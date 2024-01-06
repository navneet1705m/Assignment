// routes/singleOrderRoutes.js
const express = require("express");
const router = express.Router();
const singleOrderController = require('../controllers/singleOrderController');


// Define API routes

// Get a single order by ID 
router.get('/:orderId', singleOrderController.getSingleOrder);

module.exports = router;
