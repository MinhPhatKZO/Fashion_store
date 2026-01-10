import React, { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "@greatsumini/react-facebook-login"; 

interface Message {
  text: string;
  type: "success" | "error";
}

// ------------------------------------------------------------------
// CẤU HÌNH APP ID
// Sử dụng process.env cho Create React App
// Thêm || "" để tránh lỗi TypeScript nếu biến chưa được load
// ------------------------------------------------------------------
const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID || "";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // --- HÀM DÙNG CHUNG: Xử lý lưu token & điều hướng ---
  const handleAuthSuccess = (data: any) => {
    const { token, user } = data;

    localStorage.setItem("token", token);
    localStorage.setItem("userId", user._id);
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userRole", user.role);

    if (!localStorage.getItem("localCart")) {
      localStorage.setItem(
        "localCart",
        JSON.stringify({ items: [], priceTotal: 0 })
      );
    }

    // Delay một chút để hiển thị thông báo thành công
    setTimeout(() => {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "seller") navigate("/seller");
      else navigate("/");
    }, 500);
  };

  /* ==========================
      EMAIL / PASSWORD LOGIN
  ========================== */
  const handleSubmit = async () => {
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Đăng nhập thành công!", type: "success" });
        handleAuthSuccess(data);
      } else {
        setMessage({
          text: data.message || "Đăng nhập thất bại. Kiểm tra email/mật khẩu.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage({ text: "Không thể kết nối đến máy chủ.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  /* ==========================
      GOOGLE LOGIN
  ========================== */
  const handleGoogleLogin = async (credentialResponse: any) => {
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Đăng nhập Google thành công!", type: "success" });
        handleAuthSuccess(data);
      } else {
        setMessage({
          text: data.message || "Đăng nhập Google thất bại",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Google login error:", error);
      setMessage({ text: "Không thể kết nối đến máy chủ.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  /* ==========================
      FACEBOOK LOGIN (NEW)
  ========================== */
  const handleFacebookLogin = async (response: any) => {
    setMessage(null);
    setIsLoading(true);
    console.log("FB Response:", response);

    try {
      // Gọi API Backend
      const res = await fetch("http://localhost:5000/api/auth/facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: response.accessToken,
          userID: response.userID,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Đăng nhập Facebook thành công!", type: "success" });
        handleAuthSuccess(data);
      } else {
        setMessage({
          text: data.message || "Đăng nhập Facebook thất bại",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Facebook login error:", error);
      setMessage({ text: "Không thể kết nối đến máy chủ.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F9FAFB] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white w-full max-w-[420px] p-8 md:p-10 rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-gray-100"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Chào mừng</h2>
          <p className="text-gray-500 mt-2 font-medium">
            Đăng nhập để tiếp tục trải nghiệm
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="flex flex-col gap-4 mb-6">
          {/* 1. Google Login */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() =>
                setMessage({
                  text: "Đăng nhập Google thất bại",
                  type: "error",
                })
              }
              theme="outline"
              size="large"
              shape="pill"
              width="100%"
            />
          </div>

          {/* 2. Facebook Login (Custom Style) */}
          <div className="flex justify-center w-full">
            <FacebookLogin
              appId={FACEBOOK_APP_ID}
              onSuccess={handleFacebookLogin}
              onFail={(error) => {
                console.log("Login Failed!", error);
                setMessage({ text: "Hủy đăng nhập Facebook", type: "error" });
              }}
              // Render prop để custom nút
              render={({ onClick }) => (
                <button
                  onClick={onClick}
                  className="flex items-center justify-center w-full gap-2 px-1 py-1 text-sm font-medium text-white bg-[#1877F2] hover:bg-[#166fe5] rounded-full transition-colors shadow-sm"
                  style={{ height: "40px" }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                  <span>Tiếp tục với Facebook</span>
                </button>
              )}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-500 font-bold">
              Hoặc Email
            </span>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 mb-6 rounded-xl border text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <div className="space-y-5">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
          />

          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={form.password}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
            />
            {/* Nút Ẩn/Hiện mật khẩu */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 text-sm font-medium"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !form.email || !form.password}
            className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700 transition-colors disabled:bg-sky-300"
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Chưa có tài khoản?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-sky-600 font-bold hover:underline"
          >
            Đăng ký ngay
          </button>
        </div>
      </motion.div>
    </div>
  );
}