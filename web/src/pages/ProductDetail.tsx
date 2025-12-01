import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import { useCart } from "../context/CartContext"; 

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// ===========================================
// ⭐ INTERFACES (Giữ nguyên)
// ===========================================
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
// ===========================================

// ⭐ Arrow tùy chỉnh cho Slider (Sang trọng, không dùng icon phức tạp)
const CustomPrevArrow = (props: any) => {
    const { className, style, onClick } = props;
    return (
        <div
            className={`${className} absolute z-10 left-3 p-2 bg-black bg-opacity-30 hover:bg-opacity-70 rounded-full transition-all duration-300`}
            style={{ ...style, display: "block", width: "40px", height: "40px" }}
            onClick={onClick}
        >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white ml-0.5 mt-0.5">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
    );
};

const CustomNextArrow = (props: any) => {
    const { className, style, onClick } = props;
    return (
        <div
            className={`${className} absolute z-10 right-3 p-2 bg-black bg-opacity-30 hover:bg-opacity-70 rounded-full transition-all duration-300`}
            style={{ ...style, display: "block", width: "40px", height: "40px" }}
            onClick={onClick}
        >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white ml-0.5 mt-0.5">
                <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
    );
};

const ProductDetail: React.FC = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const { addToCart } = useCart(); 

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Product & Variants
    useEffect(() => {
        setLoading(true);
        const fetchProductData = async () => {
            try {
                // Fetch Product
                const resProduct = await fetch(`http://localhost:5000/api/products/${id}`);
                const dataProduct = await resProduct.json();
                const fetchedProduct: Product = dataProduct.product || dataProduct;
                setProduct(fetchedProduct);

                // Fetch Variants
                const resVariants = await fetch(`http://localhost:5000/api/products/${id}/variants`);
                const dataVariants = await resVariants.json();
                const list: ProductVariant[] = dataVariants.variants || [];
                setVariants(list);

                if (list.length > 0) {
                    const defaultVariant = list.find(v => v.stock > 0) || list[0];
                    setSelectedVariant(defaultVariant);
                }
            } catch (error) {
                console.error("❌ Lỗi tải dữ liệu sản phẩm:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProductData();
    }, [id]);

    // Fetch Related Products
    useEffect(() => {
        const fetchRelated = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/products/related/${id}`);
                const data = await res.json();
                // Lọc bỏ sản phẩm hiện tại khỏi danh sách liên quan
                setRelatedProducts(data.relatedProducts.filter((p: Product) => p._id !== id) || []);
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
        let url: string;

        if (typeof first === "string") {
            url = first;
        } else if (typeof first === "object" && first.url) {
            url = first.url;
        } else {
             return "https://via.placeholder.com/600x800?text=No+Image";
        }
        
        // Đảm bảo URL bắt đầu bằng / nếu là path nội bộ
        return url.startsWith("/") || url.startsWith("http") ? url : `/${url}`;
    };
    
    // Tùy chỉnh xử lý lỗi ảnh
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = 'https://via.placeholder.com/600x800?text=Image+Not+Found';
    };

    // Unique Attributes
    const uniqueAttributes = useMemo(() => {
        const allSizes = Array.from(new Set(variants.map(v => v.size))).filter(s => s);
        const allColors = Array.from(new Set(variants.map(v => v.color))).filter(c => c);

        return { allSizes, allColors };
    }, [variants]);

    const selectedSize = selectedVariant?.size || "";
    const selectedColor = selectedVariant?.color || "";

    // Select Variant
    const handleSelectVariant = (type: "size" | "color", val: string) => {
        let size = type === "size" ? val : selectedSize;
        let color = type === "color" ? val : selectedColor;

        // Tìm variant khớp chính xác
        let variant = variants.find(v => v.size === size && v.color === color);
        
        // Nếu không tìm thấy, cố gắng tìm variant khác còn hàng
        if (!variant) {
             if (type === 'size') {
                 variant = variants.find(v => v.size === size && v.stock > 0 && (!selectedColor || v.color === selectedColor));
             } else {
                 variant = variants.find(v => v.color === color && v.stock > 0 && (!selectedSize || v.size === selectedSize));
             }
        }
        
        setSelectedVariant(variant || null);
    };

    // Kiểm tra tính khả dụng của thuộc tính
    const isAttributeAvailable = (type: 'size' | 'color', val: string) => {
        if (type === 'size') {
            return variants.some(v => v.size === val && (v.color === selectedColor || !selectedColor) && v.stock > 0);
        } else { 
            return variants.some(v => v.color === val && (v.size === selectedSize || !selectedSize) && v.stock > 0);
        }
    };


    // ⭐ GIỎ HÀNG (Sử dụng Context)
    const handleAddToCart = () => {
        if (!product) return;

        if (variants.length > 0 && !selectedVariant) {
            alert("Bạn phải chọn biến thể (Size/Color)!");
            return;
        }

        const itemSource = selectedVariant || product;
        if (itemSource.stock <= 0) {
            alert("Sản phẩm/Biến thể đã hết hàng!");
            return;
        }

        const item = {
            productId: product._id, 
            variantId: selectedVariant ? selectedVariant._id : undefined,
            productName: `${product.name}` + (selectedVariant ? ` (${selectedVariant.size || ''}/${selectedVariant.color || ''})` : ''),
            price: itemSource.price,
            quantity: 1, 
            productImage: getImageUrl(product),
        };

        addToCart(item, 1);
        alert(`🛒 Đã thêm "${item.productName}" vào giỏ hàng!`);
    };

    if (loading) return <p className="text-center py-20 text-xl font-medium">Đang tải chi tiết sản phẩm...</p>;
    if (!product) return <p className="text-center py-20 text-xl font-medium text-red-600">Không tìm thấy sản phẩm.</p>;

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
        autoplaySpeed: 3000,
        pauseOnHover: true,
        arrows: true,
        prevArrow: <CustomPrevArrow />, // ⭐ Sử dụng custom arrow
        nextArrow: <CustomNextArrow />, // ⭐ Sử dụng custom arrow
        responsive: [
            { breakpoint: 1024, settings: { slidesToShow: Math.min(3, relatedProducts.length) } },
            { breakpoint: 768, settings: { slidesToShow: Math.min(2, relatedProducts.length) } },
            { breakpoint: 480, settings: { slidesToShow: 1 } }
        ]
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">

                {/* Chi tiết sản phẩm */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-6 md:p-10">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Khu vực ảnh */}
                        <div className="relative">
                            <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-xl bg-gray-100 shadow-lg">
                                <img 
                                    src={getImageUrl(product)} 
                                    alt={product.name} 
                                    className="w-full h-full object-contain object-center transition-transform duration-500 hover:scale-105" 
                                    onError={handleImageError}
                                />
                            </div>
                        </div>

                        {/* Khu vực chi tiết và nút mua hàng */}
                        <div className="flex flex-col justify-between">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
                                {product.brand && (
                                    <p className="text-lg text-gray-500 mb-4 border-b pb-2">Thương hiệu: <span className="font-semibold text-gray-700">{product.brand.name}</span></p>
                                )}
                                
                                {/* Giá */}
                                <div className="flex items-baseline gap-3 mb-6">
                                    <p className="text-4xl font-extrabold text-red-600">
                                        {displayPrice.toLocaleString("vi-VN")}₫
                                    </p>
                                    {/* Thêm giá so sánh nếu có */}
                                    {selectedVariant?.comparePrice && selectedVariant.comparePrice > displayPrice && (
                                        <p className="text-xl text-gray-400 line-through">
                                            {selectedVariant.comparePrice.toLocaleString("vi-VN")}₫
                                        </p>
                                    )}
                                </div>
                                
                                {/* Trạng thái Tồn kho */}
                                <p className={`text-base font-medium mb-8 ${isOutOfStock ? "text-red-500" : "text-green-600"}`}>
                                    Tồn kho: {isOutOfStock ? "Hết hàng" : `${displayStock.toLocaleString('vi-VN')} sản phẩm`}
                                </p>

                                {/* Variants */}
                                {variants.length > 0 && (
                                    <div className="mb-8 space-y-6">
                                        {/* Size */}
                                        {uniqueAttributes.allSizes.length > 1 && (
                                            <div>
                                                <p className="font-semibold text-lg text-gray-800 mb-3">Kích thước: <span className="text-black font-bold">{selectedSize}</span></p>
                                                <div className="flex flex-wrap gap-3">
                                                    {uniqueAttributes.allSizes.map(size => {
                                                        const isSelected = size === selectedSize;
                                                        const isAvailable = isAttributeAvailable('size', size);
                                                        return (
                                                            <button
                                                                key={size}
                                                                onClick={() => isAvailable && handleSelectVariant("size", size)}
                                                                className={`px-5 py-2 border rounded-full text-base font-medium transition-colors shadow-sm
                                                                    ${isSelected 
                                                                        ? 'bg-gray-900 text-white border-gray-900' 
                                                                        : isAvailable 
                                                                            ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                                                    }`}
                                                                disabled={!isAvailable && !isSelected}
                                                            >
                                                                {size}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Color */}
                                        {uniqueAttributes.allColors.length > 1 && (
                                            <div>
                                                <p className="font-semibold text-lg text-gray-800 mb-3">Màu sắc: <span className="text-black font-bold">{selectedColor}</span></p>
                                                <div className="flex flex-wrap gap-3">
                                                    {uniqueAttributes.allColors.map(color => {
                                                        const isSelected = color === selectedColor;
                                                        const isAvailable = isAttributeAvailable('color', color);
                                                        return (
                                                            <button
                                                                key={color}
                                                                onClick={() => isAvailable && handleSelectVariant("color", color)}
                                                                className={`px-5 py-2 border rounded-full text-base font-medium transition-colors shadow-sm
                                                                    ${isSelected 
                                                                        ? 'bg-gray-900 text-white border-gray-900' 
                                                                        : isAvailable 
                                                                            ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                                                    }`}
                                                                disabled={!isAvailable && !isSelected}
                                                            >
                                                                {color}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Nút Add to Cart */}
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock || (variants.length > 0 && !selectedVariant)}
                                className={`w-full text-lg font-bold py-4 rounded-xl transition-all duration-300 shadow-md transform hover:scale-[1.01]
                                    ${(isOutOfStock || (variants.length > 0 && !selectedVariant)) 
                                        ? "bg-gray-300 text-gray-600 cursor-not-allowed" 
                                        : "bg-black text-white hover:bg-gray-800 shadow-gray-400/50"
                                    }`}
                            >
                                {isOutOfStock ? "❌ Hết hàng" : (variants.length > 0 && !selectedVariant ? "Vui lòng chọn biến thể" : "🛍️ Thêm vào giỏ hàng")}
                            </button>
                        </div>
                    </div>
                    
                    {/* Mô tả chi tiết */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả sản phẩm</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                    </div>
                </div>

                {/* --- Sản phẩm liên quan --- */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Bạn có thể thích</h2>
                        <Slider {...sliderSettings}>
                            {relatedProducts.map((p) => (
                                <div key={p._id} className="p-2">
                                    <div 
                                        onClick={() => navigate(`/products/${p._id}`)} 
                                        className="bg-gray-50 border border-gray-100 shadow-sm rounded-xl overflow-hidden transition-all duration-300 transform hover:shadow-lg hover:scale-[1.03] cursor-pointer"
                                    >
                                        <div className="relative aspect-h-3 aspect-w-4 w-full h-52 overflow-hidden">
                                            <img
                                                src={getImageUrl(p)}
                                                alt={p.name}
                                                className="w-full h-full object-cover"
                                                onError={handleImageError}
                                            />
                                        </div>
                                        <div className="p-4 text-center">
                                            <p className="font-semibold text-gray-900 truncate mb-1">{p.name}</p>
                                            <p className="text-lg text-red-600 font-bold">
                                                {p.price.toLocaleString("vi-VN")}₫
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;