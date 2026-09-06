const pool = require("../config/db");

const updateStock = async (
    productId,
    quantityChange,
    changeType,
    note = null,
    connection = null,
    userId
) => {
    const db = connection || pool;

    const [result] = await db.query(
        `UPDATE products
         SET stock_quantity = stock_quantity + ?
         WHERE id = ? AND user_id = ? AND stock_quantity + ? >= 0`,
        [quantityChange, productId, userId, quantityChange]
    );

    if (result.affectedRows === 0) {
        const [products] = await db.query(
            "SELECT id FROM products WHERE id = ? AND user_id = ?",
            [productId, userId]
        );
        throw new Error(products.length ? "Insufficient stock" : "Product not found");
    }

    const [products] = await db.query(
        "SELECT stock_quantity FROM products WHERE id = ? AND user_id = ?",
        [productId, userId]
    );
    const newStock = Number(products[0].stock_quantity);
    const previousStock = newStock - quantityChange;

    await db.query(
        `INSERT INTO stock_history
        (
            product_id,
            change_type,
            quantity_changed,
            previous_stock,
            new_stock,
            note
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            productId,
            changeType,
            quantityChange,
            previousStock,
            newStock,
            note
        ]
    );

    return {
        productId,
        previousStock,
        newStock,
        quantityChanged: quantityChange
    };
};

module.exports = {
    updateStock
};