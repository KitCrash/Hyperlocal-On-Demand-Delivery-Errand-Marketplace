import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// GET /api/products
router.get('/', async (req, res): Promise<void> => {
  try {
    const { search, category, storeId, isFixedPrice } = req.query;

    const where: any = {};

    if (category) {
      where.category = String(category);
    }

    if (storeId) {
      where.storeId = String(storeId);
    }

    if (isFixedPrice !== undefined) {
      where.isFixedPrice = isFixedPrice === 'true';
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q } },
        { nameBengali: { contains: q } },
        { nameHindi: { contains: q } },
        { category: { contains: q } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true, category: true, isLocalMarket: true },
        },
        historicalPrices: {
          orderBy: { recordedAt: 'desc' },
          take: 7,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ products });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// GET /api/products/:id/price-history
router.get('/:id/price-history', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        historicalPrices: {
          orderBy: { recordedAt: 'asc' },
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Calculate dynamic stats
    const prices = product.historicalPrices.map((hp) => hp.recordedPrice);
    const min = prices.length ? Math.min(...prices) : product.estimatedPrice;
    const max = prices.length ? Math.max(...prices) : product.estimatedPrice;
    const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : product.estimatedPrice;
    const currentPrice = product.currentMarketPrice;
    const varianceFromAvg = avg ? ((currentPrice - avg) / avg) * 100 : 0;

    res.json({
      product: {
        id: product.id,
        name: product.name,
        nameBengali: product.nameBengali,
        nameHindi: product.nameHindi,
        unit: product.unit,
        estimatedPrice: product.estimatedPrice,
        currentMarketPrice: product.currentMarketPrice,
        isFixedPrice: product.isFixedPrice,
      },
      stats: {
        minPrice: min,
        maxPrice: max,
        avgPrice: Math.round(avg * 10) / 10,
        variancePercent: Math.round(varianceFromAvg * 10) / 10,
        isSpike: Math.abs(varianceFromAvg) > 20,
      },
      history: product.historicalPrices,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch price history', details: error.message });
  }
});

export default router;
