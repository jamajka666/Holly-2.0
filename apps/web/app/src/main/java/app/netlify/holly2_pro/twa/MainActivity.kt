package app.netlify.holly2_pro.twa

import android.Manifest
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.WindowManager
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.fragment.app.commit
import app.netlify.holly2_pro.twa.ui.UiAssistantFragment
import app.netlify.holly2_pro.twa.vault.ui.VaultFragment
import app.netlify.holly2_pro.twa.voice.VoiceController

class MainActivity : AppCompatActivity() {

    private lateinit var voice: VoiceController

    private val reqAudio = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ){ granted -> if (granted) voice.start() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 🔒 blokuj screenshoty
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )

        setContentView(R.layout.activity_main)

        val toolbar: Toolbar = findViewById(R.id.topAppBar)
        setSupportActionBar(toolbar)
        supportActionBar?.title = "Holly 2.0"

        voice = VoiceController(
            activity = this,
            onWakeAndCommand = ::onVoiceCommand,
            onStateChanged = { },
            onError = { }
        )

        if (savedInstanceState == null) {
            supportFragmentManager.commit { replace(R.id.content, UiAssistantFragment()) }
        }
    }

    private fun onVoiceCommand(cmd: String) {
        val c = cmd.lowercase().trim()
        when {
            c.startsWith("refresh") || c.startsWith("reload") -> recreate()
            c.contains("settings") -> { }
            c.contains("vault") || c.contains("trezor") -> openVault()
            else -> { }
        }
    }

    private fun openVault() {
        supportFragmentManager.commit {
            replace(R.id.content, VaultFragment())
            addToBackStack("vault")
        }
    }

    fun toggleMic(on: Boolean) {
        if (on) {
            if (!voice.hasPermission()) {
                reqAudio.launch(Manifest.permission.RECORD_AUDIO)
            } else voice.start()
        } else voice.stop()
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu); return true
    }
    override fun onOptionsItemSelected(item: MenuItem): Boolean = when (item.itemId) {
        R.id.action_refresh -> { recreate(); true }
        R.id.action_settings -> { true }
        R.id.action_vault -> { openVault(); true }
        else -> super.onOptionsItemSelected(item)
    }
}
