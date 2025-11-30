import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface Promotion {
  _id: string;
  code: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
}

interface PromotionsResponse {
  active: Promotion[];
  upcoming: Promotion[];
  expired: Promotion[];
}

export default function PromotionsPage() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<PromotionsResponse>({
    active: [],
    upcoming: [],
    expired: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeLeftMap, setTimeLeftMap] = useState<Record<string, string>>({});

  const fetchPromotions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/promotions");
      const data: PromotionsResponse = await res.json();
      setPromotions({
        active: data?.active || [],
        upcoming: data?.upcoming || [],
        expired: data?.expired || [],
      });
    } catch (err) {
      console.error("Fetch promotions failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // ✅ Countdown logic
  useEffect(() => {
    const updateCountdowns = () => {
      const now = new Date().getTime();
      const newMap: Record<string, string> = {};

      const allPromos = [...promotions.active, ...promotions.upcoming];

      allPromos.forEach((promo) => {
        let targetTime =
          promotions.active.find((p) => p._id === promo._id)
            ? new Date(promo.endDate).getTime()
            : new Date(promo.startDate).getTime();

        const diff = Math.max(0, targetTime - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        newMap[promo._id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      });

      setTimeLeftMap(newMap);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [promotions]);

  const renderPromoCard = (promo: Promotion, status: string) => {
    let badgeColor = "bg-green-500";
    if (status === "upcoming") badgeColor = "bg-yellow-400";
    else if (status === "expired") badgeColor = "bg-red-400";

    return (
      <motion.div
        key={promo._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden p-5 bg-white shadow-lg rounded-2xl border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition-all flex flex-col"
        >
        {/* Badge trạng thái */}
        <div className={`absolute top-4 right-4 text-white px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
            {status === "active"
            ? "Đang diễn ra"
            : status === "upcoming"
            ? "Sắp tới"
            : "Vừa kết thúc"}
        </div>

        <h3 className="text-xl font-bold text-indigo-600 mb-2">{promo.code}</h3>

        {/* Mô tả */}
        <p className="text-gray-700 mb-4 line-clamp-4 break-words flex-grow">
            {promo.description}
        </p>

        {/* Giảm giá */}
        <div className="text-2xl font-extrabold text-red-500 mb-3">
            -{promo.discountPercent}%
        </div>

        {/* Countdown */}
        {(status === "active" || status === "upcoming") && (
            <div className="text-sm text-gray-600 mb-3">
            {status === "active" ? "Còn lại: " : "Bắt đầu sau: "}
            {timeLeftMap[promo._id]}
            </div>
        )}

        {/* Thời gian */}
        <div className="text-sm text-gray-400 mb-4">
            <p>Bắt đầu: {new Date(promo.startDate).toLocaleDateString()}</p>
            <p>Kết thúc: {new Date(promo.endDate).toLocaleDateString()}</p>
        </div>

        {/* Nút áp dụng */}
        {status === "active" && (
            <button
            onClick={() => navigate("/cart")}
            className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition"
            >
            Áp dụng ngay
            </button>
        )}
        </motion.div>
    );
  };

  const renderSection = (title: string, list: Promotion[], status: string) => (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {list.map((promo) => renderPromoCard(promo, status))}
      </div>
    </section>
  );

  return (
    <div className="max-w-7xl mx-auto mt-12 px-6 md:px-0">
      <h1 className="text-4xl font-extrabold text-indigo-600 mb-10 text-center">
        Áp Dụng Ngay, Khuyến Mãi Liền Tay
      </h1>

      {loading ? (
        <div className="text-center text-gray-500 animate-pulse text-lg">
          Đang tải khuyến mãi...
        </div>
      ) : (
        <>
          {promotions.active?.length > 0 &&
            renderSection(
              "Chương trình đang diễn ra",
              promotions.active,
              "active"
            )}
          {promotions.upcoming?.length > 0 &&
            renderSection(
              "Chương trình sắp diễn ra",
              promotions.upcoming,
              "upcoming"
            )}
          {promotions.expired?.length > 0 &&
            renderSection(
              "Chương trình vừa kết thúc",
              promotions.expired,
              "expired"
            )}

          {promotions.active.length === 0 &&
            promotions.upcoming.length === 0 &&
            promotions.expired.length === 0 && (
              <div className="text-center text-gray-500 mt-20 text-lg">
                Hiện tại chưa có khuyến mãi nào.
              </div>
            )}
        </>
      )}
    </div>
  );
}
