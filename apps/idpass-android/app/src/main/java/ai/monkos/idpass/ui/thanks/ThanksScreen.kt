package ai.monkos.idpass.ui.thanks

import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.V1
import kotlinx.coroutines.delay
import kotlin.math.sin

@Composable
fun ThanksScreen(
    vm: CropFlowViewModel,
    onCropAnother: () -> Unit,
) {
    val context = LocalContext.current
    val lang = vm.flow.lang
    val doc = vm.flow.selectedDoc
    val country = vm.flow.selectedCountry
    val croppedBitmap = vm.flow.croppedBitmap
    val bgColorHex = vm.flow.bgColorHex
    val bgColor = V1.parseHexColor(bgColorHex)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // TopBar: "ID" + "PASS" + Spacer + "SAVED check" badge
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(top = 8.dp, bottom = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = buildAnnotatedString {
                    withStyle(SpanStyle(color = V1.text)) { append("ID") }
                    withStyle(SpanStyle(color = V1.accent)) { append("PASS") }
                },
                fontSize = 16.sp,
                fontWeight = FontWeight.Black,
            )
            Spacer(Modifier.weight(1f))
            Box(
                modifier = Modifier
                    .background(V1.accent.copy(alpha = 0.12f), RoundedCornerShape(3.dp))
                    .padding(horizontal = 7.dp, vertical = 3.dp),
            ) {
                Text(
                    text = "SAVED ✓",
                    color = V1.accent,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.2.sp,
                )
            }
        }

        // Result display: preview image
        if (croppedBitmap != null && doc != null) {
            val aspectRatio = doc.aspectRatio
            Box(
                modifier = Modifier
                    .width(160.dp)
                    .height((160 / aspectRatio).dp)
                    .shadow(12.dp, RoundedCornerShape(6.dp), ambientColor = V1.accent.copy(alpha = 0.25f))
                    .clip(RoundedCornerShape(6.dp))
                    .background(bgColor)
                    .border(2.dp, V1.accent, RoundedCornerShape(6.dp)),
            ) {
                Image(
                    bitmap = croppedBitmap.asImageBitmap(),
                    contentDescription = "Saved result",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxSize(),
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // "saved" title
        Text(
            text = tr("saved", lang),
            color = V1.text,
            fontSize = 22.sp,
            fontWeight = FontWeight.Black,
        )

        // Spec info
        if (country != null && doc != null) {
            Spacer(Modifier.height(4.dp))
            Text(
                text = "${country.flag} ${doc.size.replace(" mm", "mm")} · ${doc.standard}",
                color = V1.muted,
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 0.3.sp,
            )
        }

        // BeforeAfterSlider
        Spacer(Modifier.height(18.dp))
        BeforeAfterSlider(
            lang = lang,
            modifier = Modifier.padding(horizontal = 20.dp),
        )

        // Contact section
        Spacer(Modifier.height(14.dp))
        ContactRow(
            label = "Telegram",
            value = "@monkos_support_bot",
            onClick = {
                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://t.me/monkos_support_bot")))
            },
            modifier = Modifier.padding(horizontal = 20.dp),
        )
        Spacer(Modifier.height(8.dp))
        ContactRow(
            label = "Email",
            value = "info@monkos.ai",
            onClick = {
                context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:info@monkos.ai")))
            },
            modifier = Modifier.padding(horizontal = 20.dp),
        )

        // Print service (Korean only)
        if (lang == "ko") {
            Spacer(Modifier.height(10.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(V1.card)
                    .border(1.dp, V1.border, RoundedCornerShape(12.dp))
                    .clickable {
                        context.startActivity(
                            Intent(
                                Intent.ACTION_VIEW,
                                Uri.parse("https://smartstore.naver.com/market_kku/products/13535954098"),
                            )
                        )
                    }
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(text = "🖨️", fontSize = 14.sp)
                Spacer(Modifier.width(8.dp))
                Text(
                    text = "증명사진 인화하기",
                    color = V1.text,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.weight(1f))
                Text(
                    text = "→",
                    color = V1.text,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
        }

        // Crop another button
        Spacer(Modifier.height(14.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .height(48.dp)
                .border(1.dp, V1.border, RoundedCornerShape(12.dp))
                .clip(RoundedCornerShape(12.dp))
                .clickable { onCropAnother() },
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "↻ ${tr("crop_another", lang)}",
                color = V1.text,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
            )
        }

        // Footer
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(top = 8.dp, bottom = 14.dp),
        ) {
            Text(
                text = "© 2026 IDPASS",
                color = V1.dim,
                fontSize = 8.sp,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 0.5.sp,
            )
            Spacer(Modifier.weight(1f))
            Text(
                text = "idpass by monkos.ai · TERMS",
                color = V1.dim,
                fontSize = 8.sp,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 0.5.sp,
            )
        }
    }
}

// ─── BeforeAfterSlider ───

@Composable
private fun BeforeAfterSlider(
    lang: String,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val density = LocalDensity.current

    // Load slider images from assets
    val beforeBitmap = remember {
        try {
            context.assets.open("images/slider_before.jpg").use { BitmapFactory.decodeStream(it) }
        } catch (_: Exception) { null }
    }
    val afterBitmap = remember {
        try {
            context.assets.open("images/slider_after.jpg").use { BitmapFactory.decodeStream(it) }
        } catch (_: Exception) { null }
    }

    var sliderPos by remember { mutableFloatStateOf(0.5f) }
    var isDragging by remember { mutableStateOf(false) }
    var containerSize by remember { mutableStateOf(IntSize.Zero) }

    // Auto-sweep animation
    LaunchedEffect(isDragging) {
        if (!isDragging) {
            var t = 0f
            while (true) {
                t += 0.02f
                sliderPos = 0.5f + sin(t) * 0.22f
                delay(30)
            }
        }
    }

    // Grayscale color matrix
    val grayscaleMatrix = remember {
        ColorMatrix().apply {
            setToSaturation(0.15f)
        }
    }

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(V1.card)
            .border(0.5.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(24.dp)),
    ) {
        // Slider image area
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp)
                .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                .onSizeChanged { containerSize = it }
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { isDragging = true },
                        onDrag = { change, _ ->
                            change.consume()
                            val w = containerSize.width.toFloat()
                            if (w > 0) {
                                sliderPos = (change.position.x / w).coerceIn(0.05f, 0.95f)
                            }
                        },
                        onDragEnd = { isDragging = false },
                        onDragCancel = { isDragging = false },
                    )
                },
        ) {
            // Before image (grayscale)
            if (beforeBitmap != null) {
                Image(
                    bitmap = beforeBitmap.asImageBitmap(),
                    contentDescription = "Before",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                    colorFilter = ColorFilter.colorMatrix(grayscaleMatrix),
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF1A1A2A)),
                )
            }

            // After image (clipped by slider position)
            if (afterBitmap != null) {
                Image(
                    bitmap = afterBitmap.asImageBitmap(),
                    contentDescription = "After",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxSize()
                        .drawWithContent {
                            val clipRect = Path().apply {
                                addRect(
                                    Rect(
                                        offset = Offset(size.width * sliderPos, 0f),
                                        size = Size(size.width * (1f - sliderPos), size.height),
                                    )
                                )
                            }
                            clipPath(clipRect) {
                                this@drawWithContent.drawContent()
                            }
                        },
                )
            }

            // Divider line (white, 2dp width)
            Box(
                modifier = Modifier
                    .width(2.dp)
                    .fillMaxSize()
                    .offset(x = with(density) { (containerSize.width * sliderPos).toDp() - 1.dp })
                    .background(Color.White)
                    .shadow(8.dp, ambientColor = Color.White.copy(alpha = 0.55f)),
            )

            // Handle: Circle 36dp
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .align(Alignment.CenterStart)
                    .offset(x = with(density) { (containerSize.width * sliderPos).toDp() - 18.dp })
                    .shadow(8.dp, CircleShape, ambientColor = Color.Black.copy(alpha = 0.4f))
                    .clip(CircleShape)
                    .background(Color.White),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "‹›",
                    color = Color(0xFF1E1B4B),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                )
            }

            // Top badges: BEFORE + AFTER · AI
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
            ) {
                // BEFORE badge
                Text(
                    text = "BEFORE",
                    color = Color.White.copy(alpha = 0.9f),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.5.sp,
                    modifier = Modifier
                        .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(5.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                )
                Spacer(Modifier.weight(1f))
                // AFTER · AI badge
                Text(
                    text = "AFTER · AI",
                    color = Color(0xFF1E1B4B),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.5.sp,
                    modifier = Modifier
                        .shadow(5.dp, RoundedCornerShape(5.dp), ambientColor = V1.purple.copy(alpha = 0.45f))
                        .background(V1.purple, RoundedCornerShape(5.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                )
            }
        }

        // Bottom section
        Column(
            modifier = Modifier.padding(horizontal = 18.dp, vertical = 16.dp),
        ) {
            // "MONKOS · AI STUDIO"
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "MONKOS · AI STUDIO",
                    color = V1.purple,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 2.sp,
                )
                Spacer(Modifier.weight(1f))
                Text(
                    text = tr("slider_compare", lang),
                    color = V1.muted,
                    fontSize = 8.sp,
                    fontFamily = FontFamily.Monospace,
                )
            }

            Spacer(Modifier.height(10.dp))

            // Title: slider_drag + slider_accent (gradient)
            Text(
                text = buildAnnotatedString {
                    withStyle(SpanStyle(color = V1.text)) {
                        append(tr("slider_drag", lang))
                    }
                    withStyle(
                        SpanStyle(
                            brush = Brush.linearGradient(
                                colors = listOf(Color(0xFFC4B5FD), Color(0xFFF472B6)),
                            ),
                        )
                    ) {
                        append(tr("slider_accent", lang))
                    }
                },
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                maxLines = 2,
            )

            Spacer(Modifier.height(8.dp))

            // Subtitle
            Text(
                text = tr("slider_sub", lang),
                color = V1.muted,
                fontSize = 11.5.sp,
            )

            Spacer(Modifier.height(14.dp))

            // CTA button
            Box(
                modifier = Modifier
                    .shadow(12.dp, RoundedCornerShape(50), ambientColor = V1.purple.copy(alpha = 0.35f))
                    .clip(RoundedCornerShape(50))
                    .background(V1.purple)
                    .clickable {
                        context.startActivity(
                            Intent(Intent.ACTION_VIEW, Uri.parse("https://monkos.ai"))
                        )
                    }
                    .padding(horizontal = 18.dp, vertical = 12.dp),
            ) {
                Row {
                    Text(
                        text = tr("slider_cta", lang),
                        color = Color(0xFF1E1B4B),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                    )
                    Spacer(Modifier.width(7.dp))
                    Text(
                        text = "→",
                        color = Color(0xFF1E1B4B),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                    )
                }
            }
        }
    }
}

// ─── ContactRow ───

@Composable
private fun ContactRow(
    label: String,
    value: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(V1.card)
            .border(1.dp, V1.border, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Telegram/email icon placeholder using emoji
        Text(
            text = if (label == "Telegram") "✈" else "✉",
            fontSize = 13.sp,
            color = V1.accent,
        )
        Spacer(Modifier.width(10.dp))
        Text(
            text = label,
            color = V1.muted,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.weight(1f))
        Text(
            text = value,
            color = V1.text,
            fontSize = 11.sp,
            fontFamily = FontFamily.Monospace,
        )
    }
}
