import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { store, RootState } from "./store";
import { initializeAuth } from "./store/slices/authSlice";
import { loadCartFromStorage } from "./store/slices/cartSlice";
import { CartProvider } from "./components/cart/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";

/// Layouts
import AdminLayout from "./components/Layout/AdminLayout";
import SellerLayout from "./components/Layout/SellerLayout";
import UserLayout from "./components/Layout/UserLayout";

// Pages
import Home from "./pages/home/Home";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";

// Features
import Products from "./components/products/Products";
import ProductDetail from "./components/products/ProductDetail";
import Cart from "./components/cart/Cart";

import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

import Orders from "./components/order/Orders";
import OrderDetail from "./components/order/OrderDetail";

// Admin
import AdminPromotion from "./pages/admin/AdminPromotion";
import AdminSellerStats from "./pages/admin/AdminSellerStats";
import AdminUserManagement from "./pages/admin/AdminUserManagement";

// Seller
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerEditProduct from "./pages/seller/SellerEditProduct";
import SellerCreateProduct from "./pages/seller/SellerCreateProduct";
import SellerChat from "./pages/seller/SellerChat";

// Livestream Components
import HostLive from "./pages/seller/Livestream/HostLive"; 
import ViewerLive from "./pages/Livestream/ViewerLive";
import LivestreamList from "./pages/Livestream/LivestreamList"; // 👈 1. Import trang danh sách

// Payment
import CodCheckout from "./payment/CODCheckout";
import OnlineCheckout from "./payment/OnlineCheckout";
import MomoCheckout from "./payment/MomoCheckout";
import VNPayCheckout from "./payment/VNPayCheckout";
import OrderConfirmation from "./payment/OrderConfirmation";

const queryClient = new QueryClient();

/* ==========================
   Login / Register Redirect
========================== */
function LoginRedirect() {
  const auth = useSelector((state: RootState) => state.auth);

  if (auth.isAuthenticated) {
    if (auth.user?.role === "admin") return <Navigate to="/admin" replace />;
    if (auth.user?.role === "seller") return <Navigate to="/seller" replace />;
    return <Navigate to="/" replace />;
  }

  return <Login />;
}

function RegisterRedirect() {
  const auth = useSelector((state: RootState) => state.auth);
  return auth.isAuthenticated ? <Navigate to="/" replace /> : <Register />;
}

/* ==========================
   App Content
========================== */
function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Admin */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminUserManagement />} />
          <Route path="promotion" element={<AdminPromotion />} />
          <Route path="statistics" element={<AdminSellerStats />} />
        </Route>

        {/* Seller */}
        <Route
          path="/seller/*"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="products/create" element={<SellerCreateProduct />} />
          <Route path="products/edit/:id" element={<SellerEditProduct />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="chat" element={<SellerChat />} />
          
          {/* Route cho Seller phát Live */}
          <Route path="livestream" element={<HostLive />} />
        </Route>

        {/* User */}
        <Route path="/*" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />

          {/* Payment Routes */}
          <Route path="checkout/cod" element={<CodCheckout />} />
          <Route path="checkout/online" element={<OnlineCheckout />} />
          <Route path="checkout/online/momo" element={<MomoCheckout />} />
          <Route path="checkout/vnpay" element={<VNPayCheckout />} />
          
          <Route path="checkout/success" element={<OrderConfirmation />} />
          <Route path="order-confirmation" element={<OrderConfirmation />} />

          {/* Auth */}
          <Route path="login" element={<LoginRedirect />} />
          <Route path="register" element={<RegisterRedirect />} />
          
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />

          {/* Protected */}
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

          {/* 👇 2. CÁC ROUTE LIVESTREAM CHO USER */}
          <Route path="livestream" element={<LivestreamList />} /> {/* Trang danh sách */}
          <Route path="livestream/:channelName" element={<ViewerLive />} /> {/* Trang xem chi tiết */}

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Unauthorized */}
        <Route
          path="/not-authorized"
          element={
            <div className="flex items-center justify-center h-screen text-2xl text-red-600 font-bold">
              ⚠️ Bạn không có quyền truy cập.
            </div>
          }
        />
      </Routes>

      <Toaster position="top-right" />
    </Router>
  );
}

/* ==========================
   Main App
========================== */
function App() {
  useEffect(() => {
    store.dispatch(initializeAuth());
    store.dispatch(loadCartFromStorage());
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;