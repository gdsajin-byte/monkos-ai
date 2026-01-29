/**
 * Auth Service for MONKOS Chat
 *
 * Handles user authentication using Firebase Auth.
 */

import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Sign in anonymously (for quick start without registration)
 * @returns {Promise<object>} - User credential
 */
export async function signInAsGuest() {
  const credential = await signInAnonymously(auth);
  return credential.user;
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} - User credential
 */
export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Create a new user account
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @returns {Promise<object>} - User credential
 */
export async function signUp(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  return credential.user;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  await firebaseSignOut(auth);
}

/**
 * Get the current authenticated user
 * @returns {object|null} - Current user or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 * @param {function} callback - Callback function
 * @returns {function} - Unsubscribe function
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

export default {
  signInAsGuest,
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  subscribeToAuthChanges,
};
