import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

interface OrderData {
  orderNumber?: string;
  totalAmount?: number;
  paymentMethod?: string;
  status?: string;
}

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Lấy dữ liệu từ URL (Dành cho VNPay/MoMo trả về)
    const params = new URLSearchParams(location.search);
    const orderIdFromUrl = params.get("orderId");
    
    // 2. Lấy dữ liệu từ State (Dành cho COD hoặc chuyển trang nội bộ)
    const stateOrder = location.state && (location.state as any).order;

    if (stateOrder) {
      // Trường hợp 1: Có sẵn state (COD)
      setOrder(stateOrder);
      setLoading(false);
    } else if (orderIdFromUrl) {
      // Trường hợp 2: Trả về từ VNPay (Chỉ có ID trên URL)
      // Lúc này bạn có thể gọi API để lấy chi tiết đơn hàng nếu muốn hiển thị số tiền chính xác
      // Tạm thời mình set cứng các thông tin hiển thị để user yên tâm
      setOrder({
        orderNumber: orderIdFromUrl,
        totalAmount: 0, // Hoặc để null, ta sẽ hiển thị text khác
        paymentMethod: "VNPay/Online",
        status: "success",
      });
      setLoading(false);
    } else {
      // Trường hợp 3: Không có gì cả -> Đá về trang chủ
      // setTimeout để tránh redirect quá nhanh nếu đang load
      const timer = setTimeout(() => {
          navigate("/", { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  if (loading) {
      return (
          <div className="flex justify-center items-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
      );
  }

  if (!order) return null;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl space-y-6 text-center">
        
        {/* ICON CHECK XANH */}
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-4">
          <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-800">
            {order.status === "success" ? "Thanh toán thành công! 🎉" : "Đơn hàng đã được ghi nhận"}
        </h2>
        
        <p className="text-gray-500">
            Cảm ơn bạn đã mua sắm. Đơn hàng của bạn đang được xử lý.
        </p>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-3 text-left max-w-md mx-auto">
            <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-gray-800">{order.orderNumber || "..."}</span>
            </div>

            <div className="flex justify-between">
                <span className="text-gray-600">Phương thức:</span>
                <span className="font-medium text-blue-600">
                    {order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng" : "Chuyển khoản / VNPay"}
                </span>
            </div>

            <div className="flex justify-between border-t pt-3 mt-3">
                <span className="font-bold text-gray-800">Trạng thái:</span>
                <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                    {order.status === "success" ? "Đã thanh toán ✅" : "Chờ xử lý ⏳"}
                </span>
            </div>
            
            {/* Nếu có số tiền thì hiện, không thì ẩn (tránh hiện 0đ) */}
            {order.totalAmount && order.totalAmount > 0 ? (
                <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-gray-800">Tổng tiền:</span>
                    <span className="font-bold text-xl text-red-600">
                        {order.totalAmount.toLocaleString("vi-VN")} ₫
                    </span>
                </div>
            ) : null}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link 
                to="/orders" 
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
                Xem lịch sử đơn hàng
            </Link>
            
            <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition"
            >
                Tiếp tục mua sắm
            </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;