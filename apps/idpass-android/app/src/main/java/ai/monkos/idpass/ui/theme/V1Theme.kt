package ai.monkos.idpass.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.Signal

// ─── V1 Dark HUD color palette (SpecData.swift lines 93-104) ───

object V1 {
    val bg     = Color(0xFF05080E)
    val card   = Color(0xFF0D1320)
    val border = Color(0xFF162035)
    val text   = Color(0xFFE8EDF5)
    val muted  = Color(0xFF6B7D9A)
    val dim    = Color(0xFF3A4B65)
    val accent = Color(0xFF00D4AA)
    val orange = Color(0xFFFFB020)
    val blue   = Color(0xFF3B82F6)
    val purple = Color(0xFFA78BFA)

    fun parseHexColor(hex: String): Color {
        val cleaned = hex.removePrefix("#").removePrefix("0x").removePrefix("0X")
        return try {
            Color(("FF$cleaned").toLong(16))
        } catch (_: Exception) {
            Color.White
        }
    }
}

// ─── Signal color extension ───

fun Signal.color(): Color = when (this) {
    Signal.NEUTRAL -> V1.accent
    Signal.PASS    -> Color(0xFF00D4AA)
    Signal.WARN    -> Color(0xFFFFB020)
    Signal.FAIL    -> Color(0xFFE74C3C)
}

// ─── MaterialTheme ───

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
    error = Color(0xFFE74C3C),
    onError = Color.White,
)

@Composable
fun IdpassTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColors,
        content = content,
    )
}

// ─── Step labels (iOS SpecData.swift lines 573-578) ───

data class StepLabel(
    val id: Int,
    val names: Map<String, String>,
)

val stepLabels = listOf(
    StepLabel(1, mapOf("ko" to "선택", "en" to "SELECT", "ja" to "選択")),
    StepLabel(2, mapOf("ko" to "업로드", "en" to "UPLOAD", "ja" to "アップ")),
    StepLabel(3, mapOf("ko" to "배경", "en" to "BG", "ja" to "背景")),
    StepLabel(4, mapOf("ko" to "크롭", "en" to "CROP", "ja" to "クロップ")),
    StepLabel(5, mapOf("ko" to "완료", "en" to "DONE", "ja" to "完了")),
)

// ─── V1TopBar (CropView.swift lines 6-57) ───

/** Backward-compatible overload for callers using (currentStep, onBack, onHome). */
@Composable
fun V1TopBar(
    currentStep: Int,
    onBack: () -> Unit,
    onHome: () -> Unit,
    modifier: Modifier = Modifier,
) {
    V1TopBar(lang = "ko", step = currentStep, onStep = {}, onHome = onHome, modifier = modifier)
}

@Composable
fun V1TopBar(
    lang: String = "ko",
    step: Int,
    onStep: (Int) -> Unit = {},
    onHome: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
            .padding(top = 8.dp, bottom = 10.dp),
    ) {
        // Row 1: "ID" + "PASS" + Spacer + "FREE" badge
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(
                modifier = if (onHome != null) Modifier.clickable { onHome() } else Modifier,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "ID",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Default,
                    color = V1.text,
                )
                Text(
                    text = "PASS",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Default,
                    color = V1.accent,
                )
            }
            Spacer(Modifier.weight(1f))
            Text(
                text = "FREE",
                fontSize = 9.sp,
                fontWeight = FontWeight.ExtraBold,
                fontFamily = FontFamily.Monospace,
                color = V1.accent,
                letterSpacing = 1.2.sp,
                modifier = Modifier
                    .background(
                        color = V1.accent.copy(alpha = 0.12f),
                        shape = RoundedCornerShape(3.dp),
                    )
                    .padding(horizontal = 7.dp, vertical = 3.dp),
            )
        }

        Spacer(Modifier.height(12.dp))

        // Row 2: 5 step indicators
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(5.dp),
        ) {
            stepLabels.forEach { s ->
                val active = step >= s.id
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onStep(s.id) },
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    // Progress bar
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(2.dp)
                            .clip(RoundedCornerShape(1.dp))
                            .background(if (active) V1.accent else V1.border),
                    )
                    Spacer(Modifier.height(5.dp))
                    // Label
                    Text(
                        text = s.names[lang] ?: s.names["en"] ?: "",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = if (active) V1.accent else V1.dim,
                        letterSpacing = 1.sp,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }
    }
}

// ─── AccentButton (CropView.swift lines 375-395) ───

/** Backward-compatible overload for callers using (text, onClick, ...). */
@Composable
fun AccentButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    AccentButton(title = text, enabled = enabled, onClick = onClick, modifier = modifier)
}

