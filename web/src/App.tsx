import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { store, RootState } from "./store";
import { initializeAuth } from "./store/slices/authSlice";
import { loadCartFromStorage } from "./store/slices/cartSlice";
import { CartProvider } from "./components/features/cart/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";

/// Layouts
import AdminLayout from "./components/Layout/AdminLayout";
import SellerLayout from "./components/Layout/SellerLayout";
import UserLayout from "./components/Layout/UserLayout";

// Pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";

// Features
import Products from "./components/features/products/Products";
import ProductDetail from "./components/features/products/ProductDetail";
import Cart from "./components/features/cart/Cart";

import Login from "./components/features/auth/Login";
import Register from "./components/features/auth/Register";

import Orders from "./components/features/order/Orders";
import OrderDetail from "./components/features/order/OrderDetail";

// Admin
import AdminPromotion from "./components/features/admin/AdminPromotion";
import AdminSellerStats from "./components/features/admin/AdminSellerStats";
import AdminUserManagement from "./components/features/admin/AdminUserManagement";

// Seller
import SellerDashboard from "./components/features/seller/SellerDashboard";
import SellerProducts from "./components/features/seller/SellerProducts";
import SellerOrders from "./components/features/seller/SellerOrders";
import SellerEditProduct from "./components/features/seller/SellerEditProduct";
import SellerCreateProduct from "./components/features/seller/SellerCreateProduct";
import SellerChat from "./components/features/seller/SellerChat"; // <-- 1. Import trang Chat

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
          
          {/* --- 2. Thêm Route Chat cho Seller --- */}
          <Route path="chat" element={<SellerChat />} />
        </Route>

        {/* User */}
        <Route path="/*" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />

          {/* Payment */}
          <Route path="checkout/cod" element={<CodCheckout />} />
          <Route path="checkout/online" element={<OnlineCheckout />} />
          <Route path="checkout/online/momo" element={<MomoCheckout />} />
          <Route path="checkout/vnpay" element={<VNPayCheckout />} />
          <Route path="order-confirmation" element={<OrderConfirmation />} />

          {/* Auth */}
          <Route path="login" element={<LoginRedirect />} />
          <Route path="register" element={<RegisterRedirect />} />

          {/* Protected */}
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

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