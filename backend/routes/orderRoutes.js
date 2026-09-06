const express = require("express");

const router = express.Router();

const {
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
} = require("../controllers/ordercontroller");


// =====================================================
// CREATE ORDER
// =====================================================

router.post(
    "/",
    createOrder
);


// =====================================================
// GET ALL ORDERS
// IMPORTANT: keep this before /:id routes
// =====================================================

router.get(
    "/",
    getAllOrdersController
);


// =====================================================
// REVENUE
// IMPORTANT: keep this before /:id routes
// =====================================================

router.get(
    "/revenue",
    getRevenueReportController
);


// =====================================================
// PENDING ORDERS
// =====================================================

router.get(
    "/pending",
    getPendingOrdersController
);


// =====================================================
// MARK ORDER AS PAID
// =====================================================

router.put(
    "/:id/payment",
    markOrderAsPaidController
);


// =====================================================
// MARK ORDER AS PENDING
// =====================================================

router.put(
    "/:id/payment/pending",
    markOrderAsPendingController
);


// =====================================================
// CANCEL ORDER
// =====================================================

router.put(
    "/:id/cancel",
    cancelOrderController
);


// =====================================================
// RECEIPT DATA
// =====================================================

router.get(
    "/:id/receipt",
    getReceipt
);


// =====================================================
// PRINTABLE RECEIPT
// =====================================================

router.get(
    "/:id/receipt/print",
    getPrintableReceipt
);


// =====================================================
// RESEND RECEIPT EMAIL
// =====================================================

router.post(
    "/:id/receipt/email",
    resendReceiptEmail
);


module.exports = router;