package ai.monkos.idpass.ui.step3

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.bgOptions
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.engine.BackgroundRemover
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.AccentButton
import ai.monkos.idpass.ui.theme.BackButton
import ai.monkos.idpass.ui.theme.SpecBadge
import ai.monkos.idpass.ui.theme.V1
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun Step3Screen(
    vm: CropFlowViewModel,
    onNext: () -> Unit,
    onBack: () -> Unit,
    onHome: () -> Unit,
) {
    val lang = vm.flow.lang
    val scope = rememberCoroutineScope()
    val country = vm.flow.selectedCountry
    val doc = vm.flow.selectedDoc

    var isProcessing by remember { mutableStateOf(false) }
    var selectedBgIdx by remember { mutableIntStateOf(0) }

    val bgRemover = remember { BackgroundRemover() }

    fun runBgRemoval(hexColor: String) {
        val input = vm.flow.inputBitmap ?: return
        isProcessing = true
        scope.launch {
            val result = withContext(Dispatchers.Default) {
                bgRemover.removeBackground(input, hexColor)
            }
            vm.flow.bgRemovedBitmap = result
            vm.flow.bgColorHex = hexColor
            isProcessing = false
        }
    }

    val hasRun = remember { mutableStateOf(false) }
    if (!hasRun.value && vm.flow.bgRemovedBitmap == null) {
        hasRun.value = true
        runBgRemoval(bgOptions[0].hex)
    }

    val displayBitmap = vm.flow.bgRemovedBitmap ?: vm.flow.inputBitmap
    val selectedBgColor = V1.parseHexColor(bgOptions.getOrNull(selectedBgIdx)?.hex ?: "FFFFFF")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg),
    ) {
        // TopBar: BackButton + SpecBadge + Spacer
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BackButton(text = "‹", onClick = onBack)
            if (country != null && doc != null) {
                SpecBadge(
                    flag = country.flag,
                    docName = "${country.name(lang)} · ${doc.name(lang)}",
                    size = doc.size.replace(" mm", ""),
                )
            }
            Spacer(Modifier.weight(1f))
        }

        // Title + Description
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
        ) {
            Text(
                text = tr("bg_remove", lang),
                color = V1.text,
                fontSize = 22.sp,
                fontWeight = FontWeight.Black,
            )
            Text(
                text = tr("bg_desc", lang),
                color = V1.muted,
                fontSize = 12.sp,
            )
        }

        // Image preview with bgColor fill
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(horizontal = 20.dp)
                .padding(top = 14.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(selectedBgColor)
                .border(1.dp, V1.border, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            if (displayBitmap != null) {
                Image(
                    bitmap = displayBitmap.asImageBitmap(),
                    contentDescription = "Preview",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxSize(),
                )
            }
        }

        // Color picker card
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(top = 12.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(V1.card)
                .border(1.dp, V1.border, RoundedCornerShape(12.dp))
                .padding(vertical = 10.dp, horizontal = 8.dp),
        ) {
            bgOptions.forEachIndexed { index, option ->
                val sel = index == selectedBgIdx
                val color = V1.parseHexColor(option.hex)

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable {
                            selectedBgIdx = index
                            runBgRemoval(option.hex)
                        },
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    // Circle swatch
                    val circleModifier = Modifier
                        .size(32.dp)
                        .then(
                            if (sel) {
                                Modifier
                                    .shadow(5.dp, CircleShape, ambientColor = V1.accent.copy(alpha = 0.3f))
                                    .border(2.dp, V1.accent, CircleShape)
                            } else {
                                Modifier.border(2.dp, V1.border, CircleShape)
                            }
                        )
                        .clip(CircleShape)
                        .background(color)

                    Box(modifier = circleModifier)

                    Spacer(Modifier.height(4.dp))

                    // Color name
                    Text(
                        text = option.name(lang),
                        color = if (sel) V1.accent else V1.muted,
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace,
                    )
                }
            }
        }

        // AccentButton: "bg_remove ->"
        AccentButton(
            text = "${tr("bg_remove", lang)} →",
            onClick = {
                if (vm.flow.bgRemovedBitmap == null) {
                    vm.flow.bgRemovedBitmap = vm.flow.inputBitmap
                }
                onNext()
            },
            enabled = !isProcessing,
            modifier = Modifier
                .padding(horizontal = 20.dp)
                .padding(top = 10.dp, bottom = 12.dp),
        )
    }

    // Processing overlay
    if (isProcessing) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(V1.bg.copy(alpha = 0.85f)),
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(
                    color = V1.accent,
                    modifier = Modifier.size(48.dp),
                )
                Spacer(Modifier.height(12.dp))
                Text(
                    text = "MONKOS WORKING",
                    color = V1.accent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp,
                )
            }
        }
    }
}
