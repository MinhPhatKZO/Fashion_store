import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Heart, Star } from "lucide-react";

interface Image { url: string; alt?: string; isPrimary?: boolean; }
interface Category { _id: string; name: string; slug: string; }
interface Rating { average: number; count: number; }

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images?: (Image | string)[];
  image?: string;
  description?: string;
  category?: Category;
  rating?: Rating;
  isFeatured?: boolean;
  isOnSale?: boolean;
  discountPercentage?: number;
}

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const navigate = useNavigate();

  // Logic lấy ảnh an toàn
  const getImageUrl = () => {
    if (product.images && product.images.length > 0) {
      const first = product.images[0];
      if (typeof first === "string") return first;
      if (typeof first === "object") return first.url;
    }
    return product.image || "https://via.placeholder.com/400x500?text=No+Image";
  };

  // Tính toán % giảm giá nếu API chưa trả về
  const discount = product.discountPercentage || 
    (product.originalPrice && product.price < product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  return (
    <div 
      className="group flex flex-col gap-3 cursor-pointer"
      onClick={() => navigate(`/products/${product._id}`)}
    >
      {/* --- PHẦN HÌNH ẢNH --- */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100">
        <img
          src={getImageUrl()}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Badges (Góc trái trên) */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isOnSale && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide shadow-sm">
              Sale -{discount}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide shadow-sm">
              Hot
            </span>
          )}
        </div>

        {/* Nút yêu thích (Góc phải trên - Hiện khi hover) */}
        <button 
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
          onClick={(e) => {
            e.stopPropagation();
            // Thêm logic wishlist tại đây
          }}
        >
          <Heart className="w-4 h-4" />
        </button>

        {/* Nút hành động (Trượt từ dưới lên) */}
        <div className="absolute inset-x-4 bottom-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
          <button 
            className="w-full bg-white text-gray-900 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:bg-gray-900 hover:text-white flex items-center justify-center gap-2 transition-colors"
            onClick={(e) => {
              e.stopPropagation(); // Ngăn chặn nhảy trang khi bấm nút mua
              // Thêm logic add to cart
            }}
          >
            <ShoppingBag className="w-4 h-4" /> Thêm nhanh
          </button>
        </div>
      </div>

      {/* --- PHẦN THÔNG TIN --- */}
      <div className="space-y-1">
        {/* Tên sản phẩm */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[1.25rem] group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* Giá và Đánh giá */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">
              {product.price.toLocaleString("vi-VN")}₫
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                {product.originalPrice.toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>

          {/* Rating (Chỉ hiện nếu có) */}
          {product.rating && product.rating.count > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-gray-600 font-medium">{product.rating.average}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;