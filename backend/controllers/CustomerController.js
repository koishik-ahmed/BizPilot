const pool = require("../config/db");

// =====================================================
// GET ALL CUSTOMERS
// =====================================================

const getAllCustomers = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                id,
                name,
                phone,
                email,
                address,
                created_at,
                updated_at
            FROM customers
            ORDER BY id DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error("Get customers error:", error);

        res.status(500).json({
            message: "Failed to fetch customers",
            error: error.message
        });
    }
};


// =====================================================
// GET CUSTOMER BY ID
// =====================================================

const getCustomerById = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `
            SELECT
                id,
                name,
                phone,
                email,
                address,
                created_at,
                updated_at
            FROM customers
            WHERE id = ?
            `,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error("Get customer error:", error);

        res.status(500).json({
            message: "Failed to fetch customer",
            error: error.message
        });
    }
};


// =====================================================
// CREATE CUSTOMER
// =====================================================

const createCustomer = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            address
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Customer name is required"
            });
        }

        if (!phone || !phone.trim()) {
            return res.status(400).json({
                message: "Customer phone is required"
            });
        }

        const [result] = await pool.query(
            `
            INSERT INTO customers
                (name, phone, email, address)
            VALUES
                (?, ?, ?, ?)
            `,
            [
                name.trim(),
                phone.trim(),
                email ? email.trim() : null,
                address ? address.trim() : null
            ]
        );

        const [rows] = await pool.query(
            `
            SELECT
                id,
                name,
                phone,
                email,
                address,
                created_at,
                updated_at
            FROM customers
            WHERE id = ?
            `,
            [result.insertId]
        );

        res.status(201).json({
            message: "Customer created successfully",
            customer: rows[0]
        });

    } catch (error) {
        console.error("Create customer error:", error);

        res.status(500).json({
            message: "Failed to create customer",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE CUSTOMER
// =====================================================

const updateCustomer = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            address
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Customer name is required"
            });
        }

        if (!phone || !phone.trim()) {
            return res.status(400).json({
                message: "Customer phone is required"
            });
        }

        const [result] = await pool.query(
            `
            UPDATE customers
            SET
                name = ?,
                phone = ?,
                email = ?,
                address = ?
            WHERE id = ?
            `,
            [
                name.trim(),
                phone.trim(),
                email ? email.trim() : null,
                address ? address.trim() : null,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        const [rows] = await pool.query(
            `
            SELECT
                id,
                name,
                phone,
                email,
                address,
                created_at,
                updated_at
            FROM customers
            WHERE id = ?
            `,
            [req.params.id]
        );

        res.json({
            message: "Customer updated successfully",
            customer: rows[0]
        });

    } catch (error) {
        console.error("Update customer error:", error);

        res.status(500).json({
            message: "Failed to update customer",
            error: error.message
        });
    }
};


// =====================================================
// DELETE CUSTOMER
// =====================================================

const deleteCustomer = async (req, res) => {
    try {
        const [result] = await pool.query(
            `
            DELETE FROM customers
            WHERE id = ?
            `,
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.json({
            message: "Customer deleted successfully"
        });

    } catch (error) {
        console.error("Delete customer error:", error);

        res.status(500).json({
            message: "Failed to delete customer",
            error: error.message
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};