import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// GET /api/stores
router.get('/', async (req, res): Promise<void> => {
  try {
    const { category, isLocalMarket } = req.query;

    const where: any = {};
    if (category) {
      where.category = String(category);
    }
    if (isLocalMarket !== undefined) {
      where.isLocalMarket = isLocalMarket === 'true';
    }

    const stores = await prisma.store.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ stores });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch stores', details: error.message });
  }
});

// GET /api/stores/:id
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            historicalPrices: {
              orderBy: { recordedAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!store) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }

    res.json({ store });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch store details', details: error.message });
  }
});

export default router;
