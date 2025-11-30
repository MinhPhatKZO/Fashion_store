import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { store, RootState } from "./store";
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
import Promotions from "./pages/Promotions";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPromotion from "./pages/admin/AdminPromotion";
import AdminSellerStats from "./pages/admin/AdminSellerStats";

// Payment
import CodCheckout from "./payment/CODCheckout";
import OnlineCheckout from "./payment/OnlineCheckout";
import MomoCheckout from "./payment/MomoCheckout";
import OrderConfirmation from "./payment/OrderConfirmation";

// Seller Pages
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerEditProduct from "./pages/seller/SellerEditProduct";
import SellerCreateProduct from "./pages/seller/SellerCreateProduct";

const queryClient = new QueryClient();

/* ==========================
   Login / Register Redirect Components
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
        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="promotion" element={<AdminPromotion />} />
          <Route path="statistics" element={<AdminSellerStats />} />
        </Route>

        {/* Seller Routes */}
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
        </Route>

        {/* User/Public Routes */}
        <Route path="/*" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="promotions" element={<Promotions />} />

          {/* Payment */}
          <Route path="checkout/cod" element={<CodCheckout />} />
          <Route path="checkout/online" element={<OnlineCheckout />} />
          <Route path="checkout/online/momo" element={<MomoCheckout />} />
          <Route path="order-confirmation" element={<OrderConfirmation />} />

          {/* Login/Register Redirect */}
          <Route path="login" element={<LoginRedirect />} />
          <Route path="register" element={<RegisterRedirect />} />

          {/* User Protected */}
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
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
