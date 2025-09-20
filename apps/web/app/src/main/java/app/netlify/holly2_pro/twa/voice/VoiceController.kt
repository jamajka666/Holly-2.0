package app.netlify.holly2_pro.twa.voice

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.content.ContextCompat
import java.util.Locale

class VoiceController(
    private val activity: Activity,
    private val onWakeAndCommand: (String) -> Unit,
    private val onStateChanged: (listening: Boolean) -> Unit,
    private val onError: (String) -> Unit
) : RecognitionListener {

    private var recognizer: SpeechRecognizer? = null
    private var listening = false
    private val wakeWord = "holly"

    fun hasPermission(): Boolean =
        ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    fun start() {
        if (listening) return
        if (!SpeechRecognizer.isRecognitionAvailable(activity)) {
            onError("SpeechRecognizer není dostupný"); return
        }
        if (!hasPermission()) {
            onError("Chybí RECORD_AUDIO permission"); return
        }
        recognizer = SpeechRecognizer.createSpeechRecognizer(activity).also {
            it.setRecognitionListener(this)
        }
        listening = true
        onStateChanged(true)
        restartListening()
    }

    fun stop() {
        listening = false
        recognizer?.stopListening()
        recognizer?.cancel()
        recognizer?.destroy()
        recognizer = null
        onStateChanged(false)
    }

    private fun restartListening() {
        if (!listening) return
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        }
        recognizer?.startListening(intent)
    }

    // RecognitionListener
    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onError(error: Int) {
        if (listening) restartListening()
    }
    override fun onResults(results: Bundle) { process(results) }
    override fun onPartialResults(partialResults: Bundle) { process(partialResults) }
    override fun onEvent(eventType: Int, params: Bundle?) {}

    private fun process(bundle: Bundle) {
        val list = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) ?: return
        val text = list.firstOrNull()?.lowercase(Locale.getDefault()) ?: return
        // Wakeword → příkazy
        if (text.contains(wakeWord)) {
            val command = text
                .replace(wakeWord, "")
                .replace("hey", "")
                .trim()
            if (command.isNotEmpty()) onWakeAndCommand(command) else onWakeAndCommand("wake")
        }
    }
}
