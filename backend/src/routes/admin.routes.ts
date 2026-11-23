import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/admin/overview
router.get('/overview', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalPartners = await prisma.user.count({ where: { role: 'PARTNER' } });
    const activePartnersOnline = await prisma.user.count({ where: { role: 'PARTNER', isAvailable: true } });

    const totalOrders = await prisma.order.count();
    const activeDeliveries = await prisma.order.count({
      where: {
        status: { in: ['ACCEPTED', 'SHOPPING', 'PRICE_APPROVAL_PENDING', 'PRICE_APPROVED', 'PURCHASED', 'OUT_FOR_DELIVERY'] },
      },
    });

    const flaggedPriceAlertsCount = await prisma.order.count({
      where: { priceAlertFlag: true },
    });

    const openComplaintsCount = await prisma.complaint.count({
      where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
    });

    // Financial summaries
    const commissionTransactions = await prisma.transaction.findMany({
      where: { type: 'PLATFORM_COMMISSION' },
    });
    const totalCommissionEarned = commissionTransactions.reduce((sum, t) => sum + t.amount, 0);

    const gmvOrders = await prisma.order.findMany({
      where: { status: { in: ['DELIVERED', 'PURCHASED', 'OUT_FOR_DELIVERY'] } },
    });
    const totalGMV = gmvOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Recent 5 orders
    const recentOrders = await prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, phone: true } },
        partner: { select: { name: true } },
      },
    });

    res.json({
      metrics: {
        totalCustomers,
        totalPartners,
        activePartnersOnline,
        totalOrders,
        activeDeliveries,
        flaggedPriceAlertsCount,
        openComplaintsCount,
        totalCommissionEarned: Math.round(totalCommissionEarned * 100) / 100,
        totalGMV: Math.round(totalGMV * 100) / 100,
      },
      recentOrders,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch admin overview', details: error.message });
  }
});

// GET /api/admin/price-alerts (Price audit & fraud monitoring)
router.get('/price-alerts', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const flaggedOrders = await prisma.order.findMany({
      where: {
        priceAlertFlag: true,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        partner: { select: { id: true, name: true, phone: true, vehicleType: true, rating: true } },
        items: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ alerts: flaggedOrders });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch price alerts', details: error.message });
  }
});

// PATCH /api/admin/price-alerts/:id/resolve
router.patch('/price-alerts/:id/resolve', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { auditNotes, dismissFlag } = req.body;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        priceAlertFlag: dismissFlag ? false : true,
        purchaseProofNote: auditNotes ? `[ADMIN AUDITED]: ${auditNotes}` : undefined,
      },
    });

    res.json({ message: 'Price audit updated', order: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update audit', details: error.message });
  }
});

// GET /api/admin/financial-ledger
router.get('/financial-ledger', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, limit } = req.query;

    const where: any = {};
    if (type) {
      where.type = String(type);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        order: { select: { orderNumber: true, serviceType: true, paymentMethod: true } },
        user: { select: { name: true, role: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(String(limit)) : 50,
    });

    // Summary breakdown
    const all = await prisma.transaction.findMany();
    const platformCommissions = all.filter((t) => t.type === 'PLATFORM_COMMISSION').reduce((a, b) => a + b.amount, 0);
    const partnerEarnings = all.filter((t) => t.type === 'PARTNER_EARNINGS').reduce((a, b) => a + b.amount, 0);
    const productReimbursements = all.filter((t) => t.type === 'PRODUCT_COST_REIMBURSEMENT').reduce((a, b) => a + b.amount, 0);
    const codCollections = all.filter((t) => t.type === 'COD_COLLECTED').reduce((a, b) => a + b.amount, 0);
    const refunds = all.filter((t) => t.type === 'REFUND').reduce((a, b) => a + b.amount, 0);

    res.json({
      summary: {
        platformCommissions: Math.round(platformCommissions * 100) / 100,
        partnerEarnings: Math.round(partnerEarnings * 100) / 100,
        productReimbursements: Math.round(productReimbursements * 100) / 100,
        codCollections: Math.round(codCollections * 100) / 100,
        refunds: Math.round(refunds * 100) / 100,
      },
      transactions,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch financial ledger', details: error.message });
  }
});

// GET /api/admin/partners (Delivery partner list & verification status)
router.get('/partners', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partners = await prisma.user.findMany({
      where: { role: 'PARTNER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        vehicleType: true,
        rating: true,
        totalRatings: true,
        walletBalance: true,
        isAvailable: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { partnerOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ partners });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch partners', details: error.message });
  }
});

// PATCH /api/admin/partners/:id/toggle-verification
router.patch('/partners/:id/toggle-verification', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const partner = await prisma.user.findUnique({ where: { id } });

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isVerified: !partner.isVerified },
    });

    res.json({ message: 'Partner verification updated', partner: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update partner verification', details: error.message });
  }
});

// GET /api/admin/complaints
router.get('/complaints', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        complainant: { select: { id: true, name: true, role: true, phone: true } },
        order: { select: { id: true, orderNumber: true, serviceType: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ complaints });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch complaints', details: error.message });
  }
});

// PATCH /api/admin/complaints/:id/resolve
router.patch('/complaints/:id/resolve', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: status || 'RESOLVED',
        resolutionNotes,
      },
    });

    res.json({ message: 'Complaint resolved', complaint: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update complaint', details: error.message });
  }
});

export default router;
