import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import { useCart } from "../cart/CartContext";

// Import CSS cho slider
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// --- INTERFACES ---
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

// Interface cho Review
interface Review {
    _id: string;
    user: {
        _id: string;
        name: string;
        avatar?: string;
    };
    rating: number; // 1-5
    comment: string;
    createdAt: string;
}

const ProductDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    // State cho Review
    const [reviews, setReviews] = useState<Review[]>([]);
    const [userRating, setUserRating] = useState<number>(5);
    const [userComment, setUserComment] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- FETCH DATA ---

    // 1. Fetch Product
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

    // 2. Fetch Variants
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

    // 3. Fetch Related Products
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

    // 4. Fetch Reviews
    useEffect(() => {
        if (!id) return;
        const fetchReviews = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/reviews/product/${id}`);
                const data = await res.json();
                setReviews(data.reviews || data || []); 
            } catch (err) {
                console.error("❌ Lỗi tải đánh giá:", err);
            }
        };
        fetchReviews();
    }, [id]);

    // --- HELPER FUNCTIONS ---

    const getImageUrl = (p?: Product) => {
        if (!p || !p.images || p.images.length === 0)
            return "https://via.placeholder.com/600x800?text=No+Image";

        const first = p.images[0];
        if (typeof first === "string") return first.startsWith("/") ? first : `/${first}`;
        if ((p as any).primaryImage) {
            const url = (p as any).primaryImage;
            return url.startsWith("/") ? url : `/${url}`;
        }
        if (typeof first === "object" && first.url) return first.url.startsWith("/") ? first.url : `/${first.url}`;

        return "https://via.placeholder.com/600x800?text=No+Image";
    };

    // Unique Attributes Logic
    const uniqueAttributes = useMemo(() => {
        const allSizes = Array.from(new Set(variants.map(v => v.size)));
        const allColors = Array.from(new Set(variants.map(v => v.color)));
        return { allSizes, allColors };
    }, [variants]);

    const selectedSize = selectedVariant?.size || "";
    const selectedColor = selectedVariant?.color || "";

    const handleSelectVariant = (type: "size" | "color", val: string) => {
        let size = selectedSize;
        let color = selectedColor;
        if (type === "size") size = val;
        if (type === "color") color = val;

        let variant = variants.find(v => v.size === size && v.color === color);
        if (!variant) {
             if (type === 'size') {
                variant = variants.find(v => v.size === size && v.stock > 0);
            } else {
                variant = variants.find(v => v.color === color && v.stock > 0);
            }
        }
        setSelectedVariant(variant || null);
    };

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
            productName: `${product.name}` + (selectedVariant ? ` (${selectedVariant.size}/${selectedVariant.color})` : ''),
            price: itemSource.price,
            quantity: 1, 
            productImage: getImageUrl(product),
        };

        addToCart(item, 1);
        alert("🛒 Đã thêm vào giỏ hàng!");
    };

    // --- HÀM GỬI REVIEW ĐÃ ĐƯỢC SỬA ---
    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const token = localStorage.getItem("token"); 
        if (!token) {
            alert("Vui lòng đăng nhập để đánh giá sản phẩm!");
            navigate("/login");
            return;
        }

        if (userComment.trim() === "") {
            alert("Vui lòng nhập nội dung đánh giá.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("http://localhost:5000/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    product: id,  // <--- ĐÃ SỬA: Dùng 'product' thay vì 'productId'
                    rating: userRating,
                    comment: userComment
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Cảm ơn bạn đã đánh giá!");
                setReviews(prev => [data.review || data, ...prev]); 
                setUserComment("");
                setUserRating(5);
            } else {
                // Hiển thị lỗi chi tiết từ backend nếu có
                const errorMsg = data.message || (data.errors && data.errors[0]?.msg) || "Gửi đánh giá thất bại.";
                alert(errorMsg);
            }
        } catch (error) {
            console.error("Lỗi gửi review:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-xl">
                        {star <= rating ? "★" : "☆"}
                    </span>
                ))}
            </div>
        );
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
            { breakpoint: 1024, settings: { slidesToShow: Math.min(3, relatedProducts.length) } },
            { breakpoint: 768, settings: { slidesToShow: Math.min(2, relatedProducts.length) } },
            { breakpoint: 480, settings: { slidesToShow: 1 } }
        ]
    };

    return (
        <div className="container mx-auto px-6 py-12">

            {/* --- PHẦN 1: CHI TIẾT SẢN PHẨM --- */}
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

                    {/* Variants Selection */}
                    {variants.length > 0 && (
                        <div className="mb-6 space-y-4">
                            {/* Size */}
                            {uniqueAttributes.allSizes.length > 0 && (
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
                            {uniqueAttributes.allColors.length > 0 && (
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

            {/* --- PHẦN 2: ĐÁNH GIÁ SẢN PHẨM (REVIEWS) --- */}
            <div className="mb-12">
                <h2 className="text-3xl font-semibold mb-6">Đánh giá từ khách hàng</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Form gửi đánh giá */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm h-fit">
                        <h3 className="text-xl font-bold mb-4">Viết đánh giá của bạn</h3>
                        <form onSubmit={handleSubmitReview}>
                            <div className="mb-4">
                                <label className="block mb-2 font-medium">Bạn chấm mấy sao?</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setUserRating(star)}
                                            className={`text-2xl transition-colors ${star <= userRating ? "text-yellow-400" : "text-gray-300"}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block mb-2 font-medium">Nội dung đánh giá:</label>
                                <textarea
                                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    rows={4}
                                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                                    value={userComment}
                                    onChange={(e) => setUserComment(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
                            >
                                {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                            </button>
                        </form>
                    </div>

                    {/* Danh sách đánh giá */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {reviews.length === 0 ? (
                            <p className="text-gray-500 italic">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
                        ) : (
                            reviews.map((review) => (
                                <div key={review._id} className="border-b pb-4 mb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 overflow-hidden">
                                            {review.user?.avatar ? (
                                                <img src={review.user.avatar} alt={review.user.name} className="w-full h-full object-cover"/>
                                            ) : (
                                                (review.user?.name || "U").charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{review.user?.name || "Người dùng ẩn danh"}</p>
                                            <div className="flex text-yellow-400 text-xs">
                                                {renderStars(review.rating)}
                                            </div>
                                        </div>
                                        <span className="ml-auto text-xs text-gray-400">
                                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{review.comment}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <hr className="my-10" />

            {/* --- PHẦN 3: SẢN PHẨM LIÊN QUAN --- */}
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