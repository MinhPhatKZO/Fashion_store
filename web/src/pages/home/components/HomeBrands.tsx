import React from "react";
import { Star } from "lucide-react";
import { Brand } from "../../../utils/homeUtils"; // Import interface

// 👇 QUAN TRỌNG: Định nghĩa Props để nhận 'brands'
interface Props {
  brands: Brand[];
}

const HomeBrands: React.FC<Props> = ({ brands }) => {
  return (
    <section className="group rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm transition-all duration-500 hover:-translate-y-1 relative z-10 bg-white">
        <div className="text-center mb-8 relative">
            <span className="absolute left-1/2 -translate-x-1/2 top-0 text-6xl opacity-5 font-black text-gray-900 uppercase tracking-widest whitespace-nowrap pointer-events-none">Brands Partner</span>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-widest flex items-center justify-center gap-3 relative z-10">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400"/> Đối tác chiến lược <Star className="w-6 h-6 text-yellow-400 fill-yellow-400"/>
            </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {brands.map((brand) => (
                <div key={brand._id} className="w-28 h-28 md:w-40 md:h-40 bg-white rounded-3xl flex items-center justify-center p-6 grayscale hover:grayscale-0 shadow-sm hover:shadow-[0_0_25px_rgba(0,0,0,0.1)] hover:scale-110 transition-all duration-300 border border-gray-100 cursor-pointer relative z-10">
                    <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
            ))}
        </div>
    </section>
  );
};

export default HomeBrands;