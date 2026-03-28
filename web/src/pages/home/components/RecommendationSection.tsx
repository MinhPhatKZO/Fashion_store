import React from 'react';
import ProductCard from '../../../components/products/ProductCard'; 

interface Props {
    products: any[];
}

const RecommendationSection: React.FC<Props> = ({ products }) => {
    if (!products || products.length === 0) return null;

    return (
        <div className="w-full py-8">
            {/* Vùng chứa: Sử dụng tone màu Nâu Đất từ logo (Mã màu #8B4513 hoặc tương đương) */}
            <div className="relative rounded-3xl bg-gradient-to-br from-[#FAF7F2] via-white to-[#F2E8DF] p-6 md:p-10 border border-[#E8D5C4] shadow-[0_15px_40px_rgba(139,69,19,0.03)] overflow-hidden">
                
                {/* Hiệu ứng Glow: Tone Warm Brown/Beige */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#D7B9A5] opacity-10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#C4A484] opacity-10 blur-3xl pointer-events-none"></div>

                {/* Phần Tiêu đề: Đồng bộ với font chữ và màu sắc KZONE */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                    <div className="flex items-center gap-4">
                        {/* Biểu tượng KZONE Style */}
                        <div className="bg-[#8B4513] p-2.5 rounded-lg shadow-lg shadow-orange-900/10">
                            <span className="text-xl">🤎</span>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#8B4513] uppercase tracking-[0.1em] font-serif">
                                Dành Riêng Cho Bạn
                            </h2>
                            <div className="h-0.5 w-full bg-gradient-to-r from-[#8B4513] to-transparent mt-1"></div>
                        </div>
                        
                        {/* Badge AI: Phối màu Nâu sang trọng */}
                        <span className="hidden md:inline-flex items-center px-4 py-1.5 rounded-md text-[10px] font-bold text-white bg-[#A0522D] tracking-widest relative overflow-hidden group">
                            <span className="absolute inset-0 w-full h-full bg-white opacity-10 group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></span>
                            AI POWERED
                        </span>
                    </div>
                    
                    <p className="text-xs font-light text-[#5D4037] uppercase tracking-[0.2em] italic opacity-70">
                        Tailored specifically for your taste
                    </p>
                </div>

                {/* Grid Sản phẩm */}
                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {products.map((p: any) => (
                        <div 
                            key={p._id} 
                            className="group transition-all duration-500 hover:-translate-y-2"
                        >
                            <div className="relative">
                                {/* Hover Shadow màu Warm Earth */}
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