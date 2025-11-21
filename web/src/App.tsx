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

// Payment Pages
import CodCheckout from "./payment/CODCheckout";
import OnlineCheckout from "./payment/OnlineCheckout";
import MomoCheckout from "./payment/MomoCheckout";
import VNPayCheckout from "./payment/VNPayCheckout"; // Chú ý chữ hoa đúng với file
import OrderConfirmation from "./payment/OrderConfirmation";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    store.dispatch(initializeAuth());
    store.dispatch(loadCartFromStorage());
  }, []);

  const authState = store.getState().auth;

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <Router>
            <Routes>
              {/* ADMIN ROUTES */}
              <Route
                path="/admin/*"
                element={<ProtectedRoute element={<AdminLayout />} requiredRole="admin" />}
              >
                <Route index element={<AdminDashboard />} />
                <Route path="promotion" element={<AdminPromotion />} />
                <Route path="statistics" element={<AdminSellerStats />} />
              </Route>

              {/* SELLER ROUTES */}
              <Route
                path="/seller/*"
                element={<ProtectedRoute element={<SellerLayout />} requiredRole="seller" />}
              >
                <Route index element={<SellerProducts />} />
              </Route>

              {/* USER / PUBLIC ROUTES */}
              <Route path="/*" element={<UserLayout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />

                {/* Thanh toán */}
                <Route path="checkout/cod" element={<CodCheckout />} />
                <Route path="checkout/online" element={<OnlineCheckout />} />
                <Route path="checkout/online/momo" element={<MomoCheckout />} />
                <Route path="checkout/online/vnpay" element={<VNPayCheckout />} />

                {/* Trang xác nhận đơn hàng */}
                <Route path="order-confirmation" element={<OrderConfirmation />} />

                {/* Authentication */}
                <Route
                  path="login"
                  element={
                    authState.isAuthenticated ? (
                      authState.user?.role === "admin" ? (
                        <Navigate to="/admin" replace />
                      ) : authState.user?.role === "seller" ? (
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
                    authState.isAuthenticated ? <Navigate to="/" replace /> : <Register />
                  }
                />

                {/* User protected pages */}
                <Route path="profile" element={<ProtectedRoute element={<Profile />} />} />
                <Route path="orders" element={<ProtectedRoute element={<Orders />} />} />
                <Route path="wishlist" element={<ProtectedRoute element={<Wishlist />} />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Không có quyền truy cập */}
              <Route
                path="/not-authorized"
                element={
                  <div className="flex items-center justify-center h-screen text-2xl text-red-600 font-bold">
                    ⚠️ Không có quyền truy cập.
                  </div>
                }
              />
            </Routes>

            <Toaster position="top-right" />
          </Router>
        </CartProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
