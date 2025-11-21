import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type OnlineMethod = 'momo' | 'vnpay' | 'zalopay' | null;

const OnlineCheckout: React.FC = () => {
    const [selectedMethod, setSelectedMethod] = useState<OnlineMethod>(null);
    const navigate = useNavigate();

    const handleProceed = () => {
        if (!selectedMethod) {
            alert("Vui lòng chọn một cổng thanh toán.");
            return;
        }
        // Chuyển hướng tới trang xử lý riêng cho Momo/VNPay/ZaloPay
        navigate(`/checkout/online/${selectedMethod}`);
    };

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <h2 className="text-3xl font-bold mb-6 text-green-600">Thanh Toán Online</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <p className="text-lg mb-4 font-semibold">Vui lòng chọn cổng thanh toán an toàn:</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {['momo', 'vnpay', 'zalopay'].map(method => (
                        <button
                            key={method}
                            onClick={() => setSelectedMethod(method as OnlineMethod)}
                            className={`py-4 text-md font-bold rounded-xl transition-all shadow-md transform hover:scale-[1.05]
                                ${selectedMethod === method 
                                    ? 'bg-green-600 text-white shadow-green-400/50' 
                                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-green-50'}`}
                        >
                            {method.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="border-t pt-4 mt-4">
                    <p>Tổng tiền: <span className="font-bold text-red-600">XXX.XXX ₫</span></p>
                    <p>Cổng thanh toán đã chọn: <span className="font-bold">{selectedMethod ? selectedMethod.toUpperCase() : 'Chưa chọn'}</span></p>
                </div>

                <button
                    onClick={handleProceed}
                    disabled={!selectedMethod}
                    className={`mt-6 w-full py-3 text-white font-bold rounded-lg transition 
                        ${selectedMethod
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    Tiếp tục thanh toán
                </button>
            </div>
        </div>
    );
};

export default OnlineCheckout;