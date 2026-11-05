plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
val ga = System.getProperty("user.home") + "/.monkos/go_android"
android {
    namespace = "ai.monkos.go.bench"
    compileSdk = 34
    defaultConfig {
        applicationId = "ai.monkos.go.bench"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1"
        ndk { abiFilters += listOf("arm64-v8a", "x86_64") }
    }
    sourceSets["main"].apply {
        assets.srcDirs("$ga/assets")          // 모델·설정·벤치 수순·라이선스(prep_assets.py)
        jniLibs.srcDirs("$ga/out")            // <ABI>/libkatago.so (build_katago.sh)
    }
    packaging {
        jniLibs.useLegacyPackaging = true     // extractNativeLibs=true → nativeLibraryDir에 풀려 exec 가능(Android 10+ W^X 우회)
    }
    androidResources { noCompress += listOf("dat", "cfg", "json") }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
