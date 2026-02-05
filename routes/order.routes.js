import express from 'express';
import {updateOrderStatus, createOrder, getOrder, getUserOrders} from "../controllers/order.controller.js"
const router = express.Router();

router.post('/', createOrder);

router.get('/:orderId', getOrder);

router.get('/user/:userId', getUserOrders);

router.patch('/:orderId/status', updateOrderStatus);

export default router;

