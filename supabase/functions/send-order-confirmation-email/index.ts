import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationPayload {
    order_id?: string;
    order_number?: string;
    customer_email: string;
    customer_name: string;
    total_amount?: number;
    items_count?: number;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        let payload: OrderConfirmationPayload = await req.json();

        // Some client SDK versions wrap the body payload inside a `body` key
        if ((payload as any).body && !payload.customer_email) {
            payload = (payload as any).body;
        }

        if (!payload.customer_email) {
            throw new Error("customer_email is required");
        }

        console.log(`[send-order-confirmation-email] Sending email to: ${payload.customer_email}`);

        // Create a Nodemailer transporter using SMTP
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: "didimobilecskh@gmail.com",
                // NOTE: Trong môi trường production, bạn nên lưu password này vào Supabase Secrets
                // và sử dụng: Deno.env.get("GMAIL_APP_PASSWORD") thay vì hardcode.
                pass: "ntox hyax bmyo xzvj",
            },
        });

        // Format currency (assuming JPY based on other functions)
        const formattedAmount = payload.total_amount
            ? new Intl.NumberFormat("ja-JP", {
                  style: "currency",
                  currency: "JPY",
              }).format(payload.total_amount)
            : "";

        const orderDetails = payload.order_number
            ? `<p><strong>Mã đơn hàng:</strong> #${payload.order_number}</p>`
            : "";

        const amountDetails = formattedAmount
            ? `<p><strong>Tổng tiền:</strong> ${formattedAmount}</p>`
            : "";

        const itemsDetails = payload.items_count
            ? `<p><strong>Số lượng sản phẩm:</strong> ${payload.items_count}</p>`
            : "";

        // Send email
        const info = await transporter.sendMail({
            from: '"Didi Mobile CSKH" <didimobilecskh@gmail.com>', // sender address
            to: payload.customer_email, // list of receivers
            subject: "Xác nhận đặt hàng thành công - Didi Mobile", // Subject line
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #E3000F; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">Xác nhận đơn hàng</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Chào <strong>${payload.customer_name || 'Quý khách'}</strong>,</p>
                        <p>Cảm ơn bạn đã tin tưởng và mua sắm tại <strong>Didi Mobile</strong>. Đơn hàng của bạn đã được hệ thống ghi nhận thành công và đang trong quá trình xử lý.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #E3000F;">Thông tin đơn hàng</h3>
                            ${orderDetails}
                            ${itemsDetails}
                            ${amountDetails}
                        </div>
                        
                        <p>Chúng tôi sẽ sớm liên hệ với bạn để xác nhận thông tin giao hàng.</p>
                        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng trả lời trực tiếp email này hoặc liên hệ hotline của chúng tôi.</p>
                        <br/>
                        <p>Trân trọng,</p>
                        <p><strong>Đội ngũ Didi Mobile</strong></p>
                    </div>
                </div>
            `,
        });

        console.log("[send-order-confirmation-email] Email sent successfully. Message ID:", info.messageId);

        return new Response(
            JSON.stringify({
                success: true,
                messageId: info.messageId,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error: any) {
        console.error("[send-order-confirmation-email] Error:", error);
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
