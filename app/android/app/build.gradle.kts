plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    // Đảm bảo namespace trùng khớp với cấu hình project của bạn
    namespace = "com.example.fashion_store" 
    
    compileSdk = 35 // Flutter khuyến nghị giữ SDK mới nhất
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }

    defaultConfig {
        // ApplicationId phải trùng với namespace để tránh lỗi cài đặt
       applicationId = "com.example.fashion_store"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        getByName("release") {
            // Chỉnh sửa để tối ưu cho việc build release sau này
            isMinifyEnabled = false
            isShrinkResources = false
            signingConfig = signingConfigs.getByName("debug") // Tạm thời dùng debug key
        }
        getByName("debug") {
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
    
}

flutter {
    source = "../.."
}

dependencies {
    // Để trống cho Flutter tự quản lý các plugin Android
}