package ai.monkos.idpass.ui.landing

import android.graphics.BitmapFactory
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.ui.theme.V1
import kotlinx.coroutines.delay

private enum class DemoPhase {
    READY, SCAN, BG_REMOVE, CROP, INSPECT_EYE, COACH_EYE,
    CHIN_GUIDE, CROWN_GUIDE, HEAD_MEASURE, PASSPORT, STAMP,
    BLUR, END_CARD, FADE_OUT
}

@Composable
fun PhoneDemoView() {
    val context = LocalContext.current

    val beforeBmp = remember {
        try { context.assets.open("images/be_f_1.jpg").use { BitmapFactory.decodeStream(it) } }
        catch (_: Exception) { null }
    }
    val afterBmp = remember {
        try { context.assets.open("images/bg_f_1.jpg").use { BitmapFactory.decodeStream(it) } }
        catch (_: Exception) { null }
    }
    val passportBmp = remember {
        try { context.assets.open("images/PASSPORTUSA.jpg").use { BitmapFactory.decodeStream(it) } }
        catch (_: Exception) { null }
    }

    var phase by remember { mutableStateOf(DemoPhase.READY) }

    val scanY = rememberInfiniteTransition(label = "scan")
    val scanYAnim = scanY.animateFloat(
        initialValue = 0.05f,
        targetValue = 0.90f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "scanY",
    )

    val cropScale by animateFloatAsState(
        targetValue = if (phase >= DemoPhase.CROP) 1.44f else 1f,
        animationSpec = tween(1200, easing = EaseInOut),
        label = "cropScale",
    )
    val cropOffsetY by animateFloatAsState(
        targetValue = if (phase >= DemoPhase.CROP) 0.136f else 0f,
        animationSpec = tween(1200, easing = EaseInOut),
        label = "cropOffsetY",
    )

    val afterAlpha by animateFloatAsState(
        targetValue = if (phase >= DemoPhase.BG_REMOVE) 1f else 0f,
        animationSpec = tween(800, easing = EaseOut),
        label = "afterAlpha",
    )
    val passportAlpha by animateFloatAsState(
        targetValue = if (phase >= DemoPhase.PASSPORT && phase < DemoPhase.FADE_OUT) 1f else 0f,
        animationSpec = tween(700, easing = EaseOut),
        label = "passportAlpha",
    )
    val blurAlpha by animateFloatAsState(
        targetValue = if (phase >= DemoPhase.BLUR) 0.85f else 0f,
        animationSpec = tween(800, easing = EaseOut),
        label = "blurAlpha",
    )
    val endCardAlpha by animateFloatAsState(
        targetValue = if (phase >= DemoPhase.END_CARD) 1f else 0f,
        animationSpec = tween(600, easing = EaseIn),
        label = "endCardAlpha",
    )
    val fadeAlpha by animateFloatAsState(
        targetValue = if (phase >= DemoPhase.FADE_OUT) 1f else 0f,
        animationSpec = tween(800, easing = EaseIn),
        label = "fadeAlpha",
    )

    val stampScale by animateFloatAsState(
        targetValue = if (phase == DemoPhase.STAMP) 1f else 3f,
        animationSpec = spring(dampingRatio = 0.55f, stiffness = 300f),
        label = "stampScale",
    )
    val stampAlpha by animateFloatAsState(
        targetValue = if (phase == DemoPhase.STAMP) 1f else 0f,
        animationSpec = tween(350),
        label = "stampAlpha",
    )

    LaunchedEffect(Unit) {
        while (true) {
            phase = DemoPhase.READY
            delay(500)
            phase = DemoPhase.SCAN
            delay(2000)
            phase = DemoPhase.BG_REMOVE
            delay(1300)
            phase = DemoPhase.CROP
            delay(1400)
            phase = DemoPhase.INSPECT_EYE
            delay(400)
            phase = DemoPhase.COACH_EYE
            delay(600)
            phase = DemoPhase.CHIN_GUIDE
            delay(600)
            phase = DemoPhase.CROWN_GUIDE
            delay(600)
            phase = DemoPhase.HEAD_MEASURE
            delay(1600)
            phase = DemoPhase.PASSPORT
            delay(1200)
            phase = DemoPhase.STAMP
            delay(2300)
            phase = DemoPhase.BLUR
            delay(800)
            phase = DemoPhase.END_CARD
            delay(3200)
            phase = DemoPhase.FADE_OUT
            delay(1800)
        }
    }

    val statusText = when {
        phase >= DemoPhase.STAMP -> "PASS"
        phase >= DemoPhase.INSPECT_EYE -> "INSPECT"
        phase >= DemoPhase.CROP -> "CROP"
        phase >= DemoPhase.BG_REMOVE -> "BG REMOVE"
        phase >= DemoPhase.SCAN -> "SCANNING"
        else -> "READY"
    }
    val statusIsPass = phase >= DemoPhase.STAMP && phase < DemoPhase.BLUR

    Box(
        modifier = Modifier
            .widthIn(max = 260.dp)
            .fillMaxWidth()
            .aspectRatio(1f)
            .shadow(40.dp, RoundedCornerShape(12.dp), spotColor = V1.accent.copy(alpha = 0.12f))
            .border(2.dp, V1.accent.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            .clip(RoundedCornerShape(12.dp))
            .background(Color.Black),
    ) {
        // Before image
        beforeBmp?.let { bmp ->
            Image(
                bitmap = bmp.asImageBitmap(),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer { alpha = 1f - afterAlpha },
            )
        }

        // After image (bg removed) with crop zoom
        afterBmp?.let { bmp ->
            Image(
                bitmap = bmp.asImageBitmap(),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        alpha = afterAlpha
                        scaleX = cropScale
                        scaleY = cropScale
                        translationY = size.height * cropOffsetY
                    },
            )
        }

        // BG flash
        if (phase == DemoPhase.BG_REMOVE) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.White.copy(alpha = 0.7f)),
            )
        }

        // Scan line
        if (phase == DemoPhase.SCAN) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val y = size.height * scanYAnim.value
                drawLine(
                    color = V1.accent,
                    start = Offset(0f, y),
                    end = Offset(size.width, y),
                    strokeWidth = 2.dp.toPx(),
                )
            }
        }

        // Brackets
        if (phase >= DemoPhase.SCAN && phase < DemoPhase.PASSPORT) {
            DemoBrackets()
        }

        // Eye dots
        if (phase >= DemoPhase.INSPECT_EYE && phase < DemoPhase.PASSPORT) {
            DemoEyeDots()
        }

        // Guide lines
        if (phase >= DemoPhase.INSPECT_EYE && phase < DemoPhase.PASSPORT) {
            DemoGuideLines(
                showEye = true,
                showChin = phase >= DemoPhase.CHIN_GUIDE,
                showCrown = phase >= DemoPhase.CROWN_GUIDE,
            )
        }

        // Coach labels
        if (phase >= DemoPhase.COACH_EYE && phase < DemoPhase.PASSPORT) {
            DemoCoachLabels(
                showEye = true,
                showChin = phase >= DemoPhase.CHIN_GUIDE,
                showCrown = phase >= DemoPhase.CROWN_GUIDE,
                showHead = phase >= DemoPhase.HEAD_MEASURE,
            )
        }

        // Status badge
        if (phase >= DemoPhase.SCAN && phase < DemoPhase.BLUR) {
            Box(modifier = Modifier.padding(8.dp)) {
                Text(
                    text = statusText,
                    color = if (statusIsPass) Color(0xFF05080E) else V1.accent,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.ExtraBold,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.5.sp,
                    modifier = Modifier
                        .background(
                            if (statusIsPass) V1.accent else Color.Black.copy(alpha = 0.7f),
                            RoundedCornerShape(4.dp),
                        )
                        .padding(horizontal = 8.dp, vertical = 3.dp),
                )
            }
        }

        // Passport image
        if (passportAlpha > 0f) {
            passportBmp?.let { bmp ->
                Image(
                    bitmap = bmp.asImageBitmap(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxSize()
                        .graphicsLayer { alpha = passportAlpha },
                )
            }
        }

        // PASS stamp
        if (stampAlpha > 0f) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.BottomEnd,
            ) {
                DemoPassStamp(
                    modifier = Modifier
                        .padding(12.dp)
                        .graphicsLayer {
                            alpha = stampAlpha
                            scaleX = stampScale
                            scaleY = stampScale
                            rotationZ = -18f
                        },
                )
            }
        }

        // Blur overlay
        if (blurAlpha > 0f) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(V1.bg.copy(alpha = blurAlpha * 0.85f))
                    .then(if (blurAlpha > 0.5f) Modifier.blur(8.dp) else Modifier),
            )
        }

        // End card
        if (endCardAlpha > 0f) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer { alpha = endCardAlpha },
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Row {
                        Text("ID", color = V1.text, fontSize = 38.sp, fontWeight = FontWeight.Black)
                        Text("PASS", color = V1.accent, fontSize = 38.sp, fontWeight = FontWeight.Black)
                    }
                    Text(
                        text = "powered by MONKOS AI",
                        color = V1.text.copy(alpha = 0.5f),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp,
                    )
                }
            }
        }

        // Fade to black
        if (fadeAlpha > 0f) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(V1.bg.copy(alpha = fadeAlpha)),
            )
        }
    }
}

