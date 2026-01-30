import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, 
  Calendar, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  ShoppingBag,
  MessageSquare,
  AlertCircle
} from "lucide-react";

// --- CONFIG ---
// Vẫn giữ base URL cho API gọi dữ liệu, nhưng KHÔNG dùng cho ảnh
const API_BASE_URL = "http://localhost:5000";

// --- INTERFACES ---
interface OrderItem {
  product: {
    name: string;
    // Hỗ trợ mọi kiểu dữ liệu ảnh có thể trả về từ DB
    images?: (string | { url: string; isPrimary?: boolean })[] | any; 
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  status: string; 
  createdAt: string;
  items: OrderItem[];
  seller: { name: string; email?: string };
  // 2 trường mới bạn cần
  estimatedDeliveryDate?: string;
  sellerNote?: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // 🔥 FIX LỖI ẢNH (Logic: Luôn trỏ về /asset/ của Frontend)
  const getImageUrl = (imgData: any) => {
    // 1. Kiểm tra dữ liệu rỗng
    if (!imgData) return "https://via.placeholder.com/150?text=No+Img";
    
    // 2. Lấy phần tử đầu tiên nếu là mảng
    let raw = Array.isArray(imgData) ? imgData[0] : imgData;
    
    // 3. Nếu là object { url: ... }, lấy url ra
    let url = (typeof raw === 'object' && raw !== null) ? (raw.url || raw.secure_url) : raw;

    // 4. Nếu vẫn không phải string -> Lỗi
    if (typeof url !== 'string') return "https://via.placeholder.com/150?text=Error";

    // 5. Nếu là ảnh Online (http...) -> Giữ nguyên
    if (url.startsWith("http") || url.startsWith("data:")) return url;

    // 6. Xử lý ảnh Local:
    // Cắt bỏ hết đường dẫn thừa (như "uploads/", "products/"), chỉ lấy tên file cuối cùng
    // Ví dụ: "uploads\ao-thun.jpg" -> "ao-thun.jpg"
    const filename = url.split(/[\\/]/).pop(); 
    
    // Trả về đường dẫn trong thư mục public/asset
    return `/asset/${filename}`;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // Xử lý linh hoạt: data có thể là { orders: [...] } hoặc [...]
        if (res.ok) setOrders(data.orders || (Array.isArray(data) ? data : [])); 
        else console.error(data.message);
      } catch (err) {
        console.error("Lỗi server:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, navigate]);

  // --- HELPER TRẠNG THÁI ---
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Delivered":
      case "completed":
        return { color: "bg-green-100 text-green-700", icon: <CheckCircle size={14} />, label: "Hoàn thành" };
      case "Cancelled":
      case "cancelled":
        return { color: "bg-red-100 text-red-700", icon: <XCircle size={14} />, label: "Đã hủy" };
      case "Shipped":
      case "shipping":
        return { color: "bg-purple-100 text-purple-700", icon: <Truck size={14} />, label: "Đang giao" };
      case "Processing":
        return { color: "bg-blue-100 text-blue-700", icon: <Package size={14} />, label: "Đang chuẩn bị" };
      case "Waiting_Approval":
        return { color: "bg-amber-100 text-amber-700", icon: <Clock size={14} />, label: "Chờ Shop duyệt" };
      case "Pending_Payment":
        return { color: "bg-gray-100 text-gray-700", icon: <AlertCircle size={14} />, label: "Chờ thanh toán" };
      default:
        return { color: "bg-stone-100 text-stone-700", icon: <Package size={14} />, label: status };
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900"></div>
      </div>
    );

  if (!orders.length)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-stone-500">
        <ShoppingBag size={64} className="mb-4 text-stone-300" />
        <h2 className="text-xl font-bold text-stone-700">Chưa có đơn hàng nào</h2>
        <p className="mb-6">Hãy dạo một vòng và mua sắm nhé!</p>
        <button 
          onClick={() => navigate('/products')}
          className="px-6 py-2 bg-amber-900 text-white rounded-full hover:bg-amber-800 transition-colors"
        >
          Mua sắm ngay
        </button>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-stone-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 uppercase tracking-tight">
          Lịch sử đơn hàng
        </h1>
        <p className="text-stone-500 mt-1">Quản lý và theo dõi quá trình vận chuyển của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => {
          const statusConfig = getStatusConfig(order.status);

          return (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
              onClick={() => navigate(`/orders/${order._id}`)}
            >
              {/* Header Card */}
              <div className="p-5 border-b border-stone-100 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-stone-400 text-xs font-medium mb-1">
                     <Calendar size={12} />
                     {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                  <h3 className="font-bold text-lg text-stone-800 group-hover:text-amber-700 transition-colors">
                    #{order.orderNumber}
                  </h3>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusConfig.color}`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </div>
              </div>

              {/* Body Card */}
              <div className="p-5 flex-1 flex flex-col">
                {/* List ảnh preview */}
                <div className="flex gap-2 mb-4 overflow-hidden">
                  {order.items.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="w-12 h-12 rounded-lg bg-stone-50 border border-stone-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img
                        src={getImageUrl(item.product.images)}
                        alt="prod"
                        className="w-full h-full object-cover"
                        // Nếu ảnh lỗi, dùng placeholder
                        onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150?text=Err"; }}
                      />
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                {/* --- HIỂN THỊ THÔNG BÁO TỪ SHOP (NẾU CÓ) --- */}
                {(order.estimatedDeliveryDate || order.sellerNote) && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm animate-pulse">
                        {order.estimatedDeliveryDate && (
                            <div className="flex items-center gap-2 text-blue-800 mb-1">
                                <Truck size={14} />
                                <span className="text-xs font-semibold">
                                    Dự kiến giao: {new Date(order.estimatedDeliveryDate).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                        )}
                        {order.sellerNote && (
                            <div className="flex items-start gap-2 text-blue-700 italic text-xs mt-1">
                                <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                                <span>"{order.sellerNote}"</span>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Footer Card */}
                <div className="flex justify-between items-end mt-auto">
                    <div>
                        <p className="text-xs text-stone-500 mb-0.5">Tổng tiền</p>
                        <p className="text-xl font-black text-amber-900">
                            {order.totalPrice.toLocaleString("vi-VN")}₫
                        </p>
                    </div>
                    
                    <button className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-amber-900 group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                    </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;