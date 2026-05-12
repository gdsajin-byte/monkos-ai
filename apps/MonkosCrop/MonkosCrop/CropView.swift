import SwiftUI

struct CropView: View {
    let image: UIImage
    let spec: PhotoSpec

    @State private var croppedImage: UIImage?
    @State private var isProcessing = true
    @State private var faceDetected = false
    @State private var errorMessage: String?
    @State private var saved = false

    var body: some View {
        VStack(spacing: 0) {
            if isProcessing {
                Spacer()
                ProgressView("얼굴 인식 중...")
                    .font(.headline)
                Spacer()
            } else if let error = errorMessage {
                Spacer()
                VStack(spacing: 16) {
                    Image(systemName: "face.dashed")
                        .font(.system(size: 48))
                        .foregroundStyle(.orange)
                    Text(error)
                        .font(.headline)
                        .multilineTextAlignment(.center)
                }
                Spacer()
            } else if let result = croppedImage {
                VStack(spacing: 12) {
                    Text("\(spec.name) — \(spec.displaySize)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    Image(uiImage: result)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxHeight: 420)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .shadow(radius: 4)
                        .padding(.horizontal, 40)

                    if faceDetected {
                        Label("MONKOS 검수 통과", systemImage: "checkmark.seal.fill")
                            .font(.subheadline)
                            .foregroundStyle(.green)
                    }
                }

                Spacer()

                VStack(spacing: 12) {
                    Button {
                        saveToPhotos(result)
                    } label: {
                        HStack {
                            Image(systemName: saved ? "checkmark" : "square.and.arrow.down")
                            Text(saved ? "저장 완료" : "사진 앱에 저장")
                        }
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(RoundedRectangle(cornerRadius: 14).fill(saved ? .green : .blue))
                    }
                    .disabled(saved)

                    Button {
                        if let data = result.jpegData(compressionQuality: 0.9) {
                            let av = UIActivityViewController(activityItems: [data], applicationActivities: nil)
                            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                               let root = windowScene.windows.first?.rootViewController {
                                root.present(av, animated: true)
                            }
                        }
                    } label: {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("공유")
                        }
                        .font(.subheadline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(RoundedRectangle(cornerRadius: 12).fill(.gray.opacity(0.12)))
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 30)
            }
        }
        .navigationTitle("크롭 결과")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await processCrop()
        }
    }

    private func processCrop() async {
        guard let face = await CropEngine.detectFace(in: image) else {
            errorMessage = "얼굴을 찾을 수 없습니다.\n정면 사진을 사용해 주세요."
            isProcessing = false
            return
        }

        faceDetected = true

        guard let result = CropEngine.crop(image: image, spec: spec, face: face) else {
            errorMessage = "크롭에 실패했습니다."
            isProcessing = false
            return
        }

        croppedImage = result
        isProcessing = false
    }

    private func saveToPhotos(_ image: UIImage) {
        UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
        saved = true
    }
}
