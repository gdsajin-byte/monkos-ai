import SwiftUI
import PhotosUI

struct ContentView: View {
    @State private var selectedSpec: PhotoSpec = SpecData.specs[0]
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var inputImage: UIImage?
    @State private var showCropView = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                VStack(spacing: 4) {
                    Text("MONKOS")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                    Text("ID Photo Crop")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 40)

                Spacer().frame(height: 32)

                VStack(alignment: .leading, spacing: 8) {
                    Text("규격 선택")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(SpecData.specs) { spec in
                                SpecCard(spec: spec, isSelected: spec.id == selectedSpec.id)
                                    .onTapGesture { selectedSpec = spec }
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                }
                .padding(.horizontal, 20)

                Spacer().frame(height: 24)

                VStack(spacing: 12) {
                    HStack {
                        Image(systemName: "doc.text")
                        Text(selectedSpec.name)
                            .font(.headline)
                        Spacer()
                        Text(selectedSpec.displaySize)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        Label("배경: 흰색", systemImage: "paintbrush")
                        Spacer()
                        Label("얼굴비율: \(Int(selectedSpec.faceRatioMin*100))~\(Int(selectedSpec.faceRatioMax*100))%", systemImage: "face.smiling")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
                .padding()
                .background(RoundedRectangle(cornerRadius: 12).fill(.ultraThinMaterial))
                .padding(.horizontal, 20)

                Spacer()

                PhotosPicker(selection: $selectedPhoto, matching: .images) {
                    HStack {
                        Image(systemName: "photo.on.rectangle")
                        Text("사진 선택")
                    }
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(RoundedRectangle(cornerRadius: 14).fill(.blue))
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
            .navigationDestination(isPresented: $showCropView) {
                if let image = inputImage {
                    CropView(image: image, spec: selectedSpec)
                }
            }
            .onChange(of: selectedPhoto) { _, newValue in
                Task {
                    if let data = try? await newValue?.loadTransferable(type: Data.self),
                       let uiImage = UIImage(data: data) {
                        inputImage = uiImage
                        showCropView = true
                    }
                }
            }
        }
    }
}

struct SpecCard: View {
    let spec: PhotoSpec
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 4) {
            Text(spec.name)
                .font(.caption)
                .fontWeight(isSelected ? .bold : .regular)
            Text(spec.displaySize)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(isSelected ? Color.blue.opacity(0.15) : Color.gray.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 1.5)
        )
    }
}

#Preview {
    ContentView()
}
