import React, { useState } from "react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex justify-center items-center min-h-screen bg-sky-100">
      <div className="bg-sky-200 w-[400px] p-10 rounded-xl shadow-md">
        <h2 className="text-3xl text-center text-green-900 font-bold mb-10">
          Login Now
        </h2>

        <label className="text-sm">Email</label>
        <input
          className="w-full border-b border-black mb-6 bg-transparent outline-none"
          type="email"
        />

        <label className="text-sm">Password</label>
        <div className="flex items-center border-b border-black">
          <input
            className="w-full bg-transparent outline-none py-1"
            type={showPassword ? "text" : "password"}
          />
          <span
            className="cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            👁️
          </span>
        </div>

        <button className="w-full mt-7 bg-green-900 text-white font-semibold py-2 rounded-lg">
          Login
        </button>

        <p className="text-center my-4 text-sm">Or login with</p>

        <button className="w-full bg-yellow-50 py-2 mb-3 rounded-md border flex justify-center gap-2 items-center">
          🌐 Login with Facebook
        </button>

        <button className="w-full bg-[#e8f5fe] py-2 rounded-md border flex justify-center gap-2 items-center">
          🔍 Login with Google
        </button>

        <p className="text-center mt-6 text-sm font-semibold">
          Don't have an account ?
        </p>

        <a href="/register">
          <button className="w-full mt-4 bg-green-900 text-white font-semibold py-2 rounded-lg">
            Sign Up
          </button>
        </a>
      </div>
    </div>
  );
}
