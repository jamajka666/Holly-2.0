package app.netlify.holly2_pro.twa.ui

import android.app.Activity
import android.content.res.ColorStateList
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.widget.AppCompatCheckBox
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.materialswitch.MaterialSwitch

object AccentApplier {

    fun tintMaterialControlsIn(activity: Activity) {
        val accent = AccentManager.getAccentColor(activity)
        val root = activity.window?.decorView ?: return
        tintRecursively(root, accent)
    }

    private fun tintRecursively(view: View, accent: Int) {
        when (view) {
            is MaterialButton -> tintMaterialButton(view, accent)
            is FloatingActionButton -> tintFab(view, accent)
            is MaterialSwitch -> tintSwitch(view, accent)
            is AppCompatCheckBox -> tintCheckBox(view, accent)
        }
        if (view is ViewGroup) {
            for (i in 0 until view.childCount) {
                tintRecursively(view.getChildAt(i), accent)
            }
        }
    }

    private fun tintMaterialButton(btn: MaterialButton, accent: Int) {
        // Rozlišíme outlined vs contained podle strokeWidth/backgroundTint
        val isOutlined = btn.strokeWidth > 0 || (btn.iconTint != null && btn.strokeColor != null)
        if (isOutlined) {
            btn.strokeColor = ColorStateList.valueOf(accent)
            btn.setTextColor(accent)
            btn.iconTint = ColorStateList.valueOf(accent)
        } else {
            // contained – pozadí do akcentu, text nech světlý (z tématu / holly_text_primary)
            btn.backgroundTintList = ColorStateList.valueOf(accent)
            // icon (pokud je) a text na světlou barvu
            btn.iconTint = ColorStateList.valueOf(0xFFFFFFFF.toInt())
            // text necháme z tématu; kdyby ne, odkomentuj:
            // btn.setTextColor(0xFFFFFFFF.toInt())
        }
    }

    private fun tintFab(fab: FloatingActionButton, accent: Int) {
        fab.backgroundTintList = ColorStateList.valueOf(accent)
        fab.imageTintList = ColorStateList.valueOf(0xFFFFFFFF.toInt())
    }

    private fun tintSwitch(sw: MaterialSwitch, accent: Int) {
        // Stavová barva: checked → accent, jinak jemná bílá s alfou
        val checkedStates = arrayOf(
            intArrayOf(android.R.attr.state_checked),
            intArrayOf(-android.R.attr.state_checked)
        )
        val thumbColors = intArrayOf(
            accent,
            0x66FFFFFF
        )
        val trackColors = intArrayOf(
            (accent and 0x00FFFFFF) or 0x44000000, // poloprůhledná stopa z akcentu
            0x33000000
        )
        sw.thumbTintList = ColorStateList(checkedStates, thumbColors)
        sw.trackTintList = ColorStateList(checkedStates, trackColors)
    }

    private fun tintCheckBox(cb: AppCompatCheckBox, accent: Int) {
        val states = arrayOf(
            intArrayOf(android.R.attr.state_checked),
            intArrayOf(-android.R.attr.state_checked)
        )
        val colors = intArrayOf(
            accent,
            0x66FFFFFF
        )
        cb.buttonTintList = ColorStateList(states, colors)
        // text necháme z tématu
    }
}
