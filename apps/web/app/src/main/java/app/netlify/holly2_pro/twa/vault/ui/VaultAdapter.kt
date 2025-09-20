package app.netlify.holly2_pro.twa.vault.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import app.netlify.holly2_pro.twa.R

data class VaultItem(val label: String, val secret: String?)

class VaultAdapter(
    private val ctx: Context,
    private val onDelete: (VaultItem) -> Unit
) : RecyclerView.Adapter<VaultAdapter.VH>() {

    private val data = mutableListOf<VaultItem>()
    private val revealed = mutableSetOf<String>()
    private val handler = Handler(Looper.getMainLooper())
    private val hideRunnables = mutableMapOf<String, Runnable>()

    fun submit(labels: List<String>, resolve: (String)->String?) {
        data.clear()
        data.addAll(labels.map { lbl -> VaultItem(lbl, resolve(lbl)) })
        notifyDataSetChanged()
    }

    fun getAt(pos: Int): VaultItem = data[pos]

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.item_vault, parent, false)
        return VH(v)
    }
    override fun getItemCount(): Int = data.size
    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(data[position])

    inner class VH(itemView: View): RecyclerView.ViewHolder(itemView){
        private val tvLabel: TextView = itemView.findViewById(R.id.tvLabel)
        private val tvSecret: TextView = itemView.findViewById(R.id.tvSecret)
        private val btnToggle: ImageButton = itemView.findViewById(R.id.btnToggle)
        private val btnCopy: ImageButton = itemView.findViewById(R.id.btnCopy)

        fun bind(item: VaultItem){
            tvLabel.text = item.label
            val isShown = revealed.contains(item.label)
            tvSecret.text = if (isShown) (item.secret ?: "—") else "••••••"
            // když je zobrazeno, ukaž „close“; když skryto, ukaž „view“
            btnToggle.setImageResource(
                if (isShown) android.R.drawable.ic_menu_close_clear_cancel
                else android.R.drawable.ic_menu_view
            )

            btnToggle.setOnClickListener { _ ->
                val nowShown = revealed.toggle(item.label)
                tvSecret.text = if (nowShown) (data[bindingAdapterPosition].secret ?: "—") else "••••••"
                btnToggle.setImageResource(
                    if (nowShown) android.R.drawable.ic_menu_close_clear_cancel
                    else android.R.drawable.ic_menu_view
                )

                // Auto-hide po 15 s (reset plánovače pro tuto položku)
                hideRunnables[item.label]?.let { r -> handler.removeCallbacks(r) }
                if (nowShown) {
                    val r = Runnable {
                        revealed.remove(item.label)
                        // bezpečnost: zkontroluj, že je pozice pořád validní
                        val pos = bindingAdapterPosition
                        if (pos != RecyclerView.NO_POSITION) notifyItemChanged(pos)
                    }
                    hideRunnables[item.label] = r
                    handler.postDelayed(r, 15_000)
                }
            }

            btnCopy.setOnClickListener {
                val sec = data[bindingAdapterPosition].secret ?: return@setOnClickListener
                val cm = ctx.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                cm.setPrimaryClip(ClipData.newPlainText("secret", sec))
            }
        }
    }
}

private fun MutableSet<String>.toggle(key: String): Boolean {
    return if (contains(key)) { remove(key); false } else { add(key); true }
}
