const pool = require("../config/db");

const {
    sendOrderConfirmationEmail
} = require("./emailService");

const {
    sendOrderConfirmationSMS
} = require("./smsService");


// =====================================================
// CREATE MANUAL ORDER
// =====================================================

const createManualOrder = async (orderData) => {

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();

        const {
            userId,
            customerName,
            customerPhone,
            customerEmail,
            shippingAddress,
            items,
            paymentStatus
        } = orderData;


        // =================================================
        // VALIDATION
        // =================================================

        if (!customerName) {
            throw new Error("Customer name is required");
        }

        if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
            throw new Error("Authenticated user is required");
        }

        if (!customerPhone) {
            throw new Error("Customer phone is required");
        }

        if (
            !items ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            throw new Error(
                "At least one product is required"
            );
        }


        // =================================================
        // CUSTOMER
        // =================================================

        let customerId = null;

        const [existingCustomers] =
            await connection.query(
                `SELECT id
                 FROM customers
                 WHERE phone = ?
                 LIMIT 1`,
                [customerPhone]
            );


        if (existingCustomers.length > 0) {

            customerId =
                existingCustomers[0].id;


            await connection.query(
                `UPDATE customers
                 SET
                    name = ?,
                    email = ?,
                    address = ?
                 WHERE id = ?`,
                [
                    customerName,
                    customerEmail || null,
                    shippingAddress || null,
                    customerId
                ]
            );

        } else {

            const [customerResult] =
                await connection.query(
                    `INSERT INTO customers
                    (
                        name,
                        phone,
                        email,
                        address
                    )
                    VALUES (?, ?, ?, ?)`,
                    [
                        customerName,
                        customerPhone,
                        customerEmail || null,
                        shippingAddress || null
                    ]
                );


            customerId =
                customerResult.insertId;
        }


        // =================================================
        // PROCESS PRODUCTS
        // =================================================

        let totalAmount = 0;

        const processedItems = [];


        for (const item of items) {

            const productId =
                item.productId ||
                item.product_id;


            const quantity =
                Number(item.quantity);


            if (!productId) {

                throw new Error(
                    "Product ID is required"
                );
            }


            if (
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {

                throw new Error(
                    "Product quantity must be greater than zero"
                );
            }


            // ---------------------------------------------
            // LOCK PRODUCT
            // ---------------------------------------------

            const [products] =
                await connection.query(
                    `SELECT
                        id,
                        name,
                        sku,
                        price,
                        stock_quantity
                     FROM products
                     WHERE id = ? AND user_id = ?
                     FOR UPDATE`,
                    [productId, userId]
                );


            if (products.length === 0) {

                throw new Error(
                    `Product ${productId} not found`
                );
            }


            const product =
                products[0];


            const stock =
                Number(
                    product.stock_quantity
                );


            // ---------------------------------------------
            // STOCK CHECK
            // ---------------------------------------------

            if (stock < quantity) {

                throw new Error(
                    `Insufficient stock for ${product.name}. Available: ${stock}, Requested: ${quantity}`
                );
            }


            // ---------------------------------------------
            // PRICE FROM DATABASE
            // ---------------------------------------------

            const unitPrice =
                Number(product.price);


            const subtotal =
                unitPrice * quantity;


            totalAmount += subtotal;


            processedItems.push({

                productId:
                    product.id,

                productName:
                    product.name,

                sku:
                    product.sku,

                quantity,

                unitPrice,

                subtotal

            });


            // ---------------------------------------------
            // REDUCE STOCK
            // ---------------------------------------------

            await connection.query(
                `UPDATE products
                 SET
                    stock_quantity =
                    stock_quantity - ?
                 WHERE id = ?`,
                [
                    quantity,
                    productId
                ]
            );

        }


        // =================================================
        // PAYMENT STATUS
        // =================================================

        const finalPaymentStatus =
            paymentStatus === "PAID"
                ? "PAID"
                : "PENDING";


        // =================================================
        // CREATE ORDER
        // =================================================
        //
        // IMPORTANT:
        // orders table DOES NOT have customer_id.
        //
        // Existing DB columns:
        // user_id
        // platform
        // platform_order_id
        // platform_status
        // customer_name
        // customer_phone
        // customer_email
        // shipping_address
        // total_amount
        // status
        // payment_status
        // inventory_processed
        // created_at
        // updated_at
        //
        // =================================================

        const [orderResult] =
            await connection.query(
                `INSERT INTO orders
                (
                    user_id,
                    platform,
                    customer_name,
                    customer_phone,
                    customer_email,
                    shipping_address,
                    total_amount,
                    status,
                    payment_status,
                    inventory_processed
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    "MANUAL",
                    customerName,
                    customerPhone,
                    customerEmail || null,
                    shippingAddress || null,
                    totalAmount,
                    "CONFIRMED",
                    finalPaymentStatus,
                    1
                ]
            );


        const orderId =
            orderResult.insertId;


        // =================================================
        // INSERT ORDER ITEMS
        // =================================================

        for (const item of processedItems) {

            await connection.query(
                `INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    quantity,
                    unit_price,
                    subtotal
                )
                VALUES (?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.productId,
                    item.quantity,
                    item.unitPrice,
                    item.subtotal
                ]
            );

        }


        // =================================================
        // COMMIT DATABASE CHANGES
        // =================================================

        await connection.commit();


        // =================================================
        // EMAIL
        // =================================================

        let emailSent = false;
        let emailError = null;


        if (customerEmail) {

            try {

                await sendOrderConfirmationEmail({

                    customerEmail,

                    orderId,

                    customerName,

                    totalAmount

                });


                emailSent = true;

            } catch (error) {

                console.error(
                    "Order created but confirmation email failed:",
                    error
                );

                emailError =
                    error.message;
            }
        }


        // =================================================
        // SMS
        // =================================================

        let smsSent = false;
        let smsError = null;


        if (customerPhone) {

            try {

                await sendOrderConfirmationSMS({

                    customerPhone,

                    orderId,

                    customerName,

                    totalAmount

                });


                smsSent = true;

            } catch (error) {

                console.error(
                    "Order created but confirmation SMS failed:",
                    error
                );

                smsError =
                    error.message;
            }
        }


        // =================================================
        // RESPONSE
        // =================================================

        return {

            orderId,

            customerId,

            customerName,

            customerPhone,

            totalAmount,

            status:
                "CONFIRMED",

            paymentStatus:
                finalPaymentStatus,

            inventoryProcessed:
                true,

            emailSent,

            emailError,

            smsSent,

            smsError,

            items:
                processedItems.map(
                    item => ({

                        productId:
                            item.productId,

                        productName:
                            item.productName,

                        sku:
                            item.sku,

                        quantity:
                            item.quantity,

                        unitPrice:
                            item.unitPrice,

                        subtotal:
                            item.subtotal

                    })
                ),

            message:
                "Order created, customer saved, inventory updated successfully"
        };


    } catch (error) {

        try {

            await connection.rollback();

        } catch (rollbackError) {

            console.error(
                "Rollback error:",
                rollbackError
            );
        }


        throw error;


    } finally {

        connection.release();
    }
};


