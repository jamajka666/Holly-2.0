package app.netlify.holly2_pro.twa.bridge

import android.webkit.JavascriptInterface
import app.netlify.holly2_pro.twa.vault.VaultRepository
import org.json.JSONArray
import org.json.JSONObject

class HollyJsBridge(
    private val vault: VaultRepository,
    private val micSetter: (Boolean) -> Unit
) {
    @JavascriptInterface
    fun setMic(on: Boolean) {
        micSetter(on)
    }

    @JavascriptInterface
    fun vaultPut(label: String, secret: String): String {
        vault.put(label, secret)
        return "{\"ok\":true}"
    }

    @JavascriptInterface
    fun vaultGet(label: String): String {
        val s = vault.get(label)
        return JSONObject().put("label", label).put("secret", s).toString()
    }

    @JavascriptInterface
    fun vaultDelete(label: String): String {
        vault.delete(label)
        return "{\"ok\":true}"
    }

    @JavascriptInterface
    fun vaultList(): String {
        val arr = JSONArray()
        vault.list().forEach { arr.put(it) }
        return JSONObject().put("labels", arr).toString()
    }

    @JavascriptInterface
    fun vaultExport(): String = vault.exportJson()
}
