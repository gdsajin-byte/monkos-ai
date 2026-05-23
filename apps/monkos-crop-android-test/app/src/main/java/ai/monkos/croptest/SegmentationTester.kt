package ai.monkos.croptest

import android.content.Context
import android.graphics.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import com.google.android.gms.common.moduleinstall.ModuleInstall
import com.google.android.gms.common.moduleinstall.ModuleInstallRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.nio.FloatBuffer
import kotlin.coroutines.resume

class SegmentationTester(private val context: Context) {

    private val segmenter = SubjectSegmentation.getClient(
        SubjectSegmenterOptions.Builder()
            .enableForegroundConfidenceMask()
            .enableForegroundBitmap()
            .build()
    )

    private suspend fun ensureModelDownloaded(onStatus: (String) -> Unit) {
        onStatus("Requesting ML Kit model download...")
        val moduleInstallClient = ModuleInstall.getClient(context)
        val request = ModuleInstallRequest.newBuilder()
            .addApi(SubjectSegmentation.getClient(SubjectSegmenterOptions.Builder().build()))
            .build()

        suspendCancellableCoroutine<Boolean> { cont ->
            moduleInstallClient.installModules(request)
                .addOnSuccessListener { cont.resume(true) }
                .addOnFailureListener { cont.resume(false) }
        }

        // Wait for model to be ready
        for (i in 1..10) {
            onStatus("Waiting for ML Kit model... ($i/10)")
            delay(3000)
            val ready = suspendCancellableCoroutine<Boolean> { cont ->
                moduleInstallClient.areModulesAvailable(
                    SubjectSegmentation.getClient(SubjectSegmenterOptions.Builder().build())
                ).addOnSuccessListener { cont.resume(it.areModulesAvailable()) }
                 .addOnFailureListener { cont.resume(false) }
            }
            if (ready) {
                onStatus("ML Kit model ready!")
                return
            }
        }
        onStatus("ML Kit model download timeout — proceeding anyway")
    }

    suspend fun runAllTests(
        sampleFiles: List<String>,
        onStatus: (String) -> Unit
    ): List<TestResult> {
        val results = mutableListOf<TestResult>()

        ensureModelDownloaded(onStatus)

        for (file in sampleFiles) {
            val name = file.substringAfterLast("/")
            onStatus("Testing: $name")

            val bitmap = loadAssetBitmap(file)
            if (bitmap == null) {
                results.add(
                    TestResult(name, null, null, 0, "Failed to load", null, 0, "Failed to load")
                )
                continue
            }

            // ML Kit test
            val (mlKitResult, mlKitTime, mlKitError) = runMlKit(bitmap)

            // ISNet ONNX test
            val (isnetResult, isnetTime, isnetError) = runIsnet(bitmap)

            results.add(
                TestResult(
                    sampleName = name,
                    originalBitmap = bitmap,
                    mlKitBitmap = mlKitResult,
                    mlKitTimeMs = mlKitTime,
                    mlKitError = mlKitError,
                    isnetBitmap = isnetResult,
                    isnetTimeMs = isnetTime,
                    isnetError = isnetError
                )
            )
        }

        return results
    }

    private suspend fun runMlKit(bitmap: Bitmap): Triple<Bitmap?, Long, String?> {
        return try {
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            val startTime = System.currentTimeMillis()

            val resultOrError = suspendCancellableCoroutine<Pair<com.google.mlkit.vision.segmentation.subject.SubjectSegmentationResult?, Exception?>> { cont ->
                segmenter.process(inputImage)
                    .addOnSuccessListener { segResult ->
                        cont.resume(Pair(segResult, null))
                    }
                    .addOnFailureListener { e ->
                        cont.resume(Pair(null, e))
                    }
            }

            val result = resultOrError.first
            val error = resultOrError.second

            val elapsed = System.currentTimeMillis() - startTime

            if (result != null) {
                val mask = result.foregroundConfidenceMask
                val fg = result.foregroundBitmap
                if (mask != null) {
                    val masked = applyMask(bitmap, mask, bitmap.width, bitmap.height)
                    Triple(masked, elapsed, null)
                } else if (fg != null) {
                    Triple(fg, elapsed, null)
                } else {
                    Triple(null, elapsed, "No mask/bitmap returned")
                }
            } else {
                Triple(null, elapsed, "ML Kit failed: ${error?.javaClass?.simpleName}: ${error?.message}")
            }
        } catch (e: OutOfMemoryError) {
            Triple(null, 0L, "OOM: ${e.message}")
        } catch (e: Exception) {
            Triple(null, 0L, "${e.javaClass.simpleName}: ${e.message}")
        }
    }

    private fun applyMask(
        original: Bitmap,
        mask: FloatBuffer,
        maskWidth: Int,
        maskHeight: Int
    ): Bitmap {
        val output = Bitmap.createBitmap(maskWidth, maskHeight, Bitmap.Config.ARGB_8888)
        val scaledOriginal = Bitmap.createScaledBitmap(original, maskWidth, maskHeight, true)

        mask.rewind()
        for (y in 0 until maskHeight) {
            for (x in 0 until maskWidth) {
                val confidence = mask.get()
                val pixel = scaledOriginal.getPixel(x, y)
                val alpha = (confidence * 255).toInt().coerceIn(0, 255)
                output.setPixel(x, y, Color.argb(alpha, Color.red(pixel), Color.green(pixel), Color.blue(pixel)))
            }
        }

        // Composite onto white background
        val whiteBg = Bitmap.createBitmap(maskWidth, maskHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(whiteBg)
        canvas.drawColor(Color.WHITE)
        canvas.drawBitmap(output, 0f, 0f, null)

        return whiteBg
    }

    private suspend fun runIsnet(bitmap: Bitmap): Triple<Bitmap?, Long, String?> {
        return withContext(Dispatchers.IO) {
            try {
                val isnetRunner = IsnetRunner(context)
                val startTime = System.currentTimeMillis()
                val result = isnetRunner.segment(bitmap)
                val elapsed = System.currentTimeMillis() - startTime
                Triple(result, elapsed, null)
            } catch (e: OutOfMemoryError) {
                System.gc()
                Triple(null, 0L, "ISNet OOM: ${e.message}")
            } catch (e: Exception) {
                Triple(null, 0L, "ISNet: ${e.javaClass.simpleName}: ${e.message}")
            }
        }
    }

    private fun loadAssetBitmap(path: String): Bitmap? {
        return try {
            context.assets.open(path).use { stream ->
                BitmapFactory.decodeStream(stream)
            }
        } catch (e: Exception) {
            null
        }
    }
}
