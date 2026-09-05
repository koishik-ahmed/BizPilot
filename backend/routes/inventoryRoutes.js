const express = require("express");

const router = express.Router();

const {
    stockIn,
    stockOut,
    getLowStockProducts,
    getStockHistory,
    getAllStockHistory,
    getProductInventory
} = require("../controllers/inventorycontroller");

router.get("/low-stock", getLowStockProducts);

router.get("/history", getAllStockHistory);

router.get("/history/:productId", getStockHistory);

router.get("/product/:productId", getProductInventory);

router.post("/stock-in", stockIn);

router.post("/stock-out", stockOut);

module.exports = router;