package ai.monkos.idpass

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import ai.monkos.idpass.ui.navigation.AppNavigation
import ai.monkos.idpass.ui.theme.IdpassTheme
import ai.monkos.idpass.ui.theme.V1

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            IdpassTheme {
                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .systemBarsPadding(),
                    color = V1.bg,
                ) {
                    AppNavigation()
                }
            }
        }
    }
}
