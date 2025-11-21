import React, { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";

interface Seller {
  _id: string;
  name: string;
  email: string;
}

interface Brand {
  _id: string;
  name: string;
  seller?: Seller | null;
}

interface SellersWithBrand {
  seller: Seller;
  brand: Brand;
}

const AdminBrandManager: React.FC = () => {
  const [sellersWithoutBrand, setSellersWithoutBrand] = useState<Seller[]>([]);
  const [sellersWithBrand, setSellersWithBrand] = useState<SellersWithBrand[]>([]);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getBrandDashboard();
      setSellersWithoutBrand(res.data.sellersWithoutBrand || []);
      setSellersWithBrand(res.data.sellersWithBrand || []);

      // Lấy danh sách brand chưa gán seller
      const allBrandsRes = await adminAPI.getAllBrands();
      const unassignedBrands = allBrandsRes.data.filter((b: Brand) => !b.seller);
      setAvailableBrands(unassignedBrands);
    } catch (err) {
      console.error(err);
      alert("Lỗi tải dữ liệu thương hiệu");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBrand = async (sellerId?: string) => {
    const name = prompt("Nhập tên Brand:");
    if (!name) return;

    try {
      if (sellerId) {
        // Tạo brand mới cho seller
        await adminAPI.createBrand({ sellerId, name });
      } else {
        // Tạo brand mới chưa gán seller
        await adminAPI.createBrand({ name });
      }
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Không thể tạo brand (tên có thể đã tồn tại)");
    }
  };

  const handleAssignBrand = async (sellerId: string, brandId: string) => {
    try {
      await adminAPI.assignBrand(sellerId, brandId);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Không thể gán brand này cho seller");
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!window.confirm("Xoá brand này?")) return;
    try {
      await adminAPI.deleteBrand(brandId);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Không thể xoá brand");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Quản lý Thương hiệu (Brand)</h1>

      {loading && <p>Đang tải...</p>}

      {/* Sellers chưa có brand */}
      <h2 className="text-xl font-semibold mt-6 mb-2">Seller chưa có Brand</h2>
      <table className="min-w-full border mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Tên</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Gán Brand</th>
            <th className="p-2 border">Tạo Brand mới</th>
          </tr>
        </thead>
        <tbody>
          {sellersWithoutBrand.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center p-2 border">
                Không có seller nào
              </td>
            </tr>
          ) : (
            sellersWithoutBrand.map((seller) => (
              <tr key={seller._id} className="text-center">
                <td className="p-2 border">{seller.name}</td>
                <td className="p-2 border">{seller.email}</td>
                <td className="p-2 border">
                  <select
                    onChange={(e) => handleAssignBrand(seller._id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="">-- Chọn brand --</option>
                    {availableBrands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleCreateBrand(seller._id)}
                    className="px-3 py-1 bg-indigo-600 text-white rounded"
                  >
                    Tạo Brand
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Brands */}
      <h2 className="text-xl font-semibold mb-2">Danh sách Brand</h2>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Tên Brand</th>
            <th className="p-2 border">Seller</th>
            <th className="p-2 border">Xoá</th>
          </tr>
        </thead>
        <tbody>
          {sellersWithBrand.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center p-2 border">
                Chưa có brand nào
              </td>
            </tr>
          ) : (
            sellersWithBrand.map(({ seller, brand }) => (
              <tr key={brand._id} className="text-center">
                <td className="p-2 border">{brand.name}</td>
                <td className="p-2 border">
                  {seller ? `${seller.name} (${seller.email})` : "Chưa gán seller"}
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleDeleteBrand(brand._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBrandManager;
