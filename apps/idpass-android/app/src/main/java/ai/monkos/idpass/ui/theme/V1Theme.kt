package ai.monkos.idpass.ui.theme

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** V1 Dark HUD color palette */
object V1 {
    val bg       = Color(0xFF05080E)
    val card     = Color(0xFF0D1320)
    val border   = Color(0xFF162035)
    val text     = Color(0xFFE8EDF5)
    val muted    = Color(0xFF6B7D9A)
    val dim      = Color(0xFF3A4B65)
    val accent   = Color(0xFF00D4AA)
    val orange   = Color(0xFFFFB020)
    val blue     = Color(0xFF3B82F6)
    val purple   = Color(0xFFA78BFA)
    val red      = Color(0xFFFF4444)
    val white    = Color(0xFFFFFFFF)

    fun parseHexColor(hex: String): Color {
        val cleaned = hex.removePrefix("#").removePrefix("0x").removePrefix("0X")
        return try {
            Color(("FF$cleaned").toLong(16))
        } catch (_: Exception) {
            white
        }
    }
}

private val DarkColors = darkColorScheme(
    primary = V1.accent,
    onPrimary = V1.bg,
    secondary = V1.blue,
    onSecondary = V1.text,
    tertiary = V1.purple,
    background = V1.bg,
    onBackground = V1.text,
    surface = V1.card,
    onSurface = V1.text,
    surfaceVariant = V1.border,
    onSurfaceVariant = V1.muted,
    outline = V1.border,
    error = V1.red,
    onError = V1.white,
)

@Composable
fun IdpassTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColors,
        content = content,
    )
}

// ─── Reusable Components ───

@Composable
fun AccentButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = V1.accent,
            contentColor = V1.bg,
            disabledContainerColor = V1.dim,
            disabledContentColor = V1.muted,
        ),
    ) {
        Text(
            text = text,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
fun BackButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    TextButton(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.textButtonColors(
            contentColor = V1.muted,
        ),
    ) {
        Text(text = text, fontSize = 14.sp)
    }
}

@Composable
fun SpecBadge(
    flag: String,
    docName: String,
    size: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = V1.card,
        border = BorderStroke(1.dp, V1.border),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(text = flag, fontSize = 16.sp)
            Spacer(Modifier.width(6.dp))
            Text(
                text = docName,
                color = V1.text,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = size,
                color = V1.muted,
                fontSize = 12.sp,
            )
        }
    }
}

/** Step labels for V1TopBar */
private val stepLabels = listOf("Country", "Photo", "BG", "Crop", "Done")

@Composable
fun V1TopBar(
    currentStep: Int,
    onBack: () -> Unit,
    onHome: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = V1.bg,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Back arrow
            TextButton(
                onClick = onBack,
                contentPadding = PaddingValues(0.dp),
                colors = ButtonDefaults.textButtonColors(contentColor = V1.muted),
            ) {
                Text("<", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }

            Spacer(Modifier.width(8.dp))

            // Step indicators
            stepLabels.forEachIndexed { index, label ->
                val stepNum = index + 1
                val isActive = stepNum == currentStep
                val isPast = stepNum < currentStep

                val dotColor = when {
                    isActive -> V1.accent
                    isPast -> V1.accent.copy(alpha = 0.4f)
                    else -> V1.dim
                }
                val labelColor = when {
                    isActive -> V1.accent
                    isPast -> V1.muted
                    else -> V1.dim
                }

                if (index > 0) {
                    // Connector line
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .height(2.dp),
                        color = if (isPast || isActive) V1.accent.copy(alpha = 0.3f) else V1.dim.copy(alpha = 0.3f),
                    ) {}
                }

                // Dot + label
                androidx.compose.foundation.layout.Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Surface(
                        modifier = Modifier
                            .size(if (isActive) 10.dp else 8.dp)
                            .clip(CircleShape),
                        color = dotColor,
                    ) {}
                    Text(
                        text = label,
                        color = labelColor,
                        fontSize = 9.sp,
                        fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 2.dp),
                    )
                }
            }

            Spacer(Modifier.width(8.dp))

            // Home button
            TextButton(
                onClick = onHome,
                contentPadding = PaddingValues(0.dp),
                colors = ButtonDefaults.textButtonColors(contentColor = V1.muted),
            ) {
                Text("H", fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
