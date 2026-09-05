const express = require("express");

const router = express.Router();

const {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require("../controllers/CustomerController");


// GET all customers
router.get("/", getAllCustomers);


// GET customer by ID
router.get("/:id", getCustomerById);


// CREATE customer
router.post("/", createCustomer);


// UPDATE customer
router.put("/:id", updateCustomer);


// DELETE customer
router.delete("/:id", deleteCustomer);


module.exports = router;