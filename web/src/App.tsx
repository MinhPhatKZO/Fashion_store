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
import Checkout from "./pages/Checkout";
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

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    store.dispatch(initializeAuth());
    store.dispatch(loadCartFromStorage());
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <Router>
            <Routes>
              {/* ADMIN */}
              <Route
                path="/admin/*"
                element={<ProtectedRoute element={<AdminLayout />} requiredRole="admin" />}
              >
                <Route index element={<AdminDashboard />} />
                <Route path="promotion" element={<AdminPromotion />} />
                <Route path="statistics" element={<AdminSellerStats />} />
              </Route>

              {/* SELLER */}
              <Route
                path="/seller/*"
                element={<ProtectedRoute element={<SellerLayout />} requiredRole="seller" />}
              >
                <Route index element={<SellerProducts />} />
              </Route>

              {/* USER / PUBLIC */}
              <Route path="/*" element={<UserLayout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
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
                <Route path="profile" element={<Profile />} />
                <Route path="orders" element={<Orders />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Không có quyền */}
              <Route path="/not-authorized" element={<div>Không có quyền truy cập.</div>} />
            </Routes>

            <Toaster position="top-right" />
          </Router>
        </CartProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
