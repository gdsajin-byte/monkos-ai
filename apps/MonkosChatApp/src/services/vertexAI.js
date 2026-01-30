/**
 * Vertex AI Service for MONKOS Chat
 *
 * This service connects to Firebase Cloud Functions which securely
 * calls Google Cloud Vertex AI (Gemini 2.0 Flash).
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { auth } from '../config/firebase';
import { signInAsGuest } from './authService';

const VERTEX_AI_CONFIG = {
  projectId: 'monkos',
  location: 'us-central1',
  model: 'gemini-2.0-flash-001',
};

// Initialize Firebase Functions
const functions = getFunctions();

// Uncomment for local development with emulator
// connectFunctionsEmulator(functions, 'localhost', 5001);

// Get callable function references
const chatFunction = httpsCallable(functions, 'chat');
const healthFunction = httpsCallable(functions, 'health');

// Chat history for context
let chatHistory = [];

/**
 * Ensure user is authenticated before making API calls
 * @returns {Promise<object>} - Current user
 */
async function ensureAuthenticated() {
  if (!auth.currentUser) {
    console.log('No user signed in, signing in anonymously...');
    await signInAsGuest();
  }
  return auth.currentUser;
}

/**
 * Send a message to Vertex AI via Firebase Cloud Function
 * @param {string} userMessage - The user's message
 * @returns {Promise<string>} - The AI response
 */
export async function sendMessage(userMessage) {
  try {
    // Ensure user is authenticated
    await ensureAuthenticated();

    // Add user message to history
    chatHistory.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    // Call the Cloud Function
    const result = await chatFunction({
      message: userMessage,
      chatHistory: chatHistory.slice(-10), // Send last 10 messages for context
    });

    const response = result.data.response;

    // Add AI response to history
    chatHistory.push({
      role: 'model',
      parts: [{ text: response }],
    });

    return response;
  } catch (error) {
    console.error('Error calling Vertex AI:', error);

    // Provide user-friendly error message
    if (error.code === 'functions/unauthenticated') {
      throw new Error('인증이 필요합니다. 다시 시도해주세요.');
    } else if (error.code === 'functions/unavailable') {
      throw new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } else if (error.code === 'functions/internal') {
      throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }

    throw error;
  }
}

/**
 * Clear chat history
 */
export function clearHistory() {
  chatHistory = [];
}

/**
 * Generate an image using Imagen API
 * @param {string} prompt - The image generation prompt
 * @param {object} options - Generation options
 * @returns {Promise<string>} - The generated image URL
 */
export async function generateImage(prompt, options = {}) {
  // TODO: Implement Imagen API integration via Cloud Function
  const defaultOptions = {
    aspectRatio: '9:16',
    sampleCount: 1,
    enhancePrompt: true,
  };

  const config = { ...defaultOptions, ...options };
  console.log('Image generation requested:', { prompt, config });

  throw new Error('이미지 생성 기능은 아직 준비 중입니다.');
}

/**
 * Check Vertex AI service health
 * @returns {Promise<boolean>} - Whether the service is healthy
 */
export async function checkHealth() {
  try {
    const result = await healthFunction();
    return result.data.status === 'ok';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

export default {
  sendMessage,
  generateImage,
  checkHealth,
  clearHistory,
  config: VERTEX_AI_CONFIG,
};
