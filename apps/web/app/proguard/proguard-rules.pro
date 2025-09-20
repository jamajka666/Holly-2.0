-keep class app.netlify.holly2_pro.twa.bridge.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
