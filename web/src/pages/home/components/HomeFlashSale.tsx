import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import { Zap } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ProductCard from "../../../components/products/ProductCard"; 
import { Product } from "../../../utils/homeUtils"; 

// --- SUB COMPONENT: TIMER (Giữ nguyên) ---
const FlashSaleTimer = () => {
    const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const minutes = 59 - now.getMinutes();
            const seconds = 59 - now.getSeconds();
            setTimeLeft({ h: 0, m: minutes, s: seconds });
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const pad = (num: number) => num.toString().padStart(2, '0');
    return (
        <div className="flex gap-1.5 items-center">
            <div className="bg-red-600 text-white font-bold text-lg w-9 h-9 flex items-center justify-center rounded-lg shadow-sm">{pad(timeLeft.h)}</div>
            <span className="font-bold text-red-600">:</span>
            <div className="bg-red-600 text-white font-bold text-lg w-9 h-9 flex items-center justify-center rounded-lg shadow-sm">{pad(timeLeft.m)}</div>
            <span className="font-bold text-red-600">:</span>
            <div className="bg-red-600 text-white font-bold text-lg w-9 h-9 flex items-center justify-center rounded-lg shadow-sm">{pad(timeLeft.s)}</div>
        </div>
    );
};

const NextArrow = (props: any) => (
    <button onClick={props.onClick} className="absolute top-1/2 -right-5 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm shadow rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all group">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
    </button>
);
const PrevArrow = (props: any) => (
    <button onClick={props.onClick} className="absolute top-1/2 -left-5 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm shadow rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all group">
      <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
    </button>
);

// --- MAIN COMPONENT ---
interface Props {
  products: Product[];
}

const HomeFlashSale: React.FC<Props> = ({ products }) => {
  const navigate = useNavigate(); // Hook điều hướng

  const settings = {
    dots: false, infinite: true, speed: 500, slidesToShow: 5, slidesToScroll: 1, autoplay: true,
    nextArrow: <NextArrow />, prevArrow: <PrevArrow />,
    responsive: [ { breakpoint: 1280, settings: { slidesToShow: 4 } }, { breakpoint: 1024, settings: { slidesToShow: 3 } }, { breakpoint: 768, settings: { slidesToShow: 2 } } ],
  };

  return (
    <section id="featured" className="group rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm transition-all duration-500 hover:-translate-y-1 relative z-10 bg-white border-l-4 border-l-red-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 pb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-red-100 p-3 rounded-2xl animate-pulse"><Zap className="w-8 h-8 text-red-600 fill-red-600" /></div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight italic">FLASH SALE</h2>
                        <p className="text-sm text-gray-500 font-medium">Săn deal hot nhất trong ngày</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium text-sm uppercase tracking-wide hidden md:block">Kết thúc trong</span>
                    <FlashSaleTimer />
                </div>
            </div>
            <a href="/products" className="px-6 py-2.5 rounded-full bg-gray-50 text-gray-700 font-bold hover:bg-red-50 hover:text-red-600 transition-all shadow-sm border border-gray-200">Xem tất cả</a>
        </div>
        
        <div className="bg-gradient-to-b from-red-50/50 to-transparent rounded-2xl p-4">
            <Slider {...settings} className="-mx-3">
                {products.map((product) => (
                <div key={product._id} className="px-3 py-2 h-full">
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full border border-gray-100 overflow-hidden group/product">
                        {/* 👇 BỌC DIV NGOÀI ĐỂ XỬ LÝ CLICK */}
                        <div onClick={() => navigate(`/products/${product._id}`)} className="cursor-pointer h-full">
                            <ProductCard product={product} />
                        </div>
                    </div>
                </div>
                ))}
            </Slider>
        </div>
    </section>
  );
};

export default HomeFlashSale;