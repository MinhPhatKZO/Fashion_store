import React from "react";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ProductCard from "../../../components/ProductCard/ProductCard";
import { Brand, Product, getBrandTheme } from "../../../utils/homeUtils";

interface Props {
  brands: Brand[];
  products: Product[];
  onChat: (brand: Brand) => void;
}

const HomeBrandStores: React.FC<Props> = ({ brands, products, onChat }) => {
  const navigate = useNavigate(); // Hook điều hướng

  return (
    <div className="space-y-10">
        {brands.map((brand) => {
            const brandProducts = products.filter(p => p.brandId === brand._id).slice(0, 5);
            if (brandProducts.length === 0) return null;

            const brandTheme = getBrandTheme(brand.name);

            return (
                <section 
                key={brand._id} 
                className={`group rounded-[2rem] border border-gray-100 shadow-sm transition-all duration-500 ease-out hover:shadow-[0_0_30px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-1 relative z-10 bg-white p-0 overflow-hidden border-t-4 ${brandTheme.border} ${brandTheme.hoverBg}`}
                >
                    <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-gray-100/50 bg-transparent">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-white rounded-2xl shadow-[0_5px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain mix-blend-multiply"/>
                            </div>
                            <div>
                                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{brand.name} Store</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Official Mall</span>
                                    <span className="text-gray-500 text-sm flex items-center gap-1"><ShieldCheck size={14}/> 100% Chính hãng</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500 text-sm">{brand.country}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button onClick={() => onChat(brand)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#78350F] text-white rounded-xl font-bold hover:bg-[#5a250b] hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                <MessageCircle size={20}/> Chat ngay
                            </button>
                            <a href={`/products?brand=${brand._id}`} className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold hover:border-gray-800 hover:text-gray-900 transition-all">
                                Xem Shop
                            </a>
                        </div>
                    </div>
                    <div className="p-6 md:p-8 bg-white/40">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                            {brandProducts.map(p => (
                                <div key={p._id} className="bg-white rounded-2xl p-2 border border-gray-100 hover:border-gray-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    {/* 👇 BỌC DIV NGOÀI ĐỂ XỬ LÝ CLICK */}
                                    <div onClick={() => navigate(`/products/${p._id}`)} className="cursor-pointer h-full">
                                        <ProductCard product={p} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )
        })}
    </div>
  );
};

export default HomeBrandStores;