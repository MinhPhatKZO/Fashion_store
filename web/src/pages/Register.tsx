// src/pages/Register.tsx
import React, { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authAPI } from "../services/api";

// Kiểu dữ liệu trả về từ backend khi đăng ký
export interface RegisterResponse {
  message: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Message {
  text: string;
  type: "success" | "error";
}

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await authAPI.register(form);
      console.log("Register response:", res.data); // Debug

      // Lấy user trực tiếp từ res.data
      const user = res.data.user;

      if (!user) throw new Error("Đăng ký thất bại. Dữ liệu trả về không hợp lệ.");

      setMessage({
        text: "Đăng ký thành công! Chuyển hướng sang đăng nhập...",
        type: "success"
      });

      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || err.message || "Đăng ký thất bại. Vui lòng thử lại.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };



  const messageColor =
    message?.type === "success"
      ? "bg-green-100 border-green-400 text-green-700"
      : "bg-red-100 border-red-400 text-red-700";

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-white w-[400px] p-8 rounded-xl shadow-2xl border border-gray-100"
      >
        <h2 className="text-3xl text-center text-gray-800 font-extrabold mb-8">Đăng ký</h2>

        {message && (
          <motion.div
            key={message.text}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 mb-6 rounded-lg border text-sm font-medium ${messageColor}`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              type="text"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              type="email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-sky-500 focus-within:border-sky-500 transition">
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-3 bg-transparent outline-none rounded-l-lg"
                type={showPassword ? "text" : "password"}
                disabled={isLoading}
              />
              <button
                type="button"
                className="p-3 text-gray-500 hover:text-gray-700 transition rounded-r-lg"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={isLoading || !form.name || !form.email || !form.password}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 bg-sky-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-sky-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            "Đăng ký"
          )}
        </motion.button>

        <p className="text-center text-sm mt-6 text-gray-500">
          Đã có tài khoản?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-bold text-sky-600 hover:text-sky-700"
          >
            Đăng nhập ngay
          </button>
        </p>
      </motion.div>
    </div>
  );
}
