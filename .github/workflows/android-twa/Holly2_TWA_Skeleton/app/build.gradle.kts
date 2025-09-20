plugins {
    id("com.android.application") version "8.5.2"
}

android {
    namespace = "app.netlify.holly2_pro.twa"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.netlify.holly2_pro.twa"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures { buildConfig = true }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.4.0")
    // záměrně prázdné – žádné knihovny
}
