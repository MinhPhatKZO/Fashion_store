// src/utils/homeUtils.ts

export const API_BASE_URL = "http://localhost:5000";

// --- INTERFACES ---
export interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images?: { url: string; alt?: string }[];
  image?: string;
  isFeatured?: boolean;
  isOnSale?: boolean;
  discountPercentage?: number;
  brandId?: string;
}

export interface Brand {
  _id: string;
  name: string;
  country: string;
  description: string;
  logoUrl: string;
}

// --- HELPERS ---
export const getMongoId = (id: any): string => {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (id.$oid) return id.$oid;
  if (id._id) return id._id.toString();
  return id.toString();
};

export const getImageUrl = (url: string | undefined) => {
  if (!url) return "https://via.placeholder.com/300?text=No+Image";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
};

export const getBrandLogo = (brandName: string): string => {
  const name = brandName.toLowerCase().replace(/\s/g, "");
  const logoMap: { [key: string]: string } = {
    nike: "/assets/logo/logonike.png",
    adidas: "/assets/logo/logoadidas.jpg",
    zara: "/assets/logo/logozara.jpg",
    "h&m": "/assets/logo/logohm.jpg",
    hm: "/assets/logo/logohm.jpg",
    gucci: "/assets/logo/logogucci.png",
  };
  return logoMap[name] || "https://via.placeholder.com/100x50?text=" + brandName;
};

export const getBrandTheme = (brandName: string) => {
    const name = brandName.toLowerCase().replace(/\s/g, "");
    const themes: { [key: string]: { border: string; hoverBg: string } } = {
        nike: { border: "border-t-slate-800", hoverBg: "hover:bg-slate-50" }, 
        adidas: { border: "border-t-blue-600", hoverBg: "hover:bg-blue-50" }, 
        zara: { border: "border-t-stone-600", hoverBg: "hover:bg-stone-50" }, 
        "h&m": { border: "border-t-red-600", hoverBg: "hover:bg-red-50" }, 
        hm: { border: "border-t-red-600", hoverBg: "hover:bg-red-50" },
        gucci: { border: "border-t-emerald-700", hoverBg: "hover:bg-emerald-50" }, 
        chanel: { border: "border-t-gray-900", hoverBg: "hover:bg-gray-50" },
        dior: { border: "border-t-rose-400", hoverBg: "hover:bg-rose-50" },
    };
    return themes[name] || { border: "border-t-cyan-500", hoverBg: "hover:bg-cyan-50" };
};