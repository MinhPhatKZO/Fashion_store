import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Video, Eye, Play } from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";

// --- CẤU HÌNH ---
const API_BASE_URL = "http://localhost:5000";
const socket = io(API_BASE_URL);

interface Livestream {
  _id: string;
  title: string;
  thumbnail: string;
  viewers: number;
  brandId: string;
  brandName?: string; // Tên shop
  avatar?: string;    // Logo shop
  status: 'live' | 'ended';
  channelName: string;
}

const LivestreamList: React.FC = () => {
  const [livestreams, setLivestreams] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. LẤY DANH SÁCH BAN ĐẦU TỪ API ---
  useEffect(() => {
    const fetchLivestreams = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/livestreams`);
        
        if (res.data && Array.isArray(res.data)) {
            setLivestreams(res.data);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách livestream:", error);
        // Dữ liệu mẫu (Fallback) để bạn thấy giao diện nếu API chưa có
        setLivestreams([
            { _id: "1", title: "Săn sale Adidas 50%", thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1470&auto=format&fit=crop", viewers: 1200, brandId: "adidas", brandName: "Adidas Store", status: "live", channelName: "shop-live-1" },
            { _id: "2", title: "Gucci Summer Collection", thumbnail: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1469&auto=format&fit=crop", viewers: 850, brandId: "gucci", brandName: "Gucci Official", status: "live", channelName: "gucci-live" },
            { _id: "3", title: "Nike Air Jordan New Arrival", thumbnail: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1470&auto=format&fit=crop", viewers: 3400, brandId: "nike", brandName: "Nike Vietnam", status: "live", channelName: "nike-live" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLivestreams();
  }, []);

  // --- 2. LẮNG NGHE SỰ KIỆN REAL-TIME ---
  useEffect(() => {
    // A. Khi có Seller bắt đầu Live -> Thêm vào đầu danh sách
    socket.on("stream_started", (newStream: Livestream) => {
        console.log("🔥 Có livestream mới:", newStream);
        setLivestreams((prev) => {
            // Kiểm tra trùng lặp trước khi thêm
            if (prev.find(s => s.channelName === newStream.channelName)) return prev;
            return [newStream, ...prev];
        });
    });

    // B. Khi Seller kết thúc Live -> Xóa khỏi danh sách
    socket.on("stream_ended", (channelName: string) => {
        console.log("❌ Livestream kết thúc:", channelName);
        setLivestreams((prev) => prev.filter((stream) => stream.channelName !== channelName));
    });

    // C. Cập nhật số người xem (Viewers) real-time
    socket.on("stream_stats_update", (data: { channelName: string, viewers: number }) => {
        setLivestreams((prev) => prev.map((stream) => 
            stream.channelName === data.channelName 
                ? { ...stream, viewers: data.viewers } 
                : stream
        ));
    });

    return () => {
        socket.off("stream_started");
        socket.off("stream_ended");
        socket.off("stream_stats_update");
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-red-600 p-3 rounded-full animate-pulse shadow-lg shadow-red-500/30">
                <Video className="w-8 h-8 text-white" />
            </div>
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Sàn Livestream</h1>
                <p className="text-gray-500 font-medium">Xem trực tiếp, săn deal độc quyền từ các thương hiệu</p>
            </div>
        </div>

        {/* Content List */}
        {loading ? (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
            </div>
        ) : livestreams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <Video className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Hiện chưa có phiên live nào đang diễn ra.</p>
                <p className="text-sm">Hãy quay lại sau nhé!</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {livestreams.map((stream) => (
                    <Link 
                        key={stream._id} 
                        to={`/livestream/${stream.channelName}`} 
                        className="group relative aspect-[9/16] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 bg-black block"
                    >
                        {/* Thumbnail Image */}
                        <img 
                            src={stream.thumbnail || "https://placehold.co/400x600/222/fff?text=LIVE"} 
                            alt={stream.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
                        />
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 opacity-80" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex gap-2 z-10">
                            <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded flex items-center gap-1 animate-pulse shadow-sm">
                                <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                            </span>
                            <span className="px-2 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-medium rounded flex items-center gap-1 border border-white/10">
                                <Eye size={12} /> {stream.viewers}
                            </span>
                        </div>

                        {/* Play Button Overlay (Hiện khi hover) */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 transform scale-75 group-hover:scale-100 transition-transform">
                                <Play className="w-8 h-8 text-white fill-white ml-1" />
                            </div>
                        </div>

                        {/* Bottom Info */}
                        <div className="absolute bottom-0 left-0 w-full p-4 z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-white p-0.5 shadow-sm overflow-hidden">
                                    <img 
                                        src={stream.avatar || "https://placehold.co/50"} 
                                        className="w-full h-full rounded-full object-cover" 
                                        alt="brand" 
                                    />
                                </div>
                                <span className="text-xs font-bold text-gray-200 truncate max-w-[120px]">
                                    {stream.brandName || "Shop Official"}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 mb-1 group-hover:text-red-400 transition-colors">
                                {stream.title}
                            </h3>
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default LivestreamList;