@Composable
private fun DemoBrackets() {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val inset = 12.dp.toPx()
        val len = 22.dp.toPx()
        val stroke = 2.dp.toPx()
        val w = size.width
        val h = size.height

        for (i in 0 until 4) {
            val isRight = i % 2 == 1
            val isBottom = i >= 2
            val x = if (isRight) w - inset else inset
            val y = if (isBottom) h - inset else inset
            val dx = if (isRight) -len else len
            val dy = if (isBottom) -len else len

            drawLine(V1.accent, Offset(x, y + dy), Offset(x, y), strokeWidth = stroke)
            drawLine(V1.accent, Offset(x, y), Offset(x + dx, y), strokeWidth = stroke)
        }
    }
}

@Composable
private fun DemoEyeDots() {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val r = 3.5.dp.toPx()
        val leftEye = Offset(size.width * 0.44f, size.height * 0.43f)
        val rightEye = Offset(size.width * 0.57f, size.height * 0.43f)
        drawCircle(V1.accent, r, leftEye)
        drawCircle(V1.accent, r, rightEye)
    }
}

@Composable
private fun DemoGuideLines(showEye: Boolean, showChin: Boolean, showCrown: Boolean) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val dash = PathEffect.dashPathEffect(floatArrayOf(5.dp.toPx(), 5.dp.toPx()))
        if (showEye) {
            val y = size.height * 0.43f
            drawLine(V1.accent.copy(alpha = 0.6f), Offset(0f, y), Offset(size.width, y), 1.dp.toPx(), pathEffect = dash)
        }
        if (showChin) {
            val y = size.height * 0.78f
            drawLine(V1.accent.copy(alpha = 0.6f), Offset(0f, y), Offset(size.width, y), 1.dp.toPx(), pathEffect = dash)
        }
        if (showCrown) {
            val y = size.height * 0.08f
            val gold = Color(0xFFFFD700)
            drawLine(gold.copy(alpha = 0.5f), Offset(0f, y), Offset(size.width, y), 1.dp.toPx(), pathEffect = dash)
        }
    }
}

