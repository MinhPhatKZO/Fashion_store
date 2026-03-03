import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../cart/CartContext";
import { 
  ChevronLeft, Package, Calendar, Store, CreditCard, Truck, 
  Headphones, CheckCircle, Clock, XCircle, ShoppingBag, 
  Printer, MessageSquare, AlertCircle, FileText
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

interface OrderItem {
  product: {
    _id: string;
    name: string;
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
  estimatedDeliveryDate?: string;
  sellerNote?: string;
  cancelReason?: string;
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const getImageUrl = (imgData: any) => {
    if (!imgData) return "https://via.placeholder.com/150?text=No+Img";
    let url = Array.isArray(imgData) ? imgData[0] : imgData;
    if (typeof url === 'object' && url !== null) {
        url = url.url || url.secure_url || url.path;
    }
    if (typeof url !== 'string') return "https://via.placeholder.com/150?text=Error";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    const cleanPath = url.replace(/\\/g, "/").replace(/^\/+/, "");
    if (cleanPath.startsWith('asset/')) return `/${cleanPath}`; 
    return `/asset/${cleanPath}`;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token) { navigate("/login"); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setOrder(data.order || data || null);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchOrder();
  }, [id, token, navigate]);

  const handleBuyAgain = (item: OrderItem) => {
    addToCart(item.product, item.quantity);
  };

  // --- LOGIC STEPPER (THANH TRẠNG THÁI) ---
  const getStepStatus = (status: string) => {
    switch (status) {
        case "Pending_Payment": 
        case "Waiting_Approval": return 0; // Bước 1
        case "Processing": return 1;       // Bước 2
        case "Shipped": return 2;          // Bước 3
        case "Delivered": return 3;        // Bước 4
        case "Cancelled": return -1;
        default: return 0;
    }
  };

  const steps = [
    { label: "Chờ duyệt", icon: FileText },
    { label: "Đã duyệt", icon: Package },
    { label: "Đang giao", icon: Truck },
    { label: "Đã nhận", icon: CheckCircle }
  ];

  if (loading) return <div className="flex h-screen items-center justify-center bg-stone-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900"></div></div>;
  if (!order) return <div className="flex h-screen items-center justify-center">Không tìm thấy đơn hàng</div>;

  const currentStep = getStepStatus(order.status);
  const isCancelled = order.status === "Cancelled";

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Nav */}
        <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-stone-500 hover:text-amber-900 font-bold transition-colors">
              <ChevronLeft size={20} /> Quay lại danh sách
            </button>
            <div className="flex gap-3">
                <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-600 font-medium rounded-lg hover:bg-stone-50"><Printer size={16} /> In hóa đơn</button>
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-900 text-white font-medium rounded-lg hover:bg-amber-800"><MessageSquare size={16} /> Liên hệ Shop</button>
            </div>
        </div>

        {/* 🔥 THANH TRẠNG THÁI (STEPPER) ĐÃ CẢI TIẾN 🔥 */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 mb-8">
            {isCancelled ? (
                <div className="flex flex-col items-center justify-center text-red-600 py-4">
                    <XCircle size={48} className="mb-2" />
                    <h3 className="text-xl font-bold">Đơn hàng đã bị hủy</h3>
                    <p className="text-stone-500 mt-1">{order.cancelReason || "Lý do: Thay đổi ý định"}</p>
                </div>
            ) : (
                <div className="w-full max-w-4xl mx-auto px-4">
                    <div className="relative flex items-center justify-between">
                        
                        {/* 1. Đường kẻ nền (Màu xám) */}
                        <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>

                        {/* 2. Đường kẻ Active (Màu xanh) - Chạy theo tiến độ */}
                        <div 
                            className="absolute left-0 top-1/2 h-1 bg-green-600 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out"
                            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                        ></div>

                        {/* 3. Các điểm Steps */}
                        {steps.map((step, index) => {
                            const isCompleted = index <= currentStep;
                            const isCurrent = index === currentStep;
                            const Icon = step.icon;

                            return (
                                <div key={index} className="relative z-10 flex flex-col items-center bg-white px-2"> 
                                    {/* Circle Icon */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                        ${isCompleted 
                                            ? "bg-green-600 border-green-600 text-white shadow-lg" 
                                            : "bg-white border-gray-300 text-gray-400"
                                        }
                                        ${isCurrent ? "scale-110 ring-4 ring-green-100" : ""}
                                    `}>
                                        <Icon size={20} />
                                    </div>
                                    
                                    {/* Label */}
                                    <span className={`mt-2 text-xs font-bold uppercase transition-colors 
                                        ${isCompleted ? "text-green-700" : "text-gray-400"}`}
                                    >
                                        {step.label}
                                    </span>
                                    
                                    {/* Date (Chỉ hiện ở bước hiện tại hoặc hoàn thành) */}
                                    {isCompleted && index === currentStep && (
                                        <span className="text-[10px] text-gray-500 font-medium mt-1">
                                            {new Date(order.createdAt).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                
                {/* THÔNG BÁO TỪ SHOP */}
                {(order.estimatedDeliveryDate || order.sellerNote) && !isCancelled && (
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm animate-pulse-slow">
                        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <Store size={18} /> Thông báo từ người bán
                        </h3>
                        <div className="space-y-2 text-sm text-blue-800">
                            {order.estimatedDeliveryDate && (
                                <div className="flex items-center gap-2">
                                    <Truck size={16} />
                                    <span>Dự kiến giao hàng: <strong>{new Date(order.estimatedDeliveryDate).toLocaleDateString('vi-VN')}</strong></span>
                                </div>
                            )}
                            {order.sellerNote && (
                                <div className="flex items-start gap-2 bg-white/60 p-3 rounded-lg mt-2 italic">
                                    <MessageSquare size={16} className="mt-0.5 shrink-0" />
                                    <span>"{order.sellerNote}"</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* DANH SÁCH SẢN PHẨM */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                        <h3 className="font-bold text-stone-800 flex items-center gap-2">
                            <ShoppingBag size={18} className="text-amber-700"/> Sản phẩm
                        </h3>
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">#{order.orderNumber}</span>
                    </div>
                    
                    <div className="divide-y divide-stone-100">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-stone-50 transition-colors">
                                <div className="w-24 h-24 rounded-lg bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                                    <img
                                      src={getImageUrl(item.product.images)}
                                      alt={item.product.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150?text=Err"; }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-lg text-stone-800 mb-1 line-clamp-2">{item.product.name}</h4>
                                    <div className="flex flex-wrap gap-4 text-sm text-stone-500 mb-3">
                                        <p>Đơn giá: <span className="font-medium text-stone-700">{(item.price || 0).toLocaleString("vi-VN")}₫</span></p>
                                        <p>Số lượng: <span className="font-medium text-stone-700">x{item.quantity}</span></p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => handleBuyAgain(item)} className="text-sm font-bold text-amber-700 hover:text-amber-900 hover:underline">Mua lại</button>
                                        <div className="h-4 w-px bg-stone-300"></div>
                                        <button onClick={() => navigate(`/products/${item.product._id}`)} className="text-sm text-stone-500 hover:text-stone-700">Xem sản phẩm</button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-bold text-stone-900">{(item.price * item.quantity || 0).toLocaleString("vi-VN")}₫</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CỘT PHẢI */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <h3 className="font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100">Chi tiết thanh toán</h3>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-stone-600"><span>Tạm tính</span><span className="font-medium">{(order.totalPrice || 0).toLocaleString("vi-VN")}₫</span></div>
                        <div className="flex justify-between text-stone-600"><span>Vận chuyển</span><span className="font-medium text-green-600">Miễn phí</span></div>
                    </div>
                    <div className="pt-4 border-t border-dashed border-stone-200 flex justify-between items-center">
                        <span className="font-bold text-stone-900 text-lg">Tổng cộng</span>
                        <span className="text-2xl font-black text-amber-900">{(order.totalPrice || 0).toLocaleString("vi-VN")}₫</span>
                    </div>
                    <div className="mt-6 p-3 bg-stone-50 rounded-lg text-xs text-stone-500 flex gap-2">
                        <CreditCard size={16} className="shrink-0 text-stone-400"/>
                        Phương thức: <span className="font-bold uppercase">{order.status === 'Pending_Payment' ? 'Chưa thanh toán' : 'COD / Đã thanh toán'}</span>
                    </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white rounded-full text-amber-600 shadow-sm"><Headphones size={18} /></div>
                        <h4 className="font-bold text-amber-900">Cần hỗ trợ?</h4>
                    </div>
                    <p className="text-sm text-amber-800/80 mb-4">Vui lòng liên hệ với chúng tôi nếu bạn có thắc mắc.</p>
                    <button className="w-full py-2 bg-white text-amber-900 font-bold text-sm rounded-lg border border-amber-200 hover:bg-amber-100">Trung tâm trợ giúp</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;