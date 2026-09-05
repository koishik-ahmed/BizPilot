const { updateStock } = require("../services/inventoryservice");
const pool = require("../config/db");


// =====================================================
// GET ALL PRODUCTS
// =====================================================

const getAllProducts = async (req, res) => {
    try {

        const [products] = await pool.query(
            "SELECT * FROM products WHERE user_id = ? AND is_active = 1",
            [req.user.id]
        );

        res.status(200).json(products);

    } catch (error) {

        console.error("Error fetching products:", error);

        res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
};


// =====================================================
// CREATE PRODUCT
// =====================================================

const createProduct = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const {
            sku,
            name,
            description,
            price,
            stock_quantity,
            low_stock_threshold,
            user_id
        } = req.body;


        if (!sku || !name || price === undefined) {

            return res.status(400).json({
                message: "SKU, name and price are required"
            });
        }


        const initialStock =
            Number(stock_quantity) || 0;


        const lowStockThreshold =
            Number(low_stock_threshold) || 5;


        if (initialStock < 0) {

            return res.status(400).json({
                message: "Stock quantity cannot be negative"
            });
        }


        await connection.beginTransaction();


        // Create product with stock initially set to 0.
        // Stock will be added through updateStock so that
        // stock_history is created automatically.

        const [result] = await connection.query(
            `INSERT INTO products
            (
                sku,
                name,
                description,
                price,
                stock_quantity,
                low_stock_threshold,
                user_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                sku,
                name,
                description || null,
                price,
                0,
                lowStockThreshold,
                req.user.id
            ]
        );


        const productId = result.insertId;


        // Create initial stock history if initial stock > 0

        if (initialStock > 0) {

            await updateStock(
                productId,
                initialStock,
                "RESTOCK",
                "Initial stock",
                connection,
                req.user.id
            );
        }


        await connection.commit();


        res.status(201).json({
            message: "Product created successfully",
            productId
        });


    } catch (error) {

        await connection.rollback();

        console.error(
            "Error creating product:",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "A product with this SKU already exists in your catalog"
            });
        }

        res.status(500).json({
            message:
                error.message ||
                "Failed to create product"
        });


    } finally {

        connection.release();
    }
};


// =====================================================
// UPDATE PRODUCT
// =====================================================

const updateProduct = async (req, res) => {

    try {

        const { id } = req.params;


        const {
            sku,
            name,
            description,
            price,
            low_stock_threshold,
            is_active
        } = req.body;


        if (!sku || !name || price === undefined) {

            return res.status(400).json({
                message:
                    "SKU, name and price are required"
            });
        }


        const [result] = await pool.query(
            `UPDATE products
             SET
                sku = ?,
                name = ?,
                description = ?,
                price = ?,
                low_stock_threshold = ?,
                is_active = ?
             WHERE id = ? AND user_id = ?`,
            [
                sku,
                name,
                description || null,
                price,
                low_stock_threshold ?? 5,
                is_active ?? 1,
                id,
                req.user.id
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Product not found"
            });
        }


        res.status(200).json({
            message:
                "Product updated successfully"
        });


    } catch (error) {

        console.error(
            "Error updating product:",
            error
        );

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "A product with this SKU already exists in your catalog"
            });
        }

        res.status(500).json({
            message:
                "Failed to update product",
            error: error.message
        });
    }
};


// =====================================================
// DELETE PRODUCT
// =====================================================

const deleteProduct = async (req, res) => {

    try {

        const { id } = req.params;


        const [result] = await pool.query(
            "UPDATE products SET is_active = 0 WHERE id = ? AND user_id = ?",
            [id, req.user.id]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Product not found"
            });
        }


        res.status(200).json({
            message:
                "Product deleted successfully"
        });


    } catch (error) {

        console.error(
            "Error deleting product:",
            error
        );

        res.status(500).json({
            message:
                "Failed to delete product",
            error: error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
};