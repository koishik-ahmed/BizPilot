// =====================================================
// SMS SERVICE - sms.bd
// =====================================================

const axios = require("axios");

const SMS_API_URL = "https://api.sms.net.bd/sendsms";

const normalizePhoneNumber = (phone) => {
    if (!phone) {
        throw new Error("Customer phone is required");
    }

    let number = String(phone).trim().replace(/\s+/g, "");

    // 01XXXXXXXXX -> 8801XXXXXXXXX
    if (number.startsWith("01")) {
        number = "88" + number;
    }

    // +8801XXXXXXXXX -> 8801XXXXXXXXX
    if (number.startsWith("+880")) {
        number = number.substring(1);
    }

    return number;
};


// =====================================================
// SEND ORDER CONFIRMATION SMS
// =====================================================

const sendOrderConfirmationSMS = async ({
    customerPhone,
    orderId,
    customerName,
    totalAmount
}) => {

    if (!process.env.SMS_API_KEY) {
        throw new Error("SMS_API_KEY is not configured");
    }

    const to = normalizePhoneNumber(customerPhone);

    const message =
        `BizPilot: Dear ${customerName}, your order #${orderId} has been confirmed successfully. Total amount: BDT ${Number(totalAmount).toFixed(2)}. Thank you for your order!`;

    try {

        const response = await axios.post(
            SMS_API_URL,
            {
                api_key: process.env.SMS_API_KEY,
                msg: message,
                to
            },
            {
                headers: {
                    "Content-Type": "application/json"
                },
                timeout: 15000
            }
        );

        const result = response.data;

        if (Number(result.error) !== 0) {
            throw new Error(
                result.msg || `SMS API error: ${result.error}`
            );
        }

        return {
            success: true,
            recipient: to,
            requestId: result.data?.request_id || null,
            message: result.msg || "SMS submitted successfully"
        };

    } catch (error) {

        if (error.response?.data) {
            throw new Error(
                error.response.data.msg ||
                "SMS API request failed"
            );
        }

        throw error;
    }
};


module.exports = {
    sendOrderConfirmationSMS
};