import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Search, ChevronDown, Filter, Loader2, X, Star, ChevronUp, 
  SlidersHorizontal, Home, ChevronRight, ShoppingBag, Heart, 
  ArrowRight, Sparkles, Tag, Plus 
} from 'lucide-react';

// --- CONFIG TAILWIND ---
declare global {
  interface Window { tailwind: { config: object }; }
}
const customTailwindConfig = {
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        primary: '#0F172A', 
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
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
        if (window.tailwind) { window.tailwind.config = ${JSON.stringify(customTailwindConfig)}; }
      }, 50); 
    `;
    document.head.appendChild(configScript);
  }
};
setupTailwind();

const API_URL = 'http://localhost:5000';

// --- INTERFACES ---
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
  rating?: Rating;
  isOnSale?: boolean;
  discountPercentage?: number;
}
interface Pagination { current: number; pages: number; total: number; }
interface Brand { _id: string; name: string; slug: string; }

interface ProductResponse {
  products: Product[];
  pagination?: Pagination;
}

// --- SUB COMPONENTS ---

const Breadcrumbs = () => (
  <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-6 uppercase tracking-wide">
    <a href="/" className="hover:text-black transition-colors">Home</a>
    <span className="text-gray-300">/</span>
    <span className="text-black">Shop</span>
  </nav>
);

// Hero Banner: Minimalist & Clean
const CollectionHeader = ({ total }: { total: number }) => (
  <div className="relative w-full bg-gray-50 mb-10 overflow-hidden group">
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-5 grayscale group-hover:grayscale-0 transition-all duration-1000"></div>
    <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 text-center">
      <span className="inline-block py-1 px-3 border border-gray-900 text-gray-900 text-xs font-bold uppercase tracking-widest mb-4">
        New Arrivals
      </span>
      <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
        AUTUMN COLLECTION
      </h1>
      <p className="text-gray-600 text-sm md:text-base max-w-lg mx-auto mb-0">
        Khám phá {total} thiết kế mới nhất, định hình phong cách của bạn.
      </p>
    </div>
  </div>
);

// Product Card: Premium Look
const ProductCard = ({ product, onClick }: { product: Product; onClick: () => void }) => {
  const getImageUrl = (product: Product): string => {
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      if (typeof firstImage === 'object' && firstImage.url) return firstImage.url;
      if (typeof firstImage === 'string') return firstImage;
    }
    return 'https://via.placeholder.com/400x500?text=No+Image';
  };

  return (
    <div onClick={onClick} className="group cursor-pointer animate-fade-in">
      {/* Image Wrapper */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 mb-4">
        <img
          src={getImageUrl(product)}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/400x500'}
        />
        
        {/* Badges */}
        <div className="absolute top-0 left-0 p-3">
            {product.isOnSale && (
            <span className="bg-white/90 backdrop-blur text-black px-2 py-1 text-[10px] font-bold uppercase tracking-wider border border-black/5">
                Sale -{product.discountPercentage}%
            </span>
            )}
        </div>

        {/* Hover Action: Slide Up Button */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
            <button className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors border border-black shadow-xl">
                + Thêm vào giỏ
            </button>
        </div>
        
        {/* Wishlist Button */}
        <button className="absolute top-3 right-3 p-2 bg-transparent text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
             <Heart className="w-5 h-5" />
        </button>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:underline decoration-1 underline-offset-4">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
                <p className="text-sm font-bold text-gray-900">{product.price.toLocaleString('vi-VN')}₫</p>
                {product.originalPrice && (
                    <p className="text-xs text-gray-400 line-through">{product.originalPrice.toLocaleString('vi-VN')}₫</p>
                )}
            </div>
             {product.rating && (
                <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                    <span className="text-xs text-gray-500 font-medium">{product.rating.average}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Filter Drawer: Clean Sidebar
const FilterDrawer = ({ isOpen, onClose, categories, brands, selectedCategories, selectedBrands, priceInput, setPriceInput, onCheckboxChange, onClear, productCount }: any) => {
  const [showCat, setShowCat] = useState(true);
  const [showBrand, setShowBrand] = useState(true);
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[360px] bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Bộ lọc</h2>
          <button onClick={onClose} className="hover:rotate-90 transition-transform duration-300"><X className="w-6 h-6 text-gray-900" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
          {/* Price */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Khoảng giá</h3>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₫</span>
                 <input type="number" placeholder="Từ" value={priceInput.minPrice} onChange={e => setPriceInput((prev: any) => ({ ...prev, minPrice: e.target.value }))} className="w-full pl-6 pr-3 py-2 text-sm border-b border-gray-300 focus:border-black outline-none bg-transparent" />
              </div>
              <span className="text-gray-300">-</span>
              <div className="relative flex-1">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₫</span>
                 <input type="number" placeholder="Đến" value={priceInput.maxPrice} onChange={e => setPriceInput((prev: any) => ({ ...prev, maxPrice: e.target.value }))} className="w-full pl-6 pr-3 py-2 text-sm border-b border-gray-300 focus:border-black outline-none bg-transparent" />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <button onClick={() => setShowCat(!showCat)} className="flex items-center justify-between w-full mb-4 group"><h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Danh mục</h3>{showCat ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</button>
            {showCat && <div className="space-y-3">{categories.map((cat: Category) => (
               <label key={cat._id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${selectedCategories.includes(cat._id) ? 'bg-black border-black' : 'border-gray-300 group-hover:border-gray-500'}`}>
                      {selectedCategories.includes(cat._id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <input type="checkbox" checked={selectedCategories.includes(cat._id)} onChange={e => onCheckboxChange('category', cat._id, e.target.checked)} className="hidden" />
                  <span className={`text-sm ${selectedCategories.includes(cat._id) ? 'font-medium text-black' : 'text-gray-500 group-hover:text-black'} transition-colors`}>{cat.name}</span>
               </label>
            ))}</div>}
          </div>

          {/* Brands */}
          <div>
            <button onClick={() => setShowBrand(!showBrand)} className="flex items-center justify-between w-full mb-4 group"><h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Thương hiệu</h3>{showBrand ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</button>
            {showBrand && <div className="space-y-3">{brands.map((brand: Brand) => (
               <label key={brand._id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${selectedBrands.includes(brand._id) ? 'bg-black border-black' : 'border-gray-300 group-hover:border-gray-500'}`}>
                      {selectedBrands.includes(brand._id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <input type="checkbox" checked={selectedBrands.includes(brand._id)} onChange={e => onCheckboxChange('brand', brand._id, e.target.checked)} className="hidden" />
                  <span className={`text-sm ${selectedBrands.includes(brand._id) ? 'font-medium text-black' : 'text-gray-500 group-hover:text-black'} transition-colors`}>{brand.name}</span>
               </label>
            ))}</div>}
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 bg-white space-y-3">
          <button onClick={onClose} className="w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
             Xem {productCount || 0} kết quả
          </button>
          <button onClick={() => { onClear(); onClose(); }} className="w-full py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors border border-transparent hover:border-gray-200">
             Xóa bộ lọc
          </button>
        </div>
      </div>
    </>
  );
};

// --- MAIN PAGE ---

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
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get("ids");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ current: 1, pages: 1, total: 0 });
  const [searchInput, setSearchInput] = useState(currentSearchTerm);
  const [sortOrder, setSortOrder] = useState(currentSort);
  const [priceInput, setPriceInput] = useState({ minPrice: currentMinPrice, maxPrice: currentMaxPrice });
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Logic giữ nguyên
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
    } catch (err) { console.error('Error fetching filters:', err); }
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
      if (idsParam) params.ids = idsParam;
      params.page = page.toString();
      const response = await axios.get<ProductResponse>(`${API_URL}/api/products`, { params });
      const data = response.data;
      if (data.products) {
        setProducts(data.products);
        setPagination(data.pagination || { current: page, pages: 1, total: data.products.length });
      } else {
        setProducts([]); setPagination({ current: page, pages: 1, total: 0 });
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu.');
      setLoading(false);
    }
  }, [queryParams, currentPage, idsParam]);

  useEffect(() => {
    fetchFilters();
    setSearchInput(currentSearchTerm);
    setSortOrder(currentSort);
    setPriceInput({ minPrice: currentMinPrice, maxPrice: currentMaxPrice });
    fetchProducts(currentPage);
  }, [location.search, fetchProducts, currentSort, currentSearchTerm, currentMinPrice, currentMaxPrice, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (priceInput.minPrice !== currentMinPrice) updateUrlParams('minPrice', priceInput.minPrice, true);
      if (priceInput.maxPrice !== currentMaxPrice) updateUrlParams('maxPrice', priceInput.maxPrice, true);
    }, 800);
    return () => clearTimeout(timer);
  }, [priceInput, currentMinPrice, currentMaxPrice, updateUrlParams]);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); updateUrlParams('search', searchInput); };
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

  const activeFilterCount = currentCategoryIds.length + currentBrandIds.length + (currentMinPrice ? 1 : 0) + (currentMaxPrice ? 1 : 0);

  return (
    <div className="font-sans min-h-screen bg-white text-gray-900 pb-20">
      
      <FilterDrawer 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        categories={availableCategories}
        brands={availableBrands}
        selectedCategories={currentCategoryIds}
        selectedBrands={currentBrandIds}
        priceInput={priceInput}
        setPriceInput={setPriceInput}
        onCheckboxChange={handleCheckboxChange}
        onClear={clearFilters}
        productCount={pagination.total}
      />

      <CollectionHeader total={pagination.total} />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-12">
        <Breadcrumbs />

        <div className="flex flex-col gap-8">
          
          {/* Professional Toolbar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md py-4 border-b border-gray-100 transition-all">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              
              {/* Left: Quick Tabs & Filter Trigger */}
              <div className="flex items-center gap-6 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                 <button 
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center gap-2 px-0 py-2 text-sm font-bold uppercase tracking-wider hover:text-gray-600 transition-colors whitespace-nowrap"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Bộ lọc {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </button>
                  <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
                  
                  {/* Styled as Tabs */}
                  <div className="flex items-center gap-4">
                     <button onClick={() => clearFilters()} className={`text-sm font-medium transition-colors whitespace-nowrap ${!activeFilterCount ? 'text-black border-b-2 border-black pb-0.5' : 'text-gray-400 hover:text-black'}`}>
                        All Products
                     </button>
                     {availableCategories.slice(0, 3).map(cat => (
                         <button 
                            key={cat._id}
                            onClick={() => handleCheckboxChange('category', cat._id, !currentCategoryIds.includes(cat._id))}
                            className={`text-sm font-medium transition-colors whitespace-nowrap ${currentCategoryIds.includes(cat._id) ? 'text-black border-b-2 border-black pb-0.5' : 'text-gray-400 hover:text-black'}`}
                         >
                            {cat.name}
                         </button>
                     ))}
                  </div>
              </div>

              {/* Right: Search & Sort */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative group hidden md:block">
                  <input 
                    type="text" 
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchSubmit(e)}
                    placeholder="Search..." 
                    className="w-48 border-b border-gray-300 py-1 text-sm bg-transparent focus:border-black focus:w-64 transition-all outline-none placeholder:text-gray-400"
                  />
                  <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                
                <div className="relative">
                  <select
                    value={sortOrder}
                    onChange={e => { setSortOrder(e.target.value); updateUrlParams('sort', e.target.value); }}
                    className="appearance-none pl-2 pr-8 py-1 bg-transparent text-sm font-medium cursor-pointer outline-none hover:text-gray-600 transition-colors"
                  >
                    <option value="createdAt:desc">Mới nhất</option>
                    <option value="price:asc">Giá tăng dần</option>
                    <option value="price:desc">Giá giảm dần</option>
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid - The main stage */}
          <div className="min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40">
                <div className="w-16 h-16 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20 mx-auto max-w-lg">
                <p className="text-gray-900 font-bold mb-2">Đã xảy ra lỗi tải trang</p>
                <button onClick={() => fetchProducts()} className="text-sm underline underline-offset-4 hover:text-gray-600">Thử lại</button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-40">
                <h3 className="text-xl font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-500 mb-6 text-sm">Hãy thử thay đổi tiêu chí lọc của bạn.</p>
                <button onClick={clearFilters} className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">Xóa bộ lọc</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} onClick={() => navigate(`/products/${product._id}`)} />
                ))}
              </div>
            )}
          </div>

          {/* Pagination - Minimalist */}
          {pagination.pages > 1 && (
            <div className="mt-12 flex justify-center pt-10 border-t border-gray-100">
              <div className="flex items-center gap-4">
                {[...Array(pagination.pages)].map((_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => (idx + 1) !== pagination.current && updateUrlParams('page', (idx + 1).toString(), false)}
                    className={`text-sm font-medium transition-colors relative pb-1 ${pagination.current === (idx + 1) ? 'text-black after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-black' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;