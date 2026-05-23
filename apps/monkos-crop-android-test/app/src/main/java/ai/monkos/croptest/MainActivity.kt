package ai.monkos.croptest

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val autoRun = intent.getBooleanExtra("auto_run", false)
        setContent {
            MaterialTheme {
                MainScreen(autoRun = autoRun)
            }
        }
    }
}

@Composable
fun MainScreen(autoRun: Boolean = false) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var results by remember { mutableStateOf<List<TestResult>>(emptyList()) }
    var isRunning by remember { mutableStateOf(false) }
    var statusText by remember { mutableStateOf("Ready") }
    var faceResults by remember { mutableStateOf<List<FaceTestResult>>(emptyList()) }

    val sampleFiles = listOf(
        "samples/ID_Photosample.jpg",
        "samples/pass_f_1.jpg",
        "samples/edge_backlight.jpg",
        "samples/edge_curly.jpg",
        "samples/edge_complex_bg.jpg"
    )

    LaunchedEffect(autoRun) {
        if (autoRun && !isRunning) {
            isRunning = true
            statusText = "Auto-run: BG removal tests..."
            val segTester = SegmentationTester(context)
            results = segTester.runAllTests(sampleFiles) { statusText = it }

            statusText = "Auto-run: Face detection tests..."
            val faceTester = FaceDetectionTester(context)
            faceResults = faceTester.runAllTests(sampleFiles) { statusText = it }

            // Save results to file
            val report = buildReportJson(results, faceResults)
            val file = java.io.File(context.getExternalFilesDir(null), "test_results.json")
            file.writeText(report)
            statusText = "Done! Results saved to ${file.absolutePath}"
            isRunning = false

            android.util.Log.i("MONKOS_TEST", "=== RESULTS SAVED ===")
            android.util.Log.i("MONKOS_TEST", report)
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                "MONKOS Crop — BG Removal Test",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(statusText, color = Color.Gray)
            Spacer(modifier = Modifier.height(8.dp))
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = {
                        scope.launch {
                            isRunning = true
                            results = emptyList()
                            statusText = "Running ML Kit + ISNet tests..."
                            val tester = SegmentationTester(context)
                            results = tester.runAllTests(sampleFiles) { status ->
                                statusText = status
                            }
                            statusText = "BG removal tests complete (${results.size} results)"
                            isRunning = false
                        }
                    },
                    enabled = !isRunning
                ) {
                    Text("Run BG Removal")
                }

                Button(
                    onClick = {
                        scope.launch {
                            isRunning = true
                            faceResults = emptyList()
                            statusText = "Running Face Detection contour test..."
                            val tester = FaceDetectionTester(context)
                            faceResults = tester.runAllTests(sampleFiles) { status ->
                                statusText = status
                            }
                            statusText = "Face detection tests complete (${faceResults.size} results)"
                            isRunning = false
                        }
                    },
                    enabled = !isRunning
                ) {
                    Text("Run Face Detection")
                }
            }
        }

        if (isRunning) {
            item {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
        }

        // BG Removal Results
        if (results.isNotEmpty()) {
            item {
                Text("Background Removal Results", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
            items(results) { result ->
                ResultCard(result)
            }
        }

        // Face Detection Results
        if (faceResults.isNotEmpty()) {
            item {
                Text("Face Detection Results", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
            items(faceResults) { result ->
                FaceResultCard(result)
            }
        }
    }
}

@Composable
fun ResultCard(result: TestResult) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(result.sampleName, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                // Original
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Original", fontSize = 12.sp)
                    result.originalBitmap?.let {
                        Image(
                            bitmap = it.asImageBitmap(),
                            contentDescription = "Original",
                            modifier = Modifier.size(100.dp)
                        )
                    }
                }

                // ML Kit result
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("ML Kit", fontSize = 12.sp)
                    if (result.mlKitBitmap != null) {
                        Image(
                            bitmap = result.mlKitBitmap.asImageBitmap(),
                            contentDescription = "ML Kit",
                            modifier = Modifier
                                .size(100.dp)
                                .background(Color.White)
                        )
                    } else {
                        Text(result.mlKitError ?: "N/A", fontSize = 10.sp, color = Color.Red)
                    }
                    Text("${result.mlKitTimeMs}ms", fontSize = 10.sp, color = Color.Gray)
                }

                // ISNet result
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("ISNet", fontSize = 12.sp)
                    if (result.isnetBitmap != null) {
                        Image(
                            bitmap = result.isnetBitmap.asImageBitmap(),
                            contentDescription = "ISNet",
                            modifier = Modifier
                                .size(100.dp)
                                .background(Color.White)
                        )
                    } else {
                        Text(result.isnetError ?: "N/A", fontSize = 10.sp, color = Color.Red)
                    }
                    Text("${result.isnetTimeMs}ms", fontSize = 10.sp, color = Color.Gray)
                }
            }
        }
    }
}

