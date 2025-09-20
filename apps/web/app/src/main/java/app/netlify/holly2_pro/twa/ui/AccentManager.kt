package app.netlify.holly2_pro.twa.ui

import android.content.Context
import androidx.annotation.ColorRes
import androidx.core.content.ContextCompat
import app.netlify.holly2_pro.twa.R

object AccentManager {
    private const val PREFS = "holly_prefs"
    private const val KEY = "accent_color"

    @ColorRes
    fun getAccentRes(context: Context): Int {
        val sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        return sp.getInt(KEY, R.color.holly_neon_green)
    }

    fun getAccentColor(context: Context): Int {
        return ContextCompat.getColor(context, getAccentRes(context))
    }

    fun setAccentRes(context: Context, @ColorRes colorRes: Int) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putInt(KEY, colorRes).apply()
    }
}
