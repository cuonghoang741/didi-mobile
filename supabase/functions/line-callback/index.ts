import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// This edge function receives the callback from LINE OAuth
// and redirects to the mobile app with the authorization code

Deno.serve(async (req: Request) => {
    const url = new URL(req.url);

    // Get params from LINE callback
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // App scheme
    const APP_SCHEME = "didi";
    const CALLBACK_PATH = "auth/callback";

    if (error) {
        // Redirect error to app
        const appUrl = `${APP_SCHEME}://${CALLBACK_PATH}?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || "")}`;
        return Response.redirect(appUrl, 302);
    }

    if (!code) {
        return new Response("Missing authorization code", { status: 400 });
    }

    // Redirect to app with the code
    const appUrl = `${APP_SCHEME}://${CALLBACK_PATH}?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ""}`;

    console.log("[line-callback] Redirecting to:", appUrl);

    return Response.redirect(appUrl, 302);
});
