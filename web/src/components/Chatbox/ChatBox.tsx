import React, { useState, useEffect, useRef } from "react";
import { X, Send, Minus, Loader2, MessageCircle, MoreVertical } from "lucide-react";
import io from "socket.io-client";
import axios from "axios";

// --- CONFIG ---
const API_BASE_URL = "http://localhost:5000";
// Khởi tạo socket bên ngoài component
const socket = io(API_BASE_URL);

// --- INTERFACES ---
interface Message {
  _id?: string;
  senderId: string;
  text: string;
  createdAt?: string;
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

  const roomId = currentUser ? `${currentUser._id}-${brand._id}` : "";

  // 1. JOIN PHÒNG & TẢI LỊCH SỬ TIN NHẮN
  useEffect(() => {
    if (!currentUser || !roomId) return;

    socket.emit("join_room", roomId);

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(`${API_BASE_URL}/api/chat/messages`, {
          params: { userId: currentUser._id, brandId: brand._id },
          headers: { Authorization: `Bearer ${token}` }
        });
        
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

    const handleReceiveMessage = (data: Message) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [brand._id, currentUser, roomId]);

  // 2. SCROLL TO BOTTOM
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isMinimized, loading]);

  // 3. SEND MESSAGE
  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !currentUser) return;

    const messageData = {
      roomId: roomId,
      senderId: currentUser._id,
      text: newMessage,
      createdAt: new Date().toISOString()
    };

    socket.emit("send_message", messageData);
    setMessages((list) => [...list, messageData]);
    setNewMessage("");
  };

  if (!currentUser) return null;

  // --- GIAO DIỆN KHI THU NHỎ (MINIMIZED) ---
  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-6 right-6 w-auto bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full z-[9999] cursor-pointer flex items-center p-2 pr-4 hover:scale-105 transition-all duration-300 animate-fade-in"
        onClick={() => setIsMinimized(false)}
      >
        <div className="relative mr-3">
            <img src={brand.logoUrl} alt={brand.name} className="w-10 h-10 rounded-full border border-gray-100 object-contain p-0.5 bg-white" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
        <div className="flex flex-col">
            <span className="font-bold text-gray-900 text-sm">{brand.name}</span>
            <span className="text-[10px] text-green-600 font-medium">Đang trực tuyến</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="ml-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    );
  }

  // --- GIAO DIỆN ĐẦY ĐỦ (EXPANDED) ---
  return (
    <div className="fixed bottom-4 right-4 w-[360px] h-[520px] bg-white border border-gray-200 shadow-2xl rounded-2xl z-[9999] flex flex-col overflow-hidden font-sans animate-slide-up">
      
      {/* HEADER: Clean White Style */}
      <div className="bg-white p-4 flex items-center justify-between border-b border-gray-100 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={brand.logoUrl} alt="Logo" className="w-10 h-10 rounded-full bg-gray-50 object-contain p-0.5 border border-gray-200" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm leading-tight flex items-center gap-1">
                {brand.name}
                <div className="w-1 h-1 rounded-full bg-blue-500"></div>
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">Phản hồi trong vài phút</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"><Minus className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-gray-500"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* MESSAGE LIST: Light Gray Background */}
      <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {loading ? (
            <div className="flex h-full items-center justify-center flex-col text-gray-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
                <span className="text-xs font-medium">Đang kết nối...</span>
            </div>
        ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center flex-col text-gray-400 gap-3 opacity-70">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <MessageCircle className="w-8 h-8 text-gray-300" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-gray-600">Xin chào!</p>
                    <p className="text-xs mt-1">Chúng tôi có thể giúp gì cho bạn?</p>
                </div>
            </div>
        ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === currentUser._id;
              // Grouping logic visual only
              const isLastFromUser = index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId;

              return (
                <div key={index} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}>
                  {!isMe && isLastFromUser && (
                    <img src={brand.logoUrl} className="w-6 h-6 rounded-full mr-2 self-end mb-1 object-contain bg-white border border-gray-200" alt="brand" />
                  )}
                  {!isMe && !isLastFromUser && <div className="w-8 mr-2" />} 

                  <div
                    className={`max-w-[75%] px-4 py-2.5 text-sm shadow-sm leading-relaxed break-words ${
                      isMe
                        ? "bg-black text-white rounded-2xl rounded-br-none" // Style Chat của User (Màu đen)
                        : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-none" // Style Chat của Shop (Màu trắng)
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

      {/* INPUT AREA: Minimalist */}
      <div className="p-3 bg-white border-t border-gray-100">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2 bg-gray-50 rounded-full px-1.5 py-1.5 border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:shadow-sm transition-all duration-300"
        >
          <button type="button" className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
             <MoreVertical className="w-4 h-4"/>
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent text-gray-900 text-sm px-2 py-2 outline-none placeholder:text-gray-400"
          />
          
          <button
            type="submit"
            className={`p-2 rounded-full transition-all duration-300 ${
                newMessage.trim() 
                ? "bg-black text-white hover:bg-gray-800 hover:scale-105 shadow-md" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
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