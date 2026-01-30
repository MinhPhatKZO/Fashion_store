import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import { useCart } from "../cart/CartContext";
import { 
  Star, ShoppingBag, Heart, Truck, ShieldCheck, 
  RotateCcw, ChevronRight, Minus, Plus, Share2 
} from "lucide-react";

// Import CSS slider
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// --- INTERFACES (Giữ nguyên) ---
interface Image { url?: string; alt?: string; }
interface Brand { _id: string; name: string; logoUrl?: string; }
interface Category { _id: string; name: string; }
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
interface Review {
  _id: string;
  user: { _id: string; name: string; avatar?: string; };
  rating: number;
  comment: string;
  createdAt: string;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Data State
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // UI State
  const [mainImage, setMainImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');

  // Review Form State
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA (Giữ nguyên logic của bạn) ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/products/${id}`);
        const data = await res.json();
        const prod = data.product || data;
        setProduct(prod);
        // Set ảnh mặc định ban đầu
        if (prod) setMainImage(getImageUrl(prod, 0));
      } catch (error) { console.error("Error loading product", error); }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchVariants = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/products/${id}/variants`);
        const data = await res.json();
        const list = data.variants || [];
        setVariants(list);
        if (list.length > 0) setSelectedVariant(list.find((v: any) => v.stock > 0) || list[0]);
      } catch (err) { console.error(err); }
    };
    fetchVariants();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/products/related/${id}`);
        const data = await res.json();
        setRelatedProducts(data.relatedProducts || []);
      } catch (err) { console.error(err); }
    };
    fetchRelated();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/reviews/product/${id}`);
        const data = await res.json();
        setReviews(data.reviews || data || []);
      } catch (err) { console.error(err); }
    };
    fetchReviews();
  }, [id]);

  // --- HELPER FUNCTIONS ---
  const getImageUrl = (p?: Product, index: number = 0) => {
    if (!p || !p.images || p.images.length === 0) return "https://via.placeholder.com/600x800?text=No+Image";
    const img = p.images[index];
    if (typeof img === "string") return img.startsWith("/") ? img : `/${img}`;
    if (typeof img === "object" && img.url) return img.url.startsWith("/") ? img.url : `/${img.url}`;
    return "https://via.placeholder.com/600x800?text=No+Image";
  };

  // Helper lấy tất cả URL ảnh để render gallery
  const getAllImages = useMemo(() => {
    if (!product || !product.images) return [];
    return product.images.map((_, idx) => getImageUrl(product, idx));
  }, [product]);

  const uniqueAttributes = useMemo(() => {
    const allSizes = Array.from(new Set(variants.map(v => v.size))).filter(Boolean);
    const allColors = Array.from(new Set(variants.map(v => v.color))).filter(Boolean);
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
      if (type === 'size') variant = variants.find(v => v.size === size && v.stock > 0);
      else variant = variants.find(v => v.color === color && v.stock > 0);
    }
    setSelectedVariant(variant || null);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (variants.length > 0 && !selectedVariant) {
      alert("Vui lòng chọn phân loại hàng!");
      return;
    }
    const itemSource = selectedVariant || product;
    if (itemSource.stock <= 0) {
      alert("Sản phẩm tạm hết hàng!");
      return;
    }
    addToCart({
      productId: product._id,
      variantId: selectedVariant?._id,
      productName: `${product.name} ${selectedVariant ? `(${selectedVariant.size} / ${selectedVariant.color})` : ''}`,
      price: itemSource.price,
      quantity: quantity,
      productImage: mainImage || getImageUrl(product),
    }, quantity);
    alert("Đã thêm vào giỏ hàng!");
  };

