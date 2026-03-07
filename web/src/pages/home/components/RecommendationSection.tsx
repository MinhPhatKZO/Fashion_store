import React from 'react';
// Lưu ý: Đường dẫn import ProductCard có thể khác tùy cấu trúc thư mục của bạn
import ProductCard from '../../../components/products/ProductCard'; 

interface Props {
    products: any[];
}

const RecommendationSection: React.FC<Props> = ({ products }) => {
    // Nếu không có sản phẩm thì ẩn component này đi
    if (!products || products.length === 0) return null;

    return (
        <div className="w-full py-2">
            {/* Vùng chứa có viền gradient và background nổi bật */}
            <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 md:p-8 border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                
                {/* Hiệu ứng ánh sáng mờ ở góc (Glow effect) */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br from-purple-200 to-blue-200 opacity-20 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-gradient-to-tr from-blue-200 to-teal-200 opacity-20 blur-3xl pointer-events-none"></div>

                {/* Phần Tiêu đề được trang trí xịn xò */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl animate-bounce">✨</span>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 uppercase tracking-tight">
                            Dành Riêng Cho Bạn
                        </h2>
                        {/* Badge AI Mode */}
                        <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm relative overflow-hidden group">
                            <span className="absolute inset-0 w-full h-full bg-white opacity-20 group-hover:translate-x-full transition-transform duration-500 ease-in-out"></span>
                            AI POWERED
                        </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 italic">
                        Được tinh chỉnh dựa trên hành vi của bạn
                    </p>
                </div>

                {/* Grid Sản phẩm */}
                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {products.map((p: any) => (
                        <div key={p._id} className="transition-transform duration-300 hover:-translate-y-2">
                            <ProductCard product={p} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RecommendationSection;