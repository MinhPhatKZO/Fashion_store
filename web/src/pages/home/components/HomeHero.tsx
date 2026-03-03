import React, { useState, useEffect } from "react";

const BANNER_IMAGES = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1470&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1470&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1470&auto=format&fit=crop",
];

const HomeHero: React.FC = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % BANNER_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="group rounded-[2rem] p-3 border border-gray-100 shadow-sm transition-all duration-500 ease-out hover:shadow-[0_0_30px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-1 relative z-10 bg-white">
        <div className="relative w-full h-[400px] lg:h-[500px] rounded-[1.5rem] overflow-hidden group/banner">
            {BANNER_IMAGES.map((imgUrl, index) => (
                <div 
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                        index === currentBannerIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                >
                    <img src={imgUrl} alt="Banner" className="w-full h-full object-cover transform group-hover/banner:scale-105 transition-transform duration-[2000ms]" />
                </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-20 flex flex-col justify-center px-10 md:px-20 text-white">
                <h1 className="text-4xl md:text-7xl font-extrabold mb-4 drop-shadow-lg max-w-2xl leading-tight animate-fade-in-up">
                    SUMMER <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">VIBES</span>
                </h1>
                <p className="text-lg md:text-xl mb-8 max-w-md opacity-90 drop-shadow-md">Bộ sưu tập mới nhất với ưu đãi lên đến 50%.</p>
                <button onClick={() => document.getElementById('featured')?.scrollIntoView()} className="w-fit px-8 py-3.5 bg-white text-gray-900 font-bold rounded-full hover:bg-yellow-400 hover:text-black hover:shadow-lg hover:scale-105 transition-all shadow-md">
                    MUA NGAY
                </button>
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {BANNER_IMAGES.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentBannerIndex(idx)} className={`h-2.5 rounded-full transition-all shadow-sm ${idx === currentBannerIndex ? "w-10 bg-white" : "w-2.5 bg-white/50 hover:bg-white"}`} />
                ))}
            </div>
        </div>
    </section>
  );
};

export default HomeHero;