@Composable
private fun DemoCoachLabels(showEye: Boolean, showChin: Boolean, showCrown: Boolean, showHead: Boolean) {
    Box(modifier = Modifier.fillMaxSize()) {
        if (showEye) {
            CoachLabel("EYE 43% ✓", V1.accent, Modifier.align(Alignment.TopEnd).padding(top = 92.dp, end = 8.dp))
        }
        if (showChin) {
            CoachLabel("CHIN 78% ✓", V1.accent, Modifier.align(Alignment.TopEnd).padding(top = 192.dp, end = 8.dp))
        }
        if (showCrown) {
            CoachLabel("CROWN ✓", Color(0xFFFFD700), Modifier.align(Alignment.TopEnd).padding(top = 12.dp, end = 8.dp))
        }
        if (showHead) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val x = size.width * 0.15f
                val crownY = size.height * 0.08f
                val chinY = size.height * 0.78f
                drawLine(V1.accent, Offset(x, crownY), Offset(x, chinY), 1.5.dp.toPx())
                val arr = 5.dp.toPx()
                drawLine(V1.accent, Offset(x - arr, crownY + arr), Offset(x, crownY), 1.5.dp.toPx())
                drawLine(V1.accent, Offset(x + arr, crownY + arr), Offset(x, crownY), 1.5.dp.toPx())
                drawLine(V1.accent, Offset(x - arr, chinY - arr), Offset(x, chinY), 1.5.dp.toPx())
                drawLine(V1.accent, Offset(x + arr, chinY - arr), Offset(x, chinY), 1.5.dp.toPx())
            }
            CoachLabel("HEAD 34mm ✓", V1.accent, Modifier.align(Alignment.CenterStart).padding(start = 4.dp, bottom = 30.dp))
        }
    }
}

@Composable
private fun CoachLabel(text: String, color: Color, modifier: Modifier = Modifier) {
    Text(
        text = text,
        color = color,
        fontSize = 8.sp,
        fontWeight = FontWeight.Bold,
        fontFamily = FontFamily.Monospace,
        modifier = modifier
            .background(Color.Black.copy(alpha = 0.75f), RoundedCornerShape(3.dp))
            .padding(horizontal = 7.dp, vertical = 3.dp),
    )
}

@Composable
private fun DemoPassStamp(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.size(95.dp),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                color = V1.accent.copy(alpha = 0.9f),
                style = Stroke(width = 3.5.dp.toPx()),
            )
            drawCircle(
                color = V1.accent.copy(alpha = 0.7f),
                radius = size.minDimension / 2 - 6.dp.toPx(),
                style = Stroke(width = 1.5.dp.toPx()),
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("IDPASS", color = V1.accent.copy(alpha = 0.9f), fontSize = 7.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, letterSpacing = 2.5.sp)
            Text("PASS", color = V1.accent.copy(alpha = 0.9f), fontSize = 26.sp, fontWeight = FontWeight.Black)
            Text("VERIFIED", color = V1.accent.copy(alpha = 0.9f), fontSize = 7.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, letterSpacing = 2.5.sp)
        }
    }
}
