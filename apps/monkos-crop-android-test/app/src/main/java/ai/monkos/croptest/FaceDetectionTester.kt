package ai.monkos.croptest

import android.content.Context
import android.graphics.BitmapFactory
import android.graphics.PointF
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceContour
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class FaceDetectionTester(private val context: Context) {

    private val detector = FaceDetection.getClient(
        FaceDetectorOptions.Builder()
            .setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .build()
    )

    suspend fun runAllTests(
        sampleFiles: List<String>,
        onStatus: (String) -> Unit
    ): List<FaceTestResult> {
        val results = mutableListOf<FaceTestResult>()

        for (file in sampleFiles) {
            val name = file.substringAfterLast("/")
            onStatus("Face detect: $name")

            val bitmap = try {
                context.assets.open(file).use { BitmapFactory.decodeStream(it) }
            } catch (e: Exception) {
                results.add(
                    FaceTestResult(name, 0, 0, 0, 0, null, null, null, null, null, "Load failed")
                )
                continue
            }

            val inputImage = InputImage.fromBitmap(bitmap, 0)
            val startTime = System.currentTimeMillis()

            val faces = suspendCancellableCoroutine { cont ->
                detector.process(inputImage)
                    .addOnSuccessListener { cont.resume(it) }
                    .addOnFailureListener { cont.resume(emptyList()) }
            }

            val elapsed = System.currentTimeMillis() - startTime

            if (faces.isEmpty()) {
                results.add(
                    FaceTestResult(name, 0, 0, 0, elapsed, null, null, null, null, null, "No faces")
                )
                continue
            }

            val face = faces[0]

            // Count all contour points
            var totalContourPoints = 0
            val contourDump = StringBuilder()

            val contourTypes = listOf(
                FaceContour.FACE to "FACE",
                FaceContour.LEFT_EYEBROW_TOP to "L_EYEBROW_TOP",
                FaceContour.LEFT_EYEBROW_BOTTOM to "L_EYEBROW_BTM",
                FaceContour.RIGHT_EYEBROW_TOP to "R_EYEBROW_TOP",
                FaceContour.RIGHT_EYEBROW_BOTTOM to "R_EYEBROW_BTM",
                FaceContour.LEFT_EYE to "L_EYE",
                FaceContour.RIGHT_EYE to "R_EYE",
                FaceContour.UPPER_LIP_TOP to "UPPER_LIP_TOP",
                FaceContour.UPPER_LIP_BOTTOM to "UPPER_LIP_BTM",
                FaceContour.LOWER_LIP_TOP to "LOWER_LIP_TOP",
                FaceContour.LOWER_LIP_BOTTOM to "LOWER_LIP_BTM",
                FaceContour.NOSE_BRIDGE to "NOSE_BRIDGE",
                FaceContour.NOSE_BOTTOM to "NOSE_BOTTOM",
                FaceContour.LEFT_CHEEK to "L_CHEEK",
                FaceContour.RIGHT_CHEEK to "R_CHEEK"
            )

            for ((type, label) in contourTypes) {
                val contour = face.getContour(type)
                val count = contour?.points?.size ?: 0
                totalContourPoints += count
                contourDump.append("$label: ${count}pt")
                if (contour != null && contour.points.isNotEmpty()) {
                    val first = contour.points.first()
                    contourDump.append(" [(${first.x.toInt()},${first.y.toInt()})...]")
                }
                contourDump.append("\n")
            }

            // Landmarks
            val landmarks = listOf(
                FaceLandmark.LEFT_EYE, FaceLandmark.RIGHT_EYE,
                FaceLandmark.NOSE_BASE, FaceLandmark.MOUTH_BOTTOM,
                FaceLandmark.MOUTH_LEFT, FaceLandmark.MOUTH_RIGHT,
                FaceLandmark.LEFT_EAR, FaceLandmark.RIGHT_EAR,
                FaceLandmark.LEFT_CHEEK, FaceLandmark.RIGHT_CHEEK
            )
            val landmarkCount = landmarks.count { face.getLandmark(it) != null }

            val leftEye = face.getLandmark(FaceLandmark.LEFT_EYE)?.position
            val rightEye = face.getLandmark(FaceLandmark.RIGHT_EYE)?.position
            val noseBase = face.getLandmark(FaceLandmark.NOSE_BASE)?.position

            // Chin bottom — use FACE contour bottom-most point
            val faceContour = face.getContour(FaceContour.FACE)
            val chinBottom = faceContour?.points?.maxByOrNull { it.y }

            results.add(
                FaceTestResult(
                    sampleName = name,
                    faceCount = faces.size,
                    contourPointCount = totalContourPoints,
                    landmarkCount = landmarkCount,
                    timeMs = elapsed,
                    eyeLeft = leftEye,
                    eyeRight = rightEye,
                    noseBase = noseBase?.let { PointF(it.x, it.y) },
                    chinBottom = chinBottom?.let { PointF(it.x, it.y) },
                    contourDump = contourDump.toString().trim(),
                    error = null
                )
            )
        }

        return results
    }
}
