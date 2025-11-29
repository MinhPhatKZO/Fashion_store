import React, { useState } from "react";
import axios from "axios";

export default function SellerCreateProduct() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
  });

  const [image, setImage] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("token"); // LẤY TOKEN CHUẨN

      if (!token) {
        alert("Bạn cần đăng nhập");
        return;
      }

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("description", form.description);

      if (image) {
        formData.append("image", image);
      }

      const res = await axios.post(
        "http://localhost:5000/api/seller/products",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // GỬI TOKEN CHUẨN
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(res.data);
      alert("Tạo sản phẩm thành công!");
    } catch (error: any) {
      console.error("Lỗi khi tạo sản phẩm:", error.response?.data || error);
      alert(error.response?.data?.message || "Lỗi server");
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">Tạo sản phẩm mới</h2>

      <input
        type="text"
        name="name"
        placeholder="Tên sản phẩm"
        value={form.name}
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      />

      <input
        type="number"
        name="price"
        placeholder="Giá"
        value={form.price}
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      />

      <textarea
        name="description"
        placeholder="Mô tả"
        value={form.description}
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      />

      <input type="file" onChange={handleFile} className="mb-4" />

      <button
        onClick={handleCreate}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Tạo sản phẩm
      </button>
    </div>
  );
}
