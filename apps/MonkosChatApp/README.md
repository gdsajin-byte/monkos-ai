# MONKOS Chat App

AI-powered chat application built with Expo (React Native) and Google Cloud.

## Tech Stack

- **Frontend**: Expo (React Native)
- **Backend**: Firebase Cloud Functions
- **Database**: Cloud Firestore
- **AI**: Vertex AI (Gemini 2.0 Flash)
- **Auth**: Firebase Authentication

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud account with Firebase project

## Setup

### 1. Install Dependencies

```bash
cd apps/MonkosChatApp
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project `monkos-3c6e4`
3. Project Settings > General > Your apps > Add web app
4. Copy the config values
5. Create `.env` file from `.env.example`:

```bash
cp .env.example .env
# Edit .env with your Firebase config values
```

### 3. Deploy Cloud Functions

```bash
cd ../MonkosChat/functions
npm install
firebase deploy --only functions
```

## Development

### Start Development Server

```bash
# Web
npm run web

# Android (requires Android Studio/Emulator)
npm run android

# iOS (requires macOS + Xcode)
npm run ios
```

### Project Structure

```
MonkosChatApp/
├── App.js                 # App entry point with navigation
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js  # Welcome screen
│   │   └── ChatScreen.js  # Main chat interface
│   ├── components/
│   │   └── ChatBubble.js  # Chat message component
│   ├── services/
│   │   ├── vertexAI.js    # AI service (mock/production)
│   │   ├── chatService.js # Firestore chat operations
│   │   └── authService.js # Firebase Auth
│   └── config/
│       └── firebase.js    # Firebase initialization
└── .env.example           # Environment variables template
```

## Features

- Real-time chat with AI assistant
- User authentication (anonymous, email)
- Chat history persistence (Firestore)
- Dark theme UI
- Korean language support

## API Integration

### Vertex AI Chat (Cloud Function)

The app calls Firebase Cloud Functions which securely connects to Vertex AI:

```javascript
// From mobile app
const functions = getFunctions();
const chatFn = httpsCallable(functions, 'chat');
const result = await chatFn({ message: "Hello!" });
```

### Firestore Structure

```
chats/
  {chatId}/
    userId: string
    createdAt: timestamp
    messages/
      {messageId}/
        content: string
        role: "user" | "model"
        timestamp: timestamp
```

## Deployment

### Deploy to Firebase Hosting

```bash
expo export:web
firebase deploy --only hosting
```

### Deploy Cloud Functions

```bash
cd functions
firebase deploy --only functions
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |

## License

MONK.KR - Internal Project

---

Created: 2026-01-29
Author: Claude Code (DANGEROUSLY_FORWARD Mission)
