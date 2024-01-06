// routes/orderItemsRoutes.js
const express = require('express');
const router = express.Router();
const orderItemsController = require('../controllers/orderItemController');

// Route to add order items 
router.post('/addOrderItems', orderItemsController.addOrderItems);

module.exports = router;

