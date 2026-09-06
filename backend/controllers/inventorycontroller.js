const { updateStock } = require("../services/inventoryservice");
const pool = require("../config/db");


// =====================================================
// STOCK IN
// =====================================================

const stockIn = async (req, res) => {
    try {
        const { productId, quantity, note } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({
                message: "Product ID and a positive quantity are required"
            });
        }

        const result = await updateStock(
            productId,
            quantity,
            "RESTOCK",
            note,
            null,
            req.user.id
        );

        res.status(200).json({
            message: "Stock added successfully",
            data: result
        });

    } catch (error) {
        console.error("Error adding stock:", error);

        res.status(400).json({
            message: error.message
        });
    }
};


// =====================================================
// STOCK OUT
// =====================================================

const stockOut = async (req, res) => {
    try {
        const { productId, quantity, note } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({
                message: "Product ID and a positive quantity are required"
            });
        }

        const result = await updateStock(
            productId,
            -quantity,
            "SALE",
            note,
            null,
            req.user.id
        );

        res.status(200).json({
            message: "Stock removed successfully",
            data: result
        });

    } catch (error) {
        console.error("Error removing stock:", error);

        res.status(400).json({
            message: error.message
        });
    }
};


// =====================================================
// LOW STOCK PRODUCTS
// =====================================================

const getLowStockProducts = async (req, res) => {
    try {
        const [products] = await pool.query(
            `SELECT *
             FROM products
             WHERE user_id = ?
             AND stock_quantity <= low_stock_threshold
             AND is_active = 1
             ORDER BY stock_quantity ASC`
        , [req.user.id]);

        res.status(200).json(products);

    } catch (error) {
        console.error(
            "Error fetching low-stock products:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch low-stock products"
        });
    }
};


// =====================================================
// STOCK HISTORY FOR ONE PRODUCT
// =====================================================

const getStockHistory = async (req, res) => {
    try {
        const { productId } = req.params;

        const [history] = await pool.query(
            `SELECT
                sh.id,
                sh.product_id,
                p.name AS product_name,
                p.sku,
                sh.change_type,
                sh.quantity_changed,
                sh.previous_stock,
                sh.new_stock,
                sh.reference_type,
                sh.reference_id,
                sh.note,
                sh.created_by,
                sh.created_at
             FROM stock_history sh
             INNER JOIN products p
                ON p.id = sh.product_id
             WHERE sh.product_id = ? AND p.user_id = ?
             ORDER BY sh.created_at DESC, sh.id DESC`,
            [productId, req.user.id]
        );

        res.status(200).json(history);

    } catch (error) {
        console.error(
            "Error fetching stock history:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch stock history"
        });
    }
};


// =====================================================
// ALL STOCK HISTORY
// =====================================================

const getAllStockHistory = async (req, res) => {
    try {
        const [history] = await pool.query(
            `SELECT
                sh.id,
                sh.product_id,
                p.name AS product_name,
                p.sku,
                sh.change_type,
                sh.quantity_changed,
                sh.previous_stock,
                sh.new_stock,
                sh.reference_type,
                sh.reference_id,
                sh.note,
                sh.created_by,
                sh.created_at
             FROM stock_history sh
             INNER JOIN products p
                ON p.id = sh.product_id
             WHERE p.user_id = ?
             ORDER BY sh.created_at DESC, sh.id DESC`
        , [req.user.id]);

        res.status(200).json(history);

    } catch (error) {
        console.error(
            "Error fetching all stock history:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch stock history"
        });
    }
};


// =====================================================
// PRODUCT INVENTORY
// =====================================================

const getProductInventory = async (req, res) => {
    try {
        const { productId } = req.params;

        const [products] = await pool.query(
            `SELECT
                id,
                sku,
                name,
                description,
                price,
                stock_quantity,
                low_stock_threshold,
                is_active
             FROM products
             WHERE id = ? AND user_id = ?`,
            [productId, req.user.id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const product = products[0];

        const [history] = await pool.query(
            `SELECT
                id,
                change_type,
                quantity_changed,
                previous_stock,
                new_stock,
                reference_type,
                reference_id,
                note,
                created_by,
                created_at
             FROM stock_history
             WHERE product_id = ? AND EXISTS (
               SELECT 1 FROM products p WHERE p.id = stock_history.product_id AND p.user_id = ?
             )
             ORDER BY created_at DESC, id DESC`,
            [productId, req.user.id]
        );

        res.status(200).json({
            product,
            isLowStock:
                product.stock_quantity <=
                product.low_stock_threshold,
            history
        });

    } catch (error) {
        console.error(
            "Error fetching product inventory:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch product inventory"
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    stockIn,
    stockOut,
    getLowStockProducts,
    getStockHistory,
    getAllStockHistory,
    getProductInventory
};