package app.netlify.holly2_pro.twa.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.*
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import app.netlify.holly2_pro.twa.R
import com.google.android.material.button.MaterialButton

class VoiceControlFragment : Fragment() {

    private lateinit var status: TextView
    private lateinit var holdBtn: MaterialButton

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        return inflater.inflate(R.layout.fragment_voice_control, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        status = view.findViewById(R.id.txtStatus)
        holdBtn = view.findViewById(R.id.btnHoldToTalk)

        ensureMicPermission()

        // „Drž a mluv“ – zatím jen změna stavu (hook pro budoucí audio engine)
        holdBtn.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    if (hasMicPermission()) {
                        startListening()
                    } else {
                        ensureMicPermission()
                    }
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    stopListening()
                    true
                }
                else -> false
            }
        }
    }

    private fun hasMicPermission(): Boolean {
        return ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.RECORD_AUDIO) ==
                PackageManager.PERMISSION_GRANTED
    }

    private fun ensureMicPermission() {
        if (!hasMicPermission()) {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), 2001)
        } else {
            status.text = "Mikrofon povolen. Podrž tlačítko a mluv."
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 2001) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                status.text = "Mikrofon povolen. Podrž tlačítko a mluv."
                Toast.makeText(requireContext(), "Povolení mikrofonu uděleno", Toast.LENGTH_SHORT).show()
            } else {
                status.text = "Mikrofon zamítnut. Povolit v Nastavení."
                Toast.makeText(requireContext(), "Bez mikrofonu nebude hlas fungovat", Toast.LENGTH_LONG).show()
            }
        }
    }

    // TODO: tady později připojíme skutečný ASR engine (SpeechRecognizer/Vosk/WakeWord apod.)
    private fun startListening() {
        status.text = "🎙️ Poslouchám…"
        holdBtn.isPressed = true
    }

    private fun stopListening() {
        status.text = "Zastaveno. Podrž tlačítko a mluv."
        holdBtn.isPressed = false
    }
}
