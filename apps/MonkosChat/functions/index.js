const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { VertexAI } = require("@google-cloud/vertexai");

admin.initializeApp();

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: "monkos",
  location: "us-central1",
});

const generativeModel = vertexAI.getGenerativeModel({
  model: "gemini-2.0-flash-001",
  systemInstruction: {
    parts: [{
      text: `You are MONKOS, an AI assistant for creative professionals.
You specialize in:
- Image generation guidance (Imagen, Stable Diffusion)
- Korean fashion and beauty industry
- Creative workflow optimization
- Technical AI/ML support

Respond in Korean (한국어) unless the user writes in English.
Keep responses concise and helpful.
Be friendly but professional.`
    }]
  }
});

// Health check endpoint
exports.health = functions.https.onRequest((req, res) => {
  res.json({
    status: "ok",
    service: "MONKOS Chat Functions",
    timestamp: new Date().toISOString()
  });
});

// Chat message trigger - log new messages
exports.onNewMessage = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const { chatId, messageId } = context.params;

    console.log(`New message in chat ${chatId}: ${messageId}`);
    console.log(`Content: ${message.content?.substring(0, 100)}...`);

    // TODO: Add Vertex AI LLaMA 4 integration here
    // TODO: Add push notification logic

    return null;
  });

// User profile creation trigger
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  // Create user profile in Firestore
  await admin.firestore().collection("users").doc(uid).set({
    email,
    displayName: displayName || email?.split("@")[0] || "Anonymous",
    photoURL,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`Created profile for user: ${uid}`);
  return null;
});

// Chat endpoint - Generate AI response
exports.chat = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to use chat."
    );
  }

  const { message, chatHistory = [] } = data;

  if (!message || typeof message !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Message is required and must be a string."
    );
  }

  try {
    // Build chat history for context
    const contents = chatHistory.map(msg => ({
      role: msg.isUser ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Generate response
    const result = await generativeModel.generateContent({
      contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.95,
      }
    });

    const response = result.response;
    const text = response.candidates[0]?.content?.parts[0]?.text || "";

    // Log for analytics
    console.log(`Chat response generated for user ${context.auth.uid}`);

    return {
      success: true,
      response: text,
      model: "gemini-2.0-flash-001"
    };

  } catch (error) {
    console.error("Vertex AI error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate AI response."
    );
  }
});
