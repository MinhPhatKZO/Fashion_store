import React, { useEffect, useState } from 'react';

// Thay đổi API endpoint phù hợp với backend
const API = '/api/cart';

interface CartItem {
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
  };
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

const Cart: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu cart từ API khi mount
  useEffect(() => {
    fetch(API, { credentials: 'include' }) 
      .then(res => res.json())
      .then(data => {
        setCart(data.items || []);
        setLoading(false);
      });
  }, []);

  // Tính tổng tiền
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Hàm xóa sản phẩm khỏi giỏ
  const handleRemove = async (id: string, variant?: any) => {
    await fetch(`${API}/remove`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, variant }),
      credentials: 'include',
    });
    setCart(cart => cart.filter(item => item.product._id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Giỏ hàng</h1>
      {loading ? (
        <p>Đang tải...</p>
      ) : cart.length === 0 ? (
        <p>Giỏ hàng trống.</p>
      ) : (
        <div>
          <table className="w-full mb-8">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Phiên bản</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div>
                      <img src={item.product.images[0]} alt="" className="w-16 h-16 object-cover mr-2 inline-block" />
                      {item.product.name}
                    </div>
                  </td>
                  <td>
                    {(item.variant?.size || '') + (item.variant?.color ? ', ' + item.variant.color : '')}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{item.product.price.toLocaleString()}₫</td>
                  <td>
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded"
                      onClick={() => handleRemove(item.product._id, item.variant)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xl font-bold">Tổng: {total.toLocaleString()}₫</div>
        </div>
      )}
    </div>
  );
};

export default Cart;
