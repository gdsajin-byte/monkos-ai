import AVFoundation
import SwiftUI

#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif

class CameraManager: NSObject, ObservableObject {

    let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private let videoOutput = AVCaptureVideoDataOutput()
    private let queue = DispatchQueue(label: "ai.monkos.photomonk.camera", qos: .userInteractive)

    @Published var permissionGranted = false
    @Published var capturedImageData: Data?

    var onFrame: ((CVPixelBuffer) -> Void)?

    override init() {
        super.init()
        checkPermission()
    }

    // MARK: - Permission

    private func checkPermission() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            DispatchQueue.main.async { self.permissionGranted = true }
            configure()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async { self.permissionGranted = granted }
                if granted { self.configure() }
            }
        default:
            DispatchQueue.main.async { self.permissionGranted = false }
        }
    }

    // MARK: - Session Setup

    private func configure() {
        session.beginConfiguration()
        session.sessionPreset = .high

        guard let device = frontCamera(),
              let input = try? AVCaptureDeviceInput(device: device) else {
            session.commitConfiguration()
            return
        }

        if session.canAddInput(input) { session.addInput(input) }

        videoOutput.setSampleBufferDelegate(self, queue: queue)
        videoOutput.alwaysDiscardsLateVideoFrames = true
        if session.canAddOutput(videoOutput) { session.addOutput(videoOutput) }

        if session.canAddOutput(photoOutput) { session.addOutput(photoOutput) }

        if let conn = videoOutput.connection(with: .video) {
            #if os(iOS)
            conn.isVideoMirrored = true
            #endif
        }

        session.commitConfiguration()
    }

    private func frontCamera() -> AVCaptureDevice? {
        if let d = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) {
            return d
        }
        return AVCaptureDevice.default(for: .video)
    }

    // MARK: - Lifecycle

    func start() {
        guard !session.isRunning else { return }
        queue.async { [weak self] in self?.session.startRunning() }
    }

    func stop() {
        guard session.isRunning else { return }
        queue.async { [weak self] in self?.session.stopRunning() }
    }

    // MARK: - Capture

    func capturePhoto() {
        let settings = AVCapturePhotoSettings()
        photoOutput.capturePhoto(with: settings, delegate: self)
    }
}

// MARK: - Video Delegate

extension CameraManager: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput,
                       didOutput sampleBuffer: CMSampleBuffer,
                       from connection: AVCaptureConnection) {
        guard let buf = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        onFrame?(buf)
    }
}

// MARK: - Photo Delegate

extension CameraManager: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput,
                     didFinishProcessingPhoto photo: AVCapturePhoto,
                     error: Error?) {
        guard let data = photo.fileDataRepresentation() else { return }
        DispatchQueue.main.async { self.capturedImageData = data }
    }
}
