import Order from '../models/order.model.js';
import Counter from '../models/counter.model.js';
import { createOrderSchema } from '../validators/order.validation.js';
import { paginate } from '../utils/pagination.js';
import User from '../models/User.js';
import { createZohoPaymentLink, verifyZohoPayment } from '../utils/zohoPayment.js';
import crypto from 'crypto';

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
      const zohoVerification = await verifyZohoPayment(order.zohoTransactionId);
      if (zohoVerification.verified && zohoVerification.status === 'paid') {
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
      console.log(`Order ${orderId} payment confirmed`);
    } else {
      if (status === 'failed') {
        order.paymentStatus = 'failed';
        await order.save();
        console.log(`Order ${orderId} payment failed`);
      }
    }

    res.status(200).json({ success: true, message: 'Payment verified' });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};
