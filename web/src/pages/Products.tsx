import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronDown, Filter, Loader2, X, Star, ChevronUp } from 'lucide-react';

// Khai báo global interface cho TypeScript
declare global {
  interface Window {
    tailwind: { config: object };
  }
}

const customTailwindConfig = {
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      transitionProperty: { shadow: 'box-shadow' },
    },
  },
};

const setupTailwind = () => {
  const scriptId = 'tailwind-cdn-script';
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(script);
  }

  const configScriptId = 'tailwind-config-script';
  if (!document.getElementById(configScriptId)) {
    const configScript = document.createElement('script');
    configScript.id = configScriptId;
    configScript.textContent = `
      setTimeout(() => {
        if (window.tailwind) {
          window.tailwind.config = ${JSON.stringify(customTailwindConfig)};
        }
      }, 50); 
    `;
    document.head.appendChild(configScript);
  }
};
setupTailwind();

const API_URL = 'http://localhost:5000';
const ASSETS_BASE_URL = 'http://localhost:5000';

interface Image { url: string; alt?: string; isPrimary?: boolean; }
interface Category { _id: string; name: string; slug: string; }
interface Rating { average: number; count: number; }
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
interface Pagination { current: number; pages: number; total: number; }
interface Brand { _id: string; name: string; slug: string; }

