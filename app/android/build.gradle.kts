android {
    compileSdk = 33
    ndkVersion = "27.0.12077973"   // <-- thêm dòng này

    defaultConfig {
        applicationId = "com.example.ecommerce_project"
        minSdk = 21
        targetSdk = 33
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
}
