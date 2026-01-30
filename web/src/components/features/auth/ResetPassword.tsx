import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  // 👇 SỬA: Thêm type cho (e)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (password.length < 6) {
        setStatus('error');
        setMessage('Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }

    setStatus('loading');
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, { password });
      setStatus('success');
      setMessage(res.data.message);
      
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) { // 👇 SỬA: Thêm : any cho err
      setStatus('error');
      setMessage(err.response?.data?.message || 'Link đã hết hạn hoặc không hợp lệ.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Đặt lại mật khẩu</h2>

        {status === 'success' ? (
          <div className="bg-green-100 text-green-700 p-4 rounded text-center">
            <p>{message}</p>
            <p className="text-sm mt-2">Đang chuyển hướng về trang đăng nhập...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Mật khẩu mới</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Nhập lại mật khẩu</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {status === 'error' && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                {message}
              </div>
            )}

            <button 
              disabled={status === 'loading'}
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
            >
              {status === 'loading' ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;