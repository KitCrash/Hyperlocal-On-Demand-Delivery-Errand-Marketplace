import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;
export const setSocketInstance = (io: SocketIOServer) => {
  ioInstance = io;
};

const router = Router();

// Helper to broadcast socket events
const broadcastToOrder = (orderId: string, event: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(`order_${orderId}`).emit(event, data);
    ioInstance.emit('global_order_update', { orderId, event, data });
  }
};

const broadcastToUser = (userId: string, event: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit(event, data);
  }
};

// GET /api/orders (List orders with role-based filtering)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, serviceType } = req.query;

    const where: any = {};
    if (user.role === 'CUSTOMER') {
      where.customerId = user.id;
    } else if (user.role === 'PARTNER') {
      where.OR = [
        { partnerId: user.id },
        { status: 'PENDING' }, // Show available orders for partner to claim
      ];
    } // ADMIN gets all orders

    if (status) {
      where.status = String(status);
    }
    if (serviceType) {
      where.serviceType = String(serviceType);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        partner: { select: { id: true, name: true, phone: true, vehicleType: true, rating: true, avatarUrl: true } },
        items: true,
        transactions: true,
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

// GET /api/orders/:id (Get order details)
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        partner: { select: { id: true, name: true, phone: true, vehicleType: true, rating: true, avatarUrl: true, currentLat: true, currentLng: true } },
        items: {
          include: {
            product: {
              include: {
                historicalPrices: {
                  orderBy: { recordedAt: 'desc' },
                  take: 5,
                },
              },
            },
          },
        },
        transactions: true,
        reviews: true,
        complaints: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
});

// POST /api/orders (Create new order)
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      serviceType,
      pickupAddress,
      pickupLat,
      pickupLng,
      pickupNotes,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      deliveryNotes,
      errandInstructions,
      customTaskDetails,
      paymentMethod,
      items = [],
      customerNotes,
      tipAmount = 0,
    } = req.body;

    if (!pickupAddress || !deliveryAddress) {
      res.status(400).json({ error: 'Pickup and Delivery addresses are required' });
      return;
    }

    // Generate readable order number
    const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    // Calculate financials
    const estimatedProductTotal = items.reduce(
      (sum: number, it: any) => sum + (it.estimatedPrice || 0),
      0
    );

    // Dynamic delivery fee calculation based on service type
    let deliveryFee = 35.0;
    if (serviceType === 'PARCEL_PICKUP_DROP') deliveryFee = 50.0;
    else if (serviceType === 'CUSTOM_ERRAND') deliveryFee = 60.0;

    const platformCommission = Math.round(deliveryFee * 0.25); // 25% platform share
    const partnerEarnings = deliveryFee - platformCommission; // 75% partner share
    const totalAmount = estimatedProductTotal + deliveryFee + Number(tipAmount || 0);

    // Random 4-digit delivery OTP for secure completion
    const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: user.id,
        serviceType: serviceType || 'GROCERY_SHOPPING',
        status: 'PENDING',
        pickupAddress,
        pickupLat: pickupLat ? parseFloat(pickupLat) : 22.5800,
        pickupLng: pickupLng ? parseFloat(pickupLng) : 88.4700,
        pickupNotes,
        deliveryAddress,
        deliveryLat: deliveryLat ? parseFloat(deliveryLat) : 22.5726,
        deliveryLng: deliveryLng ? parseFloat(deliveryLng) : 88.3639,
        deliveryNotes,
        errandInstructions,
        customTaskDetails,
        estimatedProductTotal,
        actualProductTotal: estimatedProductTotal,
        deliveryFee,
        platformCommission,
        partnerEarnings,
        tipAmount: Number(tipAmount || 0),
        totalAmount,
        deliveryOtp,
        paymentMethod: paymentMethod || 'COD',
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
        customerNotes,
        items: {
          create: items.map((it: any) => ({
            productId: it.productId || null,
            name: it.name,
            quantity: Number(it.quantity || 1),
            unit: it.unit || 'piece',
            inputMethod: it.inputMethod || 'MANUAL',
            estimatedPrice: Number(it.estimatedPrice || 0),
            actualPrice: Number(it.estimatedPrice || 0),
            confidenceScore: Number(it.confidenceScore || 1.0),
            uncertaintyFlag: it.uncertaintyFlag || null,
          })),
        },
      },
      include: {
        items: true,
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    // Notify available online partners via socket
    if (ioInstance) {
      ioInstance.emit('new_order_available', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        serviceType: order.serviceType,
        pickupAddress: order.pickupAddress,
        deliveryAddress: order.deliveryAddress,
        estimatedTotal: order.totalAmount,
        partnerEarnings: order.partnerEarnings,
      });
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// PATCH /api/orders/:id/accept (Delivery Partner accepts order)
router.patch('/:id/accept', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    if (user.role !== 'PARTNER' && user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only delivery partners can accept orders' });
      return;
    }

    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (existingOrder.status !== 'PENDING') {
      res.status(400).json({ error: `Order is already in ${existingOrder.status} state` });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        partnerId: user.id,
        status: 'ACCEPTED',
      },
      include: {
        customer: true,
        partner: true,
        items: true,
      },
    });

    // Create notification for customer
    await prisma.notification.create({
      data: {
        userId: updatedOrder.customerId,
        role: 'CUSTOMER',
        title: 'Partner Assigned!',
        message: `${user.name} has accepted your order and is heading to the pickup location.`,
        type: 'ORDER_UPDATE',
        link: `/orders/${updatedOrder.id}`,
      },
    });

    broadcastToOrder(id, 'order_status_changed', {
      orderId: id,
      status: 'ACCEPTED',
      partner: { id: user.id, name: user.name, phone: user.email },
    });

    res.json({ message: 'Order accepted', order: updatedOrder });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to accept order', details: error.message });
  }
});

