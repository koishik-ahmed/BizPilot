const {
    createManualOrder,
    getAllOrders,
    cancelOrder,
    getOrderReceipt,
    getRevenueReport,
    markOrderAsPaid,
    markOrderAsPending,
    getPendingOrders
} = require("../services/orderservice");

const {
    generateReceiptHTML
} = require("../services/receiptService");

const {
    sendOrderReceiptEmail
} = require("../services/emailService");


// =====================================================
// CREATE MANUAL ORDER
// =====================================================

const createOrder = async (req, res) => {

    try {

        const result =
            await createManualOrder(
                {
                    ...req.body,
                    userId: req.user?.id
                }
            );


        res.status(201).json({

            message:
                "Order created successfully",

            data:
                result
        });

    } catch (error) {

        console.error(
            "Error creating order:",
            error
        );


        res.status(400).json({

            message:
                error.message
        });
    }
};


// =====================================================
// GET ALL ORDERS
// =====================================================

const getAllOrdersController = async (
    req,
    res
) => {

    try {

        const orders =
            await getAllOrders(req.user.id);


        res.status(200).json({

            message:
                "Orders retrieved successfully",

            data:
                orders
        });

    } catch (error) {

        console.error(
            "Error getting all orders:",
            error
        );


        res.status(500).json({

            message:
                "Failed to load orders",

            error:
                error.message
        });
    }
};


// =====================================================
// CANCEL ORDER
// =====================================================

const cancelOrderController = async (
    req,
    res
) => {

    try {

        const { id } =
            req.params;


        if (!id) {

            return res.status(400).json({

                message:
                    "Order ID is required"
            });
        }


        const result =
            await cancelOrder(id, req.user.id);


        res.status(200).json({

            message:
                "Order cancelled successfully",

            data:
                result
        });

    } catch (error) {

        console.error(
            "Error cancelling order:",
            error
        );


        res.status(400).json({

            message:
                error.message
        });
    }
};


// =====================================================
// MARK ORDER AS PAID
// =====================================================

const markOrderAsPaidController = async (
    req,
    res
) => {

    try {

        const { id } =
            req.params;


        if (!id) {

            return res.status(400).json({

                message:
                    "Order ID is required"
            });
        }


        const result =
            await markOrderAsPaid(id, req.user.id);


        res.status(200).json({

            message:
                "Order marked as paid successfully",

            data:
                result
        });

    } catch (error) {

        console.error(
            "Error marking order as paid:",
            error
        );


        res.status(400).json({

            message:
                error.message
        });
    }
};


// =====================================================
// MARK ORDER AS PENDING
// =====================================================

const markOrderAsPendingController = async (
    req,
    res
) => {

    try {

        const { id } =
            req.params;


        if (!id) {

            return res.status(400).json({

                message:
                    "Order ID is required"
            });
        }


        const result =
            await markOrderAsPending(id, req.user.id);


        res.status(200).json({

            message:
                "Order marked as pending successfully",

            data:
                result
        });

    } catch (error) {

        console.error(
            "Error marking order as pending:",
            error
        );


        res.status(400).json({

            message:
                error.message
        });
    }
};


// =====================================================
// GET PENDING ORDERS
// =====================================================

const getPendingOrdersController = async (
    req,
    res
) => {

    try {

        const orders =
            await getPendingOrders(req.user.id);


        res.status(200).json({

            message:
                "Pending orders retrieved successfully",

            data:
                orders
        });

    } catch (error) {

        console.error(
            "Error getting pending orders:",
            error
        );


        res.status(500).json({

            message:
                "Failed to load pending orders",

            error:
                error.message
        });
    }
};


// =====================================================
// GET RECEIPT DATA
// =====================================================

const getReceipt = async (
    req,
    res
) => {

    try {

        const { id } =
            req.params;


        if (!id) {

            return res.status(400).json({

                message:
                    "Order ID is required"
            });
        }


        const receipt =
            await getOrderReceipt(id, req.user.id);


        res.status(200).json({

            message:
                "Receipt data retrieved successfully",

            data:
                receipt
        });

    } catch (error) {

        console.error(
            "Error getting receipt:",
            error
        );


        res.status(404).json({

            message:
                error.message
        });
    }
};


// =====================================================
// GET PRINTABLE RECEIPT
// =====================================================

const getPrintableReceipt = async (
    req,
    res
) => {

    try {

        const { id } =
            req.params;


        if (!id) {

            return res.status(400).json({

                message:
                    "Order ID is required"
            });
        }


        const receiptData =
            await getOrderReceipt(id, req.user.id);


        const receiptHTML =
            generateReceiptHTML(
                receiptData
            );


        res.status(200).send(
            receiptHTML
        );

    } catch (error) {

        console.error(
            "Error generating printable receipt:",
            error
        );


        res.status(404).json({

            message:
                error.message
        });
    }
};


// =====================================================
// RESEND ORDER RECEIPT EMAIL
// =====================================================

const resendReceiptEmail = async (
    req,
    res
) => {

    try {

        const { id } =
            req.params;


        if (!id) {

            return res.status(400).json({

                message:
                    "Order ID is required"
            });
        }


        const receiptData =
            await getOrderReceipt(id, req.user.id);


        const customerEmail =
            receiptData.order.customerEmail;


        if (!customerEmail) {

            return res.status(400).json({

                message:
                    "This order does not have a customer email"
            });
        }


        const receiptHTML =
            generateReceiptHTML(
                receiptData
            );


        const emailResult =
            await sendOrderReceiptEmail({

                customerEmail,

                orderId:
                    receiptData.order.id,

                customerName:
                    receiptData.order.customerName,

                receiptHTML
            });


        res.status(200).json({

            message:
                "Receipt email sent successfully",

            data:
                emailResult
        });

    } catch (error) {

        console.error(
            "Error resending receipt email:",
            error
        );


        res.status(500).json({

            message:
                "Failed to send receipt email",

            error:
                error.message
        });
    }
};


// =====================================================
// GET REVENUE REPORT
// =====================================================

const getRevenueReportController = async (
    req,
    res
) => {

    try {

        const requestedPeriod =
            req.query.period ||
            "month";

        const period =
            requestedPeriod === "yearly"
                ? "year"
                : requestedPeriod;


        const allowedPeriods = [

            "today",

            "week",

            "month",

            "lastMonth",

            "year"

        ];


        if (
            !allowedPeriods.includes(
                period
            )
        ) {

            return res.status(400).json({

                message:
                    "Invalid revenue period"
            });
        }


        const report =
            await getRevenueReport(
                period,
                req.user.id
            );


        res.status(200).json({

            message:
                "Revenue report retrieved successfully",

            data:
                report
        });

    } catch (error) {

        console.error(
            "Error getting revenue report:",
            error
        );


        res.status(500).json({

            message:
                "Failed to load revenue report",

            error:
                error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    createOrder,

    getAllOrdersController,

    cancelOrderController,

    markOrderAsPaidController,

    markOrderAsPendingController,

    getPendingOrdersController,

    getReceipt,

    getPrintableReceipt,

    resendReceiptEmail,

    getRevenueReportController

};