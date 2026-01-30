import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import AgoraRTC, {
  AgoraRTCProvider,
  useRTCClient,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useJoin,
  LocalVideoTrack,
} from "agora-rtc-react";
import { io } from "socket.io-client";
import { 
  ShoppingBag, Heart, MessageCircle, Eye, Pin, Loader2, X 
} from "lucide-react";

// --- CẤU HÌNH ---
const API_BASE_URL = "http://localhost:5000";
const appId = "57376415283d4ba088e6776bcf9bd2e2"; 
const socket = io(API_BASE_URL);

// --- HELPER ---
const getImageUrl = (imgData: any) => {
  let url = "";
  if (typeof imgData === "string") url = imgData;
  else if (imgData && typeof imgData === "object" && imgData.url) url = imgData.url;
  
  if (!url) return "https://placehold.co/100x100?text=No+Image";
  if (url.startsWith("http")) return url;
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`; 
};

interface ChatMessage {
  user: string;
  message: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  images: any[]; 
  image?: string; 
  sold: number;
}

// --- COMPONENT NỘI DUNG CHÍNH ---
const HostLiveContent = ({ onEnd }: { onEnd: () => void }) => {
  const [active, setActive] = useState(false); // Trạng thái đang Live (False = Pre-live)
  const [isReady, setIsReady] = useState(false); // Trạng thái bật Camera Preview
  const [liveTitle, setLiveTitle] = useState("");
  const [channelName, setChannelName] = useState(""); // Tên kênh động từ API

  // Stats & Interactive
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [pinnedProduct, setPinnedProduct] = useState<any | null>(null);
  
  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Agora Hooks
  // Camera/Mic chỉ bật khi isReady = true
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isReady);
  const { localCameraTrack } = useLocalCameraTrack(isReady);

  // Chỉ Join & Publish khi active = true (đã bấm bắt đầu live)
  useJoin({ appid: appId, channel: channelName, token: null }, active);
  usePublish([localMicrophoneTrack, localCameraTrack], active);

  // --- 1. INITIALIZE (Lấy sản phẩm & Bật Camera) ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${API_BASE_URL}/api/seller/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const rawData = Array.isArray(res.data) ? res.data : (res.data.products || []);
        // Sắp xếp sản phẩm bán chạy lên đầu
        setProducts(rawData.sort((a: Product, b: Product) => (b.sold || 0) - (a.sold || 0)));
      } catch (error) { console.error(error); } 
      finally { setIsLoadingProducts(false); }
    };
    
    fetchProducts();
    setIsReady(true); // Bật Camera Preview ngay khi vào trang
  }, []);

  // --- 2. SOCKET LISTENERS ---
  useEffect(() => {
    // Chỉ lắng nghe khi đã Active và có Channel Name
    if (active && channelName) {
      // QUAN TRỌNG: Gửi role 'host' để Server không tính là view
      socket.emit("join_livestream", { roomName: channelName, role: 'host' });

      socket.on("new_comment", (data: ChatMessage) => {
        setMessages((prev) => [...prev, data]);
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });

      socket.on("view_count_update", (data) => setViewers(data.count));
      socket.on("receive_heart", () => setLikes(prev => prev + 1));
    }
    
    return () => {
      socket.off("new_comment");
      socket.off("view_count_update");
      socket.off("receive_heart");
    };
  }, [active, channelName]);

  // --- 3. BẮT ĐẦU LIVE (Gọi API tạo phòng) ---
  const handleStartLive = async () => {
      if (!liveTitle.trim()) return alert("Vui lòng nhập tiêu đề phiên Live!");

      try {
          const token = localStorage.getItem("token");
          // Gọi API tạo Livestream
          const res = await axios.post(`${API_BASE_URL}/api/livestreams`, {
              title: liveTitle
          }, { headers: { Authorization: `Bearer ${token}` } });

          const newChannel = res.data.channelName;
          
          setChannelName(newChannel); // 1. Set tên kênh
          setActive(true);            // 2. Chuyển sang giao diện Live & Join Agora

          // 3. Báo cho Server biết để thông báo cho User (Push Notification logic via Socket)
          socket.emit("seller_start_live", res.data);

      } catch (error) {
          console.error("Lỗi tạo livestream:", error);
          alert("Không thể bắt đầu. Vui lòng thử lại!");
      }
  };

  // --- 4. KẾT THÚC LIVE ---
  const handleStop = async () => {
    if (!window.confirm("Bạn chắc chắn muốn kết thúc phiên Live?")) return;
    
    // Tắt trạng thái ngay lập tức
    setActive(false);
    setIsReady(false);
    onEnd();
    
    try {
        const token = localStorage.getItem("token");
        // Gọi API cập nhật status = ended
        await axios.put(`${API_BASE_URL}/api/livestreams/end`, { channelName }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Báo socket giải tán phòng
        socket.emit("end_livestream", channelName);
    } catch (e) { console.error(e); }
  };

  // --- 5. GHIM / BỎ GHIM SẢN PHẨM ---
  const handlePinProduct = (product: Product) => {
    const imgSource = (product.images && product.images.length > 0) ? product.images[0] : product.image;
    const payload = { 
        name: product.name, 
        price: product.price, 
        image: getImageUrl(imgSource) 
    };
    
    setPinnedProduct(payload);
    // Gửi sự kiện ghim cho người xem
    socket.emit("pin_product", { streamId: channelName, product: payload });
  };

  const handleUnpin = () => {
    setPinnedProduct(null);
    socket.emit("pin_product", { streamId: channelName, product: null });
  };

  // ==========================================
  // --- GIAO DIỆN 1: CHUẨN BỊ (PRE-LIVE) ---
  // ==========================================
  if (!active) {
      return (
          <div className="flex h-[calc(100vh-64px)] bg-gray-900 overflow-hidden relative">
              {/* Background Video Preview */}
              <div className="absolute inset-0 z-0">
                  {localCameraTrack ? (
                      <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover opacity-60" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                          <Loader2 className="w-10 h-10 animate-spin" />
                      </div>
                  )}
              </div>

              {/* Form Nhập Tiêu Đề */}
              <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-6">
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
                      <h2 className="text-3xl font-bold text-white mb-2">Chuẩn bị Livestream</h2>
                      <p className="text-gray-300 mb-6 text-sm">Kiểm tra góc máy và đặt tiêu đề thật hấp dẫn!</p>
                      
                      <div className="space-y-4">
                          <input 
                              type="text" 
                              placeholder="Nhập tiêu đề (VD: Xả kho 50%...)" 
                              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-red-500 focus:bg-white/20 transition-all text-center"
                              value={liveTitle}
                              onChange={(e) => setLiveTitle(e.target.value)}
                          />
                          
                          <button 
                              onClick={handleStartLive}
                              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl font-bold text-white shadow-lg hover:shadow-red-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                          >
                              <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                              BẮT ĐẦU PHÁT LIVE
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // ==========================================
  // --- GIAO DIỆN 2: ĐANG LIVE (ON-AIR) ---
  // ==========================================
  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      
      {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag size={18} /> Ghim sản phẩm
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoadingProducts ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400"/></div>
          ) : (
            products.map((p) => (
              <div 
                key={p._id} 
                className="flex gap-3 bg-white p-2 rounded-xl border border-gray-100 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all group relative" 
                onClick={() => handlePinProduct(p)}
              >
                <img src={getImageUrl(p.images?.[0])} className="w-14 h-14 object-cover rounded-lg bg-gray-100" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-gray-800" title={p.name}>{p.name}</div>
                  <div className="text-red-600 font-bold text-xs mt-1">{p.price.toLocaleString()}đ</div>
                </div>
                <button className="text-gray-400 group-hover:text-red-600 absolute top-2 right-2"><Pin size={16}/></button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CỘT GIỮA: MÀN HÌNH LIVE CHÍNH */}
      <div className="flex-1 flex flex-col bg-gray-900 relative">
        
        {/* Header Stats */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
            <div className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-bold animate-pulse shadow-md">LIVE</div>
            <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-white/10">
                <Eye size={12}/> {viewers}
            </div>
            <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-white/10">
                <Heart size={12} className="text-pink-500 fill-pink-500"/> {likes}
            </div>
        </div>

        {/* Pinned Product Overlay (Hiển thị cho Host thấy mình đang ghim gì) */}
        {pinnedProduct && (
            <div className="absolute top-16 left-4 z-20 w-64 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-xl border-l-4 border-orange-500 flex gap-3 animate-in slide-in-from-left duration-300">
                <img src={pinnedProduct.image} className="w-12 h-12 rounded-lg object-cover bg-gray-100" alt="" />
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-orange-600 font-bold uppercase mb-0.5">Đang ghim</div>
                    <div className="text-sm font-bold truncate text-gray-900">{pinnedProduct.name}</div>
                    <div className="text-blue-600 font-bold text-xs">{pinnedProduct.price.toLocaleString()}đ</div>
                </div>
                <button onClick={handleUnpin} className="absolute -top-2 -right-2 bg-gray-200 hover:bg-red-500 hover:text-white rounded-full p-1 transition-colors shadow-sm"><X size={12}/></button>
            </div>
        )}

        {/* Video Area */}
        <div className="flex-1 flex items-center justify-center relative bg-black">
            <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
        </div>

        {/* Footer Control */}
        <div className="h-20 bg-gray-800 border-t border-gray-700 flex items-center justify-center gap-4">
            <button 
                onClick={handleStop} 
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg transition-all flex items-center gap-2"
            >
                <div className="w-2 h-2 bg-white rounded-full" /> KẾT THÚC LIVE
            </button>
        </div>
      </div>

      {/* CỘT PHẢI: CHAT */}
      <div className="w-1/4 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><MessageCircle size={18} /> Bình luận trực tiếp</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs">
                <MessageCircle className="w-8 h-8 mb-2 opacity-20" />
                <p>Chưa có bình luận nào</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
                <div key={idx} className="flex gap-2 items-start text-sm animate-fade-in-up">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm">
                        {msg.user.charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-white p-2.5 rounded-xl rounded-tl-none border border-gray-100 shadow-sm max-w-[90%]">
                        <span className="font-bold text-gray-800 text-xs block mb-0.5">{msg.user}</span>
                        <span className="text-gray-600 leading-tight">{msg.message}</span>
                    </div>
                </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

    </div>
  );
};

// --- COMPONENT WRAPPER ---
const HostLive = () => {
  const agoraClient = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "live", role: "host" }));
  return (
    <AgoraRTCProvider client={agoraClient}>
      <HostLiveContent onEnd={() => window.location.reload()} />
    </AgoraRTCProvider>
  );
};

export default HostLive;