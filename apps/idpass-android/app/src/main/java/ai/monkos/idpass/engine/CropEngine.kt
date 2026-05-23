package ai.monkos.idpass.engine

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PointF
import android.graphics.Rect
import ai.monkos.idpass.data.CropMetrics
import ai.monkos.idpass.data.CropState
import ai.monkos.idpass.data.FaceDetectionResult
import ai.monkos.idpass.data.PhotoSpec
import ai.monkos.idpass.data.Signal
import ai.monkos.idpass.data.tr
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Port of iOS CropEngine — auto-places face landmarks in a spec-conforming frame,
 * computes crop metrics with pass/warn/fail signals, and performs final pixel crop.
 */
object CropEngine {

    // ─── Auto-place face in frame ───

    /**
     * Given a detected face and a photo spec, compute a CropState that
     * positions the face according to spec requirements.
     *
     * @param face     Detection result with eye/chin coordinates in image space
     * @param spec     Target photo specification (size in mm, face range)
     * @param frameW   Display frame width in pixels (screen coordinates)
     * @param frameH   Display frame height in pixels (screen coordinates)
     */
    fun autoPlace(
        face: FaceDetectionResult,
        spec: PhotoSpec,
        frameW: Float,
        frameH: Float
    ): CropState {
        val mm = frameH / spec.heightMM.toFloat()
        val natW = face.imageWidth
        val natH = face.imageHeight

        // Cover-scale: ensure image fills the frame
        val covS = max(frameW / natW, frameH / natH)
        val baseW = natW * covS
        val baseH = natH * covS
        val offX = (baseW - frameW) / 2f
        val offY = (baseH - frameH) / 2f

        // Transform image coords to frame coords at cover scale
        fun toC(x: Float, y: Float) = PointF(x * covS - offX, y * covS - offY)

        // Estimate crown: mirror eye-chin distance above eyes
        val crownY = face.eyeCenterY - (face.chinY - face.eyeCenterY)
        val crC = toC(face.eyeCenterX, crownY)
        val chC = toC(face.eyeCenterX, face.chinY)
        val elC = toC(face.leftEyeX, face.leftEyeY)
        val erC = toC(face.rightEyeX, face.rightEyeY)

        // Scale to make face match target size
        val faceHC = chC.y - crC.y
        val targetPx = spec.faceTarget.toFloat() * mm
        val sc = targetPx / faceHC

        // Position eyes at the correct vertical ratio
        val eyeYC = (elC.y + erC.y) / 2f
        val eyeTarget = if (spec.heightMM >= 60) 0.42f else 0.43f
        val posY = eyeTarget * frameH - frameH / 2f - (eyeYC - frameH / 2f) * sc

        // Center face horizontally
        val faceCXC = (elC.x + erC.x) / 2f
        val posX = -(faceCXC - frameW / 2f) * sc

        // Apply scale+position transform to landmarks
        fun toF(cp: PointF) = PointF(
            frameW / 2f + (cp.x - frameW / 2f) * sc + posX,
            frameH / 2f + (cp.y - frameH / 2f) * sc + posY
        )

        // Estimate nose/mouth from eye-chin geometry
        val midX = face.eyeCenterX
        val noseImgY = face.eyeCenterY + (face.chinY - face.eyeCenterY) * 0.45f
        val mouthImgY = face.eyeCenterY + (face.chinY - face.eyeCenterY) * 0.75f
        val noseC = toC(midX, noseImgY)
        val mouthC = toC(midX, mouthImgY)

        return CropState(
            crown = toF(crC),
            chin = toF(chC),
            leftPupil = toF(elC),
            rightPupil = toF(erC),
            noseTip = toF(noseC),
            mouthCenter = toF(mouthC),
            imgOffsetX = posX,
            imgOffsetY = posY,
            imgScale = sc,
            natW = natW,
            natH = natH
        )
    }

    // ─── Metrics computation ───

