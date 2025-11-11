import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", form);
      alert(res.data.message);
      navigate("/login");
    } catch (err: any) {
      alert(err.response?.data?.message || "Register failed!");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-sky-100">
      <div className="bg-sky-200 w-[400px] p-10 rounded-xl shadow-md">
        <h2 className="text-3xl text-center text-green-900 font-bold mb-10">
          SignUp Now
        </h2>

        <label className="text-sm">Full Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border-b border-black mb-6 bg-transparent outline-none"
        />

        <label className="text-sm">Email</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border-b border-black mb-6 bg-transparent outline-none"
        />

        <label className="text-sm">Password</label>
        <div className="flex items-center border-b border-black">
          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            type={showPassword ? "text" : "password"}
            className="w-full bg-transparent outline-none py-1"
          />
          <span
            className="cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            👁️
          </span>
        </div>

        <label className="text-sm mt-4">Phone</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border-b border-black mb-6 bg-transparent outline-none"
        />

        <label className="text-sm mt-4">Address</label>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          className="w-full border-b border-black mb-6 bg-transparent outline-none"
        />

        <button
          onClick={handleRegister}
          className="w-full mt-7 bg-green-900 text-white font-semibold py-2 rounded-lg"
        >
          Sign Up
        </button>

        <a href="/login">
          <button className="w-full mt-7 bg-green-900 text-white font-semibold py-2 rounded-lg">
            Login
          </button>
        </a>
      </div>
    </div>
  );
}
