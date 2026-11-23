import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/partner/available-orders (Pending orders ready to accept)
router.get('/available-orders', authenticate, requireRole(['PARTNER', 'ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        customer: { select: { name: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch available orders', details: error.message });
  }
});

// PATCH /api/partner/toggle-availability (Toggle online / offline)
router.patch('/toggle-availability', authenticate, requireRole(['PARTNER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const partner = await prisma.user.findUnique({ where: { id: user.id } });

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isAvailable: !partner.isAvailable },
      select: { id: true, name: true, isAvailable: true, currentLat: true, currentLng: true },
    });

    res.json({
      message: `Status updated: You are now ${updated.isAvailable ? 'Online' : 'Offline'}`,
      isAvailable: updated.isAvailable,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update availability', details: error.message });
  }
});

// PATCH /api/partner/update-location (Stream current GPS coords)
router.patch('/update-location', authenticate, requireRole(['PARTNER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        currentLat: parseFloat(lat),
        currentLng: parseFloat(lng),
      },
      select: { id: true, currentLat: true, currentLng: true },
    });

    res.json({ message: 'Location updated', location: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update location', details: error.message });
  }
});

// GET /api/partner/earnings (Detailed earnings dashboard)
router.get('/earnings', authenticate, requireRole(['PARTNER', 'ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const partnerId = req.query.partnerId ? String(req.query.partnerId) : user.id;

    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true, walletBalance: true, rating: true, totalRatings: true },
    });

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    // Fetch all transactions for this partner
    const transactions = await prisma.transaction.findMany({
      where: { userId: partnerId },
      include: { order: { select: { orderNumber: true, serviceType: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Today's cutoff
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayEarnings = transactions
      .filter((t) => t.type === 'PARTNER_EARNINGS' && new Date(t.createdAt) >= startOfToday)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalLifetimeEarnings = transactions
      .filter((t) => t.type === 'PARTNER_EARNINGS')
      .reduce((sum, t) => sum + t.amount, 0);

    const codCashInHand = transactions
      .filter((t) => t.type === 'COD_COLLECTED')
      .reduce((sum, t) => sum + t.amount, 0);

    const completedOrdersCount = await prisma.order.count({
      where: {
        partnerId,
        status: 'DELIVERED',
      },
    });

    res.json({
      partner,
      stats: {
        todayEarnings: Math.round(todayEarnings * 100) / 100,
        totalLifetimeEarnings: Math.round(totalLifetimeEarnings * 100) / 100,
        codCashInHand: Math.round(codCashInHand * 100) / 100,
        walletBalance: Math.round(partner.walletBalance * 100) / 100,
        completedDeliveries: completedOrdersCount,
        rating: partner.rating,
        totalRatings: partner.totalRatings,
      },
      recentTransactions: transactions.slice(0, 15),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch earnings', details: error.message });
  }
});

export default router;
