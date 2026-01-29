
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { code, redirectUri } = await req.json();

        if (!code || !redirectUri) {
            throw new Error('Missing code or redirectUri');
        }

        const LINE_CHANNEL_ID = Deno.env.get('LINE_CHANNEL_ID');
        const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET');

        if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET) {
            throw new Error('Server misconfiguration: Missing LINE credentials');
        }

        // 1. Exchange code for access token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: LINE_CHANNEL_ID,
                client_secret: LINE_CHANNEL_SECRET,
            }),
        });

        if (!tokenResponse.ok) {
            const errText = await tokenResponse.text();
            console.error('LINE Token Error:', errText);
            throw new Error(`Failed to exchange token from LINE: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        const { access_token, id_token } = tokenData;

        // 2. Get User Profile from LINE using id_token payload
        // We trust the token because we just got it from LINE via direct channel.
        const payloadPart = id_token.split('.')[1];
        const payloadStr = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadStr);

        const lineUserId = payload.sub;
        const email = payload.email;
        const name = payload.name;
        const picture = payload.picture;

        // 3. Initialize Supabase Admin
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 4. Find or Create User
        // We use a deterministic email logic if email is missing or to link accounts.
        // Ideally, if email exists and is verified, we link.
        // If not, we create a placeholder email: line_<lineUserId>@line.login

        const emailToUse = email || `${lineUserId}@line.login`;

        // Upsert user logic (Check existence then create/update)
        let userId;

        // Try to get user by email first (Admin API)
        // Note: there is no simple getUserByEmail in some versions, but we can list with filter.
        // Or we just try to create.

        // We will use a deterministic UUID generated from LINE ID to avoid duplicates correctly?
        // Not easy in Deno without uuid v5 lib and namespace.
        // Simpler: Try to Create. If fails with "already registered", then we know they exist.
        // But we need the ID.

        // We can use listUsers to search by email.
        const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1
            // We can't filter by email directly in listUsers args in strict typing without checking docs?
            // Actually listUsers() usually doesn't take filter in all SDK versions?
            // Wait, current Supabase JS logic allows checking.
        });

        // Let's rely on RPC or standard practice.
        // Actually, `supabaseAdmin.from('auth.users').select('id').eq('email', emailToUse)` requires DB access.
        // We have service_role_key, so we can access `auth` schema if we configure the client?
        // No, client usually defaults to `public`.

        // Let's use `admin.createUser` and if it fails, we need to find the user.

        // IMPORTANT: Providing `user_metadata` with `line_user_id` is crucial for future lookups.

        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: emailToUse,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                avatar_url: picture,
                iss: 'https://access.line.me',
                sub: lineUserId,
                full_name_line: name
            }
        });

        if (createdUser && createdUser.user) {
            userId = createdUser.user.id;
        } else if (createError?.status === 422 || createError?.message?.includes("already registered")) {
            // User exists, we need to find their ID.
            // We can use the un-exposed 'getUserByEmail' if available or listUsers hack?
            // Actually, we can use `supabaseAdmin.rpc` if we had a function.
            // Or we can try `signInWithOtp` to send a code? No.

            // Correct way with Service Role:
            // You CAN query the auth schema directly using PostgREST if the role has permission.
            // Usually `postgres` role has, `service_role` has.
            // `supabaseAdmin.schema('auth').from('users').select('id').eq('email', emailToUse).single()`

            const { data: existingUser, error: findError } = await supabaseAdmin
                .schema('auth')
                .from('users')
                .select('id, raw_user_meta_data')
                .eq('email', emailToUse)
                .single();

            if (findError || !existingUser) {
                throw new Error("User exists but could not be found via admin query");
            }

            userId = existingUser.id;

            // Optional: Update metadata
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: {
                    ...existingUser.raw_user_meta_data,
                    full_name: name,
                    avatar_url: picture,
                    iss: 'https://access.line.me',
                    sub: lineUserId
                }
            });
        } else {
            throw createError;
        }

        // 5. Generate Custom JWT (Session)
        const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET') || Deno.env.get('JWT_SECRET');
        if (!jwtSecret) throw new Error('Missing JWT_SECRET');

        // Make sure to match Supabase's expected payload
        const tokenPayload = {
            aud: "authenticated",
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
            sub: userId,
            email: emailToUse,
            role: "authenticated",
            app_metadata: {
                provider: "line",
                providers: ["line"]
            },
            user_metadata: {
                full_name: name,
                avatar_url: picture
            }
        };

        // Sign the token using HMAC SHA-256 (HS256)
        // Note: djwt library usage.
        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(jwtSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign", "verify"]
        );

        const accessToken = await create({ alg: "HS256", typ: "JWT" }, tokenPayload, key);

        // 6. Return the session-like object
        // We also return the LINE tokens just in case client wants them, but mostly the `access_token` is the Supabase one.
        // Structure:
        /*
        {
          access_token: "...",
          token_type: "bearer",
          expires_in: ...,
          refresh_token: "...", // We don't have a supabase refresh token unless we insert one.
          user: { ... }
        }
        */

        // For now, we return `access_token` and `user`.
        // Client should handle `setSession(access_token)`

        return new Response(
            JSON.stringify({
                session: {
                    access_token: accessToken,
                    token_type: "bearer",
                    expires_in: 604800,
                    refresh_token: null, // No refresh token flow for now
                    user: {
                        id: userId,
                        email: emailToUse,
                        app_metadata: tokenPayload.app_metadata,
                        user_metadata: tokenPayload.user_metadata
                    }
                },
                line_tokens: tokenData
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
