package ai.monkos.idpass.engine

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import com.google.android.gms.common.moduleinstall.ModuleInstall
import com.google.android.gms.common.moduleinstall.ModuleInstallRequest
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentationResult
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.suspendCancellableCoroutine
import java.nio.FloatBuffer
import kotlin.coroutines.resume

/**
 * Wraps ML Kit Subject Segmentation for background removal.
 * Caches the confidence mask so changing bgColor doesn't require re-segmentation.
 */
class BackgroundRemover {

    private val segmenter: SubjectSegmenter = SubjectSegmentation.getClient(
        SubjectSegmenterOptions.Builder()
            .enableForegroundConfidenceMask()
            .enableForegroundBitmap()
            .build()
    )

    // Cached mask from the last segmentation run
    private var cachedMask: FloatBuffer? = null
    private var cachedMaskWidth: Int = 0
    private var cachedMaskHeight: Int = 0
    private var cachedOriginal: Bitmap? = null

    /**
     * Request model download if not already available.
     * Call this early (e.g. on app start or before first use) so segmentation is ready.
     */
    suspend fun ensureModelReady(context: Context) {
        suspendCancellableCoroutine { cont ->
            val moduleInstallClient = ModuleInstall.getClient(context)
            val request = ModuleInstallRequest.newBuilder()
                .addApi(SubjectSegmentation.getClient(SubjectSegmenterOptions.Builder().build()))
                .build()
            moduleInstallClient.installModules(request)
                .addOnSuccessListener { cont.resume(true) }
                .addOnFailureListener { cont.resume(false) }
        }
    }

    /**
     * Remove background from [bitmap] and replace with solid [bgColorHex].
     * Caches the foreground mask so subsequent calls with a different bgColor
     * skip the segmentation step.
     *
     * @param bitmap Source image
     * @param bgColorHex Hex color string, e.g. "FFFFFF" or "#E0E0E0"
     * @return Composited bitmap with new background, or null on failure
     */
    suspend fun removeBackground(bitmap: Bitmap, bgColorHex: String): Bitmap? {
        // Check if we can reuse the cached mask
        val isSameImage = cachedOriginal === bitmap && cachedMask != null

        if (!isSameImage) {
            // Run segmentation
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            val result: SubjectSegmentationResult? = suspendCancellableCoroutine { cont ->
                segmenter.process(inputImage)
                    .addOnSuccessListener { cont.resume(it) }
                    .addOnFailureListener { cont.resume(null) }
            }

            if (result == null) return null

            val mask = result.foregroundConfidenceMask ?: return null
            cachedMask = mask
            cachedMaskWidth = bitmap.width
            cachedMaskHeight = bitmap.height
            cachedOriginal = bitmap
        }

        // Composite with the new background color
        val mask = cachedMask ?: return null
        return compositeOnBackground(bitmap, mask, cachedMaskWidth, cachedMaskHeight, bgColorHex)
    }

    /**
     * Clear cached segmentation data.
     */
    fun clearCache() {
        cachedMask = null
        cachedOriginal = null
        cachedMaskWidth = 0
        cachedMaskHeight = 0
    }

    private fun compositeOnBackground(
        original: Bitmap,
        mask: FloatBuffer,
        maskW: Int,
        maskH: Int,
        bgHex: String
    ): Bitmap {
        val bgColor = parseHexColor(bgHex)
        val output = Bitmap.createBitmap(original.width, original.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)

        // Draw solid background
        canvas.drawColor(bgColor)

        // Blend original pixels using mask confidence
        mask.rewind()
        val pixels = IntArray(original.width * original.height)
        original.getPixels(pixels, 0, original.width, 0, 0, original.width, original.height)

        val bgR = Color.red(bgColor)
        val bgG = Color.green(bgColor)
        val bgB = Color.blue(bgColor)

        val resultPixels = IntArray(pixels.size)
        for (i in pixels.indices) {
            val confidence = if (i < maskW * maskH) mask.get(i) else 0f
            val alpha = (confidence).coerceIn(0f, 1f)

            val srcColor = pixels[i]
            val srcR = Color.red(srcColor)
            val srcG = Color.green(srcColor)
            val srcB = Color.blue(srcColor)

            val r = (srcR * alpha + bgR * (1f - alpha)).toInt().coerceIn(0, 255)
            val g = (srcG * alpha + bgG * (1f - alpha)).toInt().coerceIn(0, 255)
            val b = (srcB * alpha + bgB * (1f - alpha)).toInt().coerceIn(0, 255)

            resultPixels[i] = Color.argb(255, r, g, b)
        }

        output.setPixels(resultPixels, 0, original.width, 0, 0, original.width, original.height)
        return output
    }

    private fun parseHexColor(hex: String): Int {
        val clean = hex.trimStart('#')
        return try {
            Color.parseColor("#$clean")
        } catch (_: Exception) {
            Color.WHITE
        }
    }
}
