import 'package:json_annotation/json_annotation.dart';

part 'product.g.dart';

@JsonSerializable()
class Product {
  @JsonKey(name: '_id')
  final String id;
  final String name;
  final String description;
  final double price;
  @JsonKey(name: 'originalPrice')
  final double? originalPrice;
  final List<ProductImage> images;
  final Category category;
  final Category? subcategory;
  final String? brand;
  final String? sku;
  final List<ProductVariant> variants;
  final List<String> tags;
  final List<String> features;
  final ProductSpecifications specifications;
  final ProductRating rating;
  final List<String> reviews;
  @JsonKey(name: 'isActive')
  final bool isActive;
  @JsonKey(name: 'isFeatured')
  final bool isFeatured;
  @JsonKey(name: 'isOnSale')
  final bool isOnSale;
  @JsonKey(name: 'saleStartDate')
  final String? saleStartDate;
  @JsonKey(name: 'saleEndDate')
  final String? saleEndDate;
  final int views;
  final int sold;
  @JsonKey(name: 'discountPercentage')
  final int discountPercentage;
  @JsonKey(name: 'primaryImage')
  final String primaryImage;
  @JsonKey(name: 'createdAt')
  final String createdAt;
  @JsonKey(name: 'updatedAt')
  final String updatedAt;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.originalPrice,
    required this.images,
    required this.category,
    this.subcategory,
    this.brand,
    this.sku,
    required this.variants,
    required this.tags,
    required this.features,
    required this.specifications,
    required this.rating,
    required this.reviews,
    required this.isActive,
    required this.isFeatured,
    required this.isOnSale,
    this.saleStartDate,
    this.saleEndDate,
    required this.views,
    required this.sold,
    required this.discountPercentage,
    required this.primaryImage,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);
  Map<String, dynamic> toJson() => _$ProductToJson(this);
}

@JsonSerializable()
class ProductImage {
  final String url;
  final String? alt;
  @JsonKey(name: 'isPrimary')
  final bool isPrimary;

  ProductImage({required this.url, this.alt, required this.isPrimary});

  factory ProductImage.fromJson(Map<String, dynamic> json) =>
      _$ProductImageFromJson(json);
  Map<String, dynamic> toJson() => _$ProductImageToJson(this);
}

@JsonSerializable()
class ProductVariant {
  final String? size;
  final String? color;
  final int stock;
  final double? price;
  final List<String> images;

  ProductVariant({
    this.size,
    this.color,
    required this.stock,
    this.price,
    required this.images,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) =>
      _$ProductVariantFromJson(json);
  Map<String, dynamic> toJson() => _$ProductVariantToJson(this);
}

@JsonSerializable()
class ProductSpecifications {
  final String? material;
  final String? care;
  final String? origin;
  final String? weight;
  final String? dimensions;

  ProductSpecifications({
    this.material,
    this.care,
    this.origin,
    this.weight,
    this.dimensions,
  });

  factory ProductSpecifications.fromJson(Map<String, dynamic> json) =>
      _$ProductSpecificationsFromJson(json);
  Map<String, dynamic> toJson() => _$ProductSpecificationsToJson(this);
}

@JsonSerializable()
class ProductRating {
  final double average;
  final int count;

  ProductRating({required this.average, required this.count});

  factory ProductRating.fromJson(Map<String, dynamic> json) =>
      _$ProductRatingFromJson(json);
  Map<String, dynamic> toJson() => _$ProductRatingToJson(this);
}

@JsonSerializable()
class Category {
  @JsonKey(name: '_id')
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? image;
  final String? icon;
  final String? parent;
  final int level;
  final List<Category> children;
  @JsonKey(name: 'isActive')
  final bool isActive;
  @JsonKey(name: 'sortOrder')
  final int sortOrder;
  @JsonKey(name: 'createdAt')
  final String createdAt;
  @JsonKey(name: 'updatedAt')
  final String updatedAt;

  Category({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.image,
    this.icon,
    this.parent,
    required this.level,
    required this.children,
    required this.isActive,
    required this.sortOrder,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Category.fromJson(Map<String, dynamic> json) =>
      _$CategoryFromJson(json);
  Map<String, dynamic> toJson() => _$CategoryToJson(this);
}


