package ai.monkos.idpass.ui.step4

import android.graphics.PointF
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.neverEqualPolicy
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.CropMetrics
import ai.monkos.idpass.data.CropState
import ai.monkos.idpass.data.Signal
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.engine.CropEngine
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.AccentButton
import ai.monkos.idpass.ui.theme.BackButton
import ai.monkos.idpass.ui.theme.MetricBox
import ai.monkos.idpass.ui.theme.SpecBadge
import ai.monkos.idpass.ui.theme.V1
import ai.monkos.idpass.ui.theme.V1TopBar
import ai.monkos.idpass.ui.theme.color
import ai.monkos.idpass.ui.theme.drawCornerBrackets
import kotlin.math.abs
import kotlin.math.max

@Composable
fun Step4Screen(
    vm: CropFlowViewModel,
    onCropDone: () -> Unit,
    onBack: () -> Unit,
    onHome: () -> Unit,
) {
    val lang = vm.flow.lang
    val doc = vm.flow.selectedDoc ?: return
    val country = vm.flow.selectedCountry
    val face = vm.flow.faceResult ?: return
    val sourceBitmap = vm.flow.bgRemovedBitmap ?: vm.flow.inputBitmap ?: return
    val ps = doc.toPhotoSpec()

    val specAspect = ps.widthMM.toFloat() / ps.heightMM.toFloat()

    // Frame size in screen pixels
    var frameW by remember { mutableFloatStateOf(0f) }
    var frameH by remember { mutableFloatStateOf(0f) }

    // neverEqualPolicy forces recomposition on every set -- needed because CropState has mutable PointF fields
    var cropState by remember { mutableStateOf<CropState?>(null, neverEqualPolicy()) }
    var metrics by remember { mutableStateOf<CropMetrics?>(null) }
    var coachMsg by remember { mutableStateOf<String?>(null) }

    // Zoom slider value
    var zoomSlider by remember { mutableFloatStateOf(1f) }

    // Auto-place when frame size is known
    LaunchedEffect(frameW, frameH) {
        if (frameW > 0 && frameH > 0 && cropState == null) {
            val state = CropEngine.autoPlace(face, ps, frameW, frameH)
            cropState = state
            zoomSlider = state.imgScale
            val m = CropEngine.computeMetrics(state, frameH, ps)
            metrics = m
            coachMsg = CropEngine.coachingMessage(m, ps, lang)
        }
    }

    fun updateMetrics(state: CropState) {
        if (frameH > 0) {
            val m = CropEngine.computeMetrics(state, frameH, ps)
            metrics = m
            coachMsg = CropEngine.coachingMessage(m, ps, lang)
        }
    }

    val isCustom = doc.type == "custom"
    val m = metrics
    val cs = cropState

    // ─── Main layout (matches iOS step4 VStack) ───

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg),
    ) {
        V1TopBar(currentStep = 4, onBack = onBack, onHome = onHome)

        // ── TopBar row: BackButton + SpecBadge + Spacer (iOS: padding H14 B4) ──
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp)
                .padding(bottom = 2.dp, top = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            BackButton(onClick = onBack)
            if (country != null) {
                SpecBadge(
                    flag = country.flag,
                    country = country.name(lang),
                    doc = doc.name(lang),
                    size = doc.size,
                )
            }
            Spacer(Modifier.weight(1f))
        }

        // ── Coaching message (iOS: 11sp Medium, orange or accent, padding H20 V6) ──
        if (!isCustom) {
            val msgText = coachMsg ?: tr("coach_ok", lang)
            val msgColor = if (coachMsg != null) Color(0xFFFFB020) else V1.accent
            Text(
                text = msgText,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = msgColor,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
            )
        }

        // ── Crop viewport ZStack ──
        Box(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 14.dp),
            contentAlignment = Alignment.TopCenter,
        ) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .aspectRatio(specAspect)
                .clip(RoundedCornerShape(8.dp))
                .border(1.5.dp, V1.accent, RoundedCornerShape(8.dp))
                .shadow(
                    elevation = 10.dp,
                    shape = RoundedCornerShape(8.dp),
                    ambientColor = V1.accent.copy(alpha = 0.2f),
                    spotColor = V1.accent.copy(alpha = 0.2f),
                )
                .clipToBounds()
                .onSizeChanged { size ->
                    frameW = size.width.toFloat()
                    frameH = size.height.toFloat()
                }
                .pointerInput(Unit) {
                    detectDragGestures { change, dragAmount ->
                        val old = cropState ?: return@detectDragGestures
                        val pos = change.position

                        // Upper 1/4 of frame = crown drag, rest = image pan
                        if (pos.y < size.height / 4f) {
                            // Crown drag
                            val s = old.copy()
                            val newY = (s.crown.y + dragAmount.y).coerceIn(2f, s.chin.y - 20f)
                            s.crown = PointF(s.crown.x, newY)
                            cropState = s
                            updateMetrics(s)
                        } else {
                            // Pan image
                            val s = old.copy()
                            s.imgOffsetX += dragAmount.x
                            s.imgOffsetY += dragAmount.y
                            s.moveAll(dragAmount.x, dragAmount.y)

                            // Snap to center if within 0.3mm
                            if (!isCustom) {
                                val mm = frameH / ps.heightMM.toFloat()
                                val frameCX = frameW / 2f
                                val offMm = abs(s.faceCenterX - frameCX) / mm
                                if (offMm < 0.3f) {
                                    val snap = frameCX - s.faceCenterX
                                    s.imgOffsetX += snap
                                    s.moveAll(snap, 0f)
                                }
                            }

                            cropState = s
                            updateMetrics(s)
                        }
                    }
                },
        ) {
            val imageBitmap = remember(sourceBitmap) { sourceBitmap.asImageBitmap() }

            Canvas(modifier = Modifier.fillMaxSize()) {
                // ── Background color fill ──
                val bgColor = V1.parseHexColor(vm.flow.bgColorHex)
                drawRect(bgColor)

                if (cs != null && frameW > 0) {
                    // ── Image layer (iOS display pipeline) ──
                    val natW = cs.natW
                    val natH = cs.natH
                    val covS = max(frameW / natW, frameH / natH)
                    val drawW = (natW * covS * cs.imgScale).toInt()
                    val drawH = (natH * covS * cs.imgScale).toInt()
                    val imgLeft = frameW / 2f + cs.imgOffsetX - drawW / 2f
                    val imgTop = frameH / 2f + cs.imgOffsetY - drawH / 2f

                    translate(left = imgLeft, top = imgTop) {
                        drawImage(
                            image = imageBitmap,
                            dstSize = androidx.compose.ui.unit.IntSize(drawW, drawH),
                        )
                    }

                    // ── GuideOverlay Canvas (CropView.swift GuideOverlay lines 399-467) ──
                    if (!isCustom) {
                        val w = size.width
                        val h = size.height
                        val eyeY = (cs.leftPupil.y + cs.rightPupil.y) / 2f
                        val faceSignalColor = (m?.faceSignal ?: Signal.NEUTRAL).color()
                        val eyeSignalColor = (m?.eyeSignal ?: Signal.NEUTRAL).color()
                        val centerSignalColor = when (m?.centerSignal) {
                            Signal.PASS -> Color.Green.copy(alpha = 0.4f)
                            Signal.WARN -> Color.Yellow.copy(alpha = 0.6f)
                            Signal.FAIL -> Color.Red.copy(alpha = 0.6f)
                            else -> Color.Green.copy(alpha = 0.4f)
                        }

                        // Black overlay above crown (0.35 alpha)
                        if (cs.crown.y > 0) {
                            drawRect(
                                color = Color.Black.copy(alpha = 0.35f),
                                topLeft = Offset.Zero,
                                size = Size(w, max(0f, cs.crown.y)),
                            )
                        }

                        // Black overlay below chin (0.35 alpha)
                        if (cs.chin.y < h) {
                            drawRect(
                                color = Color.Black.copy(alpha = 0.35f),
                                topLeft = Offset(0f, cs.chin.y),
                                size = Size(w, max(0f, h - cs.chin.y)),
                            )
                        }

                        // Crown line (signal color, 1dp)
                        drawLine(
                            color = faceSignalColor,
                            start = Offset(0f, cs.crown.y),
                            end = Offset(w, cs.crown.y),
                            strokeWidth = 1f,
                        )

                        // Chin line (white.opacity(0.5), 0.8dp)
                        drawLine(
                            color = Color.White.copy(alpha = 0.5f),
                            start = Offset(0f, cs.chin.y),
                            end = Offset(w, cs.chin.y),
                            strokeWidth = 0.8f,
                        )

                        // Eye line (signal color, 0.8dp)
                        drawLine(
                            color = eyeSignalColor,
                            start = Offset(10f, eyeY),
                            end = Offset(w - 10f, eyeY),
                            strokeWidth = 0.8f,
                        )

                        // Center vertical dashed line [4,4]
                        drawLine(
                            color = centerSignalColor,
                            start = Offset(w / 2f, 0f),
                            end = Offset(w / 2f, h),
                            strokeWidth = 1f,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f), 0f),
                        )

                        // Crown drag handle: Circle 18dp, accent fill, chevrons inside
                        val handleRadius = 9f
                        drawCircle(
                            color = faceSignalColor,
                            radius = handleRadius,
                            center = Offset(w - 20f, cs.crown.y),
                        )
                        // Draw chevron arrows inside handle
                        val chevronColor = Color(0xFF05080E)
                        val chevronSize = 3f
                        val cx = w - 20f
                        val cy = cs.crown.y
                        // Up chevron
                        drawLine(chevronColor, Offset(cx - chevronSize, cy - 1f), Offset(cx, cy - 1f - chevronSize), strokeWidth = 1.5f)
                        drawLine(chevronColor, Offset(cx, cy - 1f - chevronSize), Offset(cx + chevronSize, cy - 1f), strokeWidth = 1.5f)
                        // Down chevron
                        drawLine(chevronColor, Offset(cx - chevronSize, cy + 1f), Offset(cx, cy + 1f + chevronSize), strokeWidth = 1.5f)
                        drawLine(chevronColor, Offset(cx, cy + 1f + chevronSize), Offset(cx + chevronSize, cy + 1f), strokeWidth = 1.5f)

                        // Face height label between crown-chin
                        val faceMmText = if (m != null) "%.1fmm".format(m.faceMm) else ""
                        val faceRangeText = if (m != null) "/${ps.faceMin.toInt()}~${ps.faceMax.toInt()}" else ""
                        val midY = (cs.crown.y + cs.chin.y) / 2f

                        // Draw face label using native canvas for text
                        val nativeCanvas = drawContext.canvas.nativeCanvas

                        // Face mm label (monospaced 10sp bold)
                        val facePaint = android.graphics.Paint().apply {
                            color = faceSignalColor.toArgb()
                            textSize = 26f  // ~9sp at typical density
                            typeface = android.graphics.Typeface.MONOSPACE
                            isFakeBoldText = true
                            textAlign = android.graphics.Paint.Align.CENTER
                            isAntiAlias = true
                        }
                        val faceRangePaint = android.graphics.Paint().apply {
                            color = faceSignalColor.copy(alpha = 0.7f).toArgb()
                            textSize = 18f  // ~6sp
                            typeface = android.graphics.Typeface.MONOSPACE
                            textAlign = android.graphics.Paint.Align.CENTER
                            isAntiAlias = true
                        }

                        // Background pill for face label
                        val labelBgPaint = android.graphics.Paint().apply {
                            color = V1.bg.copy(alpha = 0.85f).toArgb()
                            isAntiAlias = true
                        }
                        val labelBorderPaint = android.graphics.Paint().apply {
                            color = faceSignalColor.copy(alpha = 0.5f).toArgb()
                            style = android.graphics.Paint.Style.STROKE
                            strokeWidth = 1f
                            isAntiAlias = true
                        }

                        if (faceMmText.isNotEmpty()) {
                            val textW = facePaint.measureText(faceMmText)
                            val rangeW = faceRangePaint.measureText(faceRangeText)
                            val boxW = max(textW, rangeW) + 16f
                            val boxH = 36f
                            val boxLeft = w / 2f - boxW / 2f
                            val boxTop = midY - boxH / 2f
                            val boxRect = android.graphics.RectF(boxLeft, boxTop, boxLeft + boxW, boxTop + boxH)
                            nativeCanvas.drawRoundRect(boxRect, 8f, 8f, labelBgPaint)
                            nativeCanvas.drawRoundRect(boxRect, 8f, 8f, labelBorderPaint)
                            nativeCanvas.drawText(faceMmText, w / 2f, midY - 2f, facePaint)
                            nativeCanvas.drawText(faceRangeText, w / 2f, midY + 16f, faceRangePaint)
                        }

                        // CROWN label (monospaced 7sp, left side)
                        val crownLabelPaint = android.graphics.Paint().apply {
                            color = faceSignalColor.copy(alpha = 0.8f).toArgb()
                            textSize = 18f  // ~6sp
                            typeface = android.graphics.Typeface.MONOSPACE
                            isFakeBoldText = true
                            isAntiAlias = true
                        }
                        nativeCanvas.drawText("CROWN", 20f, cs.crown.y - 8f, crownLabelPaint)

                        // CHIN label (monospaced 7sp, left side)
                        val chinLabelPaint = android.graphics.Paint().apply {
                            color = Color.White.copy(alpha = 0.5f).toArgb()
                            textSize = 18f
                            typeface = android.graphics.Typeface.MONOSPACE
                            isFakeBoldText = true
                            isAntiAlias = true
                        }
                        nativeCanvas.drawText("CHIN", 16f, cs.chin.y + 20f, chinLabelPaint)

                        // EYE label (monospaced 7sp, right side)
                        val eyePctText = if (m != null) "EYE %.0f%%".format(m.eyePct) else "EYE"
                        val eyeLabelPaint = android.graphics.Paint().apply {
                            color = eyeSignalColor.copy(alpha = 0.8f).toArgb()
                            textSize = 18f
                            typeface = android.graphics.Typeface.MONOSPACE
                            isFakeBoldText = true
                            textAlign = android.graphics.Paint.Align.RIGHT
                            isAntiAlias = true
                        }
                        nativeCanvas.drawText(eyePctText, w - 16f, eyeY - 8f, eyeLabelPaint)
                    }

                    // ── CornerBrackets overlay ──
                    drawCornerBrackets()
                }
            }

            // ── Status badges overlay (top-left READY/ADJUST, top-right size spec) ──
            if (!isCustom && cs != null) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp),
                ) {
                    // READY/ADJUST badge
                    val isBlocked = m?.isBlocked ?: true
                    Text(
                        text = if (isBlocked) "ADJUST" else "READY",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp,
                        color = if (isBlocked) Color(0xFFFFB020) else V1.accent,
                        modifier = Modifier
                            .background(
                                color = Color.Black.copy(alpha = 0.6f),
                                shape = RoundedCornerShape(4.dp),
                            )
                            .padding(horizontal = 7.dp, vertical = 3.dp),
                    )
                    Spacer(Modifier.weight(1f))
                    // Size spec badge
                    Text(
                        text = doc.size.replace(" mm", "mm"),
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace,
                        color = V1.muted,
                        modifier = Modifier
                            .background(
                                color = Color.Black.copy(alpha = 0.6f),
                                shape = RoundedCornerShape(4.dp),
                            )
                            .padding(horizontal = 7.dp, vertical = 3.dp),
                    )
                }
            }
        }
        } // outer center Box

        // ── MetricBox row: EYE FACE TOP BTM (spacing 4dp, padding H14 T8) ──
        if (!isCustom && m != null) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp)
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                MetricBox(
                    label = "EYE",
                    value = "%.1f".format(m.eyePct),
                    unit = "%",
                    active = cs != null,
                    signal = m.eyeSignal,
                    modifier = Modifier.weight(1f),
                )
                MetricBox(
                    label = "FACE",
                    value = "%.1f".format(m.faceMm),
                    unit = "mm",
                    active = cs != null,
                    signal = m.faceSignal,
                    modifier = Modifier.weight(1f),
                )
                MetricBox(
                    label = "TOP",
                    value = "%.1f".format(m.topMm),
                    unit = "mm",
                    active = cs != null,
                    signal = m.topSignal,
                    modifier = Modifier.weight(1f),
                )
                MetricBox(
                    label = "BTM",
                    value = "%.1f".format(m.bottomMm),
                    unit = "mm",
                    active = cs != null,
                    signal = m.btmSignal,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        // ── Zoom slider ──
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp)
                .padding(top = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "−", // minus sign
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = V1.muted,
            )
            Slider(
                value = zoomSlider,
                onValueChange = { newVal ->
                    zoomSlider = newVal
                    val old = cropState ?: return@Slider
                    val s = old.copy()
                    s.rescaleAll(
                        newVal,
                        frameW / 2f + s.imgOffsetX,
                        frameH / 2f + s.imgOffsetY,
                    )
                    cropState = s
                    updateMetrics(s)
                },
                valueRange = 0.3f..4.0f,
                steps = 0,
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 4.dp),
                colors = SliderDefaults.colors(
                    thumbColor = V1.accent,
                    activeTrackColor = V1.accent,
                    inactiveTrackColor = V1.dim,
                ),
            )
            Text(
                text = "+",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = V1.muted,
            )
            Spacer(Modifier.width(4.dp))
            Text(
                text = "×%.2f".format(zoomSlider),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = V1.accent,
                modifier = Modifier.width(44.dp),
            )
        }

        // ── Buttons: Reset + AccentButton "crop_confirm ->" (padding H14 T8 B12) ──
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp)
                .padding(top = 4.dp, bottom = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            // Reset button (accent border, accent.opacity(0.08) bg)
            Box(
                modifier = Modifier
                    .background(
                        color = V1.accent.copy(alpha = 0.08f),
                        shape = RoundedCornerShape(10.dp),
                    )
                    .border(1.5.dp, V1.accent, RoundedCornerShape(10.dp))
                    .clickable {
                        if (frameW > 0 && frameH > 0) {
                            val state = CropEngine.autoPlace(face, ps, frameW, frameH)
                            cropState = state
                            zoomSlider = state.imgScale
                            updateMetrics(state)
                        }
                    }
                    .padding(horizontal = 14.dp, vertical = 11.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = tr("reset_crop", lang),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = V1.accent,
                )
            }

            // AccentButton "crop_confirm ->"
            AccentButton(
                title = "${tr("crop_confirm", lang)} →",
                enabled = isCustom || m?.isBlocked == false,
                onClick = {
                    val state = cropState ?: return@AccentButton
                    val bmp = vm.flow.bgRemovedBitmap ?: vm.flow.inputBitmap ?: return@AccentButton
                    val cropped = CropEngine.performFinalCrop(
                        sourceBitmap = bmp,
                        state = state,
                        spec = ps,
                        frameW = frameW,
                        frameH = frameH,
                    )
                    vm.flow.croppedBitmap = cropped
                    onCropDone()
                },
                modifier = Modifier.weight(1f),
            )
        }
    }
}
