import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import { useCart } from "../context/CartContext"; // ⭐ Giữ nguyên việc sử dụng Context

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Image {
    url?: string;
    alt?: string;
}
interface Brand {
    _id: string;
    name: string;
    country?: string;
    description?: string;
    logoUrl?: string;
}
interface Category {
    _id: string;
    name: string;
}
interface ProductVariant {
    _id: string;
    productId: string;
    sku: string;
    size: string;
    color: string;
    price: number;
    comparePrice?: number;
    stock: number;
}
interface Product {
    _id: string;
    name: string;
    price: number;
    stock: number;
    description: string;
    images?: (Image | string)[];
    isActive: boolean;
    isFeatured?: boolean;
    brand?: Brand;
    category?: Category;
}

const ProductDetail: React.FC = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const { addToCart } = useCart(); // ⭐ Sử dụng hàm addToCart từ CartContext

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    // Fetch Product
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/products/${id}`);
                const data = await res.json();
                setProduct(data.product || data);
            } catch (error) {
                console.error("❌ Lỗi tải sản phẩm:", error);
            }
        };
        fetchProduct();
    }, [id]);

    // Fetch Variants
    useEffect(() => {
        if (!id) return;
        const fetchVariants = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/products/${id}/variants`);
                const data = await res.json();
                const list: ProductVariant[] = data.variants || [];

                setVariants(list);

                if (list.length > 0) {
                    const defaultVariant = list.find(v => v.stock > 0) || list[0];
                    setSelectedVariant(defaultVariant);
                }
            } catch (err) {
                console.error("❌ Lỗi tải biến thể:", err);
            }
        };
        fetchVariants();
    }, [id]);

    // Fetch Related Products
    useEffect(() => {
        const fetchRelated = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/products/related/${id}`);
                const data = await res.json();
setRelatedProducts(data.relatedProducts || []);
            } catch (err) {
                console.error("❌ Lỗi tải liên quan:", err);
            }
        };
        fetchRelated();
    }, [id]);

    const getImageUrl = (p?: Product) => {
        if (!p || !p.images || p.images.length === 0)
            return "https://via.placeholder.com/600x800?text=No+Image";

        const first = p.images[0];
        if (typeof first === "string") return first.startsWith("/") ? first : `/${first}`;
        // Nếu Backend có trả về primaryImage, bạn nên dùng nó:
        if ((p as any).primaryImage) {
            const url = (p as any).primaryImage;
            return url.startsWith("/") ? url : `/${url}`;
        }
        if (typeof first === "object" && first.url) return first.url.startsWith("/") ? first.url : `/${first.url}`;

        return "https://via.placeholder.com/600x800?text=No+Image";
    };

    // Unique Attributes
    const uniqueAttributes = useMemo(() => {
        const allSizes = Array.from(new Set(variants.map(v => v.size)));
        const allColors = Array.from(new Set(variants.map(v => v.color)));

        return {
            allSizes,
            allColors
        };
    }, [variants]);

    const selectedSize = selectedVariant?.size || "";
    const selectedColor = selectedVariant?.color || "";

    // Select Variant
    const handleSelectVariant = (type: "size" | "color", val: string) => {
        let size = selectedSize;
        let color = selectedColor;

        if (type === "size") size = val;
        if (type === "color") color = val;

        // Tìm variant khớp chính xác
        let variant = variants.find(v => v.size === size && v.color === color);
        
        // Nếu không tìm thấy, cố gắng tìm variant khác còn hàng
        if (!variant) {
             if (type === 'size') {
                variant = variants.find(v => v.size === size && v.stock > 0);
            } else {
                variant = variants.find(v => v.color === color && v.stock > 0);
            }
        }
        
        setSelectedVariant(variant || null);
    };

    // ⭐⭐⭐ GIỎ HÀNG SỬ DỤNG CONTEXT VÀ CẤU TRÚC PHẲNG (như data cũ của bạn) ⭐⭐⭐
    const handleAddToCart = () => {
        if (!product) return;

        // Bắt buộc phải chọn biến thể nếu có variants
        if (variants.length > 0 && !selectedVariant) {
            alert("Bạn phải chọn biến thể (Size/Color)!");
            return;
        }

        const itemSource = selectedVariant || product;
        if (itemSource.stock <= 0) {
            alert("Sản phẩm/Biến thể đã hết hàng!");
            return;
        }

        // Tạo item chuẩn với cấu trúc PHẲNG (giả định Context API của bạn xử lý cấu trúc này)
        const item = {
            productId: product._id, 
            // Nếu có selectedVariant, lấy _id của nó làm variantId
            variantId: selectedVariant ? selectedVariant._id : undefined,
productName: `${product.name}` + (selectedVariant ? ` (${selectedVariant.size}/${selectedVariant.color})` : ''),
            price: itemSource.price,
            quantity: 1, // Mặc định là 1, bạn có thể thêm logic chọn số lượng
            productImage: getImageUrl(product),
        };

        // GỌI HÀM TỪ CONTEXT: Context sẽ lo việc lưu vào localStorage
        addToCart(item, 1); // 1 là quantity mặc định

        alert("🛒 Đã thêm vào giỏ hàng!");
    };


    if (!product) return <p className="text-center py-10">Đang tải...</p>;

    const displayPrice = selectedVariant?.price || product.price;
    const displayStock = selectedVariant?.stock ?? product.stock;
    const isOutOfStock = displayStock <= 0;

    const sliderSettings = {
        dots: true,
        infinite: relatedProducts.length > 4,
        speed: 700,
        slidesToShow: Math.min(4, relatedProducts.length),
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 2600,
        pauseOnHover: true,
        arrows: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: Math.min(3, relatedProducts.length),
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: Math.min(2, relatedProducts.length),
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                }
            }
        ]
    };

    return (
        <div className="container mx-auto px-6 py-12">

            {/* Chi tiết sản phẩm */}
            <div className="grid md:grid-cols-2 gap-12 mb-12">
                <div className="bg-gray-100 rounded-lg overflow-hidden shadow-md flex items-center justify-center">
                    <img src={getImageUrl(product)} alt={product.name} className="w-full h-96 object-contain" />
                </div>

                <div>
                    <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                    <p className="text-red-600 text-2xl font-semibold mb-2">{displayPrice.toLocaleString("vi-VN")}đ</p>
                    <p className={`text-sm mb-4 ${isOutOfStock ? "text-red-500 font-bold" : "text-green-600"}`}>
                        Tồn kho: {isOutOfStock ? "Hết hàng" : `${displayStock} sản phẩm`}
                    </p>
                    <p className="text-gray-700 mb-6">{product.description}</p>

                    {/* Variants */}
                    {variants.length > 0 && (
                        <div className="mb-6 space-y-4">
                            {/* Size */}
                            {uniqueAttributes.allSizes.length > 1 && (
                                <div>
                                    <p className="font-semibold mb-2">Kích thước: {selectedSize}</p>
<div className="flex flex-wrap gap-2">
                                        {uniqueAttributes.allSizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => handleSelectVariant("size", size)}
                                                className={`px-4 py-2 border rounded-full text-sm ${
                                                    size === selectedSize ? "bg-black text-white" : "bg-white text-gray-700"
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Color */}
                            {uniqueAttributes.allColors.length > 1 && (
                                <div>
                                    <p className="font-semibold mb-2">Màu sắc: {selectedColor}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueAttributes.allColors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => handleSelectVariant("color", color)}
                                                className={`px-4 py-2 border rounded-full text-sm ${
                                                    color === selectedColor ? "bg-black text-white" : "bg-white text-gray-700"
                                                }`}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add to Cart */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || (variants.length > 0 && !selectedVariant)}
                        className={`px-6 py-3 rounded-lg ${
                            (isOutOfStock || (variants.length > 0 && !selectedVariant)) ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800"
                        }`}
                    >
                        {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
                    </button>
                </div>
            </div>

            <hr className="my-10" />

            {/* Related */}
            {relatedProducts.length > 0 && (
                <div className="mt-10">
<h2 className="text-3xl font-semibold text-center mb-6">Sản phẩm liên quan</h2>
                    <Slider {...sliderSettings}>
                        {relatedProducts.map((p) => (
                            <div key={p._id} onClick={() => navigate(`/products/${p._id}`)} className="p-3 cursor-pointer">
                                <div className="bg-white shadow rounded-lg overflow-hidden">
                                    <img
                                        src={getImageUrl(p)}
                                        alt={p.name}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-3 text-center">
                                        <p className="font-medium truncate">{p.name}</p>
                                        <p className="text-red-600 font-semibold">
                                            {p.price.toLocaleString("vi-VN")}đ
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;