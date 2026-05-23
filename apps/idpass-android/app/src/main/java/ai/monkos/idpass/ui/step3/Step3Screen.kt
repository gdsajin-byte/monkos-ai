package ai.monkos.idpass.ui.step3

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.BgOption
import ai.monkos.idpass.data.bgOptions
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.engine.BackgroundRemover
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.AccentButton
import ai.monkos.idpass.ui.theme.V1
import ai.monkos.idpass.ui.theme.V1TopBar
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
    val context = LocalContext.current
    val lang = vm.flow.lang
    val scope = rememberCoroutineScope()

    var isProcessing by remember { mutableStateOf(false) }
    var selectedBgIdx by remember { mutableStateOf(0) }

    val bgRemover = remember { BackgroundRemover() }

    // Run background removal on entry or when color changes
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

    // Auto-run on first display
    val hasRun = remember { mutableStateOf(false) }
    if (!hasRun.value && vm.flow.bgRemovedBitmap == null) {
        hasRun.value = true
        runBgRemoval(bgOptions[0].hex)
    }

    val displayBitmap = vm.flow.bgRemovedBitmap ?: vm.flow.inputBitmap
    val specAspect = vm.flow.selectedDoc?.aspectRatio ?: 0.78f

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg),
    ) {
        V1TopBar(currentStep = 3, onBack = onBack, onHome = onHome)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(16.dp))

            Text(
                text = tr("select_bg", lang),
                color = V1.text,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
            )

            Spacer(Modifier.height(20.dp))

            // Photo preview
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.65f)
                    .aspectRatio(specAspect)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color.White),
                contentAlignment = Alignment.Center,
            ) {
                if (displayBitmap != null) {
                    Image(
                        bitmap = displayBitmap.asImageBitmap(),
                        contentDescription = "Preview",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
                if (isProcessing) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(V1.bg.copy(alpha = 0.6f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        CircularProgressIndicator(
                            color = V1.accent,
                            modifier = Modifier.size(36.dp),
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // Background color selector
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                bgOptions.forEachIndexed { index, option ->
                    BgColorCircle(
                        option = option,
                        isSelected = index == selectedBgIdx,
                        onClick = {
                            selectedBgIdx = index
                            runBgRemoval(option.hex)
                        },
                    )
                }
            }

            // Color name
            Spacer(Modifier.height(8.dp))
            Text(
                text = bgOptions.getOrNull(selectedBgIdx)?.name(lang) ?: "",
                color = V1.muted,
                fontSize = 12.sp,
            )

            Spacer(Modifier.weight(1f))

            // Next button — proceed with bg-removed or original
            AccentButton(
                text = tr("next", lang),
                onClick = {
                    if (vm.flow.bgRemovedBitmap == null) {
                        vm.flow.bgRemovedBitmap = vm.flow.inputBitmap
                    }
                    onNext()
                },
                enabled = !isProcessing,
            )

            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun BgColorCircle(
    option: BgOption,
    isSelected: Boolean,
    onClick: () -> Unit,
) {
    val color = V1.parseHexColor(option.hex)
    val borderColor = if (isSelected) V1.accent else V1.border

    Box(
        modifier = Modifier
            .size(44.dp)
            .clip(CircleShape)
            .border(width = if (isSelected) 2.5.dp else 1.dp, color = borderColor, shape = CircleShape)
            .clickable { onClick() }
            .padding(3.dp)
            .clip(CircleShape)
            .background(color),
    )
}
