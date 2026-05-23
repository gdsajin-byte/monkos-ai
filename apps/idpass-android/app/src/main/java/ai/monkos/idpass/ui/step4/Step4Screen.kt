package ai.monkos.idpass.ui.step4

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
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
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.graphics.PointF
import ai.monkos.idpass.data.CropMetrics
import ai.monkos.idpass.data.CropState
import ai.monkos.idpass.data.PhotoSpec
import ai.monkos.idpass.data.Signal
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.engine.CropEngine
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.AccentButton
import ai.monkos.idpass.ui.theme.V1
import ai.monkos.idpass.ui.theme.V1TopBar
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
    val face = vm.flow.faceResult ?: return
    val sourceBitmap = vm.flow.bgRemovedBitmap ?: vm.flow.inputBitmap ?: return
    val ps = doc.toPhotoSpec()

    val specAspect = ps.widthMM.toFloat() / ps.heightMM.toFloat()

    // Frame size in screen pixels (set by onSizeChanged)
    var frameW by remember { mutableFloatStateOf(0f) }
    var frameH by remember { mutableFloatStateOf(0f) }

    // neverEqualPolicy forces recomposition on every set — needed because CropState has mutable PointF fields
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg),
    ) {
        V1TopBar(currentStep = 4, onBack = onBack, onHome = onHome)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(8.dp))

            // Ready/Adjust badge
            val isReady = metrics?.isBlocked == false
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = if (isReady) V1.accent.copy(alpha = 0.15f) else V1.orange.copy(alpha = 0.15f),
            ) {
                Text(
                    text = tr(if (isReady) "ready" else "adjust", lang),
                    color = if (isReady) V1.accent else V1.orange,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                )
            }

            Spacer(Modifier.height(8.dp))

            // Crop viewport
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(specAspect)
                    .clipToBounds()
                    .onSizeChanged { size ->
                        frameW = size.width.toFloat()
                        frameH = size.height.toFloat()
                    }
                    .pointerInput(Unit) {
                        detectDragGestures { change, dragAmount ->
                            val old = cropState ?: return@detectDragGestures
                            val pos = change.position
                            // Upper 1/4 of frame → crown drag
                            if (pos.y < size.height / 4f) {
                                val s = old.copy()
                                val newY = (s.crown.y + dragAmount.y).coerceIn(2f, s.chin.y - 20f)
                                s.crown = PointF(s.crown.x, newY)
                                cropState = s
                                updateMetrics(s)
                            } else {
                                // Pan image
                                val s = old.copy()
                                s.moveAll(dragAmount.x, dragAmount.y)
                                s.imgOffsetX += dragAmount.x
                                s.imgOffsetY += dragAmount.y

                                // Snap to center (iOS 880-886)
                                val mm = frameH / ps.heightMM.toFloat()
                                val frameCX = frameW / 2f
                                val offMm = kotlin.math.abs(s.faceCenterX - frameCX) / mm
                                if (offMm < 0.3f) {
                                    val snap = frameCX - s.faceCenterX
                                    s.imgOffsetX += snap
                                    s.moveAll(snap, 0f)
                                }

                                cropState = s
                                updateMetrics(s)
                            }
                        }
                    },
            ) {
                val imageBitmap = remember(sourceBitmap) { sourceBitmap.asImageBitmap() }
                val cs = cropState

                Canvas(modifier = Modifier.fillMaxSize()) {
                    val bgColor = V1.parseHexColor(vm.flow.bgColorHex)
                    drawRect(bgColor)

                    if (cs != null && frameW > 0) {
                        // iOS display pipeline:
                        //   image.frame(width: bw*imgScale, height: bh*imgScale)
                        //   image.position(x: fw/2 + offsetX, y: fh/2 + offsetY)
                        // bw = natW * covS, bh = natH * covS
                        val natW = cs.natW
                        val natH = cs.natH
                        val covS = max(frameW / natW, frameH / natH)
                        val drawW = (natW * covS * cs.imgScale).toInt()
                        val drawH = (natH * covS * cs.imgScale).toInt()

                        // Image center at (fw/2 + offX, fh/2 + offY)
                        // So top-left = center - size/2
                        val imgLeft = frameW / 2f + cs.imgOffsetX - drawW / 2f
                        val imgTop = frameH / 2f + cs.imgOffsetY - drawH / 2f

                        translate(left = imgLeft, top = imgTop) {
                            drawImage(
                                image = imageBitmap,
                                dstSize = androidx.compose.ui.unit.IntSize(drawW, drawH),
                            )
                        }
                    }

                    // Corner brackets
                    val bracketLen = 20f
                    val bracketStroke = Stroke(width = 2f)
                    val bracketColor = V1.accent.copy(alpha = 0.7f)
                    val w = size.width
                    val h = size.height

                    // Top-left
                    drawLine(bracketColor, Offset(0f, 0f), Offset(bracketLen, 0f), strokeWidth = 2f)
                    drawLine(bracketColor, Offset(0f, 0f), Offset(0f, bracketLen), strokeWidth = 2f)
                    // Top-right
                    drawLine(bracketColor, Offset(w, 0f), Offset(w - bracketLen, 0f), strokeWidth = 2f)
                    drawLine(bracketColor, Offset(w, 0f), Offset(w, bracketLen), strokeWidth = 2f)
                    // Bottom-left
                    drawLine(bracketColor, Offset(0f, h), Offset(bracketLen, h), strokeWidth = 2f)
                    drawLine(bracketColor, Offset(0f, h), Offset(0f, h - bracketLen), strokeWidth = 2f)
                    // Bottom-right
                    drawLine(bracketColor, Offset(w, h), Offset(w - bracketLen, h), strokeWidth = 2f)
                    drawLine(bracketColor, Offset(w, h), Offset(w, h - bracketLen), strokeWidth = 2f)

                    // Frame border
                    drawRect(
                        color = V1.border,
                        style = Stroke(width = 1f),
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            // 4 metric boxes
            val m = metrics
            if (m != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    MetricBox(
                        label = tr("eye", lang),
                        value = "%.0f%%".format(m.eyePct),
                        signal = m.eyeSignal,
                    )
                    MetricBox(
                        label = tr("face", lang),
                        value = "%.1f".format(m.faceMm),
                        signal = m.faceSignal,
                    )
                    MetricBox(
                        label = tr("top", lang),
                        value = "%.1f".format(m.topMm),
                        signal = m.topSignal,
                    )
                    MetricBox(
                        label = tr("bottom", lang),
                        value = "%.1f".format(m.bottomMm),
                        signal = m.btmSignal,
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            // Coaching message
            if (coachMsg != null) {
                Text(
                    text = coachMsg ?: "",
                    color = V1.orange,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            } else if (m != null && !m.isBlocked) {
                Text(
                    text = tr("coach_ok", lang),
                    color = V1.accent,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            Spacer(Modifier.height(12.dp))

            // Zoom slider
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(text = "0.3x", color = V1.dim, fontSize = 11.sp)
                Slider(
                    value = zoomSlider,
                    onValueChange = { newVal ->
                        zoomSlider = newVal
                        val old = cropState ?: return@Slider
                        val s = old.copy()
                        s.rescaleAll(newVal, frameW / 2f + s.imgOffsetX, frameH / 2f + s.imgOffsetY)
                        cropState = s
                        updateMetrics(s)
                    },
                    valueRange = 0.3f..4f,
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 8.dp),
                    colors = SliderDefaults.colors(
                        thumbColor = V1.accent,
                        activeTrackColor = V1.accent,
                        inactiveTrackColor = V1.dim,
                    ),
                )
                Text(text = "4.0x", color = V1.dim, fontSize = 11.sp)
            }

            Spacer(Modifier.weight(1f))

            // Download button
            AccentButton(
                text = tr("download", lang),
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
                enabled = m != null && !m.isBlocked,
            )

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun MetricBox(
    label: String,
    value: String,
    signal: Signal,
) {
    val signalColor = Color(signal.color)

    Surface(
        modifier = Modifier.width(72.dp),
        shape = RoundedCornerShape(8.dp),
        color = V1.card,
    ) {
        Column(
            modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = label,
                color = V1.dim,
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = value,
                color = signalColor,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}
