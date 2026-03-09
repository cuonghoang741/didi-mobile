import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationPayload {
    order_id: string;
    order_number: string;
    customer_name: string;
    total_amount: number;
    items_count: number;
}

/**
 * Edge Function to send push notification to all admin users when a new order is created
 * Uses OneSignal REST API to send notification to users with role=admin tag
 */
Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        let payload: OrderNotificationPayload = await req.json();

        // Some client SDK versions wrap the body payload inside a `body` key
        if ((payload as any).body && !payload.order_id && !payload.order_number) {
            payload = (payload as any).body;
            console.log("Extracted payload from .body ->", payload);
        }

        if (!payload.order_id || !payload.order_number) {
            throw new Error("order_id and order_number are required");
        }

        const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
        const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

        if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
            throw new Error("OneSignal credentials not configured");
        }

        console.log("[notify-admin-new-order] Sending notification for order:", payload.order_number);

        // Format currency for notification
        const formattedAmount = new Intl.NumberFormat("ja-JP", {
            style: "currency",
            currency: "JPY",
        }).format(payload.total_amount);

        // Build notification payload for OneSignal
        // Target all users with role=admin tag
        const notificationPayload = {
            app_id: ONESIGNAL_APP_ID,
            // Target users with role=admin tag
            filters: [
                { field: "tag", key: "role", relation: "=", value: "admin" }
            ],
            headings: {
                en: "Đơn hàng mới! 🛒", // Set default to Vietnamese
                vi: "Đơn hàng mới! 🛒",
            },
            contents: {
                en: `Đơn hàng #${payload.order_number} từ ${payload.customer_name}. Tổng: ${formattedAmount}`,
                vi: `Đơn hàng #${payload.order_number} từ ${payload.customer_name}. Tổng: ${formattedAmount}`,
            },
            data: {
                type: "new_order",
                order_id: payload.order_id,
                order_number: payload.order_number,
            },
            // iOS specific settings
            ios_badgeType: "Increase",
            ios_badgeCount: 1,
            // Priority settings
            priority: 10,
            // TTL (Time To Live) - 24 hours
            ttl: 86400,
        };

        // Send notification via OneSignal REST API
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
            console.error("[notify-admin-new-order] OneSignal error:", result);
            throw new Error(result.errors?.[0] || "Failed to send notification");
        }

        console.log("[notify-admin-new-order] Notification sent successfully:", result);

        return new Response(
            JSON.stringify({
                success: true,
                notification_id: result.id,
                recipients: result.recipients,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error: any) {
        console.error("[notify-admin-new-order] Error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
