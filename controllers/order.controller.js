import Order from '../models/order.model.js';
import Counter from '../models/counter.model.js';
import { createOrderSchema } from '../validators/order.validation.js';
import { paginate } from '../utils/pagination.js';
import User from '../models/User.js';
import MenuItem from '../models/menuItems.model.js';
import Occasion from '../models/occasions.model.js';
import Service from '../models/service.model.js';
import Category from '../models/category.model.js';
import Package from '../models/Package.models.js';
import { createZohoPaymentLink, verifyZohoPayment } from '../utils/zohoPayment.js';
import crypto from 'crypto';

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const [orderStats, activeMenuItems, activeOccasions, recentOrders] = await Promise.all([
      Order.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            today: [
              { $match: { createdAt: { $gte: startOfToday, $lt: endOfToday } } },
              { $count: 'count' }
            ],
            pending: [
              { $match: { status: 'pending' } },
              { $count: 'count' }
            ],
            revenue: [
              { $match: { status: { $nin: ['cancelled'] } } },
              { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]
          }
        }
      ]),
      MenuItem.countDocuments({ active: true }),
      Occasion.countDocuments({ active: true }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'firstName lastName email phone')
        .lean()
    ]);

    const stats = orderStats[0];
    res.status(200).json({
      success: true,
      data: {
        totalOrders: stats.total[0]?.count ?? 0,
        todayOrders: stats.today[0]?.count ?? 0,
        pendingOrders: stats.pending[0]?.count ?? 0,
        totalRevenue: stats.revenue[0]?.total ?? 0,
        activeMenuItems,
        activeOccasions,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: error.message });
  }
};


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
    const validation = createOrderSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.format()
      });
    }

    const {
      entityType,
      entityId,
      items,
      bookingDetails,
      totalAmount,
      paymentMethod,
      address,
      notes
    } = validation.data;

    const userId = req.userData.userId;

    const orderId = await generateOrderId();

    const order = new Order({
      orderId,
      userId,
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

    const orderObj = order.toObject();
    try {
      if (order.entityType === 'occasion') {
        const entity = await Occasion.findById(order.entityId).select('title');
        orderObj.entityName = entity?.title || null;
      } else if (order.entityType === 'service') {
        const entity = await Service.findById(order.entityId).select('name');
        orderObj.entityName = entity?.name || null;
      } else if (order.entityType === 'category') {
        const entity = await Category.findById(order.entityId).select('name');
        orderObj.entityName = entity?.name || null;
      } else if (order.entityType === 'package') {
        const entity = await Package.findById(order.entityId).select('packageName');
        orderObj.entityName = entity?.packageName || null;
      }
    } catch (e) {
      orderObj.entityName = null;
    }

    res.status(200).json({
      success: true,
      data: orderObj
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

    // Enrich orders with entity names
    if (result.data && result.data.length > 0) {
      const entityMap = {};
      const occasionIds = [], serviceIds = [], categoryIds = [], packageIds = [];

      result.data.forEach(order => {
        if (order.entityType === 'occasion') occasionIds.push(order.entityId);
        else if (order.entityType === 'service') serviceIds.push(order.entityId);
        else if (order.entityType === 'category') categoryIds.push(order.entityId);
        else if (order.entityType === 'package') packageIds.push(order.entityId);
      });

      if (occasionIds.length) {
        const occasions = await Occasion.find({ _id: { $in: occasionIds } }).select('title');
        occasions.forEach(o => { entityMap[o._id.toString()] = o.title; });
      }
      if (serviceIds.length) {
        const services = await Service.find({ _id: { $in: serviceIds } }).select('name');
        services.forEach(s => { entityMap[s._id.toString()] = s.name; });
      }
      if (categoryIds.length) {
        const categories = await Category.find({ _id: { $in: categoryIds } }).select('name');
        categories.forEach(c => { entityMap[c._id.toString()] = c.name; });
      }
      if (packageIds.length) {
        const packages = await Package.find({ _id: { $in: packageIds } }).select('packageName');
        packages.forEach(p => { entityMap[p._id.toString()] = p.packageName; });
      }

      result.data = result.data.map(order => {
        const orderObj = order.toObject ? order.toObject() : order;
        orderObj.entityName = entityMap[orderObj.entityId] || null;
        return orderObj;
      });
    }

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
      count: result.data.length
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

export const initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ orderId }).populate('userId', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid.' });
    }

    // Create Zoho Payment Link
    const paymentResponse = await createZohoPaymentLink(order);

    // Update Order with payment info
    order.zohoTransactionId = paymentResponse.transaction_id;
    order.paymentGatewayResponse = paymentResponse;
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        paymentLink: paymentResponse.payment_link,
        transactionId: paymentResponse.transaction_id
      }
    });

  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    let { orderId, paymentId, status } = req.body;

    // Map Zoho Webhook fields if present
    if (!orderId && req.body.reference_id) {
      orderId = req.body.reference_id;
    }
    if (!paymentId && req.body.payment_id) {
      paymentId = req.body.payment_id;
    }
    if (!status && req.body.status) {
      status = req.body.status;
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify Zoho Webhook Signature (if present)
    const webhookSecret = process.env.ZOHO_WEBHOOK_SECRET;
    const signature = req.headers['x-zoho-signature'];
    if (signature && webhookSecret) {
      const calculatedSignature = crypto.createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== calculatedSignature) {
        console.error('Invalid Zoho Webhook Signature');
        return res.status(401).json({ success: false, message: 'Invalid Signature' });
      }
    }

    // Verify directly with Zoho API if we have a transaction ID
    if (order.zohoTransactionId) {
      console.log(`Verifying payment for Order ${orderId} with Zoho Transaction ID: ${order.zohoTransactionId}`);
      const zohoVerification = await verifyZohoPayment(order.zohoTransactionId);
      console.log(`Zoho verification Result for ${orderId}:`, JSON.stringify(zohoVerification, null, 2));

      if (zohoVerification.verified && (zohoVerification.status === 'paid' || zohoVerification.status === 'success' || zohoVerification.status === 'captured')) {
        status = 'paid';
      }
    }

    const successStatuses = ['success', 'paid', 'credit', 'captured'];
    const isSuccess = successStatuses.includes(status?.toLowerCase());

    if (isSuccess) {
      // Idempotency check
      if (order.paymentStatus === 'paid') {
        return res.status(200).json({ success: true, message: 'Already paid' });
      }

      order.status = 'confirmed';
      order.paymentStatus = 'paid';
      order.zohoPaymentId = paymentId || null;

      // Track which payment method was used (from webhook data)
      if (req.body.payment_method) {
        order.chosenPaymentMethod = req.body.payment_method;
      }

      await order.save();
      console.log(`Order ${orderId} payment confirmed and saved.`);
    } else {
      console.warn(`Payment for Order ${orderId} not successful. Status received: ${status}`);
      if (status === 'failed') {
        order.paymentStatus = 'failed';
        await order.save();
        console.log(`Order ${orderId} payment marked as failed`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verification processed',
      status: order.paymentStatus
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};