// PATCH /api/orders/:id/start-shopping (Partner reaches store/pickup)
router.patch('/:id/start-shopping', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.update({
      where: { id },
      data: { status: 'SHOPPING' },
      include: { customer: true, partner: true, items: true },
    });

    broadcastToOrder(id, 'order_status_changed', {
      orderId: id,
      status: 'SHOPPING',
      message: 'Partner is currently at the store / mandi picking up items',
    });

    res.json({ message: 'Shopping started', order });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
});

// ⭐ PATCH /api/orders/:id/update-prices (DYNAMIC MARKET PRICING)
// Partner inputs actual shop prices + bill photo + notes
// Flags unusual price change (>20%) and transitions to PRICE_APPROVAL_PENDING
router.patch('/:id/update-prices', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const {
      itemPrices, // array of { itemId, actualPrice }
      priceChangeReason,
      purchaseProofUrl,
      purchaseProofNote,
    } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    let actualProductTotal = 0;
    let hasPriceSpike = false;

    // Update each item's actual price
    for (const ip of itemPrices) {
      const item = order.items.find((i) => i.id === ip.itemId);
      if (item) {
        const actualPrice = Number(ip.actualPrice);
        actualProductTotal += actualPrice;

        // Check variance against estimated price
        const est = item.estimatedPrice || 1;
        const variance = Math.abs((actualPrice - est) / est);
        if (variance > 0.20) {
          hasPriceSpike = true;
        }

        await prisma.orderItem.update({
          where: { id: item.id },
          data: {
            actualPrice,
            isApproved: false, // Must be approved by customer
          },
        });

        // Record historical price in local market table if linked to product
        if (item.productId) {
          await prisma.historicalPrice.create({
            data: {
              productId: item.productId,
              recordedPrice: actualPrice,
              verifiedByPartnerId: user.id,
              marketName: 'Local Hyperlocal Market',
              notes: priceChangeReason || 'Entered by partner on actual purchase',
            },
          });
        }
      }
    }

    // Partner earnings and delivery fee remain strictly separated
    const updatedTotalAmount = actualProductTotal + order.deliveryFee + order.tipAmount;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        actualProductTotal,
        totalAmount: updatedTotalAmount,
        status: 'PRICE_APPROVAL_PENDING',
        priceApprovalStatus: 'PENDING',
        priceChangeReason: priceChangeReason || 'Market rates updated by delivery partner',
        priceAlertFlag: hasPriceSpike,
        purchaseProofUrl: purchaseProofUrl || order.purchaseProofUrl,
        purchaseProofNote: purchaseProofNote || order.purchaseProofNote,
      },
      include: { items: true, customer: true, partner: true },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: order.customerId,
        role: 'CUSTOMER',
        title: 'Price Approval Required',
        message: `Updated market total is ₹${actualProductTotal} (Estimated was ₹${order.estimatedProductTotal}). Please review and approve.`,
        type: 'PRICE_APPROVAL',
        link: `/orders/${order.id}`,
      },
    });

    // If flagged spike, notify Admin for audit
    if (hasPriceSpike) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const adm of admins) {
        await prisma.notification.create({
          data: {
            userId: adm.id,
            role: 'ADMIN',
            title: `Price Alert: ${order.orderNumber}`,
            message: `Unusual price spike (>20%) reported on order ${order.orderNumber}. Reason: ${priceChangeReason}`,
            type: 'FRAUD_ALERT',
            link: `/admin/orders/${order.id}`,
          },
        });
      }
    }

    broadcastToOrder(id, 'price_approval_required', {
      orderId: id,
      estimatedProductTotal: order.estimatedProductTotal,
      actualProductTotal,
      items: updatedOrder.items,
      reason: priceChangeReason,
      hasPriceSpike,
    });

    res.json({
      message: 'Prices submitted for customer approval',
      order: updatedOrder,
      hasPriceSpike,
    });
  } catch (error: any) {
    console.error('Price update error:', error);
    res.status(500).json({ error: 'Failed to update prices', details: error.message });
  }
});

