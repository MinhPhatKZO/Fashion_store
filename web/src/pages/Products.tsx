import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

interface Image {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Rating {
  average: number;
  count: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: (Image | string)[];
  category?: Category;
  subcategory?: Category;
  rating?: Rating;
  isOnSale?: boolean;
  isFeatured?: boolean;
  discountPercentage?: number;
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍Fetching products from:', `${API_URL}/api/products?page=${page}`);

      const response = await axios.get(`${API_URL}/api/products`, {
        params: { page, limit: 12 }
      });

      console.log(' Products response:', response.data);

      if (response.data.products) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      } else {
        setProducts([]);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Không thể tải sản phẩm');
      setLoading(false);
    }
  };

  const getImageUrl = (product: Product): string => {
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      let imageUrl: string;

      if (typeof firstImage === 'object' && firstImage.url) {
        const primaryImage = product.images.find(
          (img) => typeof img === 'object' && img.isPrimary
        );
        imageUrl = primaryImage ? (primaryImage as Image).url : (firstImage as Image).url;
      } else if (typeof firstImage === 'string') {
        imageUrl = firstImage;
      } else {
        return 'https://via.placeholder.com/300x400?text=No+Image';
      }

      if (imageUrl.startsWith('http')) {
        return imageUrl;
      }

      return imageUrl;
    }

    return 'https://via.placeholder.com/300x400?text=No+Image';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('❌ Image load error:', e.currentTarget.src);
    e.currentTarget.src = 'https://via.placeholder.com/300x400?text=Image+Not+Found';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Products</h1>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Products</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <button
            onClick={() => fetchProducts()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Products</h1>
        <div className="text-center py-20">
          <p className="text-xl text-gray-600">
            Chưa có sản phẩm nào. Hãy thêm sản phẩm từ trang quản trị!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Products</h1>
      <p className="text-gray-600 mb-8">Tìm thấy {pagination.total} sản phẩm</p>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {products.map((product) => {
          const imageUrl = getImageUrl(product);

          return (
            <div
              key={product._id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative pt-[133%] bg-gray-100 overflow-hidden group">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={handleImageError}
                  loading="lazy"
                />

                {product.isOnSale && (
                  <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    SALE
                  </span>
                )}
                {product.isFeatured && (
                  <span className="absolute top-12 right-2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    HOT
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                  {product.name}
                </h3>

                {product.category && (
                  <p className="text-sm text-gray-500 mb-3">
                    {product.category.name}
                  </p>
                )}

                {/* Pricing */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xl font-bold text-red-600">
                    {product.price.toLocaleString('vi-VN')}đ
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        {product.originalPrice.toLocaleString('vi-VN')}đ
                      </span>
                      {product.discountPercentage && (
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          -{product.discountPercentage}%
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Rating */}
                {product.rating && product.rating.count > 0 && (
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <span className="text-yellow-500">
                      {'⭐'.repeat(Math.round(product.rating.average))}
                    </span>
                    <span className="text-gray-600">
                      ({product.rating.count})
                    </span>
                  </div>
                )}

                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
                  Xem chi tiết
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => fetchProducts(pagination.current - 1)}
            disabled={pagination.current === 1}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              pagination.current === 1
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            ← Trước
          </button>

          <span className="text-gray-700 font-semibold">
            Trang {pagination.current} / {pagination.pages}
          </span>

          <button
            onClick={() => fetchProducts(pagination.current + 1)}
            disabled={pagination.current === pagination.pages}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              pagination.current === pagination.pages
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;
