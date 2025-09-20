package app.netlify.holly2_pro.twa;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;

public class MainActivity extends Activity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    TextView tv = new TextView(this);
    tv.setText("Holly 2.0 — Hello!");
    tv.setTextSize(24f);
    setContentView(tv);
  }
}
