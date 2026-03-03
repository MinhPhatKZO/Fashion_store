import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ChatBox from "../../components/Chatbox/ChatBox";

// Import các component con
import HomeHero from "./components/HomeHero";
import HomePolicies from "./components/HomePolicies";
import HomeFlashSale from "./components/HomeFlashSale";
import HomeBrands from "./components/HomeBrands";
import HomeBrandStores from "./components/HomeBrandStores";

// Import Utils
import { 
    API_BASE_URL, 
    Product, 
    Brand, 
    getMongoId, 
    getImageUrl, 
    getBrandLogo 
} from "../../utils/homeUtils";

const Home: React.FC = () => {
  const navigate = useNavigate();
  // State
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [activeChatBrand, setActiveChatBrand] = useState<Brand | null>(null);
  const [currentUser, setCurrentUser] = useState<{_id: string, name: string} | null>(null);

  // 1. Check Login
  useEffect(() => {
      const userId = localStorage.getItem("userId"); 
      const userName = localStorage.getItem("userName");
      const token = localStorage.getItem("token");
      if(token && userId && userName) setCurrentUser({ _id: userId, name: userName });
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/api/products/featured`),
          axios.get(`${API_BASE_URL}/api/brands`),
          axios.get(`${API_BASE_URL}/api/products`),
        ]);

        const getData = (result: PromiseSettledResult<any>) => 
            (result.status === 'fulfilled' && result.value) ? result.value.data : [];

        const rawFeatured = getData(results[0]);
        const rawBrands = getData(results[1]);
        const rawProducts = getData(results[2]);

        const normalizeProducts = (data: any): Product[] => {
          if (!data || !Array.isArray(data)) return [];
          return data.map((p: any) => ({
            ...p,
            _id: getMongoId(p._id),
            brandId: p.brandId ? getMongoId(p.brandId) : undefined,
            image: p.images && p.images.length > 0 ? getImageUrl(p.images[0].url) : getImageUrl(p.image),
          }));
        };

        const normalizeBrands = (data: any): Brand[] => {
          if (!data || !Array.isArray(data)) return [];
          return data.map((b: any) => ({
            ...b,
            _id: getMongoId(b._id),
            logoUrl: getBrandLogo(b.name), 
          }));
        };

        const safeFeatured = Array.isArray(rawFeatured) ? rawFeatured : (rawFeatured?.products || []);
        const safeBrands = Array.isArray(rawBrands) ? rawBrands : [];
        const safeProducts = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.products || []);

        setFeaturedProducts(normalizeProducts(safeFeatured));
        setBrands(normalizeBrands(safeBrands));
        setAllProducts(normalizeProducts(safeProducts));

      } catch (err) {
        console.error("Lỗi hệ thống:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenChat = (brand: Brand) => {
    if (!currentUser) {
        alert("Vui lòng đăng nhập để chat!");
        navigate("/login");
        return;
    }
    setActiveChatBrand(brand);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-slate-100 pb-24 relative overflow-hidden">
      
      {/* 🌟 WATERMARK KZONE HOÀN HẢO 🌟 */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <h1 className="text-[25vw] font-black text-gray-900 opacity-[0.08] tracking-tighter rotate-[-15deg] whitespace-nowrap uppercase">
          KZONE
        </h1>
      </div>

      <div className="max-w-[1450px] mx-auto px-4 lg:px-8 py-8 space-y-10 relative z-10">
        
        {/* Render các component con */}
        <HomeHero />
        <HomePolicies />
        
        {featuredProducts?.length > 0 && <HomeFlashSale products={featuredProducts} />}
        
        {brands?.length > 0 && <HomeBrands brands={brands} />}
        
        {brands?.length > 0 && (
            <HomeBrandStores 
                brands={brands} 
                products={allProducts} 
                onChat={handleOpenChat} 
            />
        )}

      </div>

      {activeChatBrand && (
        <ChatBox 
            brand={activeChatBrand} 
            currentUser={currentUser} 
            onClose={() => setActiveChatBrand(null)} 
        />
      )}
    </div>
  );
};

export default Home;