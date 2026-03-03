export const getBrandLogo = (brand: string) => {
  const name = brand.toLowerCase().replace(/\s/g, "");
  const map: Record<string, string> = {
    nike: "/assets/logo/logonike.png",
    adidas: "/assets/logo/logoadidas.jpg",
    zara: "/assets/logo/logozara.jpg",
    hm: "/assets/logo/logohm.jpg",
    gucci: "/assets/logo/logogucci.png",
  };
  return map[name] || `https://via.placeholder.com/100x50?text=${brand}`;
};

export const getBrandTheme = (brand: string) => {
  const name = brand.toLowerCase().replace(/\s/g, "");
  return {
    nike: { border: "border-t-slate-800", hoverBg: "hover:bg-slate-50" },
    adidas: { border: "border-t-blue-600", hoverBg: "hover:bg-blue-50" },
    zara: { border: "border-t-stone-600", hoverBg: "hover:bg-stone-50" },
    hm: { border: "border-t-red-600", hoverBg: "hover:bg-red-50" },
  }[name] || { border: "border-t-cyan-500", hoverBg: "hover:bg-cyan-50" };
};
