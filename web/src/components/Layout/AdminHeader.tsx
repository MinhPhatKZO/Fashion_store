import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [itemCount, setItemCount] = useState<number>(0);

  useEffect(() => {
    const storedCart = localStorage.getItem('localCart');
    if (storedCart) {
      try {
        const cart = JSON.parse(storedCart);
        const totalItems = cart.items
          ? cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
          : 0;
        setItemCount(totalItems);
      } catch {
        setItemCount(0);
      }
    }
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('localCart');
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-20 px-8 flex items-center justify-between">
        <Link to="/admin" className="text-3xl font-extrabold text-indigo-600 hover:text-indigo-700">
          Admin Panel
        </Link>

        <nav className="hidden md:flex items-center space-x-10 flex-1 justify-center">
          <Link to="/admin" className="text-gray-700 hover:text-indigo-600 font-medium">
            Quản lý tài khoản
          </Link>
          <Link to="/admin/promotion" className="text-gray-700 hover:text-indigo-600 font-medium">
            Quản lý khuyến mãi
          </Link>
          <Link to="/admin/statistics" className="text-gray-700 hover:text-indigo-600 font-medium">
            Thống kê
          </Link>
        </nav>

        {user && (
          <div className="flex items-center gap-6">
            <span className="text-gray-700 font-semibold flex items-center gap-2">
              <User className="h-6 w-6 text-indigo-600" />
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;