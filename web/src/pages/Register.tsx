import React, { useState, ChangeEvent, ReactNode, ElementType } from 'react';
import { User, Mail, Lock, Phone, MapPin, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

// === INTERFACES (Định nghĩa kiểu dữ liệu cho TypeScript) ===

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

interface InputFieldProps {
  name: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  Icon: ElementType;
  children?: ReactNode;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

interface RegisterProps {
  navigateToLogin: () => void;
}

interface LoginViewProps {
  navigateToRegister: () => void;
}

// === 1. Component Notification (Toast Message) ===
const Notification = ({ message, type, onClose }: NotificationProps) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div className={`fixed top-5 right-5 z-50 p-4 rounded-lg shadow-2xl text-white ${bgColor} transition-opacity duration-300 ease-in-out`}>
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-3" />
        <span className="font-semibold">{message}</span>
        <button onClick={onClose} className="ml-4 opacity-75 hover:opacity-100">
          &times;
        </button>
      </div>
    </div>
  );
};

// === 2. Component InputField (Styled Input with Icon) ===
const InputField = ({ name, type = 'text', value, onChange, placeholder, Icon, children }: InputFieldProps) => (
  <div className="mb-6">
    <label htmlFor={name} className="sr-only">
      {name}
    </label>
    <div className="relative flex items-center border border-indigo-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-300 bg-white shadow-sm">
      <div className="pl-4 text-indigo-400">
        <Icon size={20} />
      </div>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none px-4 py-3 text-slate-800 placeholder-slate-400 rounded-r-xl"
      />
      {children}
    </div>
  </div>
);

// === 3. Main Register Component ===
const Register = ({ navigateToLogin }: RegisterProps) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | '' }>({ message: '', type: '' });
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  // Xử lý Đăng ký (Mô phỏng API call, giữ cấu trúc async/await của bạn)
  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      showToast("Vui lòng điền đầy đủ các trường bắt buộc.", 'error');
      return;
    }

    try {
      // Mô phỏng độ trễ mạng thay cho axios
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        showToast("Đăng ký thành công! Đang chuyển hướng...", 'success');
        // Mô phỏng navigate("/login")
        setTimeout(() => navigateToLogin(), 1500); 
      } else {
        throw new Error("Email đã được sử dụng hoặc lỗi máy chủ (500).");
      }

    } catch (err: unknown) {
      const errorMessage = (err instanceof Error) ? err.message : "Đăng ký thất bại do lỗi không xác định.";
      showToast(errorMessage, 'error');
    }
  };

  return (
    <>
      <div className="flex justify-center items-center min-h-screen bg-indigo-50 p-4 font-inter">
        <div className="w-full max-w-lg bg-white p-6 sm:p-10 rounded-3xl shadow-2xl border border-indigo-100/50 transition-all duration-500">
          
          {/* Header */}
          <h2 className="text-4xl text-center text-indigo-900 font-extrabold mb-2">
            Tham Gia Cộng Đồng
          </h2>
          <p className="text-center text-indigo-500 mb-12 text-lg font-light">
            Tạo tài khoản mới chỉ trong vài giây.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
            <InputField
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Họ và tên đầy đủ"
              Icon={User}
            />

            <InputField
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Địa chỉ email hợp lệ"
              Icon={Mail}
            />

            {/* Password Field */}
            <InputField
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Mật khẩu (tối thiểu 8 ký tự)"
              Icon={Lock}
            >
              <button
                type="button"
                className="pr-4 text-indigo-400 hover:text-indigo-600 transition-colors focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </InputField>

            <InputField
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Số điện thoại"
              Icon={Phone}
            />

            <InputField
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Địa chỉ (ví dụ: TPHCM, Việt Nam)"
              Icon={MapPin}
            />

            <button
              type="submit"
              className="w-full mt-10 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/50 
                        hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 
                        focus:outline-none focus:ring-4 focus:ring-indigo-500/50 text-lg"
            >
              Đăng Ký
            </button>
          </form>

          {/* Footer Navigation */}
          <p className="text-center text-sm mt-8 text-slate-500">
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={navigateToLogin}
              className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
      <Notification 
        message={notification.message} 
        type={notification.type as 'success' | 'error'}
        onClose={() => setNotification({ message: '', type: '' })}
      />
    </>
  );
};

// === 4. App Wrapper (Simulates Routing) ===
const LoginView = ({ navigateToRegister }: LoginViewProps) => (
  <div className="flex justify-center items-center min-h-screen bg-indigo-50 p-4 font-inter">
    <div className="text-center p-10 rounded-2xl bg-white shadow-xl max-w-md w-full">
      <h1 className="text-3xl font-bold text-indigo-800 mb-4">Trang Đăng Nhập</h1>
      <p className="text-slate-600 mb-6">
        Đây là trang Đăng nhập mô phỏng.
      </p>
      <button 
        onClick={navigateToRegister} 
        className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Quay lại Đăng Ký
      </button>
    </div>
  </div>
);


const App = () => {
  const [page, setPage] = useState<'register' | 'login'>('register'); 

  const navigate = (target: 'register' | 'login') => setPage(target);

  switch (page) {
    case 'register':
      return <Register navigateToLogin={() => navigate('login')} />;
    case 'login':
      return <LoginView navigateToRegister={() => navigate('register')} />;
    default:
      return <Register navigateToLogin={() => navigate('login')} />;
  }
};

// Sửa lỗi: Export component App thay vì Register
export default App;