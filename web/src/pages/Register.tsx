import React, { useState, ChangeEvent, useEffect } from "react";
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
      const res = await axios.post("http://localhost:5000/api/auth/register", form);
      setMessage({ text: "Đăng ký thành công! Chuyển sang đăng nhập...", type: "success" });
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

  const messageColor =
    message?.type === "success"
      ? "bg-green-100 border-green-400 text-green-700"
      : "bg-red-100 border-red-400 text-red-700";

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-white w-full max-w-md p-8 rounded-xl shadow-2xl border border-gray-100"
      >
        <h2 className="text-3xl text-center text-gray-800 font-extrabold mb-6">Đăng ký</h2>

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
          {["name", "email", "password", "phone", "address"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field === "name" ? "Họ và tên" : field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                name={field}
                type={field === "password" ? (showPassword ? "text" : "password") : "text"}
                value={form[field as keyof typeof form]}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              />
            </div>
          ))}
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-gray-700">
            {showPassword ? "🙈" : "👁️"} Hiện/Mật khẩu
          </button>
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={isLoading || Object.values(form).some(v => !v)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 bg-sky-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-sky-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Đang xử lý..." : "Đăng ký"}
        </motion.button>

        <p className="text-center text-sm mt-6 text-gray-500">
          Đã có tài khoản?{" "}
          <button type="button" onClick={() => navigate("/login")} className="font-bold text-sky-600 hover:text-sky-700">
            Đăng nhập ngay
          </button>
        </p>
      </motion.div>
    </div>
  );
}