@Composable
fun AccentButton(
    title: String,
    enabled: Boolean = true,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .fillMaxWidth()
            .height(50.dp)
            .then(
                if (enabled) Modifier.shadow(
                    elevation = 10.dp,
                    shape = RoundedCornerShape(12.dp),
                    ambientColor = V1.accent.copy(alpha = 0.25f),
                    spotColor = V1.accent.copy(alpha = 0.25f),
                ) else Modifier
            ),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (enabled) V1.accent else V1.border,
            contentColor = if (enabled) Color(0xFF05080E) else V1.dim,
            disabledContainerColor = V1.border,
            disabledContentColor = V1.dim,
        ),
    ) {
        Text(
            text = title,
            fontSize = 14.sp,
            fontWeight = FontWeight.ExtraBold,
        )
    }
}

// ─── BackButton (CropView.swift lines 358-371) ───

/** Backward-compatible overload for callers using (text, onClick). */
@Suppress("UNUSED_PARAMETER")
@Composable
fun BackButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    BackButton(onClick = onClick, modifier = modifier)
}

@Composable
fun BackButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .size(28.dp)
            .clip(RoundedCornerShape(7.dp))
            .background(V1.card)
            .border(1.dp, V1.border, RoundedCornerShape(7.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "‹", // ‹
            fontSize = 18.sp,
            fontWeight = FontWeight.Medium,
            color = V1.muted,
        )
    }
}

// ─── SpecBadge (CropView.swift lines 61-81) ───

/** Backward-compatible overload for callers using (flag, docName, size). */
@Composable
fun SpecBadge(
    flag: String,
    docName: String,
    size: String,
    modifier: Modifier = Modifier,
) {
    SpecBadge(flag = flag, country = "", doc = docName, size = size, modifier = modifier)
}

@Composable
fun SpecBadge(
    flag: String,
    country: String,
    doc: String,
    size: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .background(
                color = V1.accent.copy(alpha = 0.08f),
                shape = CircleShape,
            )
            .border(1.dp, V1.accent.copy(alpha = 0.3f), CircleShape)
            .padding(horizontal = 9.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(text = flag, fontSize = 12.sp)
        Text(
            text = if (country.isNotEmpty()) "$country · $doc" else doc,
            fontSize = 10.sp,
            fontFamily = FontFamily.Monospace,
            color = V1.accent,
        )
        Text(
            text = size.replace(" mm", ""),
            fontSize = 9.sp,
            fontFamily = FontFamily.Monospace,
            color = V1.accent.copy(alpha = 0.6f),
        )
    }
}

// ─── MetricBox (CropView.swift lines 96-130) ───

@Composable
fun MetricBox(
    label: String,
    value: String,
    unit: String,
    active: Boolean,
    signal: Signal = Signal.NEUTRAL,
    modifier: Modifier = Modifier,
) {
    val c = if (active) signal.color() else V1.dim
    Column(
        modifier = modifier
            .background(
                color = if (active) V1.card else Color(0xFF0A0F18),
                shape = RoundedCornerShape(8.dp),
            )
            .border(
                width = 1.dp,
                color = if (active) c.copy(alpha = 0.3f) else V1.border,
                shape = RoundedCornerShape(8.dp),
            )
            .padding(vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // Label
        Text(
            text = label.uppercase(),
            fontSize = 8.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            color = V1.muted,
        )
        Spacer(Modifier.height(1.dp))
        // Value + unit
        Row(
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(1.dp),
        ) {
            Text(
                text = if (active) value else "—",
                fontSize = 13.sp,
                fontWeight = FontWeight.ExtraBold,
                fontFamily = FontFamily.Monospace,
                color = c,
            )
            if (active) {
                Text(
                    text = unit,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.Monospace,
                    color = c,
                )
            }
        }
    }
}

// ─── CornerBrackets (CropView.swift lines 134-161) ───

fun DrawScope.drawCornerBrackets(
    color: Color = V1.accent,
    strokeWidth: Float = 2f,
    length: Float = 16f,
    margin: Float = 6f,
) {
    val w = size.width
    val h = size.height
    val m = margin
    val s = length

    // Top-left
    drawLine(color, Offset(m, m + s), Offset(m, m), strokeWidth = strokeWidth)
    drawLine(color, Offset(m, m), Offset(m + s, m), strokeWidth = strokeWidth)

    // Top-right
    drawLine(color, Offset(w - m - s, m), Offset(w - m, m), strokeWidth = strokeWidth)
    drawLine(color, Offset(w - m, m), Offset(w - m, m + s), strokeWidth = strokeWidth)

    // Bottom-left
    drawLine(color, Offset(m, h - m - s), Offset(m, h - m), strokeWidth = strokeWidth)
    drawLine(color, Offset(m, h - m), Offset(m + s, h - m), strokeWidth = strokeWidth)

    // Bottom-right
    drawLine(color, Offset(w - m - s, h - m), Offset(w - m, h - m), strokeWidth = strokeWidth)
    drawLine(color, Offset(w - m, h - m), Offset(w - m, h - m - s), strokeWidth = strokeWidth)
}
