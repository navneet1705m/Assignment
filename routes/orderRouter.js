// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController.js");


// Define the "Get all Orders" route 
router.get("/", orderController.getOrders);

// Export the router
module.exports = router;

