package app.netlify.holly2_pro.twa.ui

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.*
import androidx.fragment.app.Fragment
import androidx.webkit.WebViewAssetLoader
import app.netlify.holly2_pro.twa.MainActivity
import app.netlify.holly2_pro.twa.R
import app.netlify.holly2_pro.twa.bridge.HollyJsBridge
import app.netlify.holly2_pro.twa.vault.VaultRepository

class UiAssistantFragment : Fragment(R.layout.fragment_ui_assistant) {
    private val origin = "https://appassets.androidplatform.net"
    private val startPath = "/assets/www/index.html"

    private lateinit var web: WebView
    private lateinit var swipe: androidx.swiperefreshlayout.widget.SwipeRefreshLayout

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        web = view.findViewById(R.id.web)
        swipe = view.findViewById(R.id.swipe)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(requireContext()))
            .build()

        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            loadsImagesAutomatically = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) forceDark = WebSettings.FORCE_DARK_AUTO
        }

        // JS Bridge – nativní funkce pro PWA
        val vault = VaultRepository(requireContext())
        val activity = (requireActivity() as MainActivity)
        web.addJavascriptInterface(HollyJsBridge(vault){ on ->
            activity.toggleMic(on)
        }, "HollyNative")

        web.webChromeClient = object : WebChromeClient() {}
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                swipe.isRefreshing = true
            }
            override fun onPageFinished(view: WebView?, url: String?) {
                swipe.isRefreshing = false
            }
        }

        if (savedInstanceState == null) web.loadUrl("$origin$startPath")
        swipe.setOnRefreshListener { web.reload() }
    }

    override fun onDestroyView() {
        try { web.destroy() } catch (_: Throwable) {}
        super.onDestroyView()
    }
}
