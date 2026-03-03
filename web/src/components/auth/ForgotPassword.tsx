import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); 
  const [message, setMessage] = useState('');

  // 👇 SỬA: Thêm type cho (e)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setStatus('success');
      setMessage(res.data.message);
    } catch (err: any) { // 👇 SỬA: Thêm : any cho err
      setStatus('error');
      setMessage(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Quên mật khẩu</h2>
        
        {status === 'success' ? (
          <div className="text-center">
            <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
              {message}
            </div>
            <Link to="/login" className="text-blue-600 hover:underline">Quay lại đăng nhập</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Nhập email của bạn</label>
              <input 
                type="email" 
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {status === 'loading' ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>

            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-gray-500 hover:text-black">Quay lại đăng nhập</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;