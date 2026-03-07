import React from "react";
import { Heart, Star, ShoppingBag } from "lucide-react";

// --- INTERFACES ---
export interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images?: { url: string; alt?: string }[] | string[]; // Hỗ trợ cả 2 kiểu dữ liệu ảnh
  image?: string; // Fallback cho trường hợp API cũ
  rating?: { average: number; count: number };
  isOnSale?: boolean;
  discountPercentage?: number;
  brandId?: string;
  description?: string;
}

interface Props {
  product: Product;
  onClick?: () => void; // 👈 THÊM DÒNG NÀY: Để nhận sự kiện click từ cha
}

const ProductCard: React.FC<Props> = ({ product, onClick }) => {
  // Helper xử lý ảnh an toàn
  const getImageUrl = (prod: Product): string => {
    if (prod.images && Array.isArray(prod.images) && prod.images.length > 0) {
      const firstImg = prod.images[0];
      return typeof firstImg === "string" ? firstImg : firstImg.url;
    }
    if (prod.image) return prod.image;
    return "https://via.placeholder.com/300x400?text=No+Image";
  };

  const displayImage = getImageUrl(product);

  return (
    <div 
      onClick={onClick} // 👈 Gắn sự kiện click vào div bao ngoài
      className="group cursor-pointer bg-white rounded-2xl p-3 border border-gray-100 hover:border-gray-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col"
    >
      {/* Image Area */}
      <div className="relative aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden mb-3">
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/300x400?text=Error"; }}
        />
        
        {/* Badges */}
        {product.isOnSale && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
            -{product.discountPercentage}%
          </div>
        )}

        {/* Hover Action Buttons */}
        <div className="absolute bottom-3 right-3 flex gap-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button 
                className="bg-white p-2 rounded-full shadow-md hover:bg-black hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); /* Logic add cart here */ }}
            >
                <ShoppingBag className="w-4 h-4" />
            </button>
            <button 
                className="bg-white p-2 rounded-full shadow-md hover:bg-red-50 hover:text-red-500 transition-colors"
                onClick={(e) => { e.stopPropagation(); /* Logic wishlist here */ }}
            >
                <Heart className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Info Area */}
      <div className="space-y-1 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[40px] group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        
        <div className="mt-auto pt-2">
            <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-gray-900">
                    {product.price.toLocaleString("vi-VN")}₫
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-gray-400 line-through">
                        {product.originalPrice.toLocaleString("vi-VN")}₫
                    </span>
                )}
            </div>
            
            {product.rating && (
                <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-500 font-medium">
                        {product.rating.average} ({product.rating.count})
                    </span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;