// =====================================================
// GET ALL ORDERS
// =====================================================

const getAllOrders = async (userId) => {

    const connection =
        await pool.getConnection();

    try {

        const [orders] =
            await connection.query(
                `SELECT
                    id,
                    user_id,
                    platform,
                    customer_name,
                    customer_phone,
                    customer_email,
                    shipping_address,
                    total_amount,
                    status,
                    payment_status,
                    inventory_processed,
                    created_at,
                    updated_at
                 FROM orders
                 WHERE user_id = ?
                 ORDER BY created_at DESC`
                , [userId]
            );


        return orders.map(
            order => ({

                id:
                    order.id,

                userId:
                    order.user_id,

                platform:
                    order.platform,

                customerName:
                    order.customer_name,

                customerPhone:
                    order.customer_phone,

                customerEmail:
                    order.customer_email,

                shippingAddress:
                    order.shipping_address,

                totalAmount:
                    Number(
                        order.total_amount
                    ),

                status:
                    order.status,

                paymentStatus:
                    order.payment_status,

                inventoryProcessed:
                    Boolean(
                        order.inventory_processed
                    ),

                createdAt:
                    order.created_at,

                updatedAt:
                    order.updated_at

            })
        );

    } finally {

        connection.release();
    }
};


// =====================================================
// CANCEL ORDER
// =====================================================

