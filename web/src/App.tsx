import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { initializeAuth } from './store/slices/authSlice';
import { loadCartFromStorage } from './store/slices/cartSlice';

// Components
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import NotFound from './pages/NotFound';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import SellerLayout from './pages/seller/SellerLayout';
import SellerDashboard from './pages/seller/Dashboard';
import ProtectedRoute from './routes/ProtectedRoute';


// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    store.dispatch(initializeAuth());
    store.dispatch(loadCartFromStorage());
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* Public Routes */}
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />

                {/* Protected Routes */}
                <Route path="checkout" element={<ProtectedRoute element={<Checkout />} />} />
                <Route path="profile" element={<ProtectedRoute element={<Profile />} />} />
                <Route path="orders" element={<ProtectedRoute element={<Orders />} />} />
                <Route path="orders/:id" element={<ProtectedRoute element={<OrderDetail />} />} />
                <Route path="wishlist" element={<ProtectedRoute element={<Wishlist />} />} />

                {/* Admin-only Route */}
                <Route
                  path="admin"
                  element={<ProtectedRoute element={<AdminLayout />} requiredRole="admin" />}
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  {/* <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} /> */}
                </Route>
                {/* Seller-only Route */}
                <Route
                  path="seller"
                  element={<ProtectedRoute element={<SellerLayout />} requiredRole="seller" />}
                >
                  <Route index element={<SellerDashboard />} />
                  <Route path="dashboard" element={<SellerDashboard />} />
                  {/* <Route path="products" element={<SellerProducts />} />
                  <Route path="orders" element={<SellerOrders />} />
                  <Route path="profile" element={<SellerProfile />} /> */}
                </Route>

                {/* Error Routes */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: { primary: '#10B981', secondary: '#fff' },
                },
                error: {
                  duration: 5000,
                  iconTheme: { primary: '#EF4444', secondary: '#fff' },
                },
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