@Composable
fun FaceResultCard(result: FaceTestResult) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(result.sampleName, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Text("Faces detected: ${result.faceCount}", fontSize = 14.sp)
            Text("Contour points: ${result.contourPointCount}", fontSize = 14.sp)
            Text("Landmarks: ${result.landmarkCount}", fontSize = 14.sp)
            Text("Processing time: ${result.timeMs}ms", fontSize = 14.sp)

            if (result.eyeLeft != null) {
                Text("Left eye: (${result.eyeLeft.x.toInt()}, ${result.eyeLeft.y.toInt()})", fontSize = 12.sp, color = Color.Gray)
            }
            if (result.eyeRight != null) {
                Text("Right eye: (${result.eyeRight.x.toInt()}, ${result.eyeRight.y.toInt()})", fontSize = 12.sp, color = Color.Gray)
            }
            if (result.noseBase != null) {
                Text("Nose base: (${result.noseBase.x.toInt()}, ${result.noseBase.y.toInt()})", fontSize = 12.sp, color = Color.Gray)
            }
            if (result.chinBottom != null) {
                Text("Chin bottom: (${result.chinBottom.x.toInt()}, ${result.chinBottom.y.toInt()})", fontSize = 12.sp, color = Color.Gray)
            }

            result.contourDump?.let {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Contour dump:", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text(it, fontSize = 9.sp, color = Color.DarkGray, maxLines = 10)
            }

            result.error?.let {
                Text("Error: $it", fontSize = 12.sp, color = Color.Red)
            }
        }
    }
}

fun buildReportJson(bgResults: List<TestResult>, faceResults: List<FaceTestResult>): String {
    val root = JSONObject()

    val bgArray = JSONArray()
    for (r in bgResults) {
        bgArray.put(JSONObject().apply {
            put("sample", r.sampleName)
            put("mlkit_time_ms", r.mlKitTimeMs)
            put("mlkit_success", r.mlKitBitmap != null)
            put("mlkit_error", r.mlKitError ?: "")
            put("isnet_time_ms", r.isnetTimeMs)
            put("isnet_success", r.isnetBitmap != null)
            put("isnet_error", r.isnetError ?: "")
        })
    }
    root.put("bg_removal", bgArray)

    val faceArray = JSONArray()
    for (r in faceResults) {
        faceArray.put(JSONObject().apply {
            put("sample", r.sampleName)
            put("face_count", r.faceCount)
            put("contour_points", r.contourPointCount)
            put("landmark_count", r.landmarkCount)
            put("time_ms", r.timeMs)
            put("eye_left", r.eyeLeft?.let { "(${it.x.toInt()},${it.y.toInt()})" } ?: "")
            put("eye_right", r.eyeRight?.let { "(${it.x.toInt()},${it.y.toInt()})" } ?: "")
            put("nose_base", r.noseBase?.let { "(${it.x.toInt()},${it.y.toInt()})" } ?: "")
            put("chin_bottom", r.chinBottom?.let { "(${it.x.toInt()},${it.y.toInt()})" } ?: "")
            put("contour_dump", r.contourDump ?: "")
            put("error", r.error ?: "")
        })
    }
    root.put("face_detection", faceArray)

    return root.toString(2)
}
