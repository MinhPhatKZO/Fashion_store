import React, { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";

interface Message {
  text: string;
  type: "success" | "error";
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setMessage(null);
    setIsLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      setMessage({ text: "Đăng ký thành công! Đang chuyển hướng...", type: "success" });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fieldLabels: Record<string, string> = {
    name: "Họ và tên",
    email: "Địa chỉ Email",
    password: "Mật khẩu",
    phone: "Số điện thoại",
    address: "Địa chỉ liên hệ"
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F9FAFB] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white w-full max-w-[500px] p-8 md:p-10 rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-gray-100"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tạo tài khoản</h2>
          <p className="text-gray-500 mt-2">Tham gia cùng chúng tôi ngay hôm nay</p>
        </div>

        {/* Social Register (Đồng bộ với Login) */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button type="button" className="flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-700 font-semibold hover:bg-gray-50 transition shadow-sm text-sm">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20c11.045 0 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.301-11.283-7.927l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Google
          </button>
          <button type="button" className="flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl bg-[#24292F] text-white font-semibold hover:bg-[#24292F]/90 transition shadow-sm text-sm">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-500 font-medium">Hoặc đăng ký bằng Email</span>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 mb-6 rounded-xl border text-sm font-medium ${
              message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Form Fields */}
        <div className="space-y-5">
          {Object.keys(form).map((field) => (
            <div key={field} className={field === "address" ? "col-span-full" : ""}>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">{fieldLabels[field]}</label>
              <div className="relative">
                <input
                  name={field}
                  type={field === "password" ? (showPassword ? "text" : "password") : field === "email" ? "email" : "text"}
                  placeholder={`Nhập ${fieldLabels[field].toLowerCase()}...`}
                  value={form[field as keyof typeof form]}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all placeholder:text-gray-400"
                />
                {field === "password" && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                )}
              </div>
            </div>
          ))}

          <motion.button
            onClick={handleSubmit}
            disabled={isLoading || Object.values(form).some(v => !v)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full mt-4 bg-sky-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-100 hover:bg-sky-700 transition-all disabled:bg-gray-300 disabled:shadow-none flex items-center justify-center"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Tạo tài khoản"
            )}
          </motion.button>
        </div>

        <p className="text-center mt-8 text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <button onClick={() => navigate("/login")} className="text-sky-600 font-bold hover:underline">Đăng nhập ngay</button>
        </p>
      </motion.div>
    </div>
  );
}