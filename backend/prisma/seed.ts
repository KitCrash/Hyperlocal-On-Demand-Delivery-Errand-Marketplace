import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed with enhanced product variety...');

  // Clear existing
  await prisma.complaint.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.historicalPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const customerPassword = await bcrypt.hash('password123', salt);
  const partnerPassword = await bcrypt.hash('password123', salt);
  const adminPassword = await bcrypt.hash('admin123', salt);

  // 1. Users
  const customer = await prisma.user.create({
    data: {
      name: 'Ananya Roy',
      email: 'customer@hyperlocal.in',
      phone: '+91 98765 43210',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      currentLat: 22.5726,
      currentLng: 88.3639,
      walletBalance: 350.0,
      isVerified: true,
    },
  });

  const partner1 = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'partner1@hyperlocal.in',
      phone: '+91 98111 22334',
      passwordHash: partnerPassword,
      role: 'PARTNER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isAvailable: true,
      currentLat: 22.5760,
      currentLng: 88.3685,
      vehicleType: 'MOTORCYCLE',
      rating: 4.88,
      totalRatings: 142,
      walletBalance: 1450.0,
      isVerified: true,
    },
  });

  const partner2 = await prisma.user.create({
    data: {
      name: 'Bikram Das',
      email: 'partner2@hyperlocal.in',
      phone: '+91 98222 33445',
      passwordHash: partnerPassword,
      role: 'PARTNER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      isAvailable: true,
      currentLat: 22.5695,
      currentLng: 88.3590,
      vehicleType: 'SCOOTER',
      rating: 4.92,
      totalRatings: 98,
      walletBalance: 820.0,
      isVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Operations Lead',
      email: 'admin@hyperlocal.in',
      phone: '+91 99999 88888',
      passwordHash: adminPassword,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      walletBalance: 0.0,
      isVerified: true,
    },
  });

  // 2. Stores
  const vegetableMandi = await prisma.store.create({
    data: {
      name: 'New Town Fresh Vegetable & Fish Mandi',
      category: 'GROCERY_VEGGIES',
      address: 'Plot B-4, Action Area 1, Daily Subzi Mandi',
      lat: 22.5800,
      lng: 88.4700,
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
      isLocalMarket: true, // Fluctuating rural/hyperlocal pricing!
    },
  });

  const hardwareStore = await prisma.store.create({
    data: {
      name: 'New Town Hardware & Sanitary Mart',
      category: 'HARDWARE_PLUMBING',
      address: 'Shop 12, Main Market Road, Action Area 1',
      lat: 22.5730,
      lng: 88.3640,
      imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500',
      isLocalMarket: false,
    },
  });

  const electricalStore = await prisma.store.create({
    data: {
      name: 'Shree Ganesh Electricals & Lighting',
      category: 'ELECTRICAL_SUPPLIES',
      address: '45 Station Road, Near Central Bus Stand',
      lat: 22.5740,
      lng: 88.3650,
      imageUrl: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=500',
      isLocalMarket: false,
    },
  });

  const clothingStore = await prisma.store.create({
    data: {
      name: 'Daily Wear Cotton & Garments Corner',
      category: 'CLOTHING_APPAREL',
      address: '18 Market Street, Block C',
      lat: 22.5750,
      lng: 88.3620,
      imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500',
      isLocalMarket: false,
    },
  });

  const kiranaStore = await prisma.store.create({
    data: {
      name: 'Balaram Ghosh Kirana & Essentials',
      category: 'LOCAL_SHOP',
      address: '14 Central Avenue, Near Metro Gate 3',
      lat: 22.5710,
      lng: 88.3615,
      imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=500',
      isLocalMarket: false,
    },
  });

  const chemistStore = await prisma.store.create({
    data: {
      name: 'Apollo 24x7 Chemist Corner',
      category: 'PHARMACY',
      address: 'Shop 8, Ground Floor, Health Hub',
      lat: 22.5745,
      lng: 88.3660,
      imageUrl: 'https://images.unsplash.com/photo-1586015555751-63c254b0cf79?w=500',
      isLocalMarket: false,
    },
  });

  const foodStore = await prisma.store.create({
    data: {
      name: 'Dada Boudi Biryani & Food Corner',
      category: 'RESTAURANT',
      address: '22 Food Street, Station Road',
      lat: 22.5780,
      lng: 88.3620,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
      isLocalMarket: false,
    },
  });

  // 3. Products with extensive variety
  const productsData = [
    // --- VEGETABLES & MANDI ---
    {
      storeId: vegetableMandi.id,
      name: 'Fresh Red Onion (Nashik Quality)',
      nameBengali: 'দেশি লাল পিয়াঁজ (১ কেজি)',
      nameHindi: 'नासिक लाल प्याज (1 किलो)',
      category: 'Vegetables',
      unit: '1 kg',
      estimatedPrice: 38.0,
      isFixedPrice: false,
      currentMarketPrice: 42.0,
      minHistoricalPrice: 32.0,
      maxHistoricalPrice: 58.0,
      avgHistoricalPrice: 40.5,
      imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400',
    },
    {
      storeId: vegetableMandi.id,
      name: 'Chandramukhi Potatoes',
      nameBengali: 'চন্দ্রমুখী আলু (১ কেজি)',
      nameHindi: 'चंद्रमुखी आलू (1 किलो)',
      category: 'Vegetables',
      unit: '1 kg',
      estimatedPrice: 28.0,
      isFixedPrice: false,
      currentMarketPrice: 26.0,
      minHistoricalPrice: 22.0,
      maxHistoricalPrice: 34.0,
      avgHistoricalPrice: 27.0,
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
    },
    {
      storeId: vegetableMandi.id,
      name: 'Farm Fresh Country Tomatoes',
      nameBengali: 'দেশি পাকা টমেটো (১ কেজি)',
      nameHindi: 'ताजा देशी टमाटर (1 किलो)',
      category: 'Vegetables',
      unit: '1 kg',
      estimatedPrice: 40.0,
      isFixedPrice: false,
      currentMarketPrice: 45.0,
      minHistoricalPrice: 30.0,
      maxHistoricalPrice: 65.0,
      avgHistoricalPrice: 42.0,
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
    },
    {
      storeId: vegetableMandi.id,
      name: 'Spicy Green Chillies',
      nameBengali: 'ঝাল কাঁচা লঙ্কা (২৫০ গ্রাম)',
      nameHindi: 'तीखी हरी मिर्च (250 ग्राम)',
      category: 'Vegetables',
      unit: '250 g',
      estimatedPrice: 25.0,
      isFixedPrice: false,
      currentMarketPrice: 28.0,
      minHistoricalPrice: 20.0,
      maxHistoricalPrice: 40.0,
      avgHistoricalPrice: 26.5,
      imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400',
    },
    {
      storeId: vegetableMandi.id,
      name: 'Local Fresh Rohu Fish (Cut & Cleaned)',
      nameBengali: 'টাটকা রুই মাছ কাটা (১ কেজি)',
      nameHindi: 'ताजा रोहू मछली (1 किलो)',
      category: 'Fish & Meat',
      unit: '1 kg',
      estimatedPrice: 260.0,
      isFixedPrice: false,
      currentMarketPrice: 280.0,
      minHistoricalPrice: 220.0,
      maxHistoricalPrice: 320.0,
      avgHistoricalPrice: 265.0,
      imageUrl: 'https://images.unsplash.com/photo-1534948216015-843149f72be3?w=400',
    },
    {
      storeId: vegetableMandi.id,
      name: 'Desi Brown Country Eggs',
      nameBengali: 'দেশি মুরগির ডিম (৬ টি)',
      nameHindi: 'देसी अंडे (6 नग)',
      category: 'Dairy & Eggs',
      unit: '6 pcs',
      estimatedPrice: 55.0,
      isFixedPrice: false,
      currentMarketPrice: 58.0,
      minHistoricalPrice: 48.0,
      maxHistoricalPrice: 65.0,
      avgHistoricalPrice: 54.0,
      imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400',
    },

    // --- HARDWARE & PLUMBING (Water Pipe, Water Mug, Buckets, Taps) ---
    {
      storeId: hardwareStore.id,
      name: 'Flexible Garden & Household Water Pipe (10m Roll)',
      nameBengali: 'নমনীয় পানির পাইপ (১০ মিটার)',
      nameHindi: 'फ्लेक्सिबल पानी का पाइप (10 मीटर)',
      category: 'Hardware & Plumbing',
      unit: '10m roll',
      estimatedPrice: 280.0,
      isFixedPrice: true,
      currentMarketPrice: 280.0,
      minHistoricalPrice: 260.0,
      maxHistoricalPrice: 300.0,
      avgHistoricalPrice: 280.0,
      imageUrl: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=400',
    },
    {
      storeId: hardwareStore.id,
      name: 'Heavy Duty Plastic Water Bucket with Steel Handle (20L)',
      nameBengali: 'মজবুত প্লাস্টিকের বালতি (২০ লিটার)',
      nameHindi: 'मजबूत प्लास्टिक बाल्टी स्टील हैंडल (20 लीटर)',
      category: 'Hardware & Plumbing',
      unit: '1 piece',
      estimatedPrice: 195.0,
      isFixedPrice: true,
      currentMarketPrice: 195.0,
      minHistoricalPrice: 180.0,
      maxHistoricalPrice: 220.0,
      avgHistoricalPrice: 195.0,
      imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=400',
    },
    {
      storeId: hardwareStore.id,
      name: 'Unbreakable Plastic Water Mug (1.5L with Grip)',
      nameBengali: 'প্লাস্টিক পানির মগ (১.৫ লিটার)',
      nameHindi: 'अनब्रेकेबल प्लास्टिक पानी मग (1.5 लीटर)',
      category: 'Hardware & Plumbing',
      unit: '1 piece',
      estimatedPrice: 45.0,
      isFixedPrice: true,
      currentMarketPrice: 45.0,
      minHistoricalPrice: 40.0,
      maxHistoricalPrice: 50.0,
      avgHistoricalPrice: 45.0,
      imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=400',
    },
    {
      storeId: hardwareStore.id,
      name: 'Chrome Plated Water Tap / Bibcock (Standard 1/2 inch)',
      nameBengali: 'ক্রোম পানির কল (১/২ ইঞ্চি)',
      nameHindi: 'क्रोम वाटर नल / बिबकॉक (1/2 इंच)',
      category: 'Hardware & Plumbing',
      unit: '1 piece',
      estimatedPrice: 130.0,
      isFixedPrice: true,
      currentMarketPrice: 130.0,
      minHistoricalPrice: 120.0,
      maxHistoricalPrice: 150.0,
      avgHistoricalPrice: 130.0,
      imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400',
    },

    // --- ELECTRICAL & LIGHTING SUPPLIES (Electricity Things) ---
    {
      storeId: electricalStore.id,
      name: '9W Cool Daylight LED Bulb (Philips / Havells B22)',
      nameBengali: '৯ ওয়াট এলইডি বাল্ব (ফিলিপ্স / হ্যাভেলস)',
      nameHindi: '9 वाट एलईडी बल्ब (फिलिप्स / हैवेल्स)',
      category: 'Electrical & Lighting',
      unit: '1 piece',
      estimatedPrice: 105.0,
      isFixedPrice: true,
      currentMarketPrice: 105.0,
      minHistoricalPrice: 95.0,
      maxHistoricalPrice: 120.0,
      avgHistoricalPrice: 105.0,
      imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400',
    },
    {
      storeId: electricalStore.id,
      name: '4-Way Extension Power Strip (2m Heavy Duty Cable)',
      nameBengali: '৪-ওয়ে পাওয়ার এক্সটেনশন বোর্ড (২ মিটার)',
      nameHindi: '4-वे पावर स्ट्रिप एक्सटेंशन बोर्ड (2 मीटर)',
      category: 'Electrical & Lighting',
      unit: '1 piece',
      estimatedPrice: 285.0,
      isFixedPrice: true,
      currentMarketPrice: 285.0,
      minHistoricalPrice: 270.0,
      maxHistoricalPrice: 320.0,
      avgHistoricalPrice: 285.0,
      imageUrl: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=400',
    },
    {
      storeId: electricalStore.id,
      name: '16A Heavy Duty Modular Socket & Switch Set',
      nameBengali: '১৬ অ্যাম্পিয়ার পাওয়ার সুইচ ও সকেট',
      nameHindi: '16A पावर सॉकेट व स्विच सेट',
      category: 'Electrical & Lighting',
      unit: '1 set',
      estimatedPrice: 85.0,
      isFixedPrice: true,
      currentMarketPrice: 85.0,
      minHistoricalPrice: 75.0,
      maxHistoricalPrice: 95.0,
      avgHistoricalPrice: 85.0,
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
    },
    {
      storeId: electricalStore.id,
      name: 'Electrical PVC Insulation Tape (Pack of 2 - Black & Red)',
      nameBengali: 'বৈদ্যুতিক ইনসুলেশন টেপ (২ টি প্যাকেট)',
      nameHindi: 'बिजली पीवीसी इंसुलेशन टेप (2 का पैक)',
      category: 'Electrical & Lighting',
      unit: 'pack of 2',
      estimatedPrice: 30.0,
      isFixedPrice: true,
      currentMarketPrice: 30.0,
      minHistoricalPrice: 25.0,
      maxHistoricalPrice: 35.0,
      avgHistoricalPrice: 30.0,
      imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400',
    },
    {
      storeId: electricalStore.id,
      name: 'Electrician Line Tester Screwdriver with Clip',
      nameBengali: 'ইলেকট্রিক লাইন টেস্টার স্ক্রু ড্রাইভার',
      nameHindi: 'इलेक्ट्रीशियन लाइन टेस्टर पेचकस',
      category: 'Electrical & Lighting',
      unit: '1 piece',
      estimatedPrice: 35.0,
      isFixedPrice: true,
      currentMarketPrice: 35.0,
      minHistoricalPrice: 30.0,
      maxHistoricalPrice: 40.0,
      avgHistoricalPrice: 35.0,
      imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=400',
    },

    // --- CLOTHING & APPAREL (Clothes, Towels, Raincoat) ---
    {
      storeId: clothingStore.id,
      name: '100% Pure Cotton Round Neck Daily T-Shirt',
      nameBengali: 'খাঁটি সুতির গোল গলা টি-শার্ট',
      nameHindi: '100% शुद्ध कॉटन राउंड नेक टी-शर्ट',
      category: 'Clothing & Apparel',
      unit: '1 piece',
      estimatedPrice: 240.0,
      isFixedPrice: true,
      currentMarketPrice: 240.0,
      minHistoricalPrice: 220.0,
      maxHistoricalPrice: 280.0,
      avgHistoricalPrice: 240.0,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400',
    },
    {
      storeId: clothingStore.id,
      name: 'Pure Cotton Super Absorbent Bath Towel / Gamcha',
      nameBengali: 'খাঁটি সুতির গামছা / গোসলের তোয়ালে',
      nameHindi: 'शुद्ध सूती गमछा / बाथ टॉवल',
      category: 'Clothing & Apparel',
      unit: '1 piece',
      estimatedPrice: 120.0,
      isFixedPrice: true,
      currentMarketPrice: 120.0,
      minHistoricalPrice: 100.0,
      maxHistoricalPrice: 140.0,
      avgHistoricalPrice: 120.0,
      imageUrl: 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=400',
    },
    {
      storeId: clothingStore.id,
      name: "Men's Cotton Daily Lounge Shorts / Bermudas",
      nameBengali: 'পুরুষদের সুতির হাফ প্যান্ট / শর্টস',
      nameHindi: 'मेंस कॉटन लाउंज शॉर्ट्स / बरमूडा',
      category: 'Clothing & Apparel',
      unit: '1 piece',
      estimatedPrice: 180.0,
      isFixedPrice: true,
      currentMarketPrice: 180.0,
      minHistoricalPrice: 160.0,
      maxHistoricalPrice: 220.0,
      avgHistoricalPrice: 180.0,
      imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400',
    },
    {
      storeId: clothingStore.id,
      name: 'Waterproof Full Length Hooded Raincoat / Poncho',
      nameBengali: 'ওয়াটারপ্রুফ রেইনকোট টুপি সহ',
      nameHindi: 'वाटरप्रूफ रेनकोट हुड के साथ',
      category: 'Clothing & Apparel',
      unit: '1 piece',
      estimatedPrice: 260.0,
      isFixedPrice: true,
      currentMarketPrice: 260.0,
      minHistoricalPrice: 240.0,
      maxHistoricalPrice: 300.0,
      avgHistoricalPrice: 260.0,
      imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400',
    },

    // --- GROCERY & STAPLES ---
    {
      storeId: kiranaStore.id,
      name: 'Fortune Kachi Ghani Mustard Oil (1L Pouch)',
      nameBengali: 'ফরচুন কাচ্চি ঘানি সরিষার তেল (১ লিটার)',
      nameHindi: 'फॉर्च्यून कच्ची घानी सरसों तेल (1 ली)',
      category: 'Grocery & Staples',
      unit: '1 litre',
      estimatedPrice: 165.0,
      isFixedPrice: true,
      currentMarketPrice: 165.0,
      minHistoricalPrice: 160.0,
      maxHistoricalPrice: 175.0,
      avgHistoricalPrice: 166.0,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
    },
    {
      storeId: kiranaStore.id,
      name: 'Aashirvaad Shudh Chakki Atta (5kg)',
      nameBengali: 'আশীর্বাদ খাঁটি গম আটা (৫ কেজি)',
      nameHindi: 'आशीर्वाद शुद्ध चक्की आटा (5 किग्रा)',
      category: 'Grocery & Staples',
      unit: '5 kg',
      estimatedPrice: 245.0,
      isFixedPrice: true,
      currentMarketPrice: 245.0,
      minHistoricalPrice: 240.0,
      maxHistoricalPrice: 260.0,
      avgHistoricalPrice: 247.0,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    },
    {
      storeId: kiranaStore.id,
      name: 'Amul Taaza Toned Milk (500ml Pouch)',
      nameBengali: 'আমুল তাজা দুধ (৫০০ মিলি)',
      nameHindi: 'अमूल ताजा दूध (500 मिली)',
      category: 'Dairy & Eggs',
      unit: '500 ml',
      estimatedPrice: 27.0,
      isFixedPrice: true,
      currentMarketPrice: 27.0,
      minHistoricalPrice: 26.0,
      maxHistoricalPrice: 28.0,
      avgHistoricalPrice: 27.0,
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
    },

    // --- PHARMACY ---
    {
      storeId: chemistStore.id,
      name: 'Dolo 650mg Paracetamol Strip (15 Tablets)',
      nameBengali: 'ডলো ৬৫০ প্যারাসিটামল (১৫ টি ট্যাবলেট)',
      nameHindi: 'डोलो 650 पैरासिटामोल (15 गोली)',
      category: 'Pharmacy',
      unit: '1 strip',
      estimatedPrice: 33.5,
      isFixedPrice: true,
      currentMarketPrice: 33.5,
      minHistoricalPrice: 30.0,
      maxHistoricalPrice: 34.0,
      avgHistoricalPrice: 32.5,
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    },

    // --- FOOD ---
    {
      storeId: foodStore.id,
      name: 'Special Kolkata Mutton Biryani with Egg & Aloo',
      nameBengali: 'কলকাতা স্পেশাল মটন বিরিয়ানি (ডিম ও আলু সহ)',
      nameHindi: 'कोलकाता स्पेशल मटन बिरयानी (आलू-अंडे के साथ)',
      category: 'Food',
      unit: '1 plate',
      estimatedPrice: 240.0,
      isFixedPrice: true,
      currentMarketPrice: 240.0,
      minHistoricalPrice: 220.0,
      maxHistoricalPrice: 260.0,
      avgHistoricalPrice: 240.0,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    createdProducts.push(prod);

    // Add historical price recordings for the last 5 days
    const now = new Date();
    for (let day = 5; day >= 1; day--) {
      const pastDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      const variance = (Math.random() * 0.14 - 0.07) * prod.estimatedPrice;
      const recPrice = Math.max(10, Math.round((prod.estimatedPrice + variance) * 10) / 10);
      await prisma.historicalPrice.create({
        data: {
          productId: prod.id,
          recordedPrice: recPrice,
          recordedAt: pastDate,
          marketName: prod.isFixedPrice ? 'MRP Store' : 'New Town Daily Subzi Mandi',
          notes: 'Daily market audit recording',
        },
      });
    }
  }

  // 4. Sample Orders
  // Order 1: DYNAMIC PRICE APPROVAL PENDING
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-77491',
      customerId: customer.id,
      partnerId: partner1.id,
      serviceType: 'GROCERY_SHOPPING',
      status: 'PRICE_APPROVAL_PENDING',
      pickupAddress: 'New Town Fresh Vegetable & Fish Mandi, Stall #14',
      pickupLat: 22.5800,
      pickupLng: 88.4700,
      pickupNotes: 'Buy fresh morning lot only',
      deliveryAddress: 'Flat 4B, Sunrise Towers, Action Area 1',
      deliveryLat: 22.5726,
      deliveryLng: 88.3639,
      deliveryNotes: 'Call on reaching gate, leave with security if unavailable',
      estimatedProductTotal: 104.0,
      actualProductTotal: 125.0,
      deliveryFee: 35.0,
      platformCommission: 10.0,
      partnerEarnings: 25.0,
      totalAmount: 160.0,
      priceApprovalStatus: 'PENDING',
      priceChangeReason: 'Early morning fresh arrival lot prices up due to unseasonal rain in Nashik',
      priceAlertFlag: true,
      purchaseProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      purchaseProofNote: 'Vendor handwritten mandi slip stamped by Shyam Sundar Subzi Bhandar',
      paymentMethod: 'UPI_ONLINE',
      paymentStatus: 'PENDING',
      customerNotes: 'Need firm tomatoes, not overripe',
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        productId: createdProducts[0].id, // Onion
        name: 'Fresh Red Onion (Nashik Quality)',
        quantity: 2.0,
        unit: '1 kg',
        inputMethod: 'VOICE',
        estimatedPrice: 76.0,
        actualPrice: 90.0,
        isApproved: false,
        confidenceScore: 0.94,
      },
      {
        orderId: order1.id,
        productId: createdProducts[1].id, // Potato
        name: 'Chandramukhi Potatoes',
        quantity: 1.0,
        unit: '1 kg',
        inputMethod: 'VOICE',
        estimatedPrice: 28.0,
        actualPrice: 35.0,
        isApproved: false,
        confidenceScore: 0.91,
        uncertaintyFlag: 'Price +25% above 7-day average',
      },
    ],
  });

  // Notifications for Order 1
  await prisma.notification.create({
    data: {
      userId: customer.id,
      role: 'CUSTOMER',
      title: 'Action Needed: Price Approval Required',
      message: 'Partner Rahul Sharma submitted actual mandi prices (₹125 vs est ₹104). Review and approve.',
      type: 'PRICE_APPROVAL',
      link: `/orders/${order1.id}`,
    },
  });

  // Order 2: OUT FOR DELIVERY
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-89312',
      customerId: customer.id,
      partnerId: partner2.id,
      serviceType: 'SHOP_TO_HOME',
      status: 'OUT_FOR_DELIVERY',
      pickupAddress: 'New Town Hardware & Sanitary Mart, Shop 12',
      pickupLat: 22.5730,
      pickupLng: 88.3640,
      deliveryAddress: 'Block C, Greenwood Apartments, Rajarhat',
      deliveryLat: 22.5750,
      deliveryLng: 88.3670,
      estimatedProductTotal: 475.0,
      actualProductTotal: 475.0,
      deliveryFee: 40.0,
      platformCommission: 12.0,
      partnerEarnings: 28.0,
      totalAmount: 515.0,
      priceApprovalStatus: 'APPROVED',
      purchaseProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      purchaseProofNote: 'Printed computer cash receipt #8812 verified',
      deliveryOtp: '4829',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order2.id,
        productId: createdProducts[6].id, // Water pipe
        name: 'Flexible Garden & Household Water Pipe (10m Roll)',
        quantity: 1.0,
        unit: '10m roll',
        inputMethod: 'MANUAL',
        estimatedPrice: 280.0,
        actualPrice: 280.0,
        isApproved: true,
        confidenceScore: 1.0,
      },
      {
        orderId: order2.id,
        productId: createdProducts[7].id, // Bucket
        name: 'Heavy Duty Plastic Water Bucket with Steel Handle (20L)',
        quantity: 1.0,
        unit: '1 piece',
        inputMethod: 'MANUAL',
        estimatedPrice: 195.0,
        actualPrice: 195.0,
        isApproved: true,
        confidenceScore: 1.0,
      },
    ],
  });

  // Order 3: DELIVERED
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-65201',
      customerId: customer.id,
      partnerId: partner1.id,
      serviceType: 'FOOD_ESSENTIALS',
      status: 'DELIVERED',
      pickupAddress: 'Dada Boudi Biryani & Food Corner, Station Road',
      pickupLat: 22.5780,
      pickupLng: 88.3620,
      deliveryAddress: 'Flat 4B, Sunrise Towers, Action Area 1',
      deliveryLat: 22.5726,
      deliveryLng: 88.3639,
      estimatedProductTotal: 240.0,
      actualProductTotal: 240.0,
      deliveryFee: 45.0,
      platformCommission: 12.0,
      partnerEarnings: 33.0,
      tipAmount: 20.0,
      totalAmount: 305.0,
      priceApprovalStatus: 'APPROVED',
      deliveryProofUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600',
      deliveryOtp: '1904',
      paymentMethod: 'UPI_ONLINE',
      paymentStatus: 'PAID',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order3.id,
      productId: createdProducts[createdProducts.length - 1].id,
      name: 'Special Kolkata Mutton Biryani with Egg & Aloo',
      quantity: 1.0,
      unit: '1 plate',
      inputMethod: 'MANUAL',
      estimatedPrice: 240.0,
      actualPrice: 240.0,
      isApproved: true,
      confidenceScore: 1.0,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        orderId: order3.id,
        userId: customer.id,
        type: 'CUSTOMER_PAYMENT',
        amount: 305.0,
        status: 'COMPLETED',
        paymentMethod: 'UPI_ONLINE',
        referenceId: 'UPI-TXN-902814881',
        notes: 'Full order payment via UPI',
      },
      {
        orderId: order3.id,
        userId: partner1.id,
        type: 'PRODUCT_COST_REIMBURSEMENT',
        amount: 240.0,
        status: 'COMPLETED',
        paymentMethod: 'WALLET_CREDIT',
        notes: 'Reimbursement for restaurant bill paid by partner',
      },
      {
        orderId: order3.id,
        userId: admin.id,
        type: 'PLATFORM_COMMISSION',
        amount: 12.0,
        status: 'COMPLETED',
        notes: 'Hyperlocal platform commission earned',
      },
      {
        orderId: order3.id,
        userId: partner1.id,
        type: 'PARTNER_EARNINGS',
        amount: 53.0,
        status: 'COMPLETED',
        notes: 'Delivery fee (₹33) + Customer Tip (₹20)',
      },
    ],
  });

  await prisma.review.create({
    data: {
      orderId: order3.id,
      customerId: customer.id,
      partnerId: partner1.id,
      rating: 5,
      comment: 'Super fast delivery! Food was piping hot and safely handled.',
      tags: 'Punctual,Friendly,Hot food,Careful handling',
    },
  });

  // Sample Complaint
  await prisma.complaint.create({
    data: {
      orderId: order1.id,
      complainantId: customer.id,
      subject: 'Inquiry regarding market price increase on onions',
      description: 'The price entered by the partner was ₹90 for 2kg onion, which is ₹45/kg. Yesterday it was ₹38/kg.',
      status: 'INVESTIGATING',
      resolutionNotes: 'Verified with morning mandi wholesale rate sheet: Nashik arrivals were 40% lower today due to transport strike.',
    },
  });

  console.log('✅ Seeding completed successfully with comprehensive items!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
