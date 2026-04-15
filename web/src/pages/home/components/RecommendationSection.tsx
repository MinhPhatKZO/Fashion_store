import React, { useState, useEffect } from 'react';
import ProductCard from '../../../components/products/ProductCard'; 
import Cookies from 'js-cookie';
import axios from 'axios';

interface Props {
    // Thêm fallback từ props để phòng hờ trường hợp Node.js bị sập hẳn
    fallbackProducts?: any[]; 
}

const RecommendationSection: React.FC<Props> = ({ fallbackProducts = [] }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // State (tùy chọn) để hiển thị dòng chữ AI đang dùng luồng nào
    const [recommendType, setRecommendType] = useState<string>(""); 

    useEffect(() => {
        const fetchSmartRecommendations = async () => {
            try {
                setIsLoading(true);
                
                // 1. Đọc Cookie lấy sở thích ngắn hạn
                const recentCookie = Cookies.get('recent_views');
                const recentItemIds = recentCookie ? JSON.parse(recentCookie) : [];

                // 2. Lấy User ID (sở thích dài hạn) nếu khách đã đăng nhập
                // Lưu ý: Đổi 'userInfo' thành key bạn đang dùng trong dự án
                const userInfoStr = localStorage.getItem('userInfo'); 
                const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
                const userId = userInfo ? userInfo._id : null;

                // 3. GỌI API GỘP TẠI NODE.JS
                const response = await axios.post("http://localhost:5000/api/recommendations/smart", {
                    recent_item_ids: recentItemIds,
                    userId: userId, // Bơm thêm User ID vào cho Node.js điều phối
                    limit: 5 // Lấy 5 món để vừa khít grid-cols-5
                });

                if (response.data.success && response.data.products && response.data.products.length > 0) {
                    setProducts(response.data.products);
                    setRecommendType(response.data.type); // Lưu lại kiểu AI để log/hiển thị nếu cần
                } else {
                    setProducts(fallbackProducts);
                }

            } catch (error) {
                console.error(" Lỗi tải gợi ý từ Node.js:", error);
                setProducts(fallbackProducts); 
            } finally {
                setIsLoading(false);
            }
        };

        fetchSmartRecommendations();
    }, [fallbackProducts]);

    if (isLoading) {
        return (
            <div className="w-full py-8 flex justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-4 border-[#8B4513] border-t-transparent animate-spin"></div>
                    <p className="text-[#8B4513] font-serif text-sm">AI đang phân tích sở thích của bạn...</p>
                </div>
            </div>
        );
    }

    if (!products || products.length === 0) return null;

    return (
        <div className="w-full py-8">
            <div className="relative rounded-3xl bg-gradient-to-br from-[#FAF7F2] via-white to-[#F2E8DF] p-6 md:p-10 border border-[#E8D5C4] shadow-[0_15px_40px_rgba(139,69,19,0.03)] overflow-hidden">
                
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#D7B9A5] opacity-10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#C4A484] opacity-10 blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#8B4513] p-2.5 rounded-lg shadow-lg shadow-orange-900/10">
                            <span className="text-xl">🤎</span>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#8B4513] uppercase tracking-[0.1em] font-serif">
                                Dành Riêng Cho Bạn
                            </h2>
                            <div className="h-0.5 w-full bg-gradient-to-r from-[#8B4513] to-transparent mt-1"></div>
                        </div>
                        
                        <span className="hidden md:inline-flex items-center px-4 py-1.5 rounded-md text-[10px] font-bold text-white bg-[#A0522D] tracking-widest relative overflow-hidden group hover:shadow-md transition-all cursor-default" title={recommendType}>
                            <span className="absolute inset-0 w-full h-full bg-white opacity-20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform duration-1000 ease-in-out"></span>
                            AI POWERED
                        </span>
                    </div>
                    
                    <p className="text-xs font-light text-[#5D4037] uppercase tracking-[0.2em] italic opacity-70">
                        Tailored specifically for your taste
                    </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {products.map((p: any) => (
                        <div 
                            key={p._id} 
                            className="group transition-all duration-500 hover:-translate-y-2"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#8B4513]/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
                                <div className="relative z-10 border-transparent group-hover:border-[#E8D5C4] transition-colors duration-500">
                                    <ProductCard product={p} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RecommendationSection;