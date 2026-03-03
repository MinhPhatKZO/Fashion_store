import React from "react";
import { Truck, ShieldCheck, RefreshCcw, Headphones } from "lucide-react";

const PolicyCard = ({ icon, title, sub, color, bg, glow }: any) => (
    <div className={`bg-white rounded-[2rem] p-6 shadow-sm flex flex-col items-center text-center gap-3 border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${glow} cursor-pointer group`}>
        <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-gray-900 text-base">{title}</h3>
            <p className="text-sm text-gray-500 mt-1 font-medium">{sub}</p>
        </div>
    </div>
);

const HomePolicies: React.FC = () => {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <PolicyCard icon={<Truck size={32}/>} title="Miễn phí vận chuyển" sub="Đơn hàng > 500k" color="text-blue-500" bg="bg-blue-50" glow="hover:shadow-blue-100" />
        <PolicyCard icon={<ShieldCheck size={32}/>} title="Bảo hành chính hãng" sub="Cam kết 100%" color="text-green-500" bg="bg-green-50" glow="hover:shadow-green-100" />
        <PolicyCard icon={<RefreshCcw size={32}/>} title="Đổi trả 30 ngày" sub="Lỗi do NSX" color="text-orange-500" bg="bg-orange-50" glow="hover:shadow-orange-100" />
        <PolicyCard icon={<Headphones size={32}/>} title="Hỗ trợ 24/7" sub="Hotline: 1900 xxxx" color="text-purple-500" bg="bg-purple-50" glow="hover:shadow-purple-100" />
    </section>
  );
};

export default HomePolicies;