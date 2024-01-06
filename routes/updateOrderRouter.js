// routes/updateOrderRoutes.js
const express = require('express');
const router = express.Router();
const updateOrderController = require('../controllers/updateOrderController');


// Define API route to update order name by order ID
router.put('/:orderId', updateOrderController.updateOrderName);

// Export the router
module.exports = router;
