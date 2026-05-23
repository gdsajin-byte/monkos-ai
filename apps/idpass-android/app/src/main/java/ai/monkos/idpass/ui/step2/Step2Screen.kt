package ai.monkos.idpass.ui.step2

import android.graphics.BitmapFactory
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.engine.FaceDetector
import ai.monkos.idpass.engine.ImageUtils
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.AccentButton
import ai.monkos.idpass.ui.theme.SpecBadge
import ai.monkos.idpass.ui.theme.V1
import ai.monkos.idpass.ui.theme.V1TopBar
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg),
    ) {
        V1TopBar(currentStep = 2, onBack = onBack, onHome = onHome)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(16.dp))

            // Spec badge
            if (doc != null && country != null) {
                SpecBadge(
                    flag = country.flag,
                    docName = doc.name(lang),
                    size = doc.size,
                )
                Spacer(Modifier.height(16.dp))
            }

            // Guide image
            if (guideBitmap != null) {
                Image(
                    bitmap = guideBitmap.asImageBitmap(),
                    contentDescription = "Guide",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier
                        .fillMaxWidth(0.7f)
                        .aspectRatio(doc?.aspectRatio ?: 0.78f)
                        .clip(RoundedCornerShape(12.dp)),
                )
                Spacer(Modifier.height(16.dp))
            }

            // Spec details
            if (doc != null) {
                val ps = doc.toPhotoSpec()
                SpecDetailRow(tr("dimensions", lang), doc.size)
                SpecDetailRow(tr("pixels", lang), doc.px)
                SpecDetailRow("DPI", "${ps.dpi.toInt()}")
                SpecDetailRow(tr("standard", lang), doc.standard)
                if (doc.headHeight != "---" && doc.headHeight != "---") {
                    SpecDetailRow(tr("face_note", lang), doc.headHeight)
                }
                Spacer(Modifier.height(16.dp))
            }

            // Warning
            val warningText = doc?.warning?.get(lang) ?: doc?.warning?.get("en")
            if (warningText != null) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    color = V1.orange.copy(alpha = 0.12f),
                ) {
                    Text(
                        text = warningText,
                        color = V1.orange,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp),
                    )
                }
                Spacer(Modifier.height(16.dp))
            }

            // Tips
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = V1.card,
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = tr("photo_tips", lang),
                        color = V1.text,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Spacer(Modifier.height(8.dp))
                    for (i in 1..6) {
                        Row(
                            modifier = Modifier.padding(vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Surface(
                                modifier = Modifier.size(6.dp),
                                shape = RoundedCornerShape(3.dp),
                                color = V1.accent,
                            ) {}
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = tr("tip_$i", lang),
                                color = V1.muted,
                                fontSize = 13.sp,
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // Upload button
            AccentButton(
                text = tr("upload_photo", lang),
                onClick = {
                    photoPicker.launch(PickVisualMediaRequest(PickVisualMedia.ImageOnly))
                },
            )

            Spacer(Modifier.height(32.dp))
        }
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
                CircularProgressIndicator(color = V1.accent)
                Spacer(Modifier.height(16.dp))
                Text(
                    text = tr("processing", lang),
                    color = V1.text,
                    fontSize = 15.sp,
                )
            }
        }
    }

    // No face dialog
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

@Composable
private fun SpecDetailRow(label: String, value: String) {
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
