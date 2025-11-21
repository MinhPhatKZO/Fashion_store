// src/pages/CodCheckout.tsx (ĐÃ SỬA HOÀN CHỈNH)
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext'; 

// Khai báo lại các Interface (Đảm bảo CartItemType linh hoạt)
interface CartItem {
    variantId?: string;
    productId: string;
    productName: string;
    productImage: string;
    price: number;
    quantity: number;
}

const getImageUrl = (url: string | undefined): string => {
    if (!url) return "https://via.placeholder.com/60x60?text=SP";
    return url.startsWith("/") ? url : "/" + url;
};

const CodCheckout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useCart(); 

    const shippingFee = 30000;

    const orderData: { items: CartItem[]; totalPrice: number } | undefined =
        (location.state && (location.state as any).orderData) || undefined;

    const [shippingInfo, setShippingInfo] = useState({
        fullName: "",
        phone: "",
        address: "",
    });

    const subTotal = orderData?.totalPrice || 0;
    const finalTotal = subTotal + shippingFee;
    const totalItems =
        orderData?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    useEffect(() => {
        if (!orderData || !orderData.items || orderData.items.length === 0) {
            alert("Giỏ hàng trống. Vui lòng thêm sản phẩm để thanh toán.");
            navigate("/cart");
        }
    }, [orderData, navigate]);

    if (!orderData) {
        return (
            <div className="flex items-center justify-center h-screen">
                Đang tải dữ liệu...
            </div>
        );
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setShippingInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handlePlaceOrder = async () => {
        if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
            alert("Vui lòng nhập đầy đủ thông tin giao hàng!");
            return;
        }

        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if (!userId || !token) {
            alert("Bạn phải đăng nhập trước!");
            navigate("/login");
            return;
        }

        // map required fields for server
        const itemsPayload = orderData.items.map((i: CartItem) => ({
            productId: i.productId, // Backend sẽ dùng ID này để tìm Product/Variant
            variantId: i.variantId || undefined,
            quantity: i.quantity,
            price: i.price, // Giữ price để Backend tham chiếu
        }));

        // ⭐ TẠO PAYLOAD ĐÚNG THEO SCHEMA YÊU CẦU
        const payload = {
            orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            
            // ⭐ Backend chỉ cần các trường này để xử lý
            items: itemsPayload,
            shippingAddress: shippingInfo, // Gửi Object, Backend sẽ chuyển thành String
            
            // Các trường này chỉ cần cho Backend tính toán, không cần thiết cho Schema
            // paymentMethod: "COD", 
            // status: "unconfirmed", 
        };
        // END OF PAYLOAD

        try {
            const res = await fetch("http://localhost:5000/api/orders/cod", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            
            const data = await res.json();

            if (res.ok) {
                clearCart(); 
                alert("🎉 Đặt hàng thành công!");
                navigate("/order-confirmation", { state: { order: data.order } });
            } else {
                console.error("Order failed:", data);
                // Hiển thị lỗi chi tiết từ Backend
                alert("❌ Lỗi đặt hàng: " + (data.errors ? data.errors.join(', ') : data.message || "Unknown error"));
            }
        } catch (err) {
            console.error("❌ Request Error:", err);
            alert("Không thể kết nối server hoặc xảy ra lỗi mạng!");
        }
    };

    // ... (Phần render UI giữ nguyên)
    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h2 className="text-3xl font-bold mb-8 text-indigo-600 border-b pb-2">
                📦 Xác nhận đơn hàng (COD)
            </h2>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 text-gray-700">
                            🏡 Thông tin giao hàng
                        </h3>

                        <div className="space-y-4">
                            <input
                                type="text"
                                name="fullName"
                                value={shippingInfo.fullName}
                                onChange={handleChange}
                                placeholder="Họ và tên"
                                className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />

                            <input
                                type="tel"
                                name="phone"
                                value={shippingInfo.phone}
                                onChange={handleChange}
                                placeholder="Số điện thoại"
                                className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />

                            <textarea
                                name="address"
                                value={shippingInfo.address}
                                onChange={handleChange}
                                placeholder="Địa chỉ"
                                rows={3}
                                className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 text-gray-700">
                            🛒 Sản phẩm ({totalItems})
                        </h3>

                        {orderData.items.map((item: CartItem, index: number) => {
                            const itemTotal = item.price * item.quantity;

                            return (
                                <div
                                    key={(item.variantId || item.productId) + "-" + index}
                                    className="flex items-center space-x-4 border-b pb-4 last:border-b-0 last:pb-0 pt-4 first:pt-0"
                                >
                                    <img
                                        src={getImageUrl(item.productImage)}
                                        alt={item.productName}
                                        className="w-16 h-16 rounded-md border object-cover"
                                    />

                                    <div className="flex-1">
                                        <p className="font-semibold">{item.productName}</p>
                                        <p className="text-sm text-gray-500">
                                            {item.price.toLocaleString("vi-VN")} ₫
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">x{item.quantity}</p>
                                        <p className="font-bold text-red-600">
                                            {itemTotal.toLocaleString("vi-VN")} ₫
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-1 bg-gray-50 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold mb-4 text-gray-700">💵 Thanh toán</h3>

                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                            <span>Tạm tính:</span>
                            <span>{subTotal.toLocaleString("vi-VN")} ₫</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Phí ship:</span>
                            <span>{shippingFee.toLocaleString("vi-VN")} ₫</span>
                        </div>
                    </div>

                    <div className="flex justify-between border-t pt-4">
                        <span className="font-bold text-xl">Tổng cộng:</span>
                        <span className="text-2xl font-bold text-red-600">
                            {finalTotal.toLocaleString("vi-VN")} ₫
                        </span>
                    </div>

                    <button
                        onClick={handlePlaceOrder}
                        className="mt-6 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-colors"
                    >
                        Đặt hàng ({finalTotal.toLocaleString("vi-VN")} ₫)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CodCheckout;