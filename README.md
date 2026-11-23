# Hyperlocal On-Demand Delivery & Errand Marketplace

A production-oriented full-stack web application designed for hyperlocal errand management, daily vegetable & grocery shopping from rural/local mandis, shop-to-home delivery, and parcel logistics.

---

## 🌟 Key Highlights & Modules

### 1. ⭐ SPECIAL MODULE: AI Hybrid Order Assistant (Triple-Engine Multimodal)
- **Manual Input**: Search and manually add products with quantities, units, and custom errand requests.
- **Voice Ordering**: Record or upload voice messages in **Bengali (বাংলা)**, **Hindi (हिन्दी)**, or **English**. Speech-to-Text and NLP extract product names, quantities, and units into an editable shopping list with real-time waveform feedback.
- **Image Ordering (OCR)**: Upload handwritten or printed shopping list photos or vendor slips. Vision OCR recognizes products and quantities into structured lists.
- **Multimodal Fusion & Deduplication**: Combines items across Manual, Voice, and Image inputs into a single order. Automatically detects duplicates (e.g., merging 1kg onions from voice + 1kg onions from image into 2kg with a `Merged from Voice & Image` badge). Flags uncertain results for explicit customer verification before order submission.

### 2. Dynamic Market Pricing System
Designed specifically for rural and unorganized vegetable mandis where products do not have printed barcodes or fixed MRP tags:
- **Estimated Benchmark Prices**: Customers place orders with estimated market prices.
- **Counter Verification**: Delivery partner arrives at the stall and enters the actual price per item.
- **Historical Trend Comparison**: Compares against 7-day historical prices, displaying min, max, average, and variance percentage.
- **Unusual Price Spike Alerts**: Automatically flags price increases >20% for Admin fraud auditing.
- **Customer Price Approval**: Customers receive real-time notifications with side-by-side estimated vs. actual comparisons and purchase proofs (mandi receipts). The partner cannot proceed to purchase until the customer approves.
- **Fair Partner Earnings**: Partner earnings are strictly separated into base delivery charges, distance fees, and incentives. Partners never earn from product price markups.

### 3. Real-Time Order Tracking & Communication
- **Workflow State Machine**: `PENDING` ➔ `ACCEPTED` ➔ `SHOPPING` ➔ `PRICE_APPROVAL_PENDING` ➔ `PRICE_APPROVED` ➔ `PURCHASED` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`.
- **Live GPS Radar & Interactive Map**: Visualizes delivery partner movement between store and customer location with real-time Socket.IO stream updates.
- **4-Digit Delivery OTP**: Secure completion requiring the customer's OTP on arrival.
- **In-App Encrypted Chat & Call**: Direct instant communication between customer and rider.

### 4. Comprehensive Payment & Financial Ledger
- **Online Gateway**: Razorpay card, net banking, and UPI checkout.
- **Direct UPI QR**: Instant dynamic UPI QR generator (`upi://pay?pa=...`) with 12-digit UTR reference verification.
- **Cash on Delivery (COD)**: Partner cash collection reconciliation.
- **Double-Entry Financial Ledger**: Separate accounting records for customer payments, product costs, delivery charges, platform commissions (25%), partner net earnings, COD collections, and refunds.

### 5. Three Distinct Panels
- **Customer Panel**: Service selection, product catalog, AI Hybrid Assistant, price approval prompts, live tracking, order history, and 5-star reviews.
- **Delivery Partner Panel**: Online/Offline availability toggle, broadcast job radar, 7-step rider execution console, actual mandi price entry, bill photo upload, and earnings dashboard.
- **Admin Operations Hub**: Real-time GMV and volume metrics, price spike audits, partner KYC verification, complaint resolution, and platform financial ledger.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Socket.IO Client |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | Prisma ORM with SQLite (or PostgreSQL via `DATABASE_URL`) |
| **Realtime** | Socket.IO |
| **AI Engine** | Multilingual Bengali/Hindi/English NLP Parser, Gemini API integration, Vision OCR |
| **Maps** | Interactive Leaflet / OpenStreetMap GPS tracking |
| **Payments** | Razorpay SDK, Direct UPI Intent QR, Cash on Delivery |
| **Storage** | Multer local storage / Cloudinary |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ (tested on v22)
- npm v9+

### 1. Backend Setup
```bash
cd backend
npm install --ignore-scripts
npx prisma generate
npx prisma db push
node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts
node ./node_modules/tsx/dist/cli.mjs src/server.ts
```
The backend server will run at `http://localhost:5000` with WebSockets ready.

### 2. Frontend Setup
```bash
cd frontend
npm install --ignore-scripts
node ./node_modules/next/dist/bin/next build
node ./node_modules/next/dist/bin/next start -p 3000
```
Open your browser at `http://localhost:3000`.

---

## 🔑 Pre-Configured Demo Accounts

Use the **One-Click Role Switcher** in the top navigation bar to switch between roles instantly:

| Role | Name | Email | Password | Features |
|---|---|---|---|---|
| **Customer** | Ananya Roy | `customer@hyperlocal.in` | `password123` | Place AI orders, approve dynamic prices, live tracking |
| **Delivery Partner** | Rahul Sharma | `partner1@hyperlocal.in` | `password123` | Motorcycle, enter actual mandi rates, upload receipts |
| **Delivery Partner** | Bikram Das | `partner2@hyperlocal.in` | `password123` | Scooter, live GPS updates, earnings dashboard |
| **Admin** | Ops Lead | `admin@hyperlocal.in` | `admin123` | GMV, price spike audits, ledger, partner KYC, complaints |

---

## 📐 Order Workflow State Machine

```
[Customer Places Order]
         ↓
    ( PENDING ) ─── Broadcast to nearby online delivery partners
         ↓
  [Partner Accepts]
         ↓
   ( ACCEPTED )
         ↓
  [Partner Arrives at Stall]
         ↓
   ( SHOPPING )
         ↓
  [Partner Enters Actual Mandi Prices + Bill Proof]
         ↓
( PRICE_APPROVAL_PENDING ) ─── Real-time alert to Customer & Admin
         ↓
  ┌───────────────┴───────────────┐
  ↓                               ↓
[Customer Approves]       [Customer Declines]
  ↓                               ↓
( PRICE_APPROVED )        ( PRICE_REJECTED / CANCELLED )
  ↓
[Partner Buys & Packs]
  ↓
  ( PURCHASED )
  ↓
[Partner Starts Navigation]
  ↓
( OUT_FOR_DELIVERY ) ─── Live GPS movement & OTP shared
  ↓
[Partner Verifies 4-Digit OTP]
  ↓
  ( DELIVERED ) ─── Financial ledger posted & Review requested
```
