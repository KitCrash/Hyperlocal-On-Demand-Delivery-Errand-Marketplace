export type Role = 'CUSTOMER' | 'PARTNER' | 'ADMIN';

export type ServiceType =
  | 'GROCERY_SHOPPING'
  | 'SHOP_TO_HOME'
  | 'PARCEL_PICKUP_DROP'
  | 'FOOD_ESSENTIALS'
  | 'CUSTOM_ERRAND';

export type OrderStatus =
  | 'PENDING'
  | 'PARTNER_ASSIGNED'
  | 'ACCEPTED'
  | 'SHOPPING'
  | 'PRICE_APPROVAL_PENDING'
  | 'PRICE_APPROVED'
  | 'PRICE_REJECTED'
  | 'PURCHASED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PriceApprovalStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type PaymentMethod = 'UPI_ONLINE' | 'DIRECT_UPI' | 'CARD' | 'NET_BANKING' | 'COD';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
  isAvailable?: boolean;
  currentLat?: number;
  currentLng?: number;
  vehicleType?: string;
  rating?: number;
  totalRatings?: number;
  walletBalance?: number;
  isVerified?: boolean;
}

export interface HistoricalPrice {
  id: string;
  productId: string;
  recordedPrice: number;
  recordedAt: string;
  marketName?: string;
  notes?: string;
}

export interface Product {
  id: string;
  storeId?: string;
  name: string;
  nameBengali?: string;
  nameHindi?: string;
  category: string;
  unit: string;
  estimatedPrice: number;
  isFixedPrice: boolean;
  currentMarketPrice: number;
  minHistoricalPrice: number;
  maxHistoricalPrice: number;
  avgHistoricalPrice: number;
  imageUrl?: string;
  store?: {
    id: string;
    name: string;
    category: string;
    isLocalMarket: boolean;
  };
  historicalPrices?: HistoricalPrice[];
}

export interface Store {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  isLocalMarket: boolean;
  products?: Product[];
  _count?: {
    products: number;
  };
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId?: string;
  name: string;
  quantity: number;
  unit: string;
  inputMethod: 'MANUAL' | 'VOICE' | 'IMAGE_OCR';
  estimatedPrice: number;
  actualPrice?: number;
  isApproved?: boolean;
  confidenceScore?: number;
  uncertaintyFlag?: string | null;
  category?: string;
  imageUrl?: string;
  isDuplicateMerged?: boolean;
  mergedFrom?: string[];
  product?: Product;
}

export interface Transaction {
  id: string;
  orderId?: string;
  userId?: string;
  type: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
  order?: {
    orderNumber: string;
    serviceType: string;
    paymentMethod: string;
  };
  user?: {
    name: string;
    role: string;
    email: string;
  };
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  partnerId: string;
  rating: number;
  comment?: string;
  tags?: string;
  createdAt: string;
  customer?: { name: string; avatarUrl?: string };
}

export interface Complaint {
  id: string;
  orderId?: string;
  complainantId: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string;
  createdAt: string;
  complainant?: { name: string; role: string; phone: string };
  order?: { orderNumber: string; serviceType: string; status: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  partnerId?: string;
  serviceType: ServiceType;
  status: OrderStatus;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupNotes?: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryNotes?: string;
  errandInstructions?: string;
  customTaskDetails?: string;
  estimatedProductTotal: number;
  actualProductTotal: number;
  deliveryFee: number;
  platformCommission: number;
  partnerEarnings: number;
  tipAmount: number;
  totalAmount: number;
  priceApprovalStatus: PriceApprovalStatus;
  priceChangeReason?: string;
  priceAlertFlag: boolean;
  purchaseProofUrl?: string;
  purchaseProofNote?: string;
  deliveryProofUrl?: string;
  deliveryOtp?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'COD_COLLECTED';
  directUpiUtr?: string;
  directUpiVerified?: boolean;
  customerNotes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; phone: string; avatarUrl?: string };
  partner?: {
    id: string;
    name: string;
    phone: string;
    vehicleType?: string;
    rating?: number;
    avatarUrl?: string;
    currentLat?: number;
    currentLng?: number;
  };
  items: OrderItem[];
  transactions?: Transaction[];
  reviews?: Review[];
  complaints?: Complaint[];
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  badge: string;
  category: 'FURNITURE' | 'HOUSEHOLD' | 'LOCAL_SHOP' | 'PROMOTION';
  type: 'BANNER' | 'COMPACT';
  isActive: boolean;
  createdAt?: string;
}

