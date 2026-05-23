package ai.monkos.idpass.ui.step5

import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.engine.ImageUtils
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.AccentButton
import ai.monkos.idpass.ui.theme.BackButton
import ai.monkos.idpass.ui.theme.V1
import ai.monkos.idpass.ui.theme.V1TopBar

@Composable
fun Step5Screen(
    vm: CropFlowViewModel,
    onCropAnother: () -> Unit,
    onStartOver: () -> Unit,
    onBack: () -> Unit,
    onHome: () -> Unit,
) {
    val context = LocalContext.current
    val lang = vm.flow.lang
    val doc = vm.flow.selectedDoc
    val croppedBitmap = vm.flow.croppedBitmap
    val specAspect = doc?.aspectRatio ?: 0.78f

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg),
    ) {
        V1TopBar(currentStep = 5, onBack = onBack, onHome = onHome)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(20.dp))

            Text(
                text = tr("result_title", lang),
                color = V1.accent,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
            )

            Spacer(Modifier.height(20.dp))

            // Result image
            if (croppedBitmap != null) {
                Image(
                    bitmap = croppedBitmap.asImageBitmap(),
                    contentDescription = "Result",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier
                        .fillMaxWidth(0.65f)
                        .aspectRatio(specAspect)
                        .clip(RoundedCornerShape(8.dp)),
                )
            }

            Spacer(Modifier.height(20.dp))

            // Spec details card
            if (doc != null) {
                val ps = doc.toPhotoSpec()
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = V1.card,
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        SpecRow(tr("dimensions", lang), doc.size)
                        SpecRow(tr("pixels", lang), doc.px)
                        SpecRow("DPI", "${ps.dpi.toInt()}")
                        SpecRow(tr("standard", lang), doc.standard)
                    }
                }
            }

            Spacer(Modifier.height(28.dp))

            // Save to gallery
            AccentButton(
                text = tr("save_gallery", lang),
                onClick = {
                    val bmp = croppedBitmap ?: return@AccentButton
                    val spec = vm.flow.selectedDoc?.toPhotoSpec()
                    val uri = if (spec != null) ImageUtils.saveToGallery(context, bmp, spec) else null
                    val msg = if (uri != null) tr("save_success", lang) else "Save failed"
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                },
            )

            Spacer(Modifier.height(12.dp))

            // Crop another
            BackButton(
                text = tr("crop_another", lang),
                onClick = onCropAnother,
            )

            Spacer(Modifier.height(4.dp))

            // Start over
            BackButton(
                text = tr("start_over", lang),
                onClick = onStartOver,
            )

            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun SpecRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(text = label, color = V1.muted, fontSize = 13.sp)
        Text(text = value, color = V1.text, fontSize = 13.sp, fontWeight = FontWeight.Medium)
    }
}
