package app.netlify.holly2_pro.twa.vault

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class LockManager(ctx: Context) {
    private val masterKey = MasterKey.Builder(ctx).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
    private val prefs = EncryptedSharedPreferences.create(
        ctx, "holly_lock",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun isPinSet(): Boolean = prefs.contains("pin_hash") && prefs.contains("pin_salt")

    fun setPin(pin: String) {
        val salt = PinCrypto.genSalt()
        val hash = PinCrypto.hashPin(pin, salt)
        prefs.edit().putString("pin_salt", salt).putString("pin_hash", hash).apply()
    }

    fun verifyPin(pin: String): Boolean {
        val salt = prefs.getString("pin_salt", null) ?: return false
        val expected = prefs.getString("pin_hash", null) ?: return false
        val got = PinCrypto.hashPin(pin, salt)
        return got == expected
    }
}
