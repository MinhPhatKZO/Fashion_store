import API_BASE_URL from "../constants/api";

export const getImageUrl = (url?: string): string => {
  if (!url) return "https://via.placeholder.com/300?text=No+Image";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
};
