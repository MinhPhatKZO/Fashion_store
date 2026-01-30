import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, User, Phone, MapPin, Receipt, ShieldCheck, Loader2, ArrowRight } from "lucide-react";

interface OrderData {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  items: any[];
  shippingAddress?: string;
}

const VNPayCheckout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const orderIdFromState = location.state?.orderData?._id;
  const query = new URLSearchParams(location.search);
  const orderIdFromQuery = query.get("orderId");

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // === Fetch order details ===
  useEffect(() => {
    const orderId = orderIdFromState || orderIdFromQuery;
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setOrderData(data.order);
        } else {
          alert("Không tìm thấy đơn hàng");
          navigate("/cart");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi lấy đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderIdFromState, orderIdFromQuery, token, navigate]);

  const handleSubmit = async () => {
    if (!fullname || !phone || !address) {
      alert("Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }

    if (!token) {
      alert("Bạn cần đăng nhập để thanh toán!");
      navigate("/login");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Update shipping address
      const updateRes = await fetch(
        `http://localhost:5000/api/orders/update-shipping/${orderData?._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            shippingAddress: `Người nhận: ${fullname}, ĐT: ${phone}, Địa chỉ: ${address}`,
          }),
        }
      );

      const updateData = await updateRes.json();
      if (!updateData.success) {
        alert("Không thể cập nhật địa chỉ giao hàng");
        setIsProcessing(false);
        return;
      }

      // 2. Create VNPay Payment URL
      const payRes = await fetch("http://localhost:5000/api/vnpay/create_payment_url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: orderData?._id, amount: orderData?.totalPrice }),
      });

      const payData = await payRes.json();
      
      if (payData.paymentUrl) {
        window.location.href = payData.paymentUrl;
      } else {
        alert("Không tạo được URL thanh toán VNPay");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi server! Vui lòng thử lại sau.");
      setIsProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-stone-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-stone-500 font-medium">Đang tải thông tin đơn hàng...</p>
      </div>
    );

  if (!orderData) return null;

  return (
    <div className="max-w-4xl mx-auto pt-28 pb-16 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => window.history.back()} 
          className="p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-stone-600" />
        </button>
        <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tighter flex items-center gap-3">
          Thanh toán qua <span className="text-blue-600">VNPay</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        
        {/* --- LEFT COLUMN: SHIPPING INFO --- */}
        <div className="md:col-span-7 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm"
          >
            <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Thông tin giao hàng
            </h3>

            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-3 top-3 w-5 h-5 text-stone-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Họ và tên người nhận"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                />
              </div>

              <div className="relative group">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-stone-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="tel"
                  placeholder="Số điện thoại liên hệ"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                />
              </div>

              <div className="relative group">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-stone-400 group-focus-within:text-blue-600 transition-colors" />
                <textarea
                  rows={3}
                  placeholder="Địa chỉ nhận hàng chi tiết"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none resize-none"
                />
              </div>
            </div>
            
            <p className="text-xs text-stone-500 mt-4 italic">
              * Vui lòng kiểm tra kỹ thông tin trước khi tiến hành thanh toán.
            </p>
          </motion.div>
        </div>

        {/* --- RIGHT COLUMN: ORDER SUMMARY --- */}
        <div className="md:col-span-5">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-stone-50 rounded-2xl border border-stone-200 p-6 sticky top-28"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
               <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Receipt className="w-5 h-5" /> Đơn hàng
              </h3>
              <span className="bg-stone-200 text-stone-600 text-xs font-bold px-2 py-1 rounded">
                {orderData.orderNumber}
              </span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-stone-600">
                <span>Giá trị đơn hàng</span>
                <span className="font-medium">{orderData.totalPrice.toLocaleString("vi-VN")} ₫</span>
              </div>
               <div className="flex justify-between items-center text-stone-600">
                <span>Phí dịch vụ</span>
                <span className="font-medium text-green-600">Miễn phí</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-stone-200">
                <span className="text-lg font-bold text-stone-900">Tổng thanh toán</span>
                <span className="text-2xl font-black text-blue-600">
                  {orderData.totalPrice.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-100 mb-6 flex items-start gap-3">
              <div className="w-10 h-10 flex-shrink-0 border border-stone-100 rounded-lg p-1 bg-white flex items-center justify-center">
                 <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" alt="VNPay" className="w-full h-auto object-contain" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">Cổng thanh toán VNPAY</p>
                <p className="text-xs text-stone-500 mt-1">
                  Hỗ trợ thanh toán qua ứng dụng ngân hàng (Mobile Banking) hoặc ví điện tử VNPAY.
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`w-full py-4 px-6 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg
                ${isProcessing 
                  ? "bg-stone-300 text-stone-500 cursor-wait" 
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 active:scale-[0.98]"
                }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
                </>
              ) : (
                <>
                  Thanh toán ngay <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-400">
              <ShieldCheck className="w-3 h-3" /> Bảo mật chuẩn quốc tế PCI DSS
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VNPayCheckout;