// ⭐ PATCH /api/orders/:id/price-approval (Customer approves or rejects updated prices)
router.patch('/:id/price-approval', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { approved, rejectionReason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { partner: true, items: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.customerId !== user.id && user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only the customer can approve or reject prices' });
      return;
    }

    if (approved) {
      // Mark items as approved
      await prisma.orderItem.updateMany({
        where: { orderId: id },
        data: { isApproved: true },
      });

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          priceApprovalStatus: 'APPROVED',
          status: 'PRICE_APPROVED',
        },
        include: { items: true, customer: true, partner: true },
      });

      if (order.partnerId) {
        await prisma.notification.create({
          data: {
            userId: order.partnerId,
            role: 'PARTNER',
            title: 'Prices Approved! Proceed with purchase',
            message: `Customer approved updated prices (₹${order.actualProductTotal}). You can now purchase the items.`,
            type: 'ORDER_UPDATE',
            link: `/partner/orders/${order.id}`,
          },
        });
      }

      broadcastToOrder(id, 'price_approved', {
        orderId: id,
        status: 'PRICE_APPROVED',
        actualTotal: order.actualProductTotal,
      });

      res.json({ message: 'Prices approved successfully', order: updatedOrder });
    } else {
      // Price rejected
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          priceApprovalStatus: 'REJECTED',
          status: 'PRICE_REJECTED',
          cancelReason: rejectionReason || 'Customer rejected revised market prices',
        },
        include: { items: true, customer: true, partner: true },
      });

      if (order.partnerId) {
        await prisma.notification.create({
          data: {
            userId: order.partnerId,
            role: 'PARTNER',
            title: 'Customer Rejected Prices',
            message: `Customer declined the updated price: "${rejectionReason || 'Price too high'}". Do not purchase.`,
            type: 'ORDER_UPDATE',
            link: `/partner/orders/${order.id}`,
          },
        });
      }

      broadcastToOrder(id, 'price_rejected', {
        orderId: id,
        status: 'PRICE_REJECTED',
        reason: rejectionReason,
      });

      res.json({ message: 'Prices rejected', order: updatedOrder });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to process price approval', details: error.message });
  }
});

// PATCH /api/orders/:id/mark-purchased (Partner marks items purchased after approval)
router.patch('/:id/mark-purchased', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { purchaseProofUrl, purchaseProofNote } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Enforce approval check for fluctuating items
    if (order.priceApprovalStatus === 'PENDING') {
      res.status(400).json({ error: 'Cannot purchase: Customer price approval is still pending!' });
      return;
    }
    if (order.priceApprovalStatus === 'REJECTED') {
      res.status(400).json({ error: 'Cannot purchase: Customer rejected the revised price!' });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'PURCHASED',
        purchaseProofUrl: purchaseProofUrl || order.purchaseProofUrl,
        purchaseProofNote: purchaseProofNote || order.purchaseProofNote,
      },
      include: { items: true, customer: true, partner: true },
    });

    broadcastToOrder(id, 'order_status_changed', {
      orderId: id,
      status: 'PURCHASED',
      message: 'Items have been purchased and packed by your delivery partner',
    });

    res.json({ message: 'Marked as purchased', order: updatedOrder });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark purchased', details: error.message });
  }
});

// PATCH /api/orders/:id/out-for-delivery
router.patch('/:id/out-for-delivery', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'OUT_FOR_DELIVERY' },
      include: { items: true, customer: true, partner: true },
    });

    await prisma.notification.create({
      data: {
        userId: updatedOrder.customerId,
        role: 'CUSTOMER',
        title: 'Out for Delivery!',
        message: `Your partner is on the way to your delivery location. Share OTP ${updatedOrder.deliveryOtp} on arrival.`,
        type: 'ORDER_UPDATE',
        link: `/orders/${updatedOrder.id}`,
      },
    });

    broadcastToOrder(id, 'order_status_changed', {
      orderId: id,
      status: 'OUT_FOR_DELIVERY',
      message: 'Delivery partner is en route to your address',
      deliveryOtp: updatedOrder.deliveryOtp,
    });

    res.json({ message: 'Order is out for delivery', order: updatedOrder });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
});

