import React from "react";
import { useNavigate } from "react-router-dom";

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

  const getImageUrl = () => {
    if (product.images) {
      const first = product.images[0];
      if (typeof first === "string") return first;
      if (typeof first === "object") return first.url;
    }
    return product.image || "https://via.placeholder.com/300x400?text=No+Image";
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
      onClick={() => navigate(`/products/${product._id}`)}
    >
      <div className="relative pt-[133%] bg-gray-100">
        <img
          src={getImageUrl()}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {product.isOnSale && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-3 py-1 rounded-full">
            SALE
          </span>
        )}
        {product.isFeatured && (
          <span className="absolute top-10 right-2 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full">
            HOT
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>
        <div className="flex gap-2 mt-3">
          <span className="text-red-600 text-xl font-bold">
            {product.price.toLocaleString("vi-VN")}đ
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
