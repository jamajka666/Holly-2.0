package app.netlify.holly2_pro.twa

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

/**
 * LauncherActivity – čistý přesměrovač na MainActivity.
 * Manifest může dál odkazovat na LauncherActivity jako LAUNCHER.
 */
class LauncherActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
