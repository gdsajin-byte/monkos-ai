package ai.monkos.idpass.ui.landing

import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.V1

private data class ServiceCard(
    val purpose: String,
    val titleKey: String,
    val assetImage: String,
)

private val cards = listOf(
    ServiceCard("passport", "passport", "images/card_passport.jpg"),
    ServiceCard("visa",     "visa",     "images/card_visa.jpg"),
    ServiceCard("license",  "license",  "images/card_license.jpg"),
    ServiceCard("custom",   "custom",   "images/card_custom.jpg"),
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
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(60.dp))

        // Hero title
        Text(
            text = "IDPASS",
            color = V1.accent,
            fontSize = 40.sp,
            fontWeight = FontWeight.ExtraBold,
            letterSpacing = 4.sp,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = tr("hero_sub", lang),
            color = V1.muted,
            fontSize = 14.sp,
        )

        Spacer(Modifier.height(40.dp))

        // 2x2 grid of service cards
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier
                .fillMaxWidth()
                .height(400.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(0.dp),
        ) {
            items(cards) { card ->
                LandingCardItem(
                    card = card,
                    lang = lang,
                    onClick = { onStart(card.purpose) },
                )
            }
        }

        Spacer(Modifier.height(48.dp))

        // Footer
        Text(
            text = "Powered by",
            color = V1.dim,
            fontSize = 11.sp,
        )
        Text(
            text = tr("powered_by", lang),
            color = V1.muted,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp,
        )

        Spacer(Modifier.height(32.dp))
    }
}

@Composable
private fun LandingCardItem(
    card: ServiceCard,
    lang: String,
    onClick: () -> Unit,
) {
    val context = LocalContext.current
    val bitmap = remember(card.assetImage) {
        try {
            context.assets.open(card.assetImage).use { BitmapFactory.decodeStream(it) }
        } catch (_: Exception) {
            null
        }
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(0.85f)
            .clip(RoundedCornerShape(16.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        color = V1.card,
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            // Background image
            bitmap?.let { bmp ->
                Image(
                    bitmap = bmp.asImageBitmap(),
                    contentDescription = card.purpose,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            }

            // Gradient overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                V1.bg.copy(alpha = 0.85f),
                            ),
                            startY = 100f,
                        )
                    )
            )

            // Label at bottom
            Text(
                text = tr(card.titleKey, lang),
                color = V1.text,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 16.dp),
                textAlign = TextAlign.Center,
            )
        }
    }
}
