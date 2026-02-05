import Order from '../models/order.model.js';
import Counter from '../models/counter.model.js';

// Generate unique order ID in format: WTF-YYYYMM-XXXX
export const generateOrderId = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const period = `${year}${month}`;

  // Get next sequence number for this period
  const sequence = await Counter.getNextSequence(`order-${period}`);
  const sequenceStr = String(sequence).padStart(4, '0');

  return `WTF-${period}-${sequenceStr}`;
};

// Create new order
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

    // Validate required fields
    if (!entityType || !entityId || !items || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: entityType, entityId, items, totalAmount'
      });
    }

    // Generate unique order ID
    const orderId = await generateOrderId();

    // Create order
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

// Get order by ID
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

// Get all orders for a user
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: orders,
      count: orders.length
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

// Update order status
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
