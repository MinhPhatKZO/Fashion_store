import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast"; 
import { 
  Package, Calendar, User, CreditCard, MapPin, 
  CheckCircle, Truck, XCircle, Clock, Filter, X 
} from "lucide-react"; 

const API_BASE_URL = "http://localhost:5000";

// --- INTERFACES ---
interface OrderItem {
  product: { 
    name: string; 
    price: number; 
    images?: string[] | { url: string }[] | any; 
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  isPaid: boolean;
  user: { name: string; email: string; phone?: string };
  shippingAddress: string;
  items: OrderItem[];
  estimatedDeliveryDate?: string; // Mới thêm
  sellerNote?: string;            // Mới thêm
}

const STATUS_CONFIG: any = {
  "Waiting_Approval": { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  "Processing": { label: "Đang chuẩn bị", color: "bg-blue-100 text-blue-800", icon: Package },
  "Shipped": { label: "Đang giao", color: "bg-purple-100 text-purple-800", icon: Truck },
  "Delivered": { label: "Hoàn thành", color: "bg-green-100 text-green-800", icon: CheckCircle },
  "Cancelled": { label: "Đã hủy", color: "bg-red-100 text-red-800", icon: XCircle },
  "Pending_Payment": { label: "Chờ thanh toán", color: "bg-gray-100 text-gray-600", icon: Clock }
};

const SellerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("All");

  // --- STATE CHO MODAL DUYỆT ĐƠN ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [sellerNote, setSellerNote] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/seller/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err: any) {
      toast.error("Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // 1. MỞ MODAL KHI ẤN DUYỆT
  const openApproveModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    
    // Tự động set ngày dự kiến là 3 ngày sau
    const date = new Date();
    date.setDate(date.getDate() + 3);
    setDeliveryDate(date.toISOString().split('T')[0]); // Format YYYY-MM-DD
    
    setSellerNote("Cảm ơn bạn đã ủng hộ shop! Đơn hàng sẽ sớm được giao đến bạn ❤️");
    setIsModalOpen(true);
  };

  // 2. GỬI API DUYỆT ĐƠN (Kèm ngày & lời nhắn)
  const confirmApproveOrder = async () => {
    if (!selectedOrderId) return;
    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `${API_BASE_URL}/api/seller/orders/${selectedOrderId}/status`,
        { 
            status: "Processing", // Chuyển sang đang chuẩn bị
            estimatedDeliveryDate: deliveryDate,
            sellerNote: sellerNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Đã duyệt đơn hàng thành công!");
      
      // Cập nhật UI
      setOrders((prev) => prev.map((o) => (o._id === selectedOrderId ? { 
          ...o, 
          status: "Processing",
          estimatedDeliveryDate: deliveryDate,
          sellerNote: sellerNote
      } : o)));

      setIsModalOpen(false); // Đóng modal
    } catch (err: any) {
      toast.error("Lỗi khi duyệt đơn");
    }
  };

  // Hàm update trạng thái nhanh cho các nút khác (Giao hàng, Hủy...)
  const handleQuickStatus = async (orderId: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!window.confirm(`Xác nhận chuyển trạng thái?`)) return;
    try {
        await axios.put(`${API_BASE_URL}/api/seller/orders/${orderId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Cập nhật thành công");
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
    } catch(e) { toast.error("Lỗi"); }
  };

  const getProductImage = (imgData: any) => {
     if (!imgData || (Array.isArray(imgData) && imgData.length === 0)) return "https://via.placeholder.com/150?text=No+Img";
     let url = Array.isArray(imgData) ? imgData[0] : imgData;
     if (typeof url === 'object' && url !== null) url = url.url || url.secure_url || url.path;
     if (typeof url !== 'string') return "https://via.placeholder.com/150?text=Error";
     if (url.startsWith("http") || url.startsWith("data:")) return url;
     const cleanPath = url.replace(/\\/g, "/").replace(/^\/+/, "");
     return cleanPath.startsWith('asset/') ? `/${cleanPath}` : `/asset/${cleanPath}`;
  };

  const filteredOrders = filterStatus === "All" ? orders : orders.filter(o => o.status === filterStatus);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans relative">
      
      {/* HEADER & TABS (Giữ nguyên code cũ) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Package className="text-blue-600" /> Quản lý đơn hàng</h1></div>
        <button onClick={fetchOrders} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium shadow-sm transition-all">Làm mới</button>
      </div>
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-2 px-1">
            <Filter size={18} className="text-gray-400 mr-2" />
            {Object.keys(STATUS_CONFIG).concat("All").reverse().map((key) => {
                const statusKey = key === "All" ? "All" : key;
                return (
                    <button key={statusKey} onClick={() => setFilterStatus(statusKey)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${filterStatus === statusKey ? "bg-blue-600 text-white shadow-md transform scale-105" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
                        {key === "All" ? "Tất cả" : STATUS_CONFIG[key].label}
                    </button>
                );
            })}
        </div>
      </div>

      {/* ORDER LIST */}
      <div className="space-y-6">
          {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                {/* Header Card */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800 text-lg">#{order.orderNumber}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${STATUS_CONFIG[order.status]?.color || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_CONFIG[order.status]?.label || order.status}
                  </div>
                </div>

                {/* Body Card */}
                <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="space-y-4">
                        {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden border border-gray-200 flex-shrink-0 flex items-center justify-center">
                                <img src={getProductImage(item.product.images)} alt="prod" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150?text=Error"; }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 line-clamp-2">{item.product.name}</p>
                                <p className="text-xs text-gray-500 mt-1">x{item.quantity}</p>
                            </div>
                            <div className="text-sm font-bold text-gray-800 whitespace-nowrap">{(item.price * item.quantity).toLocaleString()} ₫</div>
                        </div>
                        ))}
                    </div>
                    {/* Hiển thị lời nhắn nếu đã duyệt */}
                    {order.sellerNote && (
                        <div className="mt-2 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
                            <strong>Lời nhắn shop:</strong> "{order.sellerNote}" <br/>
                            <strong>Dự kiến giao:</strong> {order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </div>
                    )}
                  </div>

                  <div className="flex flex-col border-l border-gray-100 pl-0 lg:pl-8 pt-6 lg:pt-0 gap-6">
                    <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-1.5 bg-gray-100 rounded-full text-gray-600"><User size={14} /></div>
                            <div><p className="font-semibold text-gray-900">{order.user?.name}</p><p className="text-xs text-gray-500">{order.user?.phone}</p></div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-1.5 bg-gray-100 rounded-full text-gray-600"><MapPin size={14} /></div>
                            <p className="text-gray-600 line-clamp-3">{order.shippingAddress}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-1.5 bg-gray-100 rounded-full text-gray-600"><CreditCard size={14} /></div>
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-700 uppercase text-xs">{order.paymentMethod}</span>
                                {order.isPaid ? <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded w-fit mt-1">ĐÃ THANH TOÁN</span> : <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded w-fit mt-1">CHƯA THANH TOÁN</span>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-2">
                        {/* NÚT DUYỆT ĐƠN -> MỞ MODAL */}
                        {order.status === "Waiting_Approval" && (
                            <button onClick={() => openApproveModal(order._id)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> Duyệt đơn hàng
                            </button>
                        )}
                        {/* Các nút khác giữ nguyên logic cũ */}
                        {order.status === "Processing" && <button onClick={() => handleQuickStatus(order._id, "Shipped")} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"><Truck size={16} /> Giao vận chuyển</button>}
                        {order.status === "Shipped" && <button onClick={() => handleQuickStatus(order._id, "Delivered")} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"><CheckCircle size={16} /> Xác nhận đã giao</button>}
                        {["Waiting_Approval", "Processing"].includes(order.status) && <button onClick={() => { if(window.confirm("Hủy đơn?")) handleQuickStatus(order._id, "Cancelled"); }} className="w-full py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">Hủy bỏ đơn hàng</button>}
                    </div>
                  </div>
                </div>
              </div>
          ))}
      </div>

      {/* --- MODAL DUYỆT ĐƠN --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <CheckCircle className="text-blue-600" size={20} /> Duyệt đơn hàng
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giao hàng dự kiến</label>
                        <input 
                            type="date" 
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lời nhắn / Câu chúc tới khách</label>
                        <textarea 
                            rows={3}
                            value={sellerNote}
                            onChange={(e) => setSellerNote(e.target.value)}
                            placeholder="Ví dụ: Cảm ơn bạn đã tin tưởng shop..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                        ></textarea>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={confirmApproveOrder}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md transition-all transform hover:scale-105"
                    >
                        Xác nhận duyệt
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default SellerOrders;