const cancelOrder = async (orderId, userId) => {

    const connection =
        await pool.getConnection();

    try {

        await connection.beginTransaction();


        const [orders] =
            await connection.query(
                `SELECT
                    id,
                    status,
                    inventory_processed
                 FROM orders
                 WHERE id = ? AND user_id = ?
                 FOR UPDATE`,
                [orderId, userId]
            );


        if (orders.length === 0) {

            throw new Error(
                "Order not found"
            );
        }


        const order =
            orders[0];


        if (
            order.status ===
            "CANCELLED"
        ) {

            throw new Error(
                "Order is already cancelled"
            );
        }


        // ---------------------------------------------
        // GET ORDER ITEMS
        // ---------------------------------------------

        const [items] =
            await connection.query(
                `SELECT
                    product_id,
                    quantity
                 FROM order_items
                 WHERE order_id = ?`,
                [orderId]
            );


        // ---------------------------------------------
        // RESTORE STOCK
        // ---------------------------------------------

        if (
            Number(
                order.inventory_processed
            ) === 1
        ) {

            for (const item of items) {

                await connection.query(
                    `UPDATE products
                     SET
                        stock_quantity =
                        stock_quantity + ?
                     WHERE id = ?`,
                    [
                        item.quantity,
                        item.product_id
                    ]
                );

            }

        }


        // ---------------------------------------------
        // CANCEL ORDER
        // ---------------------------------------------

        await connection.query(
            `UPDATE orders
             SET
                status = 'CANCELLED',
                inventory_processed = 0
             WHERE id = ?`,
            [orderId]
        );


        await connection.commit();


        return {

            orderId:
                Number(orderId),

            status:
                "CANCELLED",

            message:
                "Order cancelled successfully"

        };


    } catch (error) {

        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "Rollback error:",
                rollbackError
            );
        }

        throw error;

    } finally {

        connection.release();
    }
};


// =====================================================
// MARK ORDER AS PAID
// =====================================================

const markOrderAsPaid = async (orderId, userId) => {

    const connection =
        await pool.getConnection();

    try {

        await connection.beginTransaction();


        const [orders] =
            await connection.query(
                `SELECT
                    id,
                    status,
                    payment_status,
                    total_amount
                 FROM orders
                 WHERE id = ? AND user_id = ?
                 FOR UPDATE`,
                [orderId, userId]
            );


        if (orders.length === 0) {

            throw new Error(
                "Order not found"
            );
        }


        const order =
            orders[0];


        if (
            order.status ===
            "CANCELLED"
        ) {

            throw new Error(
                "Cancelled orders cannot be marked as paid"
            );
        }


        if (
            order.payment_status ===
            "PAID"
        ) {

            throw new Error(
                "This order is already marked as paid"
            );
        }


        await connection.query(
            `UPDATE orders
             SET payment_status = 'PAID'
             WHERE id = ? AND user_id = ?`,
            [orderId, userId]
        );


        await connection.commit();


        return {

            orderId:
                order.id,

            paymentStatus:
                "PAID",

            totalAmount:
                Number(
                    order.total_amount
                ),

            message:
                "Order payment status updated to PAID"

        };


    } catch (error) {

        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "Rollback error:",
                rollbackError
            );
        }

        throw error;

    } finally {

        connection.release();
    }
};


// =====================================================
// MARK ORDER AS PENDING
// =====================================================

