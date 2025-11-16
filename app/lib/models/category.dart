class Category {
  final String id;
  final String name;
  final String? slug;
  final String? image;
  final String? icon;
  final List<Category> children;

  Category({
    required this.id,
    required this.name,
    this.slug,
    this.image,
    this.icon,
    List<Category>? children,
  }) : children = children ?? [];

  factory Category.fromJson(Map<String, dynamic> json) {
    // Lấy _id từ MongoDB: json['_id']['\$oid'] hoặc string thẳng
    final rawId = json['_id'];
    String idValue;
    if (rawId is Map && rawId.containsKey(r'$oid')) {
      idValue = rawId[r'$oid'];
    } else if (rawId is String) {
      idValue = rawId;
    } else {
      idValue = '';
    }

    var childrenJson = json['children'] as List<dynamic>?;

    return Category(
      id: idValue,
      name: json['name'] ?? '',
      slug: json['slug'],
      image: json['image'],
      icon: json['icon'],
      children: childrenJson != null
          ? childrenJson.map((c) => Category.fromJson(c)).toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'slug': slug,
      'image': image,
      'icon': icon,
      'children': children.map((c) => c.toJson()).toList(),
    };
  }
}
