package app.netlify.holly2_pro.twa.vault

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONArray
import org.json.JSONObject

class VaultRepository(ctx: Context) {

    private val masterKey = MasterKey.Builder(ctx)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        ctx,
        "holly_vault",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun put(label: String, secret: String) {
        prefs.edit().putString("secret:$label", secret).apply()
        indexAdd(label)
    }

    fun get(label: String): String? =
        prefs.getString("secret:$label", null)

    fun delete(label: String) {
        prefs.edit().remove("secret:$label").apply()
        indexRemove(label)
    }

    fun list(): List<String> {
        val arr = JSONArray(prefs.getString("_index", "[]"))
        return (0 until arr.length()).map { arr.getString(it) }
    }

    private fun indexAdd(label: String) {
        val set = list().toMutableSet()
        set.add(label)
        saveIndex(set)
    }

    private fun indexRemove(label: String) {
        val set = list().toMutableSet()
        set.remove(label)
        saveIndex(set)
    }

    private fun saveIndex(set: Set<String>) {
        val arr = JSONArray()
        set.sorted().forEach { arr.put(it) }
        prefs.edit().putString("_index", arr.toString()).apply()
    }

    fun exportJson(): String {
        val obj = JSONObject()
        val arr = JSONArray()
        list().forEach { label ->
            arr.put(JSONObject().put("label", label).put("secret", get(label)))
        }
        obj.put("items", arr)
        return obj.toString()
    }
}
