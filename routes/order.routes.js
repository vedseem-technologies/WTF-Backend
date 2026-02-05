const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Create new order
router.post('/', orderController.createOrder);

// Get order by order ID
router.get('/:orderId', orderController.getOrder);

// Get all orders for a user
router.get('/user/:userId', orderController.getUserOrders);

// Update order status
router.patch('/:orderId/status', orderController.updateOrderStatus);

module.exports = router;
