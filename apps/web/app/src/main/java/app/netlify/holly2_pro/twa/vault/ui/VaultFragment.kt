package app.netlify.holly2_pro.twa.vault.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import app.netlify.holly2_pro.twa.R
import app.netlify.holly2_pro.twa.vault.LockManager
import app.netlify.holly2_pro.twa.vault.LockState
import app.netlify.holly2_pro.twa.vault.VaultRepository
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.snackbar.Snackbar

class VaultFragment : Fragment() {

    private lateinit var repo: VaultRepository
    private lateinit var lock: LockManager
    private lateinit var list: RecyclerView
    private lateinit var fab: FloatingActionButton
    private lateinit var adapter: VaultAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repo = VaultRepository(requireContext())
        lock = LockManager(requireContext())
        // Při vstupu do fragmentu vyžádej odemknutí
        requireUnlock { LockState.unlockNow() }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_vault, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        list = view.findViewById(R.id.list)
        fab = view.findViewById(R.id.fabAdd)

        adapter = VaultAdapter(requireContext()) { item ->
            repo.delete(item.label)
            Snackbar.make(view, getString(R.string.vault_deleted), Snackbar.LENGTH_SHORT).show()
            refresh()
        }
        list.layoutManager = LinearLayoutManager(requireContext())
        list.adapter = adapter

        // Swipe to delete
        ItemTouchHelper(object : ItemTouchHelper.SimpleCallback(0, ItemTouchHelper.LEFT){
            override fun onMove(rv: RecyclerView, vh: RecyclerView.ViewHolder, tgt: RecyclerView.ViewHolder) = false
            override fun onSwiped(vh: RecyclerView.ViewHolder, dir: Int) {
                val pos = vh.bindingAdapterPosition
                val item = adapter.getAt(pos)
                repo.delete(item.label)
                Snackbar.make(view, getString(R.string.vault_deleted), Snackbar.LENGTH_SHORT).show()
                refresh()
            }
        }).attachToRecyclerView(list)

        fab.setOnClickListener { showAddDialog() }

        refresh()
    }

    override fun onResume() {
        super.onResume()
        // Auto‑lock: po návratu z pozadí znovu odemkni, pokud mezitím vypršel timeout
        if (LockState.isLocked()) {
            requireUnlock { LockState.unlockNow(); refresh() }
        }
    }

    private fun refresh() {
        val labels = repo.list()
        adapter.submit(labels) { repo.get(it) }
        if (labels.isEmpty() && view != null) {
            Snackbar.make(requireView(), getString(R.string.vault_empty), Snackbar.LENGTH_SHORT).show()
        }
    }

    private fun showAddDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_add_secret, null)
        val etLabel = dialogView.findViewById<EditText>(R.id.etLabel)
        val etSecret = dialogView.findViewById<EditText>(R.id.etSecret)
        AlertDialog.Builder(requireContext())
            .setTitle(getString(R.string.vault_add_item))
            .setView(dialogView)
            .setNegativeButton(getString(R.string.vault_cancel), null)
            .setPositiveButton(getString(R.string.vault_save)) { _, _ ->
                val label = etLabel.text.toString().trim()
                val secret = etSecret.text.toString()
                if (label.isNotEmpty()) {
                    repo.put(label, secret)
                    refresh()
                }
            }
            .show()
    }

    /** Odemknutí: biometrie (pokud dostupná) → fallback PIN. Pokud PIN není nastaven, vyžádáme jeho vytvoření. */
    private fun requireUnlock(onUnlocked: ()->Unit) {
        val bm = BiometricManager.from(requireContext())
        val canBio = bm.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS

        if (canBio) {
            val executor = ContextCompat.getMainExecutor(requireContext())
            val prompt = BiometricPrompt(this, executor, object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) { onUnlocked() }
                override fun onAuthenticationError(code: Int, msg: CharSequence) { showPinFlow(onUnlocked) }
                override fun onAuthenticationFailed() { /* necháme prompt běžet */ }
            })
            val info = BiometricPrompt.PromptInfo.Builder()
                .setTitle(getString(R.string.vault_unlock_title))
                .setSubtitle(getString(R.string.vault_use_pin))
                .setNegativeButtonText(getString(R.string.vault_use_pin))
                .build()
            prompt.authenticate(info)
        } else {
            showPinFlow(onUnlocked)
        }
    }

    private fun showPinFlow(onUnlocked: ()->Unit) {
        if (!lock.isPinSet()) {
            // nastavení PIN
            val view = layoutInflater.inflate(R.layout.dialog_set_pin, null)
            val et1 = view.findViewById<EditText>(R.id.etPin1)
            val et2 = view.findViewById<EditText>(R.id.etPin2)
            AlertDialog.Builder(requireContext())
                .setTitle(getString(R.string.vault_set_pin_title))
                .setView(view)
                .setNegativeButton(getString(R.string.vault_cancel), null)
                .setPositiveButton(getString(R.string.vault_save)) { _, _ ->
                    val p1 = et1.text.toString()
                    val p2 = et2.text.toString()
                    if (p1.isNotEmpty() && p1 == p2) {
                        lock.setPin(p1)
                        onUnlocked()
                    } else {
                        if (getView() != null) {
                            Snackbar.make(requireView(), getString(R.string.vault_pin_mismatch), Snackbar.LENGTH_SHORT).show()
                        }
                        showPinFlow(onUnlocked)
                    }
                }
                .show()
        } else {
            // zadání PIN
            val view = layoutInflater.inflate(R.layout.dialog_enter_pin, null)
            val et = view.findViewById<EditText>(R.id.etPin)
            AlertDialog.Builder(requireContext())
                .setTitle(getString(R.string.vault_unlock_title))
                .setView(view)
                .setNegativeButton(getString(R.string.vault_cancel), null)
                .setPositiveButton(getString(R.string.vault_use_pin)) { _, _ ->
                    val ok = lock.verifyPin(et.text.toString())
                    if (ok) onUnlocked()
                    else {
                        if (getView() != null) {
                            Snackbar.make(requireView(), getString(R.string.vault_pin_wrong), Snackbar.LENGTH_SHORT).show()
                        }
                        showPinFlow(onUnlocked)
                    }
                }
                .show()
        }
    }
}
