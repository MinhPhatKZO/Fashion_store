export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin' |'seller';
  addresses: Address[];
  wishlist: string[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  isDefault: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: string;
  level: number;
  children: Category[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: ProductImage[];
  category: Category;
  subcategory?: Category;
  brand?: string;
  sku?: string;
  variants: ProductVariant[];
  tags: string[];
  features: string[];
  specifications: ProductSpecifications;
  rating: ProductRating;
  reviews: string[];
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  saleStartDate?: string;
  saleEndDate?: string;
  views: number;
  sold: number;
  discountPercentage: number;
  primaryImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface ProductVariant {
  size?: string;
  color?: string;
  stock: number;
  price?: number;
  images: string[];
}

export interface ProductSpecifications {
  material?: string;
  care?: string;
  origin?: string;
  weight?: string;
  dimensions?: string;
}

export interface ProductRating {
  average: number;
  count: number;
}

export interface Review {
  _id: string;
  user: User;
  product: string;
  order?: string;
  rating: number;
  title?: string;
  comment: string;
  images: ReviewImage[];
  pros: string[];
  cons: string[];
  isVerified: boolean;
  isAnonymous: boolean;
  helpful: {
    count: number;
    users: string[];
  };
  response?: {
    text: string;
    respondedBy: string;
    respondedAt: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewImage {
  url: string;
  alt?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: 'cod' | 'credit_card' | 'bank_transfer' | 'wallet';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentDetails?: {
    transactionId?: string;
    paymentDate?: string;
    gateway?: string;
    amount?: number;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  history: OrderHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: Product;
  variant?: {
    size?: string;
    color?: string;
  };
  quantity: number;
  price: number;
  total: number;
}

export interface OrderHistory {
  status: string;
  note: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
  success?: boolean;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CartItem {
  product: Product;
  variant?: {
    size?: string;
    color?: string;
    price?: number;
  };
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface Promotion {
  _id: string;
  code: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

// types/index.ts

export interface ReduxCartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  variantId?: string;
  productImage?: string;
}

export interface LocalCart {
  items: CartItem[];
}

export interface ShippingInfo {
  fullName: string;
  phone: string;
  address: string;
}

export interface CheckoutProps {
  localCart: LocalCart;    // Giỏ hàng lấy từ localStorage
  token: string;           // Token người dùng đăng nhập
  shippingInfo?: ShippingInfo; // Thông tin giao hàng (có thể để undefined nếu chưa nhập)
}
