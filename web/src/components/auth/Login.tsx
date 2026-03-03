import React, { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
// 👇 Import thêm useGoogleLogin để tạo nút Google tùy chỉnh
import { useGoogleLogin } from "@react-oauth/google"; 
import FacebookLogin from "@greatsumini/react-facebook-login";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

interface Message {
  text: string;
  type: "success" | "error";
}

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

  const handleAuthSuccess = (data: any) => {
    const { token, user } = data;
    localStorage.setItem("token", token);
    localStorage.setItem("userId", user._id);
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userRole", user.role);

    if (!localStorage.getItem("localCart")) {
      localStorage.setItem("localCart", JSON.stringify({ items: [], priceTotal: 0 }));
    }

    setTimeout(() => {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "seller") navigate("/seller");
      else navigate("/");
    }, 500);
  };

  /* ========================== API CALLS ========================== */
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
        setMessage({ text: data.message || "Đăng nhập thất bại.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Lỗi kết nối máy chủ.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // 👇 Xử lý Google Login (Dùng Hook)
  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
        // Token này dùng để xác thực, bạn có thể gửi thẳng credential về BE 
        // hoặc gọi Google API để lấy info rồi gửi về BE.
        // Ở đây giả lập gửi token về BE như cũ (Lưu ý: BE cần điều chỉnh để nhận access_token nếu cần)
        // Tuy nhiên để đơn giản, ta giữ nguyên logic gọi API BE:
        handleGoogleAuthApi(tokenResponse.access_token); 
    },
    onError: () => setMessage({ text: "Lỗi Google Login", type: "error" }),
  });

  const handleGoogleAuthApi = async (accessToken: string) => {
      // Lưu ý: Nếu BE của bạn đang chờ "credential" (JWT) từ Google Button cũ, 
      // bạn có thể cần sửa BE để nhận accessToken và gọi Google UserInfo.
      // Nhưng nếu bạn muốn giữ BE cũ, bạn cần dùng lại GoogleLogin Component cũ.
      // Dưới đây là giả định BE hỗ trợ hoặc bạn chấp nhận dùng nút Custom.
      
      // TẠM THỜI: Để code chạy mượt với UI Custom, ta giả lập gọi API
      // Nếu BE cần JWT, việc custom nút Google hơi phức tạp hơn chút. 
      // Nhưng để đúng "Tone đen xám" và "Animation", đây là cách tốt nhất.
      
      // Demo logic gửi token:
      try {
        // Lưu ý: Sửa lại body tùy theo BE nhận gì (credential hay access_token)
        const res = await fetch("http://localhost:5000/api/auth/google", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: accessToken }), // BE cần xử lý
        });
        const data = await res.json();
        if (res.ok) handleAuthSuccess(data);
        else setMessage({ text: data.message || "Lỗi Google", type: "error" });
      } catch (e) { setMessage({ text: "Lỗi server", type: "error" }); }
  };


  const handleFacebookLogin = async (response: any) => {
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: response.accessToken, userID: response.userID }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Đăng nhập Facebook thành công!", type: "success" });
        handleAuthSuccess(data);
      } else {
        setMessage({ text: data.message || "Lỗi Facebook Login", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Lỗi kết nối máy chủ.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f3f4f6] px-4 py-12 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white w-full max-w-[450px] p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Đăng Nhập</h2>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            Chào mừng bạn quay trở lại Fashion Store
          </p>
        </div>

        {/* 👇 SOCIAL BUTTONS: Side-by-Side & Expand Animation */}
        <div className="flex w-full gap-3 h-[52px] mb-8">
            
          {/* Google Button Custom */}
          <button
            onClick={() => loginGoogle()}
            className="flex-1 group hover:flex-[1.4] transition-all duration-300 ease-out bg-gray-100 hover:bg-white border border-transparent hover:border-gray-200 rounded-2xl flex items-center justify-center gap-3 overflow-hidden relative"
          >
            {/* Google Icon SVG */}
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-gray-600 font-semibold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto">
              Google
            </span>
          </button>

          {/* Facebook Button Custom */}
          <FacebookLogin
            appId={FACEBOOK_APP_ID}
            onSuccess={handleFacebookLogin}
            onFail={(error) => console.log("Login Failed!", error)}
            render={({ onClick }) => (
              <button
                onClick={onClick}
                className="flex-1 group hover:flex-[1.4] transition-all duration-300 ease-out bg-[#1877F2] hover:bg-[#166fe5] rounded-2xl flex items-center justify-center gap-3 overflow-hidden text-white shadow-sm"
              >
                <svg className="w-6 h-6 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="font-semibold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto">
                  Facebook
                </span>
              </button>
            )}
          />
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-white px-4 text-gray-400 font-bold">
              Hoặc email
            </span>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`px-4 py-3 mb-6 rounded-xl text-sm font-medium text-center ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Form Inputs (Tone Xám/Đen) */}
        <div className="space-y-5">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
              <Mail size={20} strokeWidth={1.5} />
            </div>
            <input
              name="email"
              type="email"
              placeholder="Email của bạn"
              value={form.email}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-gray-900 rounded-2xl outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium"
            />
          </div>

          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
              <Lock size={20} strokeWidth={1.5} />
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={form.password}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full pl-11 pr-12 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-gray-900 rounded-2xl outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm font-semibold text-gray-500 hover:text-gray-900 hover:underline transition-colors"
            >
              Quên mật khẩu?
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !form.email || !form.password}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base hover:bg-black hover:shadow-lg hover:shadow-gray-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 font-medium">
          Chưa có tài khoản?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-gray-900 font-bold hover:underline ml-1"
          >
            Đăng ký ngay
          </button>
        </div>
      </motion.div>
    </div>
  );
}