const Products: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const currentSearchTerm = queryParams.get('search') || '';
  const currentSort = queryParams.get('sort') || 'createdAt:desc';
  const currentCategoryIds = useMemo(() => queryParams.get('category')?.split(',').filter(id => id) || [], [queryParams]);
  const currentBrandIds = useMemo(() => queryParams.get('brand')?.split(',').filter(id => id) || [], [queryParams]);
  const currentMinPrice = queryParams.get('minPrice') || '';
  const currentMaxPrice = queryParams.get('maxPrice') || '';
  const currentPage = parseInt(queryParams.get('page') || '1', 10);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ current: 1, pages: 1, total: 0 });
  const [searchInput, setSearchInput] = useState(currentSearchTerm);
  const [sortOrder, setSortOrder] = useState(currentSort);
  const [priceInput, setPriceInput] = useState({ minPrice: currentMinPrice, maxPrice: currentMaxPrice });
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [showCategory, setShowCategory] = useState(true);
  const [showBrand, setShowBrand] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  const updateUrlParams = useCallback((key: string, value: string | string[], resetPage = true) => {
    const newParams = new URLSearchParams(location.search);
    if (Array.isArray(value)) {
      if (value.length > 0) newParams.set(key, value.join(','));
      else newParams.delete(key);
    } else if (value.trim()) newParams.set(key, value.trim());
    else newParams.delete(key);

    if (resetPage && key !== 'page') newParams.delete('page');
    navigate(`?${newParams.toString()}`, { replace: true });
  }, [location.search, navigate]);

  const fetchFilters = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/filters`);
      setAvailableCategories(response.data.categories || []);
      setAvailableBrands(response.data.brands || []);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const fetchProducts = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 12 };
      queryParams.forEach((value, key) => {
        if (['category', 'brand', 'minPrice', 'maxPrice', 'search', 'sort', 'page'].includes(key) && value)
          params[key] = value;
      });
      params.page = page.toString();

      const response = await axios.get(`${API_URL}/api/products`, { params });
      if (response.data.products) {
        setProducts(response.data.products);
        setPagination(response.data.pagination || { current: page, pages: 1, total: response.data.products.length });
      } else {
        setProducts([]); setPagination({ current: page, pages: 1, total: 0 });
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Không thể tải sản phẩm. Kiểm tra API_URL hoặc server backend.');
      setLoading(false);
    }
  }, [queryParams, currentPage]);

  useEffect(() => {
    fetchFilters();
    setSearchInput(currentSearchTerm);
    setSortOrder(currentSort);
    setPriceInput({ minPrice: currentMinPrice, maxPrice: currentMaxPrice });
    fetchProducts(currentPage);
  }, [location.search, fetchProducts, currentSort, currentSearchTerm, currentMinPrice, currentMaxPrice, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (priceInput.minPrice !== currentMinPrice)
        updateUrlParams('minPrice', priceInput.minPrice, true);
      if (priceInput.maxPrice !== currentMaxPrice)
        updateUrlParams('maxPrice', priceInput.maxPrice, true);
    }, 800);
    return () => clearTimeout(timer);
  }, [priceInput, currentMinPrice, currentMaxPrice, updateUrlParams]);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); updateUrlParams('search', searchInput); };
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const newSort = e.target.value; setSortOrder(newSort); updateUrlParams('sort', newSort); };
  const handleCheckboxChange = (type: 'category' | 'brand', id: string, checked: boolean) => {
    const currentIds = type === 'category' ? currentCategoryIds : currentBrandIds;
    const newIds = checked ? [...currentIds, id] : currentIds.filter(existingId => existingId !== id);
    updateUrlParams(type, newIds);
  };
  const clearFilters = () => {
    const newParams = new URLSearchParams();
    const keepKeys = ['page', 'limit'];
    queryParams.forEach((value, key) => { if (keepKeys.includes(key)) newParams.set(key, value); });
    navigate(`?${newParams.toString()}`);
  };
  const goToPage = (page: number) => { if (page >= 1 && page <= pagination.pages) updateUrlParams('page', page.toString(), false); };

  // === Lấy ảnh cũ (an toàn)
  const getImageUrl = (product: Product): string => {
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      let imageUrl: string;
      if (typeof firstImage === 'object' && firstImage.url) {
        const primaryImage = product.images.find(img => typeof img === 'object' && (img as Image).isPrimary);
        imageUrl = primaryImage ? (primaryImage as Image).url : (firstImage as Image).url;
      } else if (typeof firstImage === 'string') imageUrl = firstImage;
      else return 'https://via.placeholder.com/300x400?text=No+Image';
      return imageUrl.startsWith('http') ? imageUrl : imageUrl;
    }
    return 'https://via.placeholder.com/300x400?text=No+Image';
  };
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://via.placeholder.com/300x400?text=Image+Not+Found';
  };

  const isAnyFilterActive = currentSearchTerm || currentCategoryIds.length > 0 || currentBrandIds.length > 0 || currentMinPrice || currentMaxPrice;
  const renderRating = (average: number) => {
    const fullStars = Math.floor(average);
    const hasHalfStar = average % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}
        {hasHalfStar && <div className="relative"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500 relative z-10" /><Star className="w-4 h-4 text-gray-300 absolute top-0 left-0" style={{ clipPath: 'polygon(50% 0%, 50% 100%, 100% 100%, 100% 0%)' }} /></div>}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />)}
      </div>
    );
  };

  if (loading && products.length === 0) return (
    <div className="font-sans container mx-auto px-4 py-16 min-h-screen bg-gray-50">
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl shadow-xl border border-gray-100">
        <Loader2 className="animate-spin h-20 w-20 text-blue-600 mb-6" />
        <p className="text-xl text-gray-700 font-semibold">Đang tải sản phẩm và bộ lọc...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="font-sans container mx-auto px-4 py-16 min-h-screen bg-gray-50">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center shadow-lg">
        <p className="text-red-600 font-bold text-2xl mb-4">❌ Lỗi kết nối hoặc tải dữ liệu</p>
        <p className="text-red-500 mb-6 text-base">{error}</p>
        <button onClick={() => fetchProducts(1)} className="bg-red-600 text-white px-8 py-3 rounded-xl hover:bg-red-700 transition font-semibold text-lg shadow-md">
          Thử lại
        </button>
      </div>
    </div>
  );

  return (
    <div className="font-sans min-h-screen bg-gray-50 pt-12 pb-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row gap-10">
        {/* --- BỘ LỌC GỌN HƠN --- */}
        <div className="w-full md:w-1/4 md:pr-6 sticky top-7 self-start bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3 border-b pb-3">
            <Filter className="w-6 h-6 text-blue-600" /> Bộ lọc
          </h2>

          {/* Danh mục */}
          <div className="mb-5">
            <button onClick={() => setShowCategory(!showCategory)} className="w-full flex justify-between items-center font-semibold text-lg text-gray-800 border-l-4 border-blue-500 pl-3 py-1 hover:bg-gray-50 rounded">
              Danh mục {showCategory ? <ChevronUp /> : <ChevronDown />}
            </button>
            {showCategory && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {availableCategories.map(cat => (
                  <label key={cat._id} className="flex items-center cursor-pointer p-1 hover:bg-gray-50 rounded-lg">
                    <input type="checkbox" checked={currentCategoryIds.includes(cat._id)} onChange={e => handleCheckboxChange('category', cat._id, e.target.checked)} className="mr-3 h-5 w-5 text-blue-600 rounded border-gray-300" />
                    <span className="text-gray-700 text-sm">{cat.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Thương hiệu */}
          <div className="mb-5">
            <button onClick={() => setShowBrand(!showBrand)} className="w-full flex justify-between items-center font-semibold text-lg text-gray-800 border-l-4 border-blue-500 pl-3 py-1 hover:bg-gray-50 rounded">
              Thương hiệu {showBrand ? <ChevronUp /> : <ChevronDown />}
            </button>
            {showBrand && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {availableBrands.map(brand => (
                  <label key={brand._id} className="flex items-center cursor-pointer p-1 hover:bg-gray-50 rounded-lg">
                    <input type="checkbox" checked={currentBrandIds.includes(brand._id)} onChange={e => handleCheckboxChange('brand', brand._id, e.target.checked)} className="mr-3 h-5 w-5 text-blue-600 rounded border-gray-300" />
                    <span className="text-gray-700 text-sm">{brand.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Giá */}
          <div className="mb-8 pb-4">
  <h3 className="font-semibold mb-3 text-lg text-gray-800 border-l-4 border-blue-500 pl-3">
    Khoảng giá (VNĐ)
  </h3>

  <div className="flex flex-col gap-4">
    <div className="flex flex-col">
      <label htmlFor="minPrice" className="text-gray-600 text-sm mb-1">Giá tối thiểu</label>
      <input
        id="minPrice"
        type="number"
        placeholder="Từ..."
        value={priceInput.minPrice}
        onChange={(e) => setPriceInput(prev => ({ ...prev, minPrice: e.target.value }))}
        className="p-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
    </div>

    <div className="flex flex-col">
      <label htmlFor="maxPrice" className="text-gray-600 text-sm mb-1">Giá tối đa</label>
      <input
        id="maxPrice"
        type="number"
        placeholder="Đến..."
        value={priceInput.maxPrice}
        onChange={(e) => setPriceInput(prev => ({ ...prev, maxPrice: e.target.value }))}
        className="p-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
    </div>

    <p className="text-xs text-gray-500 italic">
      Nhập giá trị và chờ 0.8 giây để lọc.
    </p>
  </div>
</div>


          {isAnyFilterActive && (
            <button onClick={clearFilters} className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition shadow-lg flex items-center justify-center text-base">
              <X className="w-5 h-5 inline mr-2" /> Xóa tất cả bộ lọc
            </button>
          )}
        </div>

        {/* --- DANH SÁCH SẢN PHẨM (GIỮ NGUYÊN) --- */}
        <div className="w-full md:w-3/4">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-3 text-gray-900 tracking-tight">
            {currentSearchTerm ? `Kết quả cho: "${currentSearchTerm}"` : 'Thế giới Sản Phẩm'}
          </h1>
          <p className="text-gray-600 mb-8 text-lg">Tìm thấy <strong>{pagination.total.toLocaleString('vi-VN')}</strong> sản phẩm</p>

          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4 p-5 bg-white rounded-2xl shadow-lg border border-gray-100">
            <form onSubmit={handleSearchSubmit} className="flex flex-1 w-full sm:w-auto">
              <input type="text" placeholder="Tìm kiếm sản phẩm..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-l-xl focus:ring-blue-500 text-base" />
                            <button type="submit" className="bg-blue-600 text-white px-5 py-3 rounded-r-xl hover:bg-blue-700 transition flex items-center">
                <Search className="w-5 h-5" />
              </button>
            </form>

            <div className="flex items-center gap-3">
              <label className="text-gray-700 font-medium text-base">Sắp xếp:</label>
              <select
                value={sortOrder}
                onChange={handleSortChange}
                className="border border-gray-300 rounded-xl p-2 text-base focus:ring-blue-500"
              >
                <option value="createdAt:desc">Mới nhất</option>
                <option value="price:asc">Giá tăng dần</option>
                <option value="price:desc">Giá giảm dần</option>
                <option value="name:asc">Tên A → Z</option>
                <option value="name:desc">Tên Z → A</option>
              </select>
            </div>
          </div>

          {/* DANH SÁCH SẢN PHẨM */}
          {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
              <p className="text-xl text-gray-700">Không tìm thấy sản phẩm nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 overflow-hidden group"
                >
                  <div className="relative">
                    <img
                      src={getImageUrl(product)}
                      alt={product.name}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={handleImageError}
                    />
                    {product.isOnSale && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-md">
                        -{product.discountPercentage || 10}%
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-gray-900 font-semibold text-lg mb-1 truncate">{product.name}</h3>
                    {product.rating && (
                      <div className="flex items-center mb-2">
                        {renderRating(product.rating.average)}
                        <span className="ml-2 text-gray-500 text-sm">
                          ({product.rating.count})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600 font-bold text-lg">
                        {product.price.toLocaleString('vi-VN')}₫
                      </span>
                      {product.originalPrice && (
                        <span className="text-gray-400 line-through text-sm">
                          {product.originalPrice.toLocaleString('vi-VN')}₫
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/products/${product._id}`)}
                      className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition text-sm font-semibold"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PHÂN TRANG */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-10">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                    pagination.current === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  Trước
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                      page === pagination.current
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                    pagination.current === pagination.pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  Sau
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