// PATCH /api/orders/:id/complete-delivery (Delivery verification with OTP + Ledger recording)
router.patch('/:id/complete-delivery', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { deliveryOtp, deliveryProofUrl, codCollected } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { partner: true, customer: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Verify OTP unless admin override
    if (user.role !== 'ADMIN') {
      if (order.deliveryOtp && order.deliveryOtp !== deliveryOtp) {
        res.status(400).json({ error: 'Invalid delivery OTP provided by customer' });
        return;
      }
    }

    const paymentStatus = order.paymentMethod === 'COD' ? 'COD_COLLECTED' : 'PAID';

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        paymentStatus,
        deliveryProofUrl: deliveryProofUrl || null,
      },
      include: { items: true, customer: true, partner: true },
    });

    // Create complete financial transaction records
    if (order.partnerId) {
      // 1. Partner Delivery Earnings Credit
      await prisma.transaction.create({
        data: {
          orderId: order.id,
          userId: order.partnerId,
          type: 'PARTNER_EARNINGS',
          amount: order.partnerEarnings + order.tipAmount,
          status: 'COMPLETED',
          paymentMethod: 'WALLET_CREDIT',
          notes: `Delivery earnings (₹${order.partnerEarnings}) + Tip (₹${order.tipAmount})`,
        },
      });

      // 2. Product cost reimbursement (if partner paid at store)
      if (order.actualProductTotal > 0) {
        await prisma.transaction.create({
          data: {
            orderId: order.id,
            userId: order.partnerId,
            type: 'PRODUCT_COST_REIMBURSEMENT',
            amount: order.actualProductTotal,
            status: 'COMPLETED',
            paymentMethod: 'WALLET_CREDIT',
            notes: 'Product cost reimbursement for purchased items',
          },
        });
      }

      // 3. Platform commission recorded
      await prisma.transaction.create({
        data: {
          orderId: order.id,
          type: 'PLATFORM_COMMISSION',
          amount: order.platformCommission,
          status: 'COMPLETED',
          notes: `Platform service fee (25% on delivery charge) on ${order.orderNumber}`,
        },
      });

      // 4. If COD, record cash in hand collected
      if (order.paymentMethod === 'COD') {
        await prisma.transaction.create({
          data: {
            orderId: order.id,
            userId: order.partnerId,
            type: 'COD_COLLECTED',
            amount: order.totalAmount,
            status: 'COMPLETED',
            notes: `Cash collected by partner from customer on ${order.orderNumber}`,
          },
        });
      }

      // Update partner wallet balance (Earnings + Reimbursement - COD collected if any)
      const netWalletChange = (order.partnerEarnings + order.tipAmount + order.actualProductTotal) -
        (order.paymentMethod === 'COD' ? order.totalAmount : 0);

      await prisma.user.update({
        where: { id: order.partnerId },
        data: {
          walletBalance: { increment: netWalletChange },
        },
      });
    }

    // Customer notification
    await prisma.notification.create({
      data: {
        userId: order.customerId,
        role: 'CUSTOMER',
        title: 'Order Delivered!',
        message: `Your order ${order.orderNumber} has been delivered. Please leave a rating!`,
        type: 'ORDER_UPDATE',
        link: `/orders/${order.id}`,
      },
    });

    broadcastToOrder(id, 'order_status_changed', {
      orderId: id,
      status: 'DELIVERED',
      paymentStatus,
    });

    res.json({
      message: 'Delivery completed successfully',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Complete delivery error:', error);
    res.status(500).json({ error: 'Failed to complete delivery', details: error.message });
  }
});

// POST /api/orders/:id/review (Submit review)
router.post('/:id/review', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { rating, comment, tags } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || !order.partnerId) {
      res.status(404).json({ error: 'Order or delivery partner not found' });
      return;
    }

    const review = await prisma.review.create({
      data: {
        orderId: id,
        customerId: user.id,
        partnerId: order.partnerId,
        rating: Math.min(5, Math.max(1, Number(rating || 5))),
        comment,
        tags: Array.isArray(tags) ? tags.join(',') : tags || '',
      },
    });

    // Update partner aggregate rating
    const partnerReviews = await prisma.review.findMany({
      where: { partnerId: order.partnerId },
      select: { rating: true },
    });

    const avgRating = partnerReviews.reduce((sum, r) => sum + r.rating, 0) / partnerReviews.length;

    await prisma.user.update({
      where: { id: order.partnerId },
      data: {
        rating: Math.round(avgRating * 100) / 100,
        totalRatings: partnerReviews.length,
      },
    });

    res.status(201).json({ message: 'Review submitted', review });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit review', details: error.message });
  }
});

export default router;