const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    // --- SỬA LỖI TẠI ĐÂY ---
    if (!token) {
        if(window.confirm("Bạn cần đăng nhập để đánh giá. Đi tới trang đăng nhập?")) {
            navigate("/login");
        }
        return;
    }
    // -----------------------

    if (!userComment.trim()) return alert("Vui lòng nhập nội dung!");

    setIsSubmitting(true);
    try {
        const res = await fetch("http://localhost:5000/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ product: id, rating: userRating, comment: userComment })
        });
        const data = await res.json();
        if (res.ok) {
            setReviews(prev => [data.review || data, ...prev]);
            setUserComment(""); setUserRating(5);
        } else {
            alert(data.message || "Lỗi gửi đánh giá");
        }
    } catch (e) { alert("Lỗi kết nối"); } 
    finally { setIsSubmitting(false); }
  };

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
    </div>
  );

  const displayPrice = selectedVariant?.price || product.price;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock = displayStock <= 0;

  // --- LAYOUT RENDER ---
  return (
    <div className="bg-white font-sans text-gray-900 pb-20">
      
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center text-xs text-gray-500 gap-2">
            <span className="hover:text-black cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
            <ChevronRight className="w-3 h-3" />
            <span className="hover:text-black cursor-pointer">{product.category?.name || "Sản phẩm"}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-black font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16">
            
            {/* LEFT: IMAGE GALLERY */}
            <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4">
                {/* Thumbnails (Vertical on Desktop, Hidden on Mobile if needed or Horizontal) */}
                <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:h-[600px] scrollbar-hide py-2 lg:py-0">
                    {getAllImages.map((img, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setMainImage(img)}
                            className={`flex-shrink-0 w-20 h-24 lg:w-24 lg:h-32 border-2 rounded-md overflow-hidden transition-all ${mainImage === img ? 'border-black' : 'border-transparent hover:border-gray-200'}`}
                        >
                            <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
                
                {/* Main Image */}
                <div className="flex-1 bg-gray-50 rounded-xl overflow-hidden relative group h-[500px] lg:h-[650px]">
                    <img src={mainImage} alt={product.name} className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" />
                    {product.isFeatured && <span className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">Hot</span>}
                </div>
            </div>

            {/* RIGHT: PRODUCT INFO (Sticky) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
                {/* Header Info */}
                <div className="mb-6 border-b border-gray-100 pb-6">
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900">{product.name}</h1>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex text-yellow-500 text-sm">
                            {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-current' : 'text-gray-300'}`} />)}
                        </div>
                        <span className="text-sm text-gray-500 border-l pl-4 border-gray-300">{reviews.length} đánh giá</span>
                        {product.brand && <span className="text-sm text-blue-600 font-medium border-l pl-4 border-gray-300">{product.brand.name}</span>}
                    </div>
                    <div className="flex items-baseline gap-3">
                        <p className="text-3xl font-bold text-gray-900">{displayPrice.toLocaleString("vi-VN")}₫</p>
                        {selectedVariant?.comparePrice && <p className="text-lg text-gray-400 line-through">{selectedVariant.comparePrice.toLocaleString("vi-VN")}₫</p>}
                    </div>
                </div>

                {/* Variants Selection */}
                {variants.length > 0 && (
                    <div className="space-y-6 mb-8">
                        {uniqueAttributes.allSizes.length > 0 && (
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-900">Kích thước</span>
                                    <span className="text-xs text-gray-500 underline cursor-pointer">Bảng quy đổi kích cỡ</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {uniqueAttributes.allSizes.map(size => {
                                        const isSelected = size === selectedSize;
                                        // Check availability logic can be added here
                                        return (
                                            <button
                                                key={size}
                                                onClick={() => handleSelectVariant("size", size)}
                                                className={`min-w-[3rem] h-10 px-3 rounded-lg border text-sm font-medium transition-all ${isSelected ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-black'}`}
                                            >
                                                {size}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {uniqueAttributes.allColors.length > 0 && (
                            <div>
                                <span className="text-sm font-semibold text-gray-900 block mb-2">Màu sắc: <span className="font-normal text-gray-600">{selectedColor}</span></span>
                                <div className="flex flex-wrap gap-3">
                                    {uniqueAttributes.allColors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => handleSelectVariant("color", color)}
                                            className={`w-8 h-8 rounded-full border-2 p-0.5 relative transition-all ${color === selectedColor ? 'border-black' : 'border-transparent hover:border-gray-300'}`}
                                        >
                                            <div className="w-full h-full rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: color.toLowerCase() }}></div> {/* Simple color map */}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-4 mb-8">
                    {/* Quantity & Add to Cart Row */}
                    <div className="flex gap-4">
                        <div className="flex items-center border border-gray-300 rounded-lg h-12 w-32">
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-full flex items-center justify-center hover:bg-gray-50 rounded-l-lg"><Minus className="w-4 h-4"/></button>
                            <input type="number" value={quantity} readOnly className="flex-1 w-full text-center border-none focus:ring-0 text-gray-900 font-medium" />
                            <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-full flex items-center justify-center hover:bg-gray-50 rounded-r-lg"><Plus className="w-4 h-4"/></button>
                        </div>
                        <button 
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-lg font-bold text-sm uppercase tracking-wide transition-all shadow-lg ${isOutOfStock ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl hover:-translate-y-0.5'}`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
                        </button>
                        <button className="h-12 w-12 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 hover:text-red-500 transition-colors">
                            <Heart className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Trust Signals */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                    <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold">Miễn phí vận chuyển</p>
                            <p className="text-xs text-gray-500">Cho đơn hàng trên 500k</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <RotateCcw className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold">Đổi trả miễn phí</p>
                            <p className="text-xs text-gray-500">Trong vòng 30 ngày</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold">Bảo hành chính hãng</p>
                            <p className="text-xs text-gray-500">Cam kết 100% auth</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Share2 className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold">Chia sẻ sản phẩm</p>
                            <p className="text-xs text-gray-500">Copy link</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- TABS SECTION (Description & Reviews) --- */}
        <div className="mt-20 border-t border-gray-200 pt-10">
            <div className="flex justify-center gap-8 mb-8 border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('desc')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'desc' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    Mô tả chi tiết
                </button>
                <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'reviews' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    Đánh giá khách hàng ({reviews.length})
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                {activeTab === 'desc' && (
                    <div className="prose max-w-none text-gray-700 leading-relaxed">
                         {/* Nếu description là HTML thì dùng dangerouslySetInnerHTML, nếu text thường thì để thẻ p */}
                         <p className="whitespace-pre-line">{product.description}</p>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div>
                         {/* Form Review */}
                         <div className="bg-gray-50 p-6 rounded-xl mb-10 border border-gray-100">
                            <h3 className="text-lg font-bold mb-4">Viết đánh giá của bạn</h3>
                            <form onSubmit={handleSubmitReview}>
                                <div className="mb-4">
                                    <span className="block text-sm font-medium mb-2">Đánh giá sao:</span>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button type="button" key={star} onClick={() => setUserRating(star)} className={`text-2xl transition-transform hover:scale-110 ${star <= userRating ? "text-yellow-400" : "text-gray-300"}`}>★</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <textarea 
                                        className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
                                        rows={3} 
                                        placeholder="Bạn cảm thấy thế nào về sản phẩm này?" 
                                        value={userComment} 
                                        onChange={(e) => setUserComment(e.target.value)} 
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition disabled:bg-gray-400">
                                    {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                                </button>
                            </form>
                        </div>

                        {/* List Review */}
                        <div className="space-y-6">
                            {reviews.length === 0 ? <p className="text-center text-gray-500">Chưa có đánh giá nào.</p> : reviews.map((review) => (
                                <div key={review._id} className="flex gap-4 border-b border-gray-100 pb-6 last:border-0">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                                        {review.user?.avatar ? <img src={review.user.avatar} className="w-full h-full object-cover"/> : (review.user?.name || "U").charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-900">{review.user?.name}</h4>
                                            <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex text-yellow-400 text-xs mb-2">
                                            {[...Array(5)].map((_, i) => <span key={i}>{i < review.rating ? "★" : "☆"}</span>)}
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* --- RELATED PRODUCTS --- */}
        {relatedProducts.length > 0 && (
            <div className="mt-24 border-t border-gray-200 pt-12">
                <div className="flex justify-between items-end mb-8">
                    <h2 className="text-2xl font-bold uppercase tracking-tight">Sản phẩm liên quan</h2>
                    <button className="text-sm font-semibold underline underline-offset-4 hover:text-gray-600">Xem tất cả</button>
                </div>
                
                <Slider {...{
                    dots: true, infinite: relatedProducts.length > 4, speed: 500, slidesToShow: 4, slidesToScroll: 1,
                    responsive: [ { breakpoint: 1024, settings: { slidesToShow: 3 } }, { breakpoint: 768, settings: { slidesToShow: 2 } }, { breakpoint: 480, settings: { slidesToShow: 1 } } ]
                }}>
                    {relatedProducts.map((p) => (
                         <div key={p._id} className="px-2" onClick={() => navigate(`/products/${p._id}`)}>
                             <div className="group cursor-pointer">
                                 <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                                     <img src={getImageUrl(p)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt=""/>
                                     <button className="absolute bottom-3 right-3 bg-white p-2 rounded-full shadow opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"><ShoppingBag className="w-4 h-4"/></button>
                                 </div>
                                 <h3 className="font-medium text-sm truncate">{p.name}</h3>
                                 <p className="font-bold text-sm mt-1">{p.price.toLocaleString("vi-VN")}₫</p>
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