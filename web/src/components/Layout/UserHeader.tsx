import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// Thêm icon Store
import { ShoppingCart, User, LogOut, ChevronDown, Globe, Store } from "lucide-react";

// --- CẤU HÌNH API ---
const API_BASE_URL = "http://localhost:5000";

// --- INTERFACES ---
interface Brand {
  _id: string;
  name: string;
  logoUrl?: string;
}

interface Category {
  _id: string;
  name: string;
  slug?: string;
}

interface Product {
  _id: string;
  name: string;
  images: any[]; 
}

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface CartStorage {
  items?: CartItem[];
}

// --- TỪ ĐIỂN NGÔN NGỮ (TRANSLATIONS) ---
const TRANSLATIONS = {
  vi: {
    home: "Trang chủ",
    products: "Sản phẩm",
    featured: "Nổi bật",
    orders: "Đơn hàng",
    hotCategories: "DANH MỤC HOT",
    strategicPartners: "ĐỐI TÁC CHIẾN LƯỢC",
    productCategories: "DANH MỤC SẢN PHẨM",
    featuredProducts: "SẢN PHẨM NỔI BẬT",
    newArrivals: "Hàng Mới Về",
    bestSellers: "Bán Chạy Nhất",
    onSale: "Giảm Giá",
    login: "Đăng nhập",
    register: "Đăng ký",
    hello: "Xin chào",
    cart: "Giỏ hàng",
    becomeSeller: "Kênh người bán"
  },
  en: {
    home: "Home",
    products: "Shop",
    featured: "Featured",
    orders: "Orders",
    hotCategories: "HOT CATEGORIES",
    strategicPartners: "STRATEGIC PARTNERS",
    productCategories: "CATEGORIES",
    featuredProducts: "FEATURED ITEMS",
    newArrivals: "New Arrivals",
    bestSellers: "Best Sellers",
    onSale: "On Sale",
    login: "Login",
    register: "Register",
    hello: "Hello",
    cart: "Cart",
    becomeSeller: "Seller Centre"
  }
};

