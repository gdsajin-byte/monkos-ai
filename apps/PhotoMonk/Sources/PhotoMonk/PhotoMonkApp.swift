import SwiftUI

@main
struct PhotoMonkApp: App {
    var body: some Scene {
        WindowGroup {
            CoachingView()
                .preferredColorScheme(.dark)
        }
    }
}
