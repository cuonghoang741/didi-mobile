import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * LINE CALLBACK PROXY
 * 
 * Edge Function này nhận callback từ LINE OAuth và redirect về mobile app.
 * LINE không cho phép dùng custom scheme (exp://, didi://), nên ta dùng Edge Function làm trung gian.
 * 
 * QUAN TRỌNG: Phải TẮT "Enforce JWT Verification" cho function này trong Supabase Dashboard.
 */

Deno.serve(async (req: Request) => {
    const url = new URL(req.url);

    // Lấy các params từ LINE callback
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    console.log("[line-callback] Nhận request:", {
        hasCode: !!code,
        hasState: !!state,
        hasError: !!error,
    });

    // Mặc định redirect về app scheme
    let targetUrl = "didi://auth/callback";

    // Đọc redirectTo từ state param (được gửi từ App)
    // State có format: {"nonce": "xxx", "redirectTo": "exp://..."}
    if (state) {
        try {
            const stateObj = JSON.parse(decodeURIComponent(state));
            if (stateObj.redirectTo) {
                targetUrl = stateObj.redirectTo;
                console.log("[line-callback] Sử dụng redirectTo từ state:", targetUrl);
            }
        } catch (e) {
            console.warn("[line-callback] Không thể parse state JSON:", e);
        }
    }

    // Xử lý lỗi từ LINE
    if (error) {
        const redirectUrl = `${targetUrl}?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || "")}`;
        console.log("[line-callback] Redirect lỗi:", redirectUrl);
        return Response.redirect(redirectUrl, 302);
    }

    // Xử lý thành công
    if (code) {
        // Thêm code vào URL, giữ state để App có thể verify nếu cần
        const separator = targetUrl.includes("?") ? "&" : "?";
        const redirectUrl = `${targetUrl}${separator}code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
        console.log("[line-callback] Redirect thành công:", redirectUrl);
        return Response.redirect(redirectUrl, 302);
    }

    return new Response("Missing authorization code", { status: 400 });
});
