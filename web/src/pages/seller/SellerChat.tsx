import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { Send, User, MessageCircle, Loader2 } from "lucide-react";

// --- CONFIG ---
const API_BASE_URL = "http://localhost:5000";
// Khởi tạo socket bên ngoài để tránh connect lại liên tục
const socket = io(API_BASE_URL);

// --- INTERFACES ---
interface Conversation {
  conversationId: string;
  user: {
    _id: string;
    name: string;
    avatar: string;
    email: string;
  };
  lastMessage: string;
  updatedAt: string;
}

interface Message {
  _id?: string;
  senderId: string;
  text: string;
  createdAt: string;
}

const SellerChat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation["user"] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [brandId, setBrandId] = useState<string>(""); 
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. KHỞI TẠO: Lấy BrandID & Danh sách Chat
  useEffect(() => {
    const initChat = async () => {
      try {
        const token = localStorage.getItem("token");
        if(!token) return;

        // A. Lấy Profile để biết mình là Brand nào
        const profileRes = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Lưu BrandID (Quan trọng để tạo RoomID)
        const myBrandId = profileRes.data.brand?._id;
        setBrandId(myBrandId);

        // B. Lấy danh sách khách hàng đã chat
        const chatRes = await axios.get(`${API_BASE_URL}/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations(chatRes.data);
      } catch (err) {
        console.error("Lỗi khởi tạo chat:", err);
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, []);

  // 2. KHI CHỌN KHÁCH HÀNG -> JOIN ROOM & LOAD TIN NHẮN
  useEffect(() => {
    if (!selectedUser || !brandId) return;

    // Room ID chuẩn: UserID - BrandID (Khớp với bên Customer)
    const roomId = `${selectedUser._id}-${brandId}`;
    
    // A. Join Room
    socket.emit("join_room", roomId);
    console.log(`Seller joined room: ${roomId}`);

    // B. Lấy lịch sử tin nhắn từ API
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/chat/messages`, {
          params: { userId: selectedUser._id, brandId: brandId },
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error("Lỗi tải tin nhắn:", err);
      }
    };
    fetchMessages();

    // C. Lắng nghe tin nhắn mới (Real-time)
    const handleNewMessage = (data: Message) => {
        // Chỉ nhận tin nhắn nếu đúng là của Room đang mở (Optional check)
        setMessages((prev) => [...prev, data]);
    };

    socket.on("receive_message", handleNewMessage);

    return () => {
      socket.off("receive_message", handleNewMessage);
    };
  }, [selectedUser, brandId]);

  // 3. AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. GỬI TIN NHẮN
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !brandId) return;

    const roomId = `${selectedUser._id}-${brandId}`;
    
    const messageData = {
      roomId: roomId, // Bắt buộc để server biết gửi đi đâu
      senderId: brandId, // Gửi với tư cách Brand
      text: newMessage,
      createdAt: new Date().toISOString()
    };

    // Gửi qua Socket
    socket.emit("send_message", messageData);

    // Cập nhật UI ngay
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden font-sans">
      
      {/* --- SIDEBAR: LIST USER --- */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" /> Tin nhắn khách hàng
            </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {loading ? (
                <div className="flex justify-center p-5"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : conversations.length === 0 ? (
                <p className="text-center text-gray-400 mt-10 text-sm">Chưa có tin nhắn nào.</p>
            ) : (
                conversations.map((conv) => (
                    <div
                        key={conv.conversationId}
                        onClick={() => setSelectedUser(conv.user)}
                        className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-blue-50 transition border-b border-gray-100 ${
                            selectedUser?._id === conv.user._id ? "bg-blue-100 border-l-4 border-l-blue-600" : ""
                        }`}
                    >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-300">
                            {conv.user.avatar ? (
                                <img src={conv.user.avatar} className="w-full h-full object-cover" alt="avt" />
                            ) : (
                                <User className="w-6 h-6 text-gray-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                                <p className="font-semibold text-gray-800 text-sm truncate">{conv.user.name}</p>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(conv.updatedAt).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5 opacity-80">
                                {conv.lastMessage || "Hình ảnh/File..."}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* --- MAIN: CHAT WINDOW --- */}
      <div className="w-2/3 flex flex-col bg-gray-50/50">
        {selectedUser ? (
            <>
                {/* Header */}
                <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-sm border border-blue-200">
                        {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span className="font-bold text-gray-800 block leading-tight">{selectedUser.name}</span>
                        <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
                            <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span> Online
                        </span>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-400 mt-20 text-sm">Bắt đầu cuộc trò chuyện...</div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.senderId === brandId;
                            return (
                                <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}>
                                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                                        isMe 
                                        ? "bg-blue-600 text-white rounded-br-none" 
                                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 border border-gray-200 focus-within:border-blue-400 focus-within:bg-white transition-all shadow-inner">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Nhập tin nhắn..." 
                            className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-sm text-gray-700"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md transform active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <MessageCircle className="w-12 h-12 text-gray-300" />
                </div>
                <p className="font-medium text-lg text-gray-500">Chọn khách hàng để chat</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SellerChat;