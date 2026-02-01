import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LineTokenResponse {
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    id_token: string;
}

interface LineProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { code, redirectUri } = await req.json();

        if (!code) {
            throw new Error("Authorization code is required");
        }

        const LINE_CHANNEL_ID = Deno.env.get("LINE_CHANNEL_ID")!;
        const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET")!;
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://brsigfliyzwlomomoxqu.supabase.co";
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        console.log("[line-login] Exchanging code for tokens...");

        // Step 1: Exchange code for tokens
        const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                client_id: LINE_CHANNEL_ID,
                client_secret: LINE_CHANNEL_SECRET,
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("[line-login] LINE token error:", errorText);
            throw new Error(`Failed to exchange code: ${errorText}`);
        }

        const tokens: LineTokenResponse = await tokenResponse.json();
        console.log("[line-login] Got tokens successfully");

        // Step 2: Get LINE profile
        const profileResponse = await fetch("https://api.line.me/v2/profile", {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        if (!profileResponse.ok) {
            throw new Error("Failed to get LINE profile");
        }

        const profile: LineProfile = await profileResponse.json();
        console.log("[line-login] Got profile:", profile.displayName);

        // Step 3: Create/update user in Supabase
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Check if user exists by line_user_id in users table
        const { data: existingUsers } = await supabase
            .from("users")
            .select("id")
            .eq("line_user_id", profile.userId)
            .limit(1);

        let userId: string;
        let authUser: any;

        if (existingUsers && existingUsers.length > 0) {
            // User exists, get their auth data
            userId = existingUsers[0].id;

            // Get auth user
            const { data: userData } = await supabase.auth.admin.getUserById(userId);
            authUser = userData?.user;

            if (!authUser) {
                throw new Error("Auth user not found");
            }

            console.log("[line-login] Existing user found:", userId);
        } else {
            // Create new auth user
            const email = `line_${profile.userId}@line.local`;

            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: {
                    full_name: profile.displayName,
                    avatar_url: profile.pictureUrl,
                    provider: "line",
                    line_user_id: profile.userId,
                },
            });

            if (authError) {
                console.error("[line-login] Create user error:", authError);
                throw authError;
            }

            authUser = authData.user;
            userId = authUser.id;

            // Create user profile in users table
            const { error: profileError } = await supabase.from("users").upsert({
                id: userId,
                line_user_id: profile.userId,
                full_name: profile.displayName,
                avatar_url: profile.pictureUrl,
            });

            if (profileError) {
                console.error("[line-login] Create profile error:", profileError);
            }

            console.log("[line-login] New user created:", userId);
        }

        // Step 4: Generate Supabase session using admin API
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: authUser.email,
        });

        if (sessionError) {
            console.error("[line-login] Generate link error:", sessionError);
            throw sessionError;
        }

        // Extract token from the magic link
        const magicLinkUrl = new URL(sessionData.properties.action_link);
        const token = magicLinkUrl.searchParams.get("token");
        const type = magicLinkUrl.searchParams.get("type");

        // Verify the OTP to get a session
        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: token!,
            type: type as any,
        });

        if (otpError) {
            console.error("[line-login] Verify OTP error:", otpError);
            throw otpError;
        }

        console.log("[line-login] Session created successfully");

        return new Response(
            JSON.stringify({
                session: {
                    access_token: otpData.session?.access_token,
                    refresh_token: otpData.session?.refresh_token,
                    user: otpData.user,
                },
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error: any) {
        console.error("[line-login] Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