const markOrderAsPending = async (orderId, userId) => {

    const connection =
        await pool.getConnection();

    try {

        await connection.beginTransaction();


        const [orders] =
            await connection.query(
                `SELECT
                    id,
                    status,
                    payment_status,
                    total_amount
                 FROM orders
                 WHERE id = ? AND user_id = ?
                 FOR UPDATE`,
                [orderId, userId]
            );


        if (orders.length === 0) {

            throw new Error(
                "Order not found"
            );
        }


        const order =
            orders[0];


        if (
            order.status ===
            "CANCELLED"
        ) {

            throw new Error(
                "Cancelled orders cannot be marked as pending"
            );
        }


        if (
            order.payment_status ===
            "PENDING"
        ) {

            throw new Error(
                "This order is already marked as pending"
            );
        }


        await connection.query(
            `UPDATE orders
             SET payment_status = 'PENDING'
             WHERE id = ? AND user_id = ?`,
            [orderId, userId]
        );


        await connection.commit();


        return {

            orderId:
                order.id,

            paymentStatus:
                "PENDING",

            totalAmount:
                Number(
                    order.total_amount
                ),

            message:
                "Order payment status updated to PENDING"

        };


    } catch (error) {

        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "Rollback error:",
                rollbackError
            );
        }

        throw error;

    } finally {

        connection.release();
    }
};


// =====================================================
// GET PENDING ORDERS
// =====================================================

const getPendingOrders = async (userId) => {

    const connection =
        await pool.getConnection();

    try {

        const [orders] =
            await connection.query(
                `SELECT
                    id,
                    customer_name,
                    customer_phone,
                    customer_email,
                    shipping_address,
                    total_amount,
                    status,
                    payment_status,
                    created_at
                 FROM orders
                 WHERE user_id = ?
                   AND status = 'CONFIRMED'
                   AND payment_status = 'PENDING'
                 ORDER BY created_at DESC`,
                [userId]
            );


        return orders.map(
            order => ({

                id:
                    order.id,

                customerName:
                    order.customer_name,

                customerPhone:
                    order.customer_phone,

                customerEmail:
                    order.customer_email,

                shippingAddress:
                    order.shipping_address,

                totalAmount:
                    Number(
                        order.total_amount
                    ),

                status:
                    order.status,

                paymentStatus:
                    order.payment_status,

                createdAt:
                    order.created_at

            })
        );

    } finally {

        connection.release();
    }
};


// =====================================================
// GET ORDER RECEIPT
// =====================================================

const getOrderReceipt = async (orderId, userId) => {

    const connection =
        await pool.getConnection();

    try {

        const [orders] =
            await connection.query(
                `SELECT
                    id,
                    customer_name,
                    customer_phone,
                    customer_email,
                    shipping_address,
                    total_amount,
                    status,
                    payment_status,
                    created_at
                 FROM orders
                 WHERE id = ? AND user_id = ?`,
                [orderId, userId]
            );


        if (orders.length === 0) {

            throw new Error(
                "Order not found"
            );
        }


        const order =
            orders[0];


        const [items] =
            await connection.query(
                `SELECT
                    oi.product_id,
                    p.name AS product_name,
                    p.sku,
                    oi.quantity,
                    oi.unit_price,
                    oi.subtotal
                 FROM order_items oi
                 INNER JOIN products p
                    ON oi.product_id = p.id
                 WHERE oi.order_id = ?`,
                [orderId]
            );


        return {

            order: {

                id:
                    order.id,

                customerName:
                    order.customer_name,

                customerPhone:
                    order.customer_phone,

                customerEmail:
                    order.customer_email,

                shippingAddress:
                    order.shipping_address,

                status:
                    order.status,

                paymentStatus:
                    order.payment_status,

                createdAt:
                    order.created_at

            },

            items:
                items.map(
                    item => ({

                        productId:
                            item.product_id,

                        productName:
                            item.product_name,

                        sku:
                            item.sku,

                        quantity:
                            item.quantity,

                        unitPrice:
                            Number(
                                item.unit_price
                            ),

                        subtotal:
                            Number(
                                item.subtotal
                            )

                    })
                ),

            totalAmount:
                Number(
                    order.total_amount
                )

        };

    } finally {

        connection.release();
    }
};


// =====================================================
// GET REVENUE REPORT
// =====================================================

