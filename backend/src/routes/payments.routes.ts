import { Router, Response } from 'express';
import crypto from 'crypto';
import prisma from '../prisma.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_hyperlocal12345';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key_67890';

// POST /api/payments/create-razorpay-order
router.post('/create-razorpay-order', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const amountInPaise = Math.round(order.totalAmount * 100);
    const mockRazorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;

    res.json({
      keyId: RAZORPAY_KEY_ID,
      razorpayOrderId: mockRazorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      orderNumber: order.orderNumber,
      customerEmail: req.user!.email,
      customerName: req.user!.name,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create payment order', details: error.message });
  }
});

// POST /api/payments/verify-razorpay
router.post('/verify-razorpay', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Update order payment status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: 'UPI_ONLINE',
      },
    });

    // Record customer payment transaction
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        userId: req.user!.id,
        type: 'CUSTOMER_PAYMENT',
        amount: order.totalAmount,
        status: 'COMPLETED',
        paymentMethod: 'UPI_ONLINE',
        referenceId: razorpayPaymentId || `PAY-${Date.now()}`,
        notes: `Online payment via Razorpay / Cards / UPI. Gateway ref: ${razorpayOrderId || 'DIRECT'}`,
      },
    });

    res.json({ message: 'Payment verified successfully', order: updatedOrder });
  } catch (error: any) {
    res.status(500).json({ error: 'Payment verification failed', details: error.message });
  }
});

// POST /api/payments/submit-direct-upi
// Customer scans direct QR and enters the 12-digit UPI reference number (UTR)
router.post('/submit-direct-upi', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, utrNumber } = req.body;

    if (!utrNumber || utrNumber.length < 8) {
      res.status(400).json({ error: 'Please enter a valid 12-digit UPI Reference / UTR Number' });
      return;
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: 'DIRECT_UPI',
        directUpiUtr: utrNumber,
        directUpiVerified: true, // Mark verified
        paymentStatus: 'PAID',
      },
    });

    // Record transaction
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        userId: req.user!.id,
        type: 'CUSTOMER_PAYMENT',
        amount: order.totalAmount,
        status: 'COMPLETED',
        paymentMethod: 'DIRECT_UPI',
        referenceId: `UTR-${utrNumber}`,
        notes: `Direct UPI transfer verified with UTR: ${utrNumber}`,
      },
    });

    res.json({
      message: 'Direct UPI payment recorded and verified',
      order: updatedOrder,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record direct UPI payment', details: error.message });
  }
});

export default router;
