import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Brand } from '../../utils/homeUtils';

interface AIChatBoxProps {
    brand: Brand;
    currentUser: { _id: string; name: string } | null;
    onClose: () => void;
}

interface Message {
    sender: 'user' | 'bot';
    text: string;
    products?: any[]; 
}

const AIChatBox: React.FC<AIChatBoxProps> = ({ brand, currentUser, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: `Chào ${currentUser?.name || 'bạn'}, mình là trợ lý AI. Mình có thể tư vấn sản phẩm gì cho bạn hôm nay?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false); // Trạng thái ẩn/hiện nút cuộn lên

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Tự động cuộn xuống cuối khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Hàm cuộn lên đầu trang chat
    const scrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Theo dõi vị trí cuộn để hiển thị nút "Cuộn lên"
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop } = scrollContainerRef.current;
            setShowScrollBtn(scrollTop > 200); // Hiện nút khi cuộn xuống quá 200px
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
           const response = await axios.post('http://localhost:8000/chat', {
    message: userMsg,
    user_id: currentUser ? currentUser._id : null, // Thêm dòng này để gửi ID xuống cho AI bắt mạch
    brand_id: brand._id 
});

            if (response.data.success) {
                setMessages(prev => [...prev, { 
                    sender: 'bot', 
                    text: response.data.reply,
                    products: response.data.products 
                }]);
            } else {
                setMessages(prev => [...prev, { sender: 'bot', text: 'Xin lỗi, mình đang gặp sự cố kết nối.' }]);
            }
        } catch (error) {
            console.error('Lỗi chat AI:', error);
            setMessages(prev => [...prev, { sender: 'bot', text: 'Hệ thống AI đang bảo trì, bạn thử lại sau nhé!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (url: string) => {
        if (!url) return 'https://via.placeholder.com/150';
        if (url.startsWith('http')) return url;
        return `http://localhost:5000/${url}`;
    };

    return (
        <div className="fixed bottom-6 right-6 w-[90vw] md:w-[420px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 flex flex-col z-50 overflow-hidden transform transition-all duration-300 font-sans">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-500 p-4 flex justify-between items-center text-white shadow-md z-10">
                <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 border border-white"></span>
                    </span>
                    <div>
                        <h3 className="font-bold text-[16px] leading-tight tracking-wide">KZONE AI</h3>
                        <p className="text-[11px] text-red-100 opacity-90">Sẵn sàng tư vấn 24/7</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none text-3xl font-light leading-none transition-transform hover:scale-110">
                    &times;
                </button>
            </div>

            {/* Khung chứa tin nhắn và các nút cuộn */}
            <div className="relative flex-1 bg-[#F9FAFB]">
                
                {/* 👇 CỤM NÚT CUỘN LÊN / XUỐNG 👇 */}
                <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-20">
                    {showScrollBtn && (
                        <button 
                            onClick={scrollToTop}
                            className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full flex items-center justify-center text-red-500 shadow-lg hover:bg-red-500 hover:text-white transition-all transform hover:-translate-y-1"
                            title="Cuộn lên đầu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                        </button>
                    )}
                    <button 
                        onClick={scrollToBottom}
                        className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full flex items-center justify-center text-orange-500 shadow-lg hover:bg-orange-500 hover:text-white transition-all transform hover:translate-y-1"
                        title="Cuộn xuống cuối"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                </div>

                {/* Danh sách tin nhắn */}
                <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="h-[420px] overflow-y-auto p-4 flex flex-col gap-5 scrollbar-thin scrollbar-thumb-gray-300"
                >
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[95%] px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
                                msg.sender === 'user' 
                                ? 'bg-red-500 text-white rounded-2xl rounded-tr-sm' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm w-full'
                            }`}>
                                <p className="whitespace-pre-line">{msg.text}</p>
                                
                                {msg.products && msg.products.length > 0 && (
                                    <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-transparent">
                                        {msg.products.map(p => (
                                            <div key={p._id} className="min-w-[130px] max-w-[130px] bg-white border border-gray-100 rounded-lg p-2 shadow-sm shrink-0 transition-all hover:border-red-200">
                                                <div className="w-full h-28 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center mb-2">
                                                    <img 
                                                        src={getImageUrl(p.image)} 
                                                        alt={p.name} 
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150' }}
                                                    />
                                                </div>
                                                <p className="text-[12px] font-medium text-gray-800 line-clamp-2 leading-tight h-8">{p.name}</p>
                                                <p className="text-[13px] font-bold text-red-500 mt-1">{p.price.toLocaleString('vi-VN')}đ</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 flex gap-1.5 items-center">
                                <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-200 flex gap-2 items-center">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Nhập yêu cầu tư vấn..."
                    className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-[14px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all border border-transparent"
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-red-500 text-white p-2 w-11 h-11 flex items-center justify-center rounded-full hover:bg-red-600 shadow-md transition-all active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default AIChatBox;