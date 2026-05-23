package ai.monkos.idpass.engine

import android.graphics.Bitmap
import android.graphics.PointF
import ai.monkos.idpass.data.FaceDetectionResult
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceContour
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * Wraps ML Kit Face Detection for ID photo face landmark extraction.
 * Extracts eye positions, chin bottom from contour, and roll/yaw angles.
 */
class FaceDetector {

    private val options = FaceDetectorOptions.Builder()
        .setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL)
        .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
        .build()

    private val detector = FaceDetection.getClient(options)

    /**
     * Detect the largest face in the bitmap and return landmarks.
     * @return FaceDetectionResult with eye positions, chin Y, roll/yaw, or null if no face found.
     */
    suspend fun detect(bitmap: Bitmap): FaceDetectionResult? {
        val inputImage = InputImage.fromBitmap(bitmap, 0)

        val faces = suspendCancellableCoroutine { cont ->
            detector.process(inputImage)
                .addOnSuccessListener { result ->
                    cont.resume(result)
                }
                .addOnFailureListener {
                    cont.resume(emptyList())
                }
        }

        if (faces.isEmpty()) return null

        // Pick the largest face
        val face = faces.maxByOrNull {
            it.boundingBox.width() * it.boundingBox.height()
        } ?: return null

        // Extract eye landmarks
        val leftEyeLm = face.getLandmark(FaceLandmark.LEFT_EYE)
        val rightEyeLm = face.getLandmark(FaceLandmark.RIGHT_EYE)

        if (leftEyeLm == null || rightEyeLm == null) return null

        val leftEyePos = leftEyeLm.position
        val rightEyePos = rightEyeLm.position

        val eyeCenterX = (leftEyePos.x + rightEyePos.x) / 2f
        val eyeCenterY = (leftEyePos.y + rightEyePos.y) / 2f

        // Extract chin bottom from face contour (max Y point)
        val faceContour = face.getContour(FaceContour.FACE)
        val chinY: Float = if (faceContour != null && faceContour.points.isNotEmpty()) {
            faceContour.points.maxOf { it.y }
        } else {
            // Fallback: bottom of bounding box
            face.boundingBox.bottom.toFloat()
        }

        // Roll and yaw angles from ML Kit (degrees)
        val rollDeg = face.headEulerAngleZ  // roll: tilt left/right
        val yawDeg = face.headEulerAngleY   // yaw: turn left/right

        return FaceDetectionResult(
            eyeCenterX = eyeCenterX,
            eyeCenterY = eyeCenterY,
            chinY = chinY,
            imageWidth = bitmap.width.toFloat(),
            imageHeight = bitmap.height.toFloat(),
            leftEyeX = leftEyePos.x,
            leftEyeY = leftEyePos.y,
            rightEyeX = rightEyePos.x,
            rightEyeY = rightEyePos.y,
            rollDeg = rollDeg,
            yawDeg = yawDeg
        )
    }
}
