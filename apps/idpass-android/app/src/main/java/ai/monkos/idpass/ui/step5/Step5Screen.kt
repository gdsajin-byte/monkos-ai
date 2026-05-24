package ai.monkos.idpass.ui.step5

import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Divider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.engine.ImageUtils
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.AccentButton
import ai.monkos.idpass.ui.theme.BackButton
import ai.monkos.idpass.ui.theme.SpecBadge
import ai.monkos.idpass.ui.theme.V1

@Composable
fun Step5Screen(
    vm: CropFlowViewModel,
    onCropAnother: () -> Unit,
    onSaved: () -> Unit,
    onBack: () -> Unit,
    onHome: () -> Unit,
) {
    val context = LocalContext.current
    val lang = vm.flow.lang
    val doc = vm.flow.selectedDoc
    val country = vm.flow.selectedCountry
    val croppedBitmap = vm.flow.croppedBitmap
    val bgColorHex = vm.flow.bgColorHex
    val bgColor = V1.parseHexColor(bgColorHex)
    val ps = doc?.toPhotoSpec()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // TopBar: BackButton + "STEP 5 / 5" + Spacer
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BackButton(text = "‹", onClick = onBack)
            Spacer(Modifier.width(8.dp))
            Text(
                text = "STEP 5 / 5",
                color = V1.muted,
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.sp,
            )
            Spacer(Modifier.weight(1f))
        }

        // Success section (centered)
        Spacer(Modifier.height(10.dp))

        // Check icon: Circle with check mark
        Box(contentAlignment = Alignment.Center) {
            // Filled circle background
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(CircleShape)
                    .background(V1.accent.copy(alpha = 0.13f)),
            )
            // Stroke circle
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .border(2.dp, V1.accent, CircleShape),
            )
            Text(
                text = "✓",
                color = V1.accent,
                fontSize = 26.sp,
            )
        }

        Spacer(Modifier.height(10.dp))

        Text(
            text = tr("done", lang),
            color = V1.text,
            fontSize = 20.sp,
            fontWeight = FontWeight.Black,
        )

        if (country != null && doc != null) {
            Spacer(Modifier.height(6.dp))
            SpecBadge(
                flag = country.flag,
                docName = "${country.name(lang)} · ${doc.name(lang)}",
                size = doc.size.replace(" mm", ""),
            )
        }

        // Result image preview
        if (croppedBitmap != null && doc != null) {
            val aspectRatio = doc.aspectRatio

            Box(
                modifier = Modifier
                    .padding(top = 14.dp)
                    .width(180.dp)
                    .height((180 / aspectRatio).dp)
                    .shadow(
                        elevation = 15.dp,
                        shape = RoundedCornerShape(6.dp),
                        ambientColor = V1.accent.copy(alpha = 0.2f),
                    )
                    .clip(RoundedCornerShape(6.dp))
                    .background(bgColor)
                    .border(2.dp, V1.accent, RoundedCornerShape(6.dp)),
            ) {
                Image(
                    bitmap = croppedBitmap.asImageBitmap(),
                    contentDescription = "Result",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
                // Top-left "IDPASS · VERIFIED" badge
                Box(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(4.dp)
                        .background(V1.accent, RoundedCornerShape(2.dp))
                        .padding(horizontal = 5.dp, vertical = 2.dp),
                ) {
                    Text(
                        text = "IDPASS · VERIFIED",
                        color = Color(0xFF05080E),
                        fontSize = 7.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp,
                    )
                }
            }
        }

        // Spec details table
        if (doc != null && ps != null) {
            val specDetails = listOf(
                tr("dimensions", lang) to doc.size,
                tr("output", lang) to "${ps.pxW.toInt()} × ${ps.pxH.toInt()} px",
                "DPI" to "${ps.dpi.toInt()}",
                tr("standard", lang) to doc.standard,
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .padding(top = 12.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(V1.card)
                    .border(1.dp, V1.border, RoundedCornerShape(10.dp))
                    .padding(12.dp),
            ) {
                specDetails.forEachIndexed { index, (label, value) ->
                    if (index > 0) {
                        Divider(color = V1.border, thickness = 1.dp)
                    }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                    ) {
                        Text(
                            text = label,
                            color = V1.muted,
                            fontSize = 10.sp,
                        )
                        Spacer(Modifier.weight(1f))
                        Text(
                            text = value,
                            color = V1.text,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(24.dp))

        // Download button
        AccentButton(
            text = "↓ ${tr("download", lang)} · ${tr("free", lang)}",
            onClick = {
                val bmp = croppedBitmap ?: return@AccentButton
                val spec = doc?.toPhotoSpec()
                val uri = if (spec != null) ImageUtils.saveToGallery(context, bmp, spec) else null
                val msg = if (uri != null) tr("save_success", lang) else "Save failed"
                Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                onSaved()
            },
            modifier = Modifier.padding(horizontal = 20.dp),
        )

        // Crop another button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(top = 6.dp, bottom = 12.dp)
                .height(44.dp)
                .border(1.dp, V1.border, RoundedCornerShape(12.dp))
                .clip(RoundedCornerShape(12.dp))
                .clickable { onCropAnother() },
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "↻ ${tr("crop_another", lang)}",
                color = V1.muted,
                fontSize = 11.sp,
            )
        }
    }
}
