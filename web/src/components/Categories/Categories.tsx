import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/categories";

export interface Category {
  _id: string;
  name: string;
  slug?: string;
  isActive?: boolean;
  children?: Category[];
  parent?: Category;
}

interface CategoriesProps {
  onSelect?: (cat: Category | null) => void;
  selectedId?: string | null;
}

const categoryIcons: Record<string, string> = {
  nam: "👔",
  nu: "👗",
  "giay-dep": "👟",
  "phu-kien": "👜",
  "tre-em": "🧒",
  
};

const isCategoryLike = (item: any) =>
  item && typeof item === "object" && ("_id" in item || "id" in item || "name" in item);

const findFirstArray = (obj: any, depth = 3): any[] | null => {
  if (!obj || depth < 0) return null;
  if (Array.isArray(obj) && obj.length && isCategoryLike(obj[0])) return obj;
  if (Array.isArray(obj) && obj.length && typeof obj[0] === "object") return obj;
  if (typeof obj !== "object") return null;
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (Array.isArray(val) && val.length && isCategoryLike(val[0])) return val;
  }
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (typeof val === "object") {
      const found = findFirstArray(val, depth - 1);
      if (found) return found;
    }
  }
  return null;
};

const normalizeResponse = (data: any): Category[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  // direct known keys
  const directKeys = ["categories", "data", "result", "items", "rows", "docs", "payload"];
  for (const k of directKeys) {
    if (Array.isArray(data[k])) return data[k];
    if (data[k] && Array.isArray(data[k].data)) return data[k].data;
  }
  // fallback: find first plausible array
  const found = findFirstArray(data, 4);
  if (found) return found;
  return [];
};

const Categories: React.FC<CategoriesProps> = ({ onSelect, selectedId = null }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL);
      // log full response for debugging
      // eslint-disable-next-line no-console
      console.log("GET /api/categories status:", response.status, "data:", response.data);

      const list = normalizeResponse(response?.data);
      if (!list.length) {
        setCategories([]);
        setError("Danh mục rỗng hoặc server trả về cấu trúc khác. Kiểm tra console (GET /api/categories).");
      } else {
        // normalize keys (id -> _id) if needed
        const normalized = list.map((it: any) => ({
          _id: it._id || it.id || String(it._id || it.id || Math.random()),
          name: it.name || it.title || it.label || "",
          slug: it.slug,
          isActive: it.isActive ?? true,
          children: Array.isArray(it.children) ? it.children : undefined,
        })) as Category[];
        setCategories(normalized);
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to load categories:", err?.response ?? err);
      setError(err?.response?.data?.message || err?.message || "Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 inline-block"></span>
        <span className="ml-2">Đang tải danh mục...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 mb-3">{error}</div>
        <div className="flex justify-center gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => onSelect && onSelect(null)}>
            Xem tất cả
          </button>
          <button className="px-4 py-2 border rounded" onClick={fetchCategories}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="p-4 text-center">
        <div>Không có danh mục nào.</div>
        <div className="mt-3">
          <button className="px-4 py-2 border rounded" onClick={fetchCategories}>
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Danh mục sản phẩm</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => onSelect && onSelect(null)}
          className={`px-4 py-2 rounded-full ${!selectedId ? "bg-blue-600 text-white" : "bg-white border"}`}
        >
          Tất cả
        </button>

        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => onSelect && onSelect(c)}
            className={`px-4 py-2 rounded-full ${selectedId === c._id ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            <span className="mr-2">{categoryIcons[c.slug || ""] || "📦"}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat._id}>
            <div className="flex items-center space-x-2">
              <button
                className="text-blue-600 hover:underline font-medium flex items-center space-x-2"
                onClick={() => onSelect && onSelect(cat)}
              >
                <span>{categoryIcons[cat.slug || ""] || "📦"}</span>
                <span>{cat.name}</span>
              </button>
            </div>

            {cat.children && cat.children.length > 0 && (
              <ul className="ml-6 mt-1 space-y-1">
                {cat.children.map((child) => (
                  <li key={child._id}>
                    <button
                      className="text-blue-400 hover:underline flex items-center space-x-2"
                      onClick={() => onSelect && onSelect(child)}
                    >
                      <span>{categoryIcons[child.slug || ""] || "📦"}</span>
                      <span>{child.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Categories;