/**
 * Chat Service for MONKOS Chat
 *
 * Handles chat message storage and retrieval using Firestore.
 */

import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const CHATS_COLLECTION = 'chats';
const MESSAGES_COLLECTION = 'messages';

/**
 * Create a new chat session
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} - The new chat ID
 */
export async function createChat(userId) {
  const chatRef = await addDoc(collection(db, CHATS_COLLECTION), {
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messageCount: 0,
  });

  return chatRef.id;
}

/**
 * Add a message to a chat
 * @param {string} chatId - The chat session ID
 * @param {object} message - The message object
 * @returns {Promise<string>} - The message ID
 */
export async function addMessage(chatId, message) {
  const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION);

  const messageDoc = await addDoc(messagesRef, {
    ...message,
    timestamp: serverTimestamp(),
  });

  // Update chat's updatedAt
  await setDoc(
    doc(db, CHATS_COLLECTION, chatId),
    { updatedAt: serverTimestamp() },
    { merge: true }
  );

  return messageDoc.id;
}

/**
 * Subscribe to messages in a chat
 * @param {string} chatId - The chat session ID
 * @param {function} callback - Callback function for updates
 * @param {number} messageLimit - Maximum number of messages to retrieve
 * @returns {function} - Unsubscribe function
 */
export function subscribeToMessages(chatId, callback, messageLimit = 50) {
  const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION);
  const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(messageLimit));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }));
    callback(messages);
  });
}

/**
 * Format a message for display
 * @param {object} rawMessage - Raw message from Firestore
 * @returns {object} - Formatted message
 */
export function formatMessage(rawMessage) {
  return {
    id: rawMessage.id,
    text: rawMessage.content || rawMessage.text,
    isUser: rawMessage.role === 'user',
    timestamp: rawMessage.timestamp,
    metadata: rawMessage.metadata,
  };
}

export default {
  createChat,
  addMessage,
  subscribeToMessages,
  formatMessage,
};
