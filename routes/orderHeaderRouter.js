// routes/orderRoutes.js
const express = require("express");
const orderController = require("../controllers/orderHeaderController");


const router = express.Router();


// Route for fetching all orders
router.get('/getAllOrders', orderController.getAllOrders);

// Create Order API 
router.post("/",orderController.createOrder);



module.exports = router;
