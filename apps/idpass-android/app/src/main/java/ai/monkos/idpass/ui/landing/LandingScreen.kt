package ai.monkos.idpass.ui.landing

import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.V1

private data class ServiceCard(
    val purpose: String,
    val koName: String,
    val enName: String,
    val sub: String,
    val assetImage: String,
)

private val cards = listOf(
    ServiceCard("passport", "여권", "Passport", "PASSPORT", "images/card_passport.jpg"),
    ServiceCard("visa", "비자", "Visa", "VISA", "images/card_visa.jpg"),
    ServiceCard("license", "면허증", "License", "LICENSE", "images/card_license.jpg"),
    ServiceCard("custom", "커스텀", "Custom", "CUSTOM SIZE", "images/card_custom.jpg"),
)

@Composable
fun LandingScreen(
    vm: CropFlowViewModel,
    onStart: (purpose: String) -> Unit,
) {
    val lang = vm.flow.lang
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // ── Hero Section ──
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.radialGradient(
                        colors = listOf(V1.accent.copy(alpha = 0.05f), Color.Transparent),
                        radius = 300f,
                    )
                ),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // FREE · NO ADS badge
            Row(
                modifier = Modifier
                    .padding(top = 50.dp)
                    .border(
                        width = 1.dp,
                        color = V1.accent.copy(alpha = 0.25f),
                        shape = RoundedCornerShape(20.dp),
                    )
                    .padding(horizontal = 14.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .background(V1.accent, CircleShape),
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    text = "FREE · NO ADS · NO LOGIN",
                    color = V1.accent,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 2.sp,
                )
            }

            // ID PASS title
            Row(
                modifier = Modifier.padding(top = 12.dp),
            ) {
                Text(
                    text = "ID",
                    color = V1.text,
                    fontSize = 54.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 3.sp,
                )
                Text(
                    text = "PASS",
                    color = V1.accent,
                    fontSize = 54.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 3.sp,
                )
            }

            // Tagline
            Text(
                text = buildAnnotatedString {
                    withStyle(SpanStyle(color = V1.text)) {
                        append(tr("landing_tagline", lang))
                    }
                    withStyle(SpanStyle(color = V1.accent)) {
                        append(tr("landing_tagline_accent", lang))
                    }
                },
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 8.dp),
            )

            // Subtitle
            Text(
                text = tr("landing_sub", lang),
                color = V1.muted,
                fontSize = 11.sp,
                modifier = Modifier.padding(top = 3.dp),
            )

            // Placeholder for PhoneDemoView
            Box(
                modifier = Modifier
                    .padding(top = 20.dp, bottom = 12.dp)
                    .widthIn(max = 260.dp)
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .shadow(
                        elevation = 40.dp,
                        spotColor = V1.accent.copy(alpha = 0.12f),
                        shape = RoundedCornerShape(12.dp),
                    )
                    .border(
                        width = 2.dp,
                        color = V1.accent.copy(alpha = 0.3f),
                        shape = RoundedCornerShape(12.dp),
                    )
                    .clip(RoundedCornerShape(12.dp))
                    .background(V1.card),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "DEMO",
                    color = V1.dim,
                    fontSize = 14.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                )
            }
        }

        // ── Service Cards 2x2 Grid ──
        Column(
            modifier = Modifier
                .padding(horizontal = 20.dp)
                .padding(top = 24.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            // Row 1
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                ServiceCardItem(
                    card = cards[0],
                    lang = lang,
                    onClick = { onStart(cards[0].purpose) },
                    modifier = Modifier.weight(1f),
                )
                ServiceCardItem(
                    card = cards[1],
                    lang = lang,
                    onClick = { onStart(cards[1].purpose) },
                    modifier = Modifier.weight(1f),
                )
            }
            // Row 2
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                ServiceCardItem(
                    card = cards[2],
                    lang = lang,
                    onClick = { onStart(cards[2].purpose) },
                    modifier = Modifier.weight(1f),
                )
                ServiceCardItem(
                    card = cards[3],
                    lang = lang,
                    onClick = { onStart(cards[3].purpose) },
                    modifier = Modifier.weight(1f),
                )
            }
        }

        // ── Spacer ──
        Spacer(Modifier.weight(1f))

        // ── Footer ──
        Column(
            modifier = Modifier
                .padding(top = 16.dp, bottom = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
            ) {
                // monkos icon
                val iconBitmap = remember {
                    try {
                        context.assets.open("images/monkos-icon.png").use {
                            BitmapFactory.decodeStream(it)
                        }
                    } catch (_: Exception) {
                        null
                    }
                }
                iconBitmap?.let { bmp ->
                    Image(
                        bitmap = bmp.asImageBitmap(),
                        contentDescription = "MONKOS",
                        modifier = Modifier
                            .size(20.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        contentScale = ContentScale.Fit,
                    )
                    Spacer(Modifier.width(6.dp))
                }
                Text(
                    text = "powered by",
                    color = V1.dim,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Medium,
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    text = "MONKOS AI",
                    color = V1.purple,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                )
            }
            Spacer(Modifier.height(6.dp))
            Text(
                text = "© 2026 MONK STUDIO · Terms · Privacy",
                color = V1.dim,
                fontSize = 8.sp,
                fontWeight = FontWeight.Medium,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 0.5.sp,
            )
        }
    }
}

@Composable
private fun ServiceCardItem(
    card: ServiceCard,
    lang: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val bitmap = remember(card.assetImage) {
        try {
            context.assets.open(card.assetImage).use { BitmapFactory.decodeStream(it) }
        } catch (_: Exception) {
            null
        }
    }

    Box(
        modifier = modifier
            .height(90.dp)
            .clip(RoundedCornerShape(12.dp))
            .border(1.dp, V1.border, RoundedCornerShape(12.dp))
            .clickable { onClick() },
    ) {
        // Background image
        bitmap?.let { bmp ->
            Image(
                bitmap = bmp.asImageBitmap(),
                contentDescription = card.purpose,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
        }

        // Gradient overlay: bottom (dark) -> top (lighter)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Black.copy(alpha = 0.3f),
                            Color.Black.copy(alpha = 0.6f),
                        ),
                    )
                ),
        )

        // Content — centered
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = if (lang == "en") card.enName else card.koName,
                color = V1.text,
                fontSize = 18.sp,
                fontWeight = FontWeight.Black,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = card.sub,
                color = V1.accent,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.sp,
            )
        }
    }
}
