import Order from '../models/order.model.js';
import Counter from '../models/counter.model.js';

export const generateOrderId = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const period = `${year}${month}`;

  const sequence = await Counter.getNextSequence(`order-${period}`);
  const sequenceStr = String(sequence).padStart(4, '0');

  return `WTF-${period}-${sequenceStr}`;
};

export const createOrder = async (req, res) => {
  try {
    const {
      userId,
      entityType,
      entityId,
      items,
      bookingDetails,
      totalAmount,
      paymentMethod,
      address,
      notes
    } = req.body;

    if (!entityType || !entityId || !items || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: entityType, entityId, items, totalAmount'
      });
    }

    const orderId = await generateOrderId();

    const order = new Order({
      orderId,
      userId: userId || null,
      entityType,
      entityId,
      items,
      bookingDetails,
      totalAmount,
      paymentMethod,
      address,
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await order.save();

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId })
      .populate('userId', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

import { paginate } from '../utils/pagination.js';
import User from '../models/User.js';

export const getAllOrders = async (req, res) => {
  try {
    const { cursor, limit, direction, search, status } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      if (search.toUpperCase().startsWith('WTF-')) {
        query.orderId = { $regex: search, $options: 'i' };
      } else {
        // Search by user name
        const users = await User.find({
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex }
          ]
        }).select('_id');
        const userIds = users.map(user => user._id);

        query.$or = [
          { userId: { $in: userIds } },
          { orderId: { $regex: search, $options: 'i' } }
        ];
      }
    }

    const result = await paginate(Order, query, {
      cursor,
      limit,
      direction,
      sort: { createdAt: -1 },
      populate: { path: 'userId', select: 'firstName lastName email phone' }
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all orders',
      error: error.message
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cursor, limit, direction } = req.query;

    const result = await paginate(Order, { userId }, {
      cursor,
      limit,
      direction,
      sort: { createdAt: -1 }
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pageInfo: result.pageInfo,
      count: result.data.length // Keeping count for compatibility if needed, though usually total count is separate
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};