    /**
     * Compute crop metrics (face size, margins, eye position, signals) from the current state.
     */
    fun computeMetrics(
        state: CropState,
        frameH: Float,
        spec: PhotoSpec
    ): CropMetrics {
        val mm = frameH / spec.heightMM.toFloat()
        val frameW = frameH * spec.widthMM.toFloat() / spec.heightMM.toFloat()

        val faceMm = (state.chin.y - state.crown.y) / mm
        val topMm = state.crown.y / mm
        val bottomMm = spec.heightMM.toFloat() - topMm - faceMm
        val eyeY = (state.leftPupil.y + state.rightPupil.y) / 2f
        val eyeRatio = eyeY / frameH
        val centerOffMm = abs(state.faceCenterX - frameW / 2f) / mm

        // Face size signal
        val fRange = spec.faceMax.toFloat() - spec.faceMin.toFloat()
        val fSweetMin = spec.faceMin.toFloat() + fRange * 0.2f
        val fSweetMax = spec.faceMax.toFloat() - fRange * 0.2f
        val faceSignal = when {
            faceMm in fSweetMin..fSweetMax -> Signal.PASS
            faceMm in spec.faceMin.toFloat()..spec.faceMax.toFloat() -> Signal.WARN
            else -> Signal.FAIL
        }

        // Eye position signal
        val tall = spec.heightMM >= 60
        val eyeSignal = if (tall) {
            when {
                eyeRatio in 0.40f..0.48f -> Signal.PASS
                eyeRatio in 0.38f..0.50f -> Signal.WARN
                else -> Signal.FAIL
            }
        } else {
            when {
                eyeRatio in 0.43f..0.45f -> Signal.PASS
                eyeRatio in 0.40f..0.48f -> Signal.WARN
                else -> Signal.FAIL
            }
        }

        // Top margin signal
        val topSignal = if (tall) {
            when {
                topMm in 10f..20f -> Signal.PASS
                topMm in 5f..25f -> Signal.WARN
                else -> Signal.FAIL
            }
        } else {
            when {
                topMm in 3f..7f -> Signal.PASS
                topMm in 2f..10f -> Signal.WARN
                else -> Signal.FAIL
            }
        }

        // Bottom margin signal
        val btmSignal = if (tall) {
            when {
                bottomMm in 10f..25f -> Signal.PASS
                bottomMm in 5f..30f -> Signal.WARN
                else -> Signal.FAIL
            }
        } else {
            when {
                bottomMm in 4f..10f -> Signal.PASS
                bottomMm in 2f..12f -> Signal.WARN
                else -> Signal.FAIL
            }
        }

        // Center offset signal
        val centerSignal = when {
            centerOffMm < 1f -> Signal.PASS
            centerOffMm < 2f -> Signal.WARN
            else -> Signal.FAIL
        }

        val isBlocked = faceMm < spec.faceMin.toFloat() ||
                faceMm > spec.faceMax.toFloat() ||
                eyeRatio < 0.40f ||
                eyeRatio > 0.48f

        return CropMetrics(
            faceMm = faceMm,
            topMm = topMm,
            bottomMm = bottomMm,
            eyeRatio = eyeRatio,
            eyePct = eyeRatio * 100f,
            centerOffsetMm = centerOffMm,
            faceSignal = faceSignal,
            eyeSignal = eyeSignal,
            topSignal = topSignal,
            btmSignal = btmSignal,
            centerSignal = centerSignal,
            isBlocked = isBlocked
        )
    }

    // ─── Coaching message ───

    /**
     * Return a user-facing coaching message based on metrics, or null if all within spec.
     */
    fun coachingMessage(metrics: CropMetrics, spec: PhotoSpec, lang: String): String? {
        if (metrics.coverageShort) {
            return tr("coach_coverage", lang)
        }
        if (metrics.faceMm < spec.faceMin.toFloat()) {
            return tr("coach_small", lang)
        }
        if (metrics.faceMm > spec.faceMax.toFloat()) {
            return tr("coach_large", lang)
        }
        if (metrics.eyeRatio < 0.40f) {
            return tr("coach_eye_low", lang)
        }
        if (metrics.eyeRatio > 0.48f) {
            return tr("coach_eye_high", lang)
        }
        if (metrics.centerOffsetMm >= 1.5f) {
            return tr("coach_center", lang)
        }
        return null
    }

    // ─── Final pixel crop ───

    /**
     * Render the final cropped image at the spec's pixel dimensions.
     *
     * @param sourceBitmap The (possibly background-removed) source image
     * @param state        Current crop state with landmark positions and scale/offset
     * @param spec         Target photo spec (defines output pixel size)
     * @param frameW       Display frame width used during adjustment
     * @param frameH       Display frame height used during adjustment
     * @return Cropped bitmap at spec.pxW x spec.pxH
     */
    fun performFinalCrop(
        sourceBitmap: Bitmap,
        state: CropState,
        spec: PhotoSpec,
        frameW: Float,
        frameH: Float
    ): Bitmap {
        val natW = state.natW
        val natH = state.natH
        val s = state.imgScale
        val covS = max(frameW / natW, frameH / natH)
        val displayW = natW * covS
        val displayH = natH * covS

        // iOS display pipeline (direct port):
        //   imgLeft = fw/2 + offset.x - displayW*s/2
        //   imgTop  = fh/2 + offset.y - displayH*s/2
        //   pixelScale = covS * s
        //   cropX = (0 - imgLeft) / pixelScale
        //   cropY = (0 - imgTop) / pixelScale
        val imgLeft = frameW / 2f + state.imgOffsetX - displayW * s / 2f
        val imgTop = frameH / 2f + state.imgOffsetY - displayH * s / 2f
        val pixelScale = covS * s

        val cropX = (0f - imgLeft) / pixelScale
        val cropY = (0f - imgTop) / pixelScale
        val cropW = frameW / pixelScale
        val cropH = frameH / pixelScale

        val cx = max(0f, cropX)
        val cy = max(0f, cropY)
        val cw = min(cropW, natW - cx)
        val ch = min(cropH, natH - cy)

        val outW = spec.pxW.toInt()
        val outH = spec.pxH.toInt()

        val output = Bitmap.createBitmap(outW, outH, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        canvas.drawColor(Color.WHITE)

        val srcRect = Rect(cx.toInt(), cy.toInt(), (cx + cw).toInt(), (cy + ch).toInt())
        val dstRect = Rect(0, 0, outW, outH)

        val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
        canvas.drawBitmap(sourceBitmap, srcRect, dstRect, paint)

        return output
    }
}
