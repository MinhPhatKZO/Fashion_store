import React, { useEffect, useState } from "react";
import { Product, ProductVariant } from "../../types";
import { sellerAPI, uploadAPI } from "../../services/api";

const SellerProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({ name: "", price: 0 });
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await sellerAPI.getProducts();
      const productsData: Product[] = res.data?.data || [];
      setProducts(productsData);
    } catch (error) {
      console.error("Fetch seller products error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantChange = (
    index: number,
    field: keyof ProductVariant,
    value: ProductVariant[keyof ProductVariant]
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleAddVariant = () => {
    setVariants([...variants, { size: "", color: "", stock: 0, images: [] }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleUploadImages = async (files: File[]) => {
    if (files.length === 0) return [];
    try {
      const res = await uploadAPI.uploadMultiple(files);
      const uploadedImages = res.data?.data?.images || [];
      return uploadedImages.map((img: any) => ({
        url: img.path,
        isPrimary: false,
      }));
    } catch (error) {
      console.error("Upload images error:", error);
      return [];
    }
  };

  const handleSubmit = async () => {
    try {
      const uploadedImages = await handleUploadImages(images);
      const payload: Partial<Product> = {
        ...form,
        images: uploadedImages,
        variants,
      };

      if (editingProduct) {
        // Update
        const res = await sellerAPI.updateProduct(editingProduct._id!, payload);
        const updatedProduct = res.data?.data?.product;
        if (updatedProduct) {
          setProducts(
            products.map((p) => (p._id === editingProduct._id ? updatedProduct : p))
          );
        }
        setEditingProduct(null);
      } else {
        // Create
        const res = await sellerAPI.createProduct(payload);
        const newProduct = res.data?.data?.product;
        if (newProduct) {
          setProducts([...products, newProduct]);
        }
      }

      setForm({ name: "", price: 0 });
      setVariants([]);
      setImages([]);
    } catch (error) {
      console.error("Submit product error:", error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: product.price,
      description: product.description,
    });
    setVariants(product.variants || []);
    setImages([]); // nếu muốn upload thêm ảnh mới
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await sellerAPI.deleteProduct(id);
      setProducts(products.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Delete product error:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Quản lý sản phẩm</h1>

      {/* Form thêm/sửa sản phẩm */}
      <div className="border p-4 mb-4 rounded">
        <h2 className="font-medium mb-2">
          {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        </h2>

        <input
          type="text"
          placeholder="Tên sản phẩm"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 w-full mb-2 rounded"
        />
        <input
          type="number"
          placeholder="Giá"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          className="border p-2 w-full mb-2 rounded"
        />
        <textarea
          placeholder="Mô tả"
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 w-full mb-2 rounded"
        />

        {/* Biến thể */}
        <div className="mb-2">
          <h3 className="font-medium mb-1">Biến thể</h3>
          {variants.map((v, i) => (
            <div key={i} className="flex gap-2 mb-1">
              <input
                type="text"
                placeholder="Size"
                value={v.size}
                onChange={(e) => handleVariantChange(i, "size", e.target.value)}
                className="border p-1 rounded w-20"
              />
              <input
                type="text"
                placeholder="Color"
                value={v.color}
                onChange={(e) => handleVariantChange(i, "color", e.target.value)}
                className="border p-1 rounded w-20"
              />
              <input
                type="number"
                placeholder="Stock"
                value={v.stock}
                onChange={(e) => handleVariantChange(i, "stock", Number(e.target.value))}
                className="border p-1 rounded w-20"
              />
              <button
                onClick={() => handleRemoveVariant(i)}
                className="bg-red-500 text-white px-2 rounded"
              >
                Xóa
              </button>
            </div>
          ))}
          <button
            onClick={handleAddVariant}
            className="bg-green-500 text-white px-2 rounded mt-1"
          >
            Thêm biến thể
          </button>
        </div>

        {/* Hình ảnh */}
        <div className="mb-2">
          <input
            type="file"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files || []))}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {editingProduct ? "Cập nhật" : "Thêm sản phẩm"}
        </button>
      </div>

      {/* Danh sách sản phẩm */}
      {products.length === 0 && <p>Bạn chưa có sản phẩm nào.</p>}
      <div className="grid grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p._id} className="border p-2 rounded">
            <img
              src={p.images?.[0]?.url || "/placeholder.png"}
              alt={p.name}
              className="w-full h-40 object-cover mb-2"
            />
            <h2 className="font-medium">{p.name}</h2>
            <p className="text-gray-600">{p.price}₫</p>
            <button
              onClick={() => handleEditProduct(p)}
              className="mt-2 mr-2 px-2 py-1 bg-yellow-500 text-white rounded"
            >
              Sửa
            </button>
            <button
              onClick={() => handleDeleteProduct(p._id)}
              className="mt-2 px-2 py-1 bg-red-500 text-white rounded"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerProducts;
