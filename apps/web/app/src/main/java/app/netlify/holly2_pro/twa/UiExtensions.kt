package app.netlify.holly2_pro.twa

import android.app.Activity
import androidx.appcompat.widget.Toolbar
import androidx.fragment.app.Fragment

val Activity.topAppBar: Toolbar
    get() = findViewById(R.id.topAppBar)

val Fragment.topAppBar: Toolbar
    get() = requireActivity().findViewById(R.id.topAppBar)
