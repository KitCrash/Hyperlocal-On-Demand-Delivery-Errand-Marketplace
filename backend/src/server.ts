import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import authRoutes from './routes/auth.routes.js';
import storesRoutes from './routes/stores.routes.js';
import productsRoutes from './routes/products.routes.js';
import ordersRoutes, { setSocketInstance } from './routes/orders.routes.js';
import aiAssistantRoutes from './routes/ai-assistant.routes.js';
import partnerRoutes from './routes/partner.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import advertisementsRoutes from './routes/advertisements.routes.js';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

setSocketInstance(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory
const uploadDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Hyperlocal Delivery & Errand Marketplace API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/ai', aiAssistantRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/advertisements', advertisementsRoutes);

// Real-time Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join order room
  socket.on('join_order', (orderId: string) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined order room order_${orderId}`);
  });

  // Leave order room
  socket.on('leave_order', (orderId: string) => {
    socket.leave(`order_${orderId}`);
  });

  // Join user room for targeted notifications
  socket.on('join_user', (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined user room user_${userId}`);
  });

  // Partner GPS stream
  socket.on('update_partner_location', (data: { orderId: string; lat: number; lng: number; partnerId: string }) => {
    io.to(`order_${data.orderId}`).emit('partner_location_updated', {
      lat: data.lat,
      lng: data.lng,
      partnerId: data.partnerId,
      timestamp: new Date().toISOString(),
    });
  });

  // In-app order chat message
  socket.on('send_order_chat', (data: { orderId: string; senderId: string; senderName: string; text: string; role: string }) => {
    io.to(`order_${data.orderId}`).emit('receive_order_chat', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Hyperlocal Backend Server running at http://localhost:${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});
