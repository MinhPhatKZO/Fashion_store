import React, { useState, useEffect, useRef } from "react";
import { X, Send, Minus, Loader2, MessageCircle } from "lucide-react";
import io from "socket.io-client";
import axios from "axios";

// --- CONFIG ---
const API_BASE_URL = "http://localhost:5000";
// Khởi tạo socket bên ngoài component để tránh kết nối lại liên tục khi re-render
const socket = io(API_BASE_URL);

// --- INTERFACES ---
interface Message {
  _id?: string; // ID từ MongoDB
  senderId: string;
  text: string;
  createdAt?: string; // Thời gian từ DB
}

interface ChatBoxProps {
  brand: {
    _id: string;
    name: string;
    logoUrl: string;
  };
  currentUser: {
    _id: string;
    name: string;
  } | null;
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ brand, currentUser, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Room ID chuẩn: UserID - BrandID
  const roomId = currentUser ? `${currentUser._id}-${brand._id}` : "";

  // 1. JOIN PHÒNG & TẢI LỊCH SỬ TIN NHẮN
  useEffect(() => {
    if (!currentUser || !roomId) return;

    // A. Join Socket Room
    socket.emit("join_room", roomId);

    // B. Gọi API lấy tin nhắn cũ
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(`${API_BASE_URL}/api/chat/messages`, {
          params: { userId: currentUser._id, brandId: brand._id },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Nếu API trả về mảng tin nhắn, set vào state
        if (Array.isArray(res.data)) {
            setMessages(res.data);
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử chat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // C. Lắng nghe tin nhắn mới (Real-time)
    const handleReceiveMessage = (data: Message) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("receive_message", handleReceiveMessage);

    // Cleanup khi đóng chat
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [brand._id, currentUser, roomId]);

  // 2. TỰ ĐỘNG CUỘN XUỐNG CUỐI
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isMinimized, loading]);

  // 3. GỬI TIN NHẮN
  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !currentUser) return;

    const messageData = {
      roomId: roomId,         // Cần thiết để Backend biết gửi vào phòng nào
      senderId: currentUser._id,
      text: newMessage,
      createdAt: new Date().toISOString()
    };

    // Gửi qua Socket
    socket.emit("send_message", messageData);

    // Cập nhật UI ngay lập tức (Optimistic update)
    setMessages((list) => [...list, messageData]);
    setNewMessage("");
  };

  // Nếu chưa đăng nhập thì không hiện chat box (hoặc xử lý khác tùy bạn)
  if (!currentUser) return null;

  // --- GIAO DIỆN KHI THU NHỎ ---
  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-0 right-4 w-72 bg-white border border-gray-300 shadow-xl rounded-t-lg z-[9999] cursor-pointer flex items-center justify-between p-3 hover:bg-gray-50 transition-all"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2">
            <div className="relative">
                <img src={brand.logoUrl} alt={brand.name} className="w-8 h-8 rounded-full border object-contain bg-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <span className="font-bold text-gray-800 text-sm truncate">{brand.name}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 hover:bg-gray-200 rounded-full">
            <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    );
  }

  // --- GIAO DIỆN ĐẦY ĐỦ ---
  return (
    <div className="fixed bottom-0 right-4 w-80 md:w-96 h-[500px] bg-white border border-gray-300 shadow-2xl rounded-t-xl z-[9999] flex flex-col overflow-hidden font-sans animate-slide-up">
      
      {/* HEADER */}
      <div className="bg-blue-600 p-3 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={brand.logoUrl} alt="Logo" className="w-10 h-10 rounded-full bg-white object-contain p-0.5 border-2 border-blue-400" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-blue-600 rounded-full"></span>
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">{brand.name}</h3>
            <p className="text-[11px] text-blue-100">Đang hoạt động</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-blue-700/50 rounded-full transition"><Minus className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-1.5 hover:bg-blue-700/50 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* MESSAGE LIST */}
      <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-3">
        {loading ? (
            <div className="flex h-full items-center justify-center flex-col text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-xs">Đang tải tin nhắn...</span>
            </div>
        ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center flex-col text-gray-400 gap-3 opacity-60">
                <MessageCircle className="w-12 h-12" />
                <p className="text-sm">Bắt đầu trò chuyện với shop ngay!</p>
            </div>
        ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === currentUser._id;
              return (
                <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}>
                  {!isMe && (
                    <img src={brand.logoUrl} className="w-8 h-8 rounded-full mr-2 self-end mb-1 object-contain bg-white border shadow-sm" alt="brand" />
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-2 text-sm rounded-2xl shadow-sm leading-relaxed break-words ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 bg-white border-t border-gray-200">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 border border-gray-200 focus-within:border-blue-400 focus-within:bg-white transition-all"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent text-gray-800 text-sm px-3 py-2 outline-none"
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            disabled={!newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;