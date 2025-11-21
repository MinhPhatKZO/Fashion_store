import React from 'react';
import { useParams } from 'react-router-dom';

const WalletProcessor: React.FC = () => {
    const { walletType } = useParams<{ walletType: string }>();

    return (
        <div className="max-w-3xl mx-auto py-12 px-4 text-center">
            <h2 className="text-4xl font-extrabold mb-6 text-yellow-500">
                Chuyển Hướng Thanh Toán
            </h2>
            <div className="bg-white p-8 rounded-xl shadow-2xl">
                <p className="text-xl mb-4">
                    Bạn đang được chuyển hướng đến cổng thanh toán an toàn của
                    <span className="font-bold text-red-500 ml-2">{walletType?.toUpperCase()}</span>.
                </p>
                <div className="my-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                </div>
                <p className="text-gray-600 italic">
                    (Đây là trang giả lập. Trong thực tế, bạn sẽ gọi API và chuyển hướng người dùng ra khỏi website của mình.)
                </p>

                <button
                    onClick={() => alert(`Đã giả lập thanh toán qua ${walletType}.`)}
                    className="mt-6 px-8 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
                >
                    Xác nhận thanh toán giả lập
                </button>
            </div>
        </div>
    );
};

export default WalletProcessor;