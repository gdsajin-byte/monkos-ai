package ai.monkos.idpass.engine

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.exifinterface.media.ExifInterface
import ai.monkos.idpass.data.PhotoSpec
import java.nio.FloatBuffer

/**
 * Image utility functions for IDPASS:
 * - EXIF orientation normalization
 * - Foreground/background compositing from mask
 * - Gallery save via MediaStore
 * - Hex color parsing
 */
object ImageUtils {

    // ─── Orientation normalization ───

    /**
     * Read a bitmap from [uri], apply EXIF rotation so it displays upright.
     * Returns a correctly-oriented bitmap.
     */
    fun normalizeOrientation(context: Context, uri: Uri): Bitmap {
        // Read EXIF orientation
        val rotation = context.contentResolver.openInputStream(uri)?.use { stream ->
            val exif = ExifInterface(stream)
            exif.getAttributeInt(
                ExifInterface.TAG_ORIENTATION,
                ExifInterface.ORIENTATION_NORMAL
            )
        } ?: ExifInterface.ORIENTATION_NORMAL

        // Decode the bitmap
        val bitmap = context.contentResolver.openInputStream(uri)?.use { stream ->
            BitmapFactory.decodeStream(stream)
        } ?: throw IllegalArgumentException("Cannot read bitmap from URI: $uri")

        val matrix = Matrix()
        when (rotation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
            ExifInterface.ORIENTATION_TRANSPOSE -> {
                matrix.postRotate(90f)
                matrix.postScale(-1f, 1f)
            }
            ExifInterface.ORIENTATION_TRANSVERSE -> {
                matrix.postRotate(270f)
                matrix.postScale(-1f, 1f)
            }
        }

        return if (matrix.isIdentity) {
            bitmap
        } else {
            Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true).also {
                if (it !== bitmap) bitmap.recycle()
            }
        }
    }

    // ─── Foreground compositing ───

    /**
     * Composite the original image onto a solid background using a confidence mask.
     *
     * @param original Source bitmap
     * @param mask     FloatBuffer of per-pixel foreground confidence values (0.0 to 1.0)
     * @param maskW    Mask width (should match original width)
     * @param maskH    Mask height (should match original height)
     * @param bgHex    Background color hex string (e.g. "FFFFFF")
     * @return Composited bitmap with solid background behind the subject
     */
    fun compositeOnBackground(
        original: Bitmap,
        mask: FloatBuffer,
        maskW: Int,
        maskH: Int,
        bgHex: String
    ): Bitmap {
        val bgColor = parseColor(bgHex)
        val bgR = Color.red(bgColor)
        val bgG = Color.green(bgColor)
        val bgB = Color.blue(bgColor)

        val output = Bitmap.createBitmap(original.width, original.height, Bitmap.Config.ARGB_8888)
        val pixels = IntArray(original.width * original.height)
        original.getPixels(pixels, 0, original.width, 0, 0, original.width, original.height)

        mask.rewind()
        val resultPixels = IntArray(pixels.size)

        for (i in pixels.indices) {
            val confidence = if (i < maskW * maskH) mask.get(i) else 0f
            val alpha = confidence.coerceIn(0f, 1f)

            val src = pixels[i]
            val srcR = Color.red(src)
            val srcG = Color.green(src)
            val srcB = Color.blue(src)

            val r = (srcR * alpha + bgR * (1f - alpha)).toInt().coerceIn(0, 255)
            val g = (srcG * alpha + bgG * (1f - alpha)).toInt().coerceIn(0, 255)
            val b = (srcB * alpha + bgB * (1f - alpha)).toInt().coerceIn(0, 255)

            resultPixels[i] = Color.argb(255, r, g, b)
        }

        output.setPixels(resultPixels, 0, original.width, 0, 0, original.width, original.height)
        return output
    }

    // ─── Save to gallery ───

    /**
     * Save the bitmap to the device gallery via MediaStore.
     * File is named with spec details for easy identification.
     *
     * @return The content URI of the saved image, or null on failure.
     */
    fun saveToGallery(context: Context, bitmap: Bitmap, spec: PhotoSpec): Uri? {
        val fileName = "IDPASS_${spec.id}_${spec.displaySize}_${System.currentTimeMillis()}.jpg"

        val contentValues = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            put(MediaStore.Images.Media.WIDTH, bitmap.width)
            put(MediaStore.Images.Media.HEIGHT, bitmap.height)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/IDPASS")
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
        }

        val resolver = context.contentResolver
        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
            ?: return null

        return try {
            resolver.openOutputStream(uri)?.use { outputStream ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 95, outputStream)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                contentValues.clear()
                contentValues.put(MediaStore.Images.Media.IS_PENDING, 0)
                resolver.update(uri, contentValues, null, null)
            }
            uri
        } catch (_: Exception) {
            resolver.delete(uri, null, null)
            null
        }
    }

    // ─── Color parsing ───

    /**
     * Parse a hex color string to Android Color int.
     * Accepts formats: "FFFFFF", "#FFFFFF", "E0E0E0", "#E0E0E0".
     */
    fun parseColor(hex: String): Int {
        val clean = hex.trimStart('#')
        return try {
            Color.parseColor("#$clean")
        } catch (_: Exception) {
            Color.WHITE
        }
    }
}
