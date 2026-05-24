package ai.monkos.idpass.ui.step2

import android.graphics.BitmapFactory
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.engine.FaceDetector
import ai.monkos.idpass.engine.ImageUtils
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.AccentButton
import ai.monkos.idpass.ui.theme.BackButton
import ai.monkos.idpass.ui.theme.SpecBadge
import ai.monkos.idpass.ui.theme.V1
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun Step2Screen(
    vm: CropFlowViewModel,
    onPhotoReady: (skipBg: Boolean) -> Unit,
    onBack: () -> Unit,
    onHome: () -> Unit,
) {
    val context = LocalContext.current
    val lang = vm.flow.lang
    val doc = vm.flow.selectedDoc
    val country = vm.flow.selectedCountry
    val scope = rememberCoroutineScope()

    var isProcessing by remember { mutableStateOf(false) }
    var showNoFaceDialog by remember { mutableStateOf(false) }

    val faceDetector = remember { FaceDetector() }

    val photoPicker = rememberLauncherForActivityResult(PickVisualMedia()) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        isProcessing = true
        scope.launch {
            val bitmap = withContext(Dispatchers.IO) {
                try { ImageUtils.normalizeOrientation(context, uri) } catch (_: Exception) { null }
            }
            if (bitmap == null) {
                isProcessing = false
                return@launch
            }
            vm.flow.inputBitmap = bitmap

            val faceResult = withContext(Dispatchers.Default) {
                faceDetector.detect(bitmap)
            }
            isProcessing = false

            if (faceResult == null) {
                showNoFaceDialog = true
            } else {
                vm.flow.faceResult = faceResult
                onPhotoReady(false)
            }
        }
    }

    // Guide image
    val guideKey = doc?.let {
        val ps = it.toPhotoSpec()
        "${ps.widthMM.toInt()}x${ps.heightMM.toInt()}"
    }
    val guideBitmap = remember(guideKey) {
        if (guideKey == null) null
        else try {
            context.assets.open("guides/$guideKey.jpg").use { BitmapFactory.decodeStream(it) }
        } catch (_: Exception) {
            null
        }
    }

    // Spec calculations
    val spec = doc?.toPhotoSpec()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg),
    ) {
        // TopBar row: BackButton + SpecBadge + Spacer
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BackButton(text = "❮", onClick = onBack)
            Spacer(Modifier.width(8.dp))
            if (doc != null && country != null) {
                SpecBadge(
                    flag = country.flag,
                    docName = doc.name(lang),
                    size = doc.size,
                )
            }
            Spacer(Modifier.weight(1f))
        }

        // Title + Description
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 14.dp),
        ) {
            Text(
                text = tr("upload_photo", lang),
                color = V1.text,
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
            )
            Spacer(Modifier.height(3.dp))
            Text(
                text = tr("upload_desc", lang),
                color = V1.muted,
                fontSize = 11.sp,
            )
        }

        // Warning banner
        val warningText = doc?.warning?.get(lang) ?: doc?.warning?.get("en")
        if (warningText != null) {
            Text(
                text = warningText,
                color = V1.orange,
                fontSize = 10.sp,
                modifier = Modifier
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 6.dp)
                    .fillMaxWidth()
                    .background(
                        V1.orange.copy(alpha = 0.08f),
                        RoundedCornerShape(8.dp),
                    )
                    .border(
                        1.dp,
                        V1.orange.copy(alpha = 0.3f),
                        RoundedCornerShape(8.dp),
                    )
                    .padding(10.dp),
            )
        }

        // Scrollable content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f)
                .verticalScroll(rememberScrollState()),
        ) {
            // ── Spec Guide Box ──
            if (doc != null && spec != null) {
                val dashedBorderColor = V1.accent.copy(alpha = 0.2f)

                Column(
                    modifier = Modifier
                        .padding(horizontal = 20.dp)
                        .fillMaxWidth()
                        .background(V1.card, RoundedCornerShape(14.dp))
                        .drawBehind {
                            drawRoundRect(
                                color = dashedBorderColor,
                                style = Stroke(
                                    width = 1.5.dp.toPx(),
                                    pathEffect = PathEffect.dashPathEffect(
                                        floatArrayOf(8.dp.toPx(), 5.dp.toPx()),
                                    ),
                                ),
                                cornerRadius = androidx.compose.ui.geometry.CornerRadius(14.dp.toPx()),
                            )
                        }
                        .padding(vertical = 10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    // Header
                    Row(
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(text = "📐", fontSize = 11.sp)
                        Spacer(Modifier.width(4.dp))
                        Text(
                            text = tr("spec_guide", lang),
                            color = V1.muted,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            fontFamily = FontFamily.Monospace,
                        )
                    }

                    Spacer(Modifier.height(10.dp))

                    // HStack: Left ruler + Center image + Right face bracket
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp)
                            .height(220.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        // Left ruler — height label
                        Column(
                            modifier = Modifier
                                .width(32.dp)
                                .fillMaxSize(),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                        ) {
                            val rulerColor = V1.accent.copy(alpha = 0.4f)
                            Canvas(
                                modifier = Modifier
                                    .width(1.dp)
                                    .weight(1f),
                            ) {
                                drawLine(
                                    color = rulerColor,
                                    start = Offset(size.width / 2, 0f),
                                    end = Offset(size.width / 2, size.height),
                                    strokeWidth = 1.dp.toPx(),
                                )
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = String.format("%.1fcm", spec.heightMM / 10),
                                color = V1.accent,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                            )
                            Spacer(Modifier.height(4.dp))
                            Canvas(
                                modifier = Modifier
                                    .width(1.dp)
                                    .weight(1f),
                            ) {
                                drawLine(
                                    color = rulerColor,
                                    start = Offset(size.width / 2, 0f),
                                    end = Offset(size.width / 2, size.height),
                                    strokeWidth = 1.dp.toPx(),
                                )
                            }
                        }

                        // Center: guide image + bottom badge
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxSize(),
                            contentAlignment = Alignment.Center,
                        ) {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center,
                            ) {
                                if (guideBitmap != null) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .padding(horizontal = 8.dp),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Image(
                                            bitmap = guideBitmap.asImageBitmap(),
                                            contentDescription = "Guide",
                                            contentScale = ContentScale.Fit,
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .clip(RoundedCornerShape(4.dp))
                                                .shadow(10.dp, RoundedCornerShape(4.dp)),
                                        )
                                    }
                                } else {
                                    Text(
                                        text = "👤",
                                        fontSize = 58.sp,
                                        color = V1.accent.copy(alpha = 0.3f),
                                    )
                                }

                                // Bottom capsule badge
                                val specStr = if (doc.standard.isEmpty()) {
                                    "${spec.widthMM.toInt()}×${spec.heightMM.toInt()}mm"
                                } else {
                                    "${spec.widthMM.toInt()}×${spec.heightMM.toInt()}mm · ${doc.standard}"
                                }
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomCenter)
                                        .padding(bottom = 8.dp)
                                        .background(V1.accent, RoundedCornerShape(50))
                                        .padding(horizontal = 10.dp, vertical = 4.dp),
                                ) {
                                    Text(
                                        text = specStr,
                                        color = Color.White,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Black,
                                        fontFamily = FontFamily.Monospace,
                                    )
                                }
                            }
                        }

                        // Right: face range bracket
                        Column(
                            modifier = Modifier
                                .width(36.dp)
                                .fillMaxSize(),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            val faceRatio = spec.faceTarget / spec.heightMM
                            val topPad = 0.05f
                            val bottomPad = 1f - topPad.toFloat() - faceRatio.toFloat()

                            // Top spacer
                            Spacer(Modifier.weight(topPad.coerceAtLeast(0.01f)))

                            // Face range bracket
                            Column(
                                modifier = Modifier.weight(faceRatio.toFloat().coerceAtLeast(0.01f)),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                val bracketColor = V1.accent.copy(alpha = 0.5f)
                                val lineColor = V1.accent.copy(alpha = 0.4f)

                                // Top bracket line
                                Canvas(modifier = Modifier.width(6.dp).height(1.dp)) {
                                    drawLine(
                                        color = bracketColor,
                                        start = Offset(0f, size.height / 2),
                                        end = Offset(size.width, size.height / 2),
                                        strokeWidth = 1.dp.toPx(),
                                    )
                                }

                                // Vertical line
                                Canvas(modifier = Modifier.width(1.dp).weight(1f)) {
                                    drawLine(
                                        color = lineColor,
                                        start = Offset(size.width / 2, 0f),
                                        end = Offset(size.width / 2, size.height),
                                        strokeWidth = 1.dp.toPx(),
                                    )
                                }

                                // Label rotated -90 degrees
                                Text(
                                    text = "${spec.faceMin.toInt()}~${spec.faceMax.toInt()}mm",
                                    color = V1.accent,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    modifier = Modifier.rotate(-90f),
                                    maxLines = 1,
                                )

                                // Vertical line
                                Canvas(modifier = Modifier.width(1.dp).weight(1f)) {
                                    drawLine(
                                        color = lineColor,
                                        start = Offset(size.width / 2, 0f),
                                        end = Offset(size.width / 2, size.height),
                                        strokeWidth = 1.dp.toPx(),
                                    )
                                }

                                // Bottom bracket line
                                Canvas(modifier = Modifier.width(6.dp).height(1.dp)) {
                                    drawLine(
                                        color = bracketColor,
                                        start = Offset(0f, size.height / 2),
                                        end = Offset(size.width, size.height / 2),
                                        strokeWidth = 1.dp.toPx(),
                                    )
                                }
                            }

                            // Bottom spacer
                            Spacer(Modifier.weight(bottomPad.coerceAtLeast(0.01f)))
                        }
                    }

                    Spacer(Modifier.height(10.dp))

                    // Bottom text: spec + standard/ratio + face note
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "${doc.size} · ${tr("face_size", lang)} ${spec.faceMin.toInt()}–${spec.faceMax.toInt()}mm",
                            color = V1.accent,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                        )
                        Spacer(Modifier.height(2.dp))

                        val wMM = spec.widthMM.toInt()
                        val hMM = spec.heightMM.toInt()
                        val g = gcd(wMM, hMM)
                        val ratio = if (wMM == hMM) "1:1" else "${wMM / g}:${hMM / g}"
                        val standardText = if (doc.standard.isEmpty()) {
                            "$ratio ${tr("ratio", lang)}"
                        } else {
                            "${doc.standard} · $ratio ${tr("ratio", lang)}"
                        }
                        Text(
                            text = standardText,
                            color = V1.dim,
                            fontSize = 10.sp,
                        )

                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = tr("face_note", lang),
                            color = V1.orange,
                            fontSize = 9.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 30.dp),
                        )
                    }
                }
            }

            Spacer(Modifier.height(10.dp))

            // ── Tips Section ──
            Column(
                modifier = Modifier
                    .padding(horizontal = 20.dp)
                    .fillMaxWidth()
                    .background(V1.card, RoundedCornerShape(12.dp))
                    .border(1.dp, V1.border, RoundedCornerShape(12.dp))
                    .padding(12.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = "💡", fontSize = 10.sp)
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = tr("photo_tips", lang).uppercase(),
                        color = V1.accent,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 0.5.sp,
                    )
                }
                Spacer(Modifier.height(6.dp))

                val tips = listOf(
                    tr("tip1", lang), tr("tip2", lang), tr("tip3", lang),
                    tr("tip4", lang), tr("tip5", lang), tr("tip6", lang),
                )

                // 2-column grid
                val rows = tips.chunked(2)
                Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    rows.forEach { rowItems ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(3.dp),
                        ) {
                            rowItems.forEach { tip ->
                                Row(
                                    modifier = Modifier.weight(1f),
                                    verticalAlignment = Alignment.Top,
                                ) {
                                    Text(
                                        text = "›",
                                        color = V1.accent,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                    )
                                    Spacer(Modifier.width(4.dp))
                                    Text(
                                        text = tip,
                                        color = V1.muted,
                                        fontSize = 10.sp,
                                    )
                                }
                            }
                            if (rowItems.size == 1) {
                                Spacer(Modifier.weight(1f))
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(10.dp))

            // ── Upload Button ──
            AccentButton(
                text = "🖼 ${tr("choose_gallery", lang)}",
                onClick = {
                    photoPicker.launch(PickVisualMediaRequest(PickVisualMedia.ImageOnly))
                },
                modifier = Modifier
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 12.dp),
            )
        }
    }

    // ── Processing Overlay ──
    if (isProcessing) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(V1.bg.copy(alpha = 0.85f)),
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = V1.accent)
                Spacer(Modifier.height(12.dp))
                Text(
                    text = "MONKOS WORKING",
                    color = V1.accent,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                )
            }
        }
    }

    // ── No Face Dialog ──
    if (showNoFaceDialog) {
        AlertDialog(
            onDismissRequest = { showNoFaceDialog = false },
            confirmButton = {
                TextButton(onClick = { showNoFaceDialog = false }) {
                    Text("OK", color = V1.accent)
                }
            },
            title = {
                Text(tr("no_face", lang), color = V1.text)
            },
            text = {
                Text(
                    "Please try a different photo with a clearly visible face.",
                    color = V1.muted,
                )
            },
            containerColor = V1.card,
            titleContentColor = V1.text,
        )
    }
}

private fun gcd(a: Int, b: Int): Int {
    var x = a; var y = b
    while (y != 0) { val t = y; y = x % y; x = t }
    return if (x == 0) 1 else x
}
