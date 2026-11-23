import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { AuthRequest, authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hyperlocal-super-secret-jwt-key-2026';

const generateToken = (user: { id: string; email: string; role: string; name: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { name, email, phone, password, role, vehicleType } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({ error: 'Name, email, phone, and password are required' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email or phone already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = role === 'PARTNER' ? 'PARTNER' : role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: userRole,
        vehicleType: userRole === 'PARTNER' ? vehicleType || 'MOTORCYCLE' : null,
        isAvailable: userRole === 'PARTNER' ? true : false,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    const token = generateToken(user);
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        walletBalance: user.walletBalance,
        isAvailable: user.isAvailable,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        walletBalance: user.walletBalance,
        isAvailable: user.isAvailable,
        vehicleType: user.vehicleType,
        rating: user.rating,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        walletBalance: true,
        isAvailable: true,
        currentLat: true,
        currentLng: true,
        vehicleType: true,
        rating: true,
        totalRatings: true,
        isVerified: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// POST /api/auth/switch-demo-user
// Instant one-click switch between demo roles (Customer, Partner Rahul, Partner Bikram, Admin)
router.post('/switch-demo-user', async (req, res): Promise<void> => {
  try {
    const { targetRole, partnerEmail } = req.body;
    let email = 'customer@hyperlocal.in';

    if (targetRole === 'PARTNER') {
      email = partnerEmail || 'partner1@hyperlocal.in';
    } else if (targetRole === 'ADMIN') {
      email = 'admin@hyperlocal.in';
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ error: `Demo user for role ${targetRole} not found` });
      return;
    }

    const token = generateToken(user);
    res.json({
      message: `Switched to demo ${user.role} (${user.name})`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        walletBalance: user.walletBalance,
        isAvailable: user.isAvailable,
        vehicleType: user.vehicleType,
        rating: user.rating,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to switch demo user', details: error.message });
  }
});

export default router;
