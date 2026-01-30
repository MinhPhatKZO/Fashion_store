import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AgoraRTC, {
  AgoraRTCProvider,
  useRTCClient,
  useJoin,
  useRemoteUsers,
  RemoteUser,
} from "agora-rtc-react";
import { io } from "socket.io-client";
import { 
  ShoppingBag, 
  Heart, 
  Send, 
  X, 
  Eye 
} from "lucide-react";

// --- CONFIG ---
const API_BASE_URL = "http://localhost:5000";
const appId = "57376415283d4ba088e6776bcf9bd2e2"; 
const socket = io(API_BASE_URL);

interface ChatMessage {
  user: string;
  message: string;
}

const ViewerLiveContent = ({ channelName }: { channelName: string }) => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [pinnedProduct, setPinnedProduct] = useState<any>(null);
  const [comments, setComments] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [currentUser, setCurrentUser] = useState("Khách");
  
  // Stats (Sync with Seller)
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Join Channel Agora
  // Đảm bảo chỉ join khi có channelName
  const { isConnected } = useJoin({ appid: appId, channel: channelName, token: null }, true);

  // 2. Get Remote Users (Host)
  const remoteUsers = useRemoteUsers();

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) setCurrentUser(storedName);
  }, []);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    if (!channelName) return;

    // Join room với role là 'viewer' để server đếm view
    socket.emit("join_livestream", { roomName: channelName, role: 'viewer' });

    // 1. Pin Product
    socket.on("product_pinned", (product) => {
      setPinnedProduct(product);
      // Tự động ẩn sau 15 giây nếu không có tương tác mới (optional)
      // setTimeout(() => setPinnedProduct(null), 15000); 
    });

    // 2. Chat
    socket.on("new_comment", (data: ChatMessage) => {
      setComments((prev) => [...prev, data]);
    });

    // 3. Stats Sync (Viewers & Likes)
    socket.on("view_count_update", (data: { count: number }) => {
        setViewers(data.count);
    });

    socket.on("receive_heart", () => {
        setLikes((prev) => prev + 1);
        // Optional: Trigger floating heart animation from others
    });

    // 4. Stream Ended
    socket.on("stream_ended", () => {
      alert("Buổi livestream đã kết thúc.");
      navigate("/"); 
    });

    return () => {
      // Báo server là viewer đã rời đi
      socket.emit("leave_livestream", channelName);
      
      socket.off("product_pinned");
      socket.off("new_comment");
      socket.off("view_count_update");
      socket.off("receive_heart");
      socket.off("stream_ended");
    };
  }, [channelName, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const sendComment = () => {
    if (!msg.trim()) return;
    const payload = { streamId: channelName, user: currentUser, message: msg };
    socket.emit("live_chat_message", payload);
    setMsg("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') sendComment();
  };

  const handleSendHeart = () => {
    socket.emit("send_heart", channelName);
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 1000);
  };

  return (
    <div className="relative h-screen bg-black flex justify-center overflow-hidden">
      
      {/* Close Button */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-4 right-4 z-50 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 backdrop-blur-md"
      >
        <X size={24} />
      </button>

      {/* VIDEO PLAYER CONTAINER */}
      <div className="w-full max-w-md h-full relative bg-gray-900 shadow-2xl flex flex-col">
        
        {/* --- HEADER STATS (NEW) --- */}
        <div className="absolute top-4 left-4 z-30 flex gap-2">
            <div className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold animate-pulse shadow-md">
                LIVE
            </div>
            <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-white/10">
                <Eye size={12} /> {viewers}
            </div>
            <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-white/10">
                <Heart size={12} className="text-pink-500 fill-pink-500" /> {likes}
            </div>
        </div>

        {/* Video Render */}
        <div className="flex-1 relative bg-black">
            {remoteUsers.length > 0 ? (
            <RemoteUser 
                user={remoteUsers[0]} 
                style={{ width: '100%', height: '100%' }}
                className="w-full h-full object-cover" 
            />
            ) : (
            <div className="flex items-center justify-center h-full text-white flex-col gap-3 bg-gray-900 absolute inset-0">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-gray-400 font-medium">Đang kết nối tới {channelName}...</p>
                {!isConnected && <p className="text-xs text-red-400">Đang thử lại kết nối...</p>}
            </div>
            )}
            {/* Gradient Overlay for better text visibility */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/80"></div>
        </div>

        {/* --- PINNED PRODUCT POPUP --- */}
        {pinnedProduct && (
          <div className="absolute top-20 left-4 z-20 w-64 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-2xl animate-in slide-in-from-left duration-500 border-l-4 border-red-600">
            <div className="flex gap-3">
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                 <img 
                    src={pinnedProduct.image} 
                    alt="product" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = "https://placehold.co/100"; }} 
                 />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-red-600 uppercase mb-0.5 flex items-center gap-1">
                    <ShoppingBag size={10} /> Đang giới thiệu
                </div>
                <div className="font-bold text-gray-800 truncate text-sm">{pinnedProduct.name}</div>
                <div className="text-blue-600 font-extrabold">{pinnedProduct.price.toLocaleString()}đ</div>
              </div>
            </div>
            <button className="w-full mt-2 bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white py-1.5 rounded-lg font-bold text-xs shadow-md">
              Mua ngay
            </button>
          </div>
        )}

        {/* --- BOTTOM INTERACTION AREA --- */}
        <div className="absolute bottom-0 w-full p-4 z-20 flex flex-col gap-2">
          
          {/* Chat List */}
          <div className="h-48 overflow-y-auto mb-2 space-y-2 pr-1 scrollbar-none mask-image-linear-gradient">
            {comments.map((c, i) => (
              <div key={i} className="flex items-start gap-2 animate-in slide-in-from-bottom-2 duration-300">
                 <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 border border-white/20">
                    {c.user.charAt(0).toUpperCase()}
                 </div>
                 <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl rounded-tl-none text-sm max-w-[85%] break-words border border-white/10 shadow-sm">
                    <span className="font-bold text-yellow-400 mr-2 text-xs">{c.user}</span>
                    <span className="text-gray-100 font-light">{c.message}</span>
                 </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input & Heart */}
          <div className="flex gap-3 items-center pb-2">
            <div className="flex-1 relative">
                <input
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full bg-black/50 text-white rounded-full pl-4 pr-10 py-3 border border-white/20 focus:outline-none focus:border-white/50 focus:bg-black/70 placeholder-gray-300 text-sm backdrop-blur-md transition-all shadow-lg"
                    placeholder="Chat..."
                />
                <button 
                    onClick={sendComment}
                    disabled={!msg.trim()}
                    className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full text-white transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
            
            <button 
                onClick={handleSendHeart}
                className={`p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-white shadow-lg shadow-pink-500/30 active:scale-90 transition-transform ${isLikeAnimating ? 'animate-bounce' : ''}`}
            >
              <Heart size={24} fill="white" className={isLikeAnimating ? "animate-ping" : ""} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// Wrapper Component
const ViewerLive = () => {
  const { channelName } = useParams<{ channelName: string }>();
  // Tạo client với role 'audience' (chỉ xem)
  const agoraClient = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "live", role: "audience" }));

  if (!channelName) return <div className="text-white text-center mt-20">Không tìm thấy kênh Livestream</div>;

  return (
    <AgoraRTCProvider client={agoraClient}>
      <ViewerLiveContent channelName={channelName} />
    </AgoraRTCProvider>
  );
};

export default ViewerLive;