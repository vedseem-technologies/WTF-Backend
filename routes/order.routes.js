import express from 'express';
import { updateOrderStatus, createOrder, getOrder, getUserOrders, getAllOrders, initiatePayment, verifyPayment } from "../controllers/order.controller.js"
const router = express.Router();


router.get('/', getAllOrders);

import { verifyToken } from '../middleware/authMiddleware.js';

router.post('/', verifyToken, createOrder);

router.get('/:orderId', getOrder);

router.get('/user/:userId', getUserOrders);

router.patch('/:orderId/status', updateOrderStatus);

router.post('/payment/initiate', verifyToken, initiatePayment);
router.post('/payment/verify', verifyPayment); // No auth — Zoho webhook hits this directly

export default router;