const getRevenueReport = async (
    period = "month",
    userId
) => {

    const connection =
        await pool.getConnection();

    try {

        const now = new Date();

        let startDate;
        let endDate;
        let previousStartDate;
        let previousEndDate;


        // ---------------------------------------------
        // DATE RANGE
        // ---------------------------------------------

        if (period === "today") {

            startDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate()
                );

            endDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + 1
                );

            previousStartDate =
                new Date(
                    startDate.getTime() -
                    86400000
                );

            previousEndDate =
                new Date(startDate);

        } else if (period === "week") {

            const day =
                now.getDay();

            startDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() - day
                );

            endDate =
                new Date(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate() + 7
                );

            previousStartDate =
                new Date(
                    startDate.getTime() -
                    7 * 86400000
                );

            previousEndDate =
                new Date(startDate);

        } else if (period === "lastMonth") {

            startDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1
                );

            endDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                );

            previousStartDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth() - 2,
                    1
                );

            previousEndDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1
                );

        } else if (period === "year") {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
            previousEndDate = new Date(now.getFullYear(), 0, 1);
        } else {

            startDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                );

            endDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    1
                );

            previousStartDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1
                );

            previousEndDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                );
        }


        const formatDate = (date) => {

            const year =
                date.getFullYear();

            const month =
                String(
                    date.getMonth() + 1
                ).padStart(2, "0");

            const day =
                String(
                    date.getDate()
                ).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };


        // ---------------------------------------------
        // REVENUE + ORDERS
        // ---------------------------------------------

        const [revenueRows] =
            await connection.query(
                `SELECT
                    COUNT(*) AS orders,
                    COALESCE(
                        SUM(total_amount),
                        0
                    ) AS revenue
                 FROM orders
                 WHERE status <> 'CANCELLED'
                   AND payment_status = 'PAID'
                   AND user_id = ?
                   AND created_at >= ?
                   AND created_at < ?`,
                [
                    userId,
                    formatDate(startDate),
                    formatDate(endDate)
                ]
            );


        const revenue =
            Number(
                revenueRows[0]?.revenue || 0
            );

        const orders =
            Number(
                revenueRows[0]?.orders || 0
            );


        // ---------------------------------------------
        // PREVIOUS PERIOD
        // ---------------------------------------------

        const [previousRows] =
            await connection.query(
                `SELECT
                    COUNT(*) AS orders,
                    COALESCE(
                        SUM(total_amount),
                        0
                    ) AS revenue
                 FROM orders
                 WHERE status <> 'CANCELLED'
                   AND payment_status = 'PAID'
                   AND user_id = ?
                   AND created_at >= ?
                   AND created_at < ?`,
                [
                    userId,
                    formatDate(previousStartDate),
                    formatDate(previousEndDate)
                ]
            );


        const previousRevenue =
            Number(
                previousRows[0]?.revenue || 0
            );

        const previousOrders =
            Number(
                previousRows[0]?.orders || 0
            );


        // ---------------------------------------------
        // PENDING
        // ---------------------------------------------

        const [pendingRows] =
            await connection.query(
                `SELECT
                    COUNT(*) AS pendingOrders,
                    COALESCE(
                        SUM(total_amount),
                        0
                    ) AS pendingRevenue
                 FROM orders
                 WHERE status <> 'CANCELLED'
                   AND payment_status = 'PENDING'
                   AND user_id = ?
                   AND created_at >= ?
                   AND created_at < ?`,
                [
                    userId,
                    formatDate(startDate),
                    formatDate(endDate)
                ]
            );


        const pendingRevenue =
            Number(
                pendingRows[0]?.pendingRevenue || 0
            );

        const pendingOrders =
            Number(
                pendingRows[0]?.pendingOrders || 0
            );


        // ---------------------------------------------
        // CHART
        // ---------------------------------------------

        const chartDateExpression =
            period === "year"
                ? "DATE_FORMAT(created_at, '%Y-%m-01')"
                : "DATE(created_at)";

        const [chartRows] =
            await connection.query(
                `SELECT
                    ${chartDateExpression} AS date,
                    COALESCE(
                        SUM(total_amount),
                        0
                    ) AS revenue
                 FROM orders
                 WHERE status <> 'CANCELLED'
                   AND payment_status = 'PAID'
                   AND user_id = ?
                   AND created_at >= ?
                   AND created_at < ?
                 GROUP BY ${chartDateExpression}
                 ORDER BY date ASC`,
                [
                    userId,
                    formatDate(startDate),
                    formatDate(endDate)
                ]
            );


        const chart =
            chartRows.map(
                row => ({

                    date:
                        row.date,

                    revenue:
                        Number(
                            row.revenue
                        )

                })
            );


        // ---------------------------------------------
        // TOP PRODUCTS
        // ---------------------------------------------

        const [productRows] =
            await connection.query(
                `SELECT
                    p.id,
                    p.name,
                    COALESCE(
                        SUM(oi.quantity),
                        0
                    ) AS units,
                    COALESCE(
                        SUM(oi.subtotal),
                        0
                    ) AS revenue
                 FROM order_items oi
                 INNER JOIN orders o
                    ON oi.order_id = o.id
                 INNER JOIN products p
                    ON oi.product_id = p.id
                 WHERE o.status <> 'CANCELLED'
                   AND o.payment_status = 'PAID'
                   AND o.user_id = ?
                   AND o.created_at >= ?
                   AND o.created_at < ?
                 GROUP BY
                    p.id,
                    p.name
                 ORDER BY revenue DESC
                 LIMIT 10`,
                [
                    userId,
                    formatDate(startDate),
                    formatDate(endDate)
                ]
            );


        const topProducts =
            productRows.map(
                product => ({

                    name:
                        product.name,

                    units:
                        Number(
                            product.units
                        ),

                    revenue:
                        Number(
                            product.revenue
                        ),

                    change:
                        0

                })
            );


        // ---------------------------------------------
        // PAYMENT METHODS / STATUS
        // ---------------------------------------------

        const [paymentRows] =
            await connection.query(
                `SELECT
                    payment_status,
                    COALESCE(
                        SUM(total_amount),
                        0
                    ) AS revenue
                 FROM orders
                 WHERE status <> 'CANCELLED'
                   AND user_id = ?
                   AND created_at >= ?
                   AND created_at < ?
                 GROUP BY payment_status
                 ORDER BY revenue DESC`,
                [
                    userId,
                    formatDate(startDate),
                    formatDate(endDate)
                ]
            );


        const paymentTotal =
            paymentRows.reduce(
                (
                    sum,
                    row
                ) =>
                    sum +
                    Number(
                        row.revenue
                    ),
                0
            );


        const paymentMethods =
            paymentRows.map(
                row => ({

                    name:
                        row.payment_status ||
                        "Unknown",

                    revenue:
                        Number(
                            row.revenue
                        ),

                    percentage:
                        paymentTotal > 0
                            ? Number(
                                (
                                    Number(
                                        row.revenue
                                    ) /
                                    paymentTotal *
                                    100
                                ).toFixed(1)
                            )
                            : 0

                })
            );


        // ---------------------------------------------
        // CATEGORY
        // ---------------------------------------------

        const categories = [];


        // ---------------------------------------------
        // GROWTH
        // ---------------------------------------------

        const revenueGrowth =
            previousRevenue > 0
                ? (
                    (
                        revenue -
                        previousRevenue
                    ) /
                    previousRevenue
                ) * 100
                : revenue > 0
                    ? 100
                    : 0;


        const orderGrowth =
            previousOrders > 0
                ? (
                    (
                        orders -
                        previousOrders
                    ) /
                    previousOrders
                ) * 100
                : orders > 0
                    ? 100
                    : 0;


        // ---------------------------------------------
        // FINAL REPORT
        // ---------------------------------------------

        return {

            period,

            revenue,

            previousRevenue,

            orders,

            previousOrders,

            revenueGrowth:
                Number(
                    revenueGrowth.toFixed(1)
                ),

            orderGrowth:
                Number(
                    orderGrowth.toFixed(1)
                ),

            averageOrderValue:
                orders > 0
                    ? Number(
                        (
                            revenue /
                            orders
                        ).toFixed(2)
                    )
                    : 0,

            pendingRevenue,

            pendingOrders,

            chart,

            topProducts,

            paymentMethods,

            categories

        };


    } catch (error) {

        console.error(
            "Revenue report error:",
            error
        );

        throw error;

    } finally {

        connection.release();
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    createManualOrder,

    getAllOrders,

    cancelOrder,

    markOrderAsPaid,

    markOrderAsPending,

    getPendingOrders,

    getOrderReceipt,

    getRevenueReport

};