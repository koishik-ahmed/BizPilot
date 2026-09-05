const nodemailer = require("nodemailer");


// =====================================================
// EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});


// =====================================================
// SEND ORDER CONFIRMATION EMAIL
// =====================================================

const sendOrderConfirmationEmail = async ({
    customerEmail,
    orderId,
    customerName,
    totalAmount,
    receiptHTML
}) => {

    // -------------------------------------------------
    // VALIDATE EMAIL
    // -------------------------------------------------

    if (!customerEmail) {
        throw new Error(
            "Customer email is required to send receipt"
        );
    }


    // -------------------------------------------------
    // VALIDATE EMAIL CONFIG
    // -------------------------------------------------

    if (!process.env.EMAIL_USER) {
        throw new Error(
            "EMAIL_USER is not configured in .env"
        );
    }

    if (!process.env.EMAIL_APP_PASSWORD) {
        throw new Error(
            "EMAIL_APP_PASSWORD is not configured in .env"
        );
    }


    // -------------------------------------------------
    // VERIFY SMTP CONNECTION
    // -------------------------------------------------

    await transporter.verify();


    // -------------------------------------------------
    // FORMAT TOTAL
    // -------------------------------------------------

    const formattedTotal =
        Number(totalAmount || 0).toFixed(2);


    // -------------------------------------------------
    // EMAIL HTML
    // -------------------------------------------------

    const fallbackReceiptHTML = `

        <div
            style="
                font-family: Arial, sans-serif;
                max-width: 700px;
                margin: 0 auto;
                padding: 24px;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                background: #ffffff;
            "
        >

            <div
                style="
                    text-align: center;
                    margin-bottom: 24px;
                "
            >

                <h1
                    style="
                        margin: 0;
                        color: #111827;
                    "
                >
                    BizPilot
                </h1>

                <p
                    style="
                        margin: 6px 0 0;
                        color: #6b7280;
                    "
                >
                    Business made simple
                </p>

            </div>


            <h2
                style="
                    color: #111827;
                    margin-bottom: 8px;
                "
            >
                Thank you for your order,
                ${customerName || "Customer"}!
            </h2>


            <p
                style="
                    color: #4b5563;
                    font-size: 15px;
                "
            >
                Your order
                <strong>#${orderId}</strong>
                has been successfully confirmed.
            </p>


            <div
                style="
                    margin-top: 24px;
                    padding: 18px;
                    background: #f9fafb;
                    border-radius: 8px;
                "
            >

                <p
                    style="
                        margin: 0 0 10px;
                        color: #374151;
                    "
                >
                    <strong>Order ID:</strong>
                    #${orderId}
                </p>


                <p
                    style="
                        margin: 0 0 10px;
                        color: #374151;
                    "
                >
                    <strong>Customer:</strong>
                    ${customerName || "Customer"}
                </p>


                <p
                    style="
                        margin: 0;
                        color: #111827;
                        font-size: 18px;
                    "
                >
                    <strong>Total Amount:</strong>
                    ৳${formattedTotal}
                </p>

            </div>


            <div
                style="
                    margin-top: 24px;
                    padding-top: 18px;
                    border-top: 1px solid #e5e7eb;
                "
            >

                <p
                    style="
                        margin: 0;
                        color: #6b7280;
                        font-size: 14px;
                    "
                >
                    This email confirms that your order
                    has been received and processed by BizPilot.
                </p>

            </div>


            <div
                style="
                    margin-top: 24px;
                    text-align: center;
                "
            >

                <p
                    style="
                        margin: 0;
                        color: #9ca3af;
                        font-size: 13px;
                    "
                >
                    Thank you for choosing BizPilot.
                </p>

            </div>

        </div>
    `;


    // -------------------------------------------------
    // MAIL OPTIONS
    // -------------------------------------------------

    const mailOptions = {

        from: `"BizPilot" <${process.env.EMAIL_USER}>`,

        to: customerEmail,

        subject:
            `Order Receipt #${orderId} - BizPilot`,

        html: `
            <div
                style="
                    background: #f3f4f6;
                    padding: 30px 15px;
                "
            >

                ${receiptHTML || fallbackReceiptHTML}

            </div>
        `
    };


    // -------------------------------------------------
    // SEND EMAIL
    // -------------------------------------------------

    const info =
        await transporter.sendMail(
            mailOptions
        );


    // -------------------------------------------------
    // CHECK RESULT
    // -------------------------------------------------

    if (
        !info.accepted ||
        info.accepted.length === 0
    ) {

        throw new Error(
            "Email was not accepted by the mail server"
        );
    }


    // -------------------------------------------------
    // RETURN RESULT
    // -------------------------------------------------

    return {

        success: true,

        messageId:
            info.messageId,

        recipient:
            customerEmail,

        accepted:
            info.accepted || [],

        rejected:
            info.rejected || [],

        response:
            info.response || null
    };
};


// =====================================================
// BACKWARD COMPATIBILITY
// =====================================================
//
// Existing orderservice.js uses:
// sendOrderConfirmationEmail
//
// So we export that exact function name.
//
// =====================================================

module.exports = {

    sendOrderConfirmationEmail,

    // Keep the old name available too
    sendOrderReceiptEmail:
        sendOrderConfirmationEmail
};