import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  @JsonKey(name: '_id')
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? avatar;
  final String role;
  final List<Address> addresses;
  final List<String> wishlist;
  @JsonKey(name: 'isActive')
  final bool isActive;
  @JsonKey(name: 'emailVerified')
  final bool emailVerified;
  @JsonKey(name: 'createdAt')
  final String createdAt;
  @JsonKey(name: 'updatedAt')
  final String updatedAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.avatar,
    required this.role,
    required this.addresses,
    required this.wishlist,
    required this.isActive,
    required this.emailVerified,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class Address {
  @JsonKey(name: '_id')
  final String id;
  final String name;
  final String phone;
  final String address;
  final String city;
  final String district;
  final String ward;
  @JsonKey(name: 'isDefault')
  final bool isDefault;

  Address({
    required this.id,
    required this.name,
    required this.phone,
    required this.address,
    required this.city,
    required this.district,
    required this.ward,
    required this.isDefault,
  });

  factory Address.fromJson(Map<String, dynamic> json) =>
      _$AddressFromJson(json);
  Map<String, dynamic> toJson() => _$AddressToJson(this);
}


