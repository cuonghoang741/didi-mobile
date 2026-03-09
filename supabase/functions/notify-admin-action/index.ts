import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminActionPayload {
  action: 'new_user' | 'add_to_cart' | string;
  title: string;
  message: string;
  data?: any;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let payload: AdminActionPayload = await req.json();
    console.log("Received raw payload:", payload);

    // Some client SDK versions wrap the body payload inside a `body` key
    if ((payload as any).body && !(payload.title && payload.message)) {
      payload = (payload as any).body;
      console.log("Extracted payload from .body ->", payload);
    }

    if (!payload.title || !payload.message) {
      return new Response(JSON.stringify({ success: false, error: "title and message are required", debug_payload: payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error("OneSignal credentials not configured");
    }

    console.log(`[notify-admin-action] Sending notification: ${payload.action}`);

    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      // Target users with role=admin tag
      filters: [
        { field: "tag", key: "role", relation: "=", value: "admin" }
      ],
      headings: {
        en: payload.title,
        vi: payload.title,
      },
      contents: {
        en: payload.message,
        vi: payload.message,
      },
      data: {
        type: payload.action,
        ...payload.data,
      },
      // iOS specific settings
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      // Priority
      priority: 10,
      ttl: 86400,
    };

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[notify-admin-action] OneSignal error:", result);
      throw new Error(result.errors?.[0] || "Failed to send notification");
    }

    console.log("[notify-admin-action] Notification sent successfully:", result);

    return new Response(JSON.stringify({ success: true, notification_id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[notify-admin-action] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
