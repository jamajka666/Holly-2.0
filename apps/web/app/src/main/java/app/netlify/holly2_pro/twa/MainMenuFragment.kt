package app.netlify.holly2_pro.twa

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import com.google.android.material.snackbar.Snackbar

class MainMenuFragment : Fragment(R.layout.fragment_main_menu) {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        view.post {
            Snackbar.make(view, "MainMenuFragment ready", Snackbar.LENGTH_SHORT).show()
        }
    }
}
