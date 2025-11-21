import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { store } from "./store";
import { initializeAuth } from "./store/slices/authSlice";
import { loadCartFromStorage } from "./store/slices/cartSlice";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Layouts
import AdminLayout from "./components/Layout/AdminLayout";
import SellerLayout from "./components/Layout/SellerLayout";
import UserLayout from "./components/Layout/UserLayout";

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
// import Checkout from "./pages/Checkout"; // Đã loại bỏ Route Checkout chung
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import AdminPromotion from "./pages/admin/AdminPromotion";
import AdminSellerStats from "./pages/admin/AdminSellerStats";

// Imports mới cho các trang thanh toán chi tiết (đặt trong thư mục 'payment')
import CodCheckout from "./payment/CODCheckout";
import OnlineCheckout from "./payment/OnlineCheckout";
import WalletProcessor from "./payment/WalletProcessor";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Khởi tạo Auth và tải Cart từ LocalStorage khi ứng dụng khởi động
    store.dispatch(initializeAuth());
    store.dispatch(loadCartFromStorage());
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <Router>
            <Routes>
              {/* ADMIN ROUTES - Yêu cầu role="admin" */}
              <Route
                path="/admin/*"
                element={<ProtectedRoute element={<AdminLayout />} requiredRole="admin" />}
              >
                <Route index element={<AdminDashboard />} />
                <Route path="promotion" element={<AdminPromotion />} />
                <Route path="statistics" element={<AdminSellerStats />} />
              </Route>

              {/* SELLER ROUTES - Yêu cầu role="seller" */}
              <Route
                path="/seller/*"
                element={<ProtectedRoute element={<SellerLayout />} requiredRole="seller" />}
              >
                <Route index element={<SellerProducts />} />
              </Route>

              {/* USER / PUBLIC ROUTES - Sử dụng UserLayout làm Layout cha */}
              <Route path="/*" element={<UserLayout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                
                {/* 1. Thanh toán COD: /checkout/cod */}
                <Route path="checkout/cod" element={<CodCheckout />} />
                {/* 2. Chọn Cổng Thanh toán Online: /checkout/online */}
                <Route path="checkout/online" element={<OnlineCheckout />} />
                {/* 3. Xử lý Cổng Thanh toán cụ thể (Momo/VNPay/ZaloPay): /checkout/online/:walletType */}
                <Route path="checkout/online/:walletType" element={<WalletProcessor />} />
                {/* ----------------------------------------------------- */}

                <Route
                  path="login"
                  element={
                    store.getState().auth.isAuthenticated ? (
                      store.getState().auth.user?.role === "admin" ? (
                        <Navigate to="/admin" replace />
                      ) : store.getState().auth.user?.role === "seller" ? (
                        <Navigate to="/seller" replace />
                      ) : (
                        <Navigate to="/" replace />
                      )
                    ) : (
                      <Login />
                    )
                  }
                />
                <Route
                  path="register"
                  element={
                    store.getState().auth.isAuthenticated ? (
                      <Navigate to="/" replace />
                    ) : (
                      <Register />
                    )
                  }
                />
                {/* Các trang yêu cầu User đăng nhập (Profile, Orders, Wishlist) */}
                <Route path="profile" element={<ProtectedRoute element={<Profile />} />} />
                <Route path="orders" element={<ProtectedRoute element={<Orders />} />} />
                <Route path="wishlist" element={<ProtectedRoute element={<Wishlist />} />} />

                {/* Catch-all for 404 inside UserLayout */}
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Lỗi không có quyền truy cập */}
              <Route path="/not-authorized" element={
                <div className="flex items-center justify-center h-screen text-2xl text-red-600 font-bold">
                  ⚠️ Không có quyền truy cập.
                </div>
              } />
            </Routes>

            <Toaster position="top-right" />
          </Router>
        </CartProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;