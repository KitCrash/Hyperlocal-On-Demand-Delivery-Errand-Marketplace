import { Router, Response } from 'express';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

export interface AdvertisementData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  badge: string;
  category: 'FURNITURE' | 'HOUSEHOLD' | 'LOCAL_SHOP' | 'PROMOTION';
  type: 'BANNER' | 'COMPACT';
  isActive: boolean;
  createdAt: string;
}

// In-memory persistent ad store initialized with realistic local business promotions
let advertisements: AdvertisementData[] = [
  {
    id: 'ad-banner-1',
    title: 'Royal Heritage Solid Teak Furniture',
    description: 'Flat 35% Off on handmade wooden dining sets, coffee tables, and study desks. Direct delivery available in New Town.',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    linkUrl: 'https://example.com/furniture-sale',
    badge: '🛋️ Festive Furniture Offer',
    category: 'FURNITURE',
    type: 'BANNER',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ad-banner-2',
    title: 'Modern Household & Kitchenware Essentials',
    description: 'Heavy duty plastic storage buckets, stainless steel utensils & cleaning supplies starting at ₹149. Stall #8 New Town Market.',
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800',
    linkUrl: 'https://example.com/household-essentials',
    badge: '🏠 Household Super Saver',
    category: 'HOUSEHOLD',
    type: 'BANNER',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ad-banner-3',
    title: 'Sharma Electricals & Modular Hardware',
    description: 'Buy 2 Get 1 Free on 9W Energy Saver LED Bulbs, extension power strips and copper wiring cables.',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800',
    linkUrl: 'https://example.com/local-hardware',
    badge: '⚡ Local Shop Promotion',
    category: 'LOCAL_SHOP',
    type: 'BANNER',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ad-compact-1',
    title: 'City Carpentry & Doorstep Furniture Repair',
    description: '2-hour emergency latch, hinge, sofa fix & polish service in New Town. Call or request errand pickup.',
    imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400',
    linkUrl: 'https://example.com/local-carpentry',
    badge: '🔨 Local Service Spotlight',
    category: 'LOCAL_SHOP',
    type: 'COMPACT',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ad-compact-2',
    title: 'GreenPlant Home Nursery & Pots',
    description: 'Indoor plants, terracotta pots & organic potting mix delivered in 30 mins.',
    imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400',
    linkUrl: 'https://example.com/local-nursery',
    badge: '🌿 Green Living',
    category: 'HOUSEHOLD',
    type: 'COMPACT',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// GET /api/advertisements - Public: retrieve all active ads
router.get('/', (req, res) => {
  const { type, all } = req.query;
  let result = advertisements;

  if (all !== 'true') {
    result = result.filter((ad) => ad.isActive);
  }

  if (type) {
    result = result.filter((ad) => ad.type === (type as string).toUpperCase());
  }

  res.json({ advertisements: result });
});

// POST /api/advertisements - Admin: create new advertisement
router.post('/', authenticate, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { title, description, imageUrl, linkUrl, badge, category, type } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const newAd: AdvertisementData = {
      id: `ad-${Date.now()}`,
      title,
      description,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
      linkUrl: linkUrl || '#',
      badge: badge || '⭐ Local Promotion',
      category: category || 'LOCAL_SHOP',
      type: type === 'COMPACT' ? 'COMPACT' : 'BANNER',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    advertisements.unshift(newAd);
    res.status(201).json({ message: 'Advertisement created successfully', advertisement: newAd });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create advertisement', details: err.message });
  }
});

// PUT /api/advertisements/:id - Admin: update advertisement
router.put('/:id', authenticate, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const index = advertisements.findIndex((a) => a.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Advertisement not found' });
      return;
    }

    advertisements[index] = {
      ...advertisements[index],
      ...req.body,
      id, // Preserve id
    };

    res.json({ message: 'Advertisement updated successfully', advertisement: advertisements[index] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update advertisement', details: err.message });
  }
});

// PATCH /api/advertisements/:id/toggle - Admin: toggle active status
router.patch('/:id/toggle', authenticate, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const ad = advertisements.find((a) => a.id === id);

  if (!ad) {
    res.status(404).json({ error: 'Advertisement not found' });
    return;
  }

  ad.isActive = !ad.isActive;
  res.json({ message: `Advertisement ${ad.isActive ? 'activated' : 'deactivated'}`, advertisement: ad });
});

// DELETE /api/advertisements/:id - Admin: delete advertisement
router.delete('/:id', authenticate, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const initialLen = advertisements.length;
  advertisements = advertisements.filter((a) => a.id !== id);

  if (advertisements.length === initialLen) {
    res.status(404).json({ error: 'Advertisement not found' });
    return;
  }

  res.json({ message: 'Advertisement deleted successfully' });
});

export default router;
