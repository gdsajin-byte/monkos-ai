package ai.monkos.idpass.ui.thanks

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.ui.theme.AccentButton
import ai.monkos.idpass.ui.theme.V1

@Composable
fun ThanksScreen(
    onStartOver: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg)
            .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "IDPASS",
            color = V1.accent,
            fontSize = 36.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 3.sp,
        )

        Spacer(Modifier.height(20.dp))

        Text(
            text = "Thank you for using IDPASS",
            color = V1.text,
            fontSize = 18.sp,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(8.dp))

        Text(
            text = "Your ID photo has been saved.",
            color = V1.muted,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(40.dp))

        AccentButton(
            text = "Start Over",
            onClick = onStartOver,
        )

        Spacer(Modifier.height(48.dp))

        Text(
            text = "Powered by MONKOS AI",
            color = V1.dim,
            fontSize = 12.sp,
        )
    }
}