const Header: React.FC = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [userName, setUserName] = useState<string | null>(null);
  const [itemCount, setItemCount] = useState<number>(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  
  // State Ngôn ngữ
  const [language, setLanguage] = useState<'vi' | 'en'>(() => {
    return (localStorage.getItem('appLanguage') as 'vi' | 'en') || 'vi';
  });

  const t = TRANSLATIONS[language];

  const toggleLanguage = () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const getImageUrl = (img: any) => {
    if (!img) return "https://via.placeholder.com/300x300?text=No+Image";
    let imgUrl = typeof img === "string" ? img : img?.url;
    if (!imgUrl) return "https://via.placeholder.com/300x300?text=No+Image";

    if (imgUrl.startsWith("http")) return imgUrl;
    if (imgUrl.startsWith("/assets")) return imgUrl;

    imgUrl = imgUrl.replace(/\\/g, "/");
    if (imgUrl.startsWith("/")) imgUrl = imgUrl.substring(1);

    return `${API_BASE_URL}/${imgUrl}`;
  };

  const updateInfo = () => {
    const name = localStorage.getItem("userName");
    setUserName(name);

    const storedCart = localStorage.getItem("localCart");
    if (storedCart) {
      try {
        const cart: CartStorage = JSON.parse(storedCart);
        const totalItems = cart.items
          ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
          : 0;
        setItemCount(totalItems);
      } catch {
        setItemCount(0);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filtersRes = await fetch(`${API_BASE_URL}/api/products/filters`);
        const filtersData = await filtersRes.json();
        if (filtersData.categories) setCategories(filtersData.categories);
        if (filtersData.brands) setBrands(filtersData.brands);

        const featuredRes = await fetch(`${API_BASE_URL}/api/products/featured`);
        const featuredData = await featuredRes.json();
        const productList = featuredData.products || featuredData || [];
        setFeaturedProducts(productList.slice(0, 5)); 
      } catch (error) {
        console.error("Lỗi tải dữ liệu Header:", error);
      }
    };

    fetchData();

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    updateInfo();
    window.addEventListener("storage", updateInfo);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", updateInfo);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUserName(null);
    setItemCount(0);
    navigate("/login");
  };

  // --- CẤU HÌNH MENU ---
  const navItems = [
    { 
      name: t.home, 
      path: "/", 
      type: "mega",
      labelLeft: t.hotCategories,
      leftContent: {
        type: "links",
        items: [
            { name: t.newArrivals, href: "/products?sort=createdAt_desc" },
            { name: t.bestSellers, href: "/products?sort=sold_desc" },
            { name: t.onSale, href: "/products?onSale=true" },
        ]
      },
      labelRight: t.strategicPartners,
      rightContent: {
        type: "brands",
        items: brands.slice(0, 5) 
      }
    },
    { 
      name: t.products, 
      path: "/products", 
      type: "mega",
      labelLeft: t.productCategories,
      leftContent: {
        type: "categories",
        items: categories
      },
      labelRight: t.featuredProducts,
      rightContent: {
        type: "products",
        items: featuredProducts
      }
    },
    { name: t.featured, path: "/products?isFeatured=true", type: "link" },
    { name: t.orders, path: "/orders", type: "link" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-stone-200"
          : "bg-white border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl md:text-3xl font-black text-amber-900 tracking-tighter uppercase hover:opacity-80 transition-opacity">
              Fashion<span className="font-light text-amber-700">Store</span>
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item: any) => (
              <div key={item.name} className="group h-20 flex items-center">
                <Link
                  to={item.path}
                  className="relative flex items-center gap-1 text-stone-600 hover:text-amber-900 font-bold text-base transition-colors tracking-wide py-2"
                >
                  {item.name}
                  {item.type === "mega" && <ChevronDown className="w-4 h-4 mt-0.5 group-hover:rotate-180 transition-transform duration-300" />}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-800 transition-all duration-300 group-hover:w-full" />
                </Link>

                {/* MEGA MENU - (Giữ nguyên code mega menu cũ) */}
                {item.type === "mega" && (
                  <div className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-stone-100 invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                      <div className="flex gap-12">
                        {/* CỘT TRÁI */}
                        <div className="w-1/5 border-r border-stone-100 pr-6">
                          <h3 className="font-black text-stone-900 uppercase text-sm mb-4 tracking-wider">
                            {item.labelLeft}
                          </h3>
                          <ul className="space-y-3">
                            {item.leftContent.type === "links" && item.leftContent.items.map((link: any, idx: number) => (
                                <li key={idx}>
                                    <Link to={link.href} className="text-stone-500 hover:text-amber-700 hover:underline transition-colors text-sm font-medium block">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                            {item.leftContent.type === "categories" && item.leftContent.items.map((cat: Category) => (
                                <li key={cat._id}>
                                    <Link to={`/products?category=${cat._id}`} className="text-stone-500 hover:text-amber-700 hover:underline transition-colors text-sm font-medium block">
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                          </ul>
                        </div>

                        {/* CỘT PHẢI */}
                        <div className="w-4/5">
                          <h3 className="font-black text-stone-900 uppercase text-sm mb-4 tracking-wider">
                            {item.labelRight}
                          </h3>
                          
                          {item.rightContent.type === "brands" ? (
                             <div className="grid grid-cols-5 gap-6">
                                {item.rightContent.items.map((brand: Brand) => (
                                    <Link key={brand._id} to={`/products?brand=${brand._id}`} className="group/brand block">
                                        <div className="bg-white border border-stone-100 rounded-xl h-24 flex items-center justify-center p-4 shadow-sm group-hover/brand:shadow-md group-hover/brand:border-amber-200 transition-all duration-300">
                                            <img 
                                                src={getImageUrl(brand.logoUrl)} 
                                                alt={brand.name} 
                                                className="max-w-full max-h-full object-contain filter grayscale opacity-70 group-hover/brand:grayscale-0 group-hover/brand:opacity-100 transition-all duration-500"
                                            />
                                        </div>
                                    </Link>
                                ))}
                             </div>
                          ) : (
                             <div className="grid grid-cols-5 gap-4">
                                {item.rightContent.items.map((prod: Product) => (
                                    <Link key={prod._id} to={`/products/${prod._id}`} className="group/item block text-center">
                                        <div className="bg-stone-50 rounded-lg overflow-hidden mb-3 aspect-[4/3] relative">
                                            <img 
                                                src={getImageUrl(prod.images?.[0])} 
                                                alt={prod.name} 
                                                className="w-full h-full object-cover transform group-hover/item:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/5 transition-colors" />
                                        </div>
                                        <span className="text-sm font-bold text-stone-800 group-hover/item:text-amber-700 line-clamp-2 px-1">
                                            {prod.name}
                                        </span>
                                    </Link>
                                ))}
                             </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Actions Area */}
          <div className="flex items-center gap-4 md:gap-6 pr-10 lg:pr-0"> {/* Thêm padding-right trên mobile để tránh đè nút Seller */}
            
            {/* Đã XÓA nút Become Seller ở đây */}

            {/* Language Switcher */}
            <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-stone-100 transition-colors text-stone-600 font-bold text-xs"
            >
                <Globe size={18} className="text-stone-500" />
                <span>{language === 'vi' ? 'VN' : 'EN'}</span>
            </button>

            <div className="h-6 w-px bg-stone-300 hidden sm:block" />

            {/* Cart Button */}
            <Link to="/cart" className="relative p-2 text-stone-600 hover:text-amber-900 hover:bg-stone-50 rounded-full transition-all">
              <ShoppingCart className="h-6 w-6 stroke-2" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-amber-700 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white transform translate-x-1 -translate-y-1">
                  {itemCount}
                </span>
              )}
            </Link>

            <div className="h-6 w-px bg-stone-300 hidden sm:block" />

            {/* User Area */}
            {userName ? (
              <div className="flex items-center gap-3 md:gap-4">
                <Link to="/profile" className="group flex items-center gap-3 pl-1 pr-3 py-1 hover:bg-stone-50 rounded-full transition-all">
                  <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center border border-amber-200 group-hover:bg-amber-200 transition-colors">
                    <User className="h-5 w-5 text-amber-900" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider leading-tight">{t.hello}</p>
                    <p className="text-sm font-bold text-stone-900 leading-tight max-w-[100px] truncate">{userName}</p>
                  </div>
                </Link>
                <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="hidden sm:block px-4 py-2 text-sm font-bold text-stone-600 hover:text-amber-900 transition-colors">{t.login}</Link>
                <Link to="/register" className="px-6 py-2.5 text-sm font-bold text-white bg-amber-900 hover:bg-amber-950 rounded-full shadow-md hover:shadow-lg transition-all transform active:scale-95">{t.register}</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ⭐⭐⭐ BECOME SELLER BUTTON - MOVED HERE (ABSOLUTE RIGHT) ⭐⭐⭐ */}
      <Link 
        to="/seller/register" 
        className="absolute right-[10px] top-1/2 -translate-y-1/2 hidden xl:flex items-center gap-1.5 text-stone-500 hover:text-amber-900 transition-colors font-medium text-sm group bg-white/80 p-2 rounded-lg backdrop-blur-sm"
        title={t.becomeSeller}
      >
        <Store size={20} className="group-hover:scale-110 transition-transform text-amber-800" />
        <span className="font-bold text-amber-900">{t.becomeSeller}</span>
      </Link>

    </header>
  );
};

export default Header;