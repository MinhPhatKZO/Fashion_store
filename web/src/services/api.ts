import axios, { AxiosResponse } from 'axios';
import { ApiResponse, PaginationResponse, User, Product, Category, Order, Review, Promotion  } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ message: string; user: { id: string; name: string; email: string; role: string } }>('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data),
  
  getMe: () =>
    api.get<ApiResponse<{ user: User }>>('/auth/me'),
  
  updateProfile: (data: Partial<User>) =>
    api.put<ApiResponse<{ user: User }>>('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse<{ message: string }>>('/auth/change-password', data),
};

// Products API
export const productsAPI = {
  getProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    search?: string;
    sort?: string;
    isFeatured?: boolean;
    isOnSale?: boolean;
  }) =>
    api.get<ApiResponse<PaginationResponse<Product>>>('/products', { params }),
  
  getProduct: (id: string) =>
    api.get<ApiResponse<{ product: Product }>>(`/products/${id}`),
  
  getFeaturedProducts: () =>
    api.get<ApiResponse<{ products: Product[] }>>('/products/featured'),
  
  getRelatedProducts: (id: string) =>
    api.get<ApiResponse<{ products: Product[] }>>(`/products/related/${id}`),
  
  createProduct: (data: Partial<Product>) =>
    api.post<ApiResponse<{ product: Product }>>('/products', data),
  
  updateProduct: (id: string, data: Partial<Product>) =>
    api.put<ApiResponse<{ product: Product }>>(`/products/${id}`, data),
  
  deleteProduct: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/products/${id}`),
};

// Categories API
export const categoriesAPI = {
  getCategories: () =>
    api.get<ApiResponse<{ categories: Category[] }>>('/categories'),
  
  getCategory: (id: string) =>
    api.get<ApiResponse<{ category: Category }>>(`/categories/${id}`),
  
  createCategory: (data: Partial<Category>) =>
    api.post<ApiResponse<{ category: Category }>>('/categories', data),
  
  updateCategory: (id: string, data: Partial<Category>) =>
    api.put<ApiResponse<{ category: Category }>>(`/categories/${id}`, data),
  
  deleteCategory: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/categories/${id}`),
};

// Orders API
export const ordersAPI = {
  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) =>
    api.get<ApiResponse<PaginationResponse<Order>>>('/orders', { params }),
  
  getOrder: (id: string) =>
    api.get<ApiResponse<{ order: Order }>>(`/orders/${id}`),
  
  createOrder: (data: {
    items: Array<{
      product: string;
      variant?: { size?: string; color?: string };
      quantity: number;
    }>;
    shippingAddress: any;
    paymentMethod: string;
    notes?: string;
  }) =>
    api.post<ApiResponse<{ order: Order }>>('/orders', data),
  
  cancelOrder: (id: string, reason?: string) =>
    api.put<ApiResponse<{ order: Order }>>(`/orders/${id}/cancel`, { reason }),
};

// Reviews API
export const reviewsAPI = {
  getProductReviews: (productId: string, params?: {
    page?: number;
    limit?: number;
    rating?: number;
  }) =>
    api.get<ApiResponse<PaginationResponse<Review> & { ratingStats: any }>>(`/reviews/product/${productId}`, { params }),
  
  createReview: (data: {
    product: string;
    rating: number;
    title?: string;
    comment: string;
    images?: any[];
    pros?: string[];
    cons?: string[];
    order?: string;
  }) =>
    api.post<ApiResponse<{ review: Review }>>('/reviews', data),
  
  updateReview: (id: string, data: Partial<Review>) =>
    api.put<ApiResponse<{ review: Review }>>(`/reviews/${id}`, data),
  
  deleteReview: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/reviews/${id}`),
  
  markHelpful: (id: string) =>
    api.post<ApiResponse<{ helpful: any }>>(`/reviews/${id}/helpful`),
};

// Users API
export const usersAPI = {
  getWishlist: () =>
    api.get<ApiResponse<{ wishlist: Product[] }>>('/users/wishlist'),
  
  addToWishlist: (productId: string) =>
    api.post<ApiResponse<{ message: string }>>('/users/wishlist', { productId }),
  
  removeFromWishlist: (productId: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/users/wishlist/${productId}`),
  
  getAddresses: () =>
    api.get<ApiResponse<{ addresses: any[] }>>('/users/addresses'),
  
  addAddress: (data: any) =>
    api.post<ApiResponse<{ address: any }>>('/users/addresses', data),
  
  updateAddress: (id: string, data: any) =>
    api.put<ApiResponse<{ address: any }>>(`/users/addresses/${id}`, data),
  
  deleteAddress: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/users/addresses/${id}`),
};

// Upload API
export const uploadAPI = {
  uploadSingle: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<ApiResponse<{ image: any }>>('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post<ApiResponse<{ images: any[] }>>('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  deleteImage: (publicId: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/upload/${publicId}`),
};

// Payment API
export const paymentAPI = {
  createPaymentIntent: (orderId: string) =>
    api.post<ApiResponse<{ clientSecret: string; paymentIntentId: string }>>('/payment/create-payment-intent', { orderId }),
  
  confirmPayment: (paymentIntentId: string, orderId: string) =>
    api.post<ApiResponse<{ order: Order }>>('/payment/confirm', { paymentIntentId, orderId }),
};

//---------------------------------------------------------------------------------------------------------------------------------------------------//

// Admin API
export const adminAPI = {
  // Lấy danh sách users theo role
  getUsers: (role: "user" | "seller") =>
    api.get<User[]>(`/admin/users?role=${role}`),  // trả về User[]
  
  // Cập nhật role user
  updateUserRole: (id: string, role: "user" | "seller") =>
    api.put<{ message: string; user: { id: string; name: string; role: string } }>(
      `/admin/users/${id}/role`,
      { role }
    ),

  // Xoá user
  deleteUser: (id: string) => api.delete<{ message: string }>(`/admin/users/${id}`),

  // Promotions
  getPromotions: () => api.get<Promotion[]>("/admin/promotions"),
  createPromotion: (data: Partial<Promotion>) =>
    api.post<Promotion>("/admin/promotions", data),
  updatePromotion: (id: string, data: Partial<Promotion>) =>
    api.put<Promotion>(`/admin/promotions/${id}`, data),
  togglePromotion: (id: string) =>
    api.patch<Promotion>(`/admin/promotions/${id}/toggle`),
  deletePromotion: (id: string) =>
    api.delete<{ message: string }>(`/admin/promotions/${id}`),

   //Thống kê tổng quan dashboard
  getStatistics: () => api.get<ApiResponse<{
    totalUsers: number;
    totalSellers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
  }>>("/admin/statistics"),

  //Thống kê doanh thu seller
  getSellerRevenue: (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: "month" | "year";
  }) => api.get<ApiResponse<Array<{
    sellerId: string;
    sellerName: string;
    sellerEmail: string;
    year?: number;
    month?: number;
    totalRevenue: number;
    totalOrders: number;
  }>>>("/admin/seller-revenue", { params }),
};



export default api;

