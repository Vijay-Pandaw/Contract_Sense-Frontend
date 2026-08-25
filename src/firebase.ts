import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth'

// Firebase Configuration for ContractSense
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDw-demo-contract-sense-key-2026',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'contractsense-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'contractsense-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'contractsense-demo.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '108234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:108234567890:web:abcdef123456',
}

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)

// Google Auth Provider — configured to show account chooser without any hardcoded email
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account',
})

// Apple Auth Provider
const appleProvider = new OAuthProvider('apple.com')
appleProvider.addScope('email')
appleProvider.addScope('name')

/**
 * Real Firebase Google Sign-In with popup
 */
export async function loginWithGoogle(): Promise<{ success: boolean; user?: FirebaseUser; credential?: UserCredential; error?: string }> {
  try {
    console.log('[Auth] Google login clicked')
    console.log('[Auth] Google authentication started')
    const credential = await signInWithPopup(auth, googleProvider)
    console.log('[Auth] Google authentication successful')
    console.log('[Auth] Authenticated Firebase UID exists:', Boolean(credential.user?.uid))
    console.log('[Auth] Authenticated provider:', credential.user?.providerData?.[0]?.providerId || 'google.com')
    return { success: true, user: credential.user, credential }
  } catch (err: any) {
    console.error('[Auth] Google authentication error:', err.code, err.message)
    let errorMessage = 'Google authentication was cancelled or failed. Please try again.'
    if (err.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in popup was closed before completing. Please try again.'
    } else if (err.code === 'auth/unauthorized-domain') {
      errorMessage = 'This domain is not authorized for OAuth in Firebase Console. Please add it to Authorized Domains.'
    } else if (err.code === 'auth/network-request-failed') {
      errorMessage = 'Network connection issue. Please check your internet connection.'
    } else if (err.message) {
      errorMessage = err.message
    }
    return { success: false, error: errorMessage }
  }
}

/**
 * Real Firebase Apple Sign-In with popup
 */
export async function loginWithApple(): Promise<{ success: boolean; user?: FirebaseUser; credential?: UserCredential; error?: string }> {
  try {
    console.log('[Auth] Apple login clicked')
    console.log('[Auth] Apple authentication started')
    const credential = await signInWithPopup(auth, appleProvider)
    console.log('[Auth] Apple authentication successful')
    console.log('[Auth] Authenticated Firebase UID exists:', Boolean(credential.user?.uid))
    console.log('[Auth] Authenticated provider:', credential.user?.providerData?.[0]?.providerId || 'apple.com')
    return { success: true, user: credential.user, credential }
  } catch (err: any) {
    console.error('[Auth] Apple authentication error:', err.code, err.message)
    let errorMessage = 'Apple authentication was cancelled or failed. Please try again.'
    if (err.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Apple sign-in popup was closed before completing. Please try again.'
    } else if (err.code === 'auth/operation-not-allowed') {
      errorMessage = 'Apple Sign-In provider is not enabled in your Firebase Console.'
    } else if (err.message) {
      errorMessage = err.message
    }
    return { success: false, error: errorMessage }
  }
}

/**
 * Real Firebase Email & Password Login
 */
export async function loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  try {
    console.log('[Auth] Email login started for:', email)
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
    console.log('[Auth] Email authentication successful, UID exists:', Boolean(credential.user?.uid))
    return { success: true, user: credential.user }
  } catch (err: any) {
    console.error('[Auth] Email login error:', err.code, err.message)
    let errorMessage = 'Invalid email or password.'
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      errorMessage = 'Incorrect email or password. Please check your credentials.'
    } else if (err.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.'
    } else if (err.code === 'auth/too-many-requests') {
      errorMessage = 'Access temporarily disabled due to many failed login attempts. Reset your password or try again later.'
    } else if (err.message) {
      errorMessage = err.message
    }
    return { success: false, error: errorMessage }
  }
}

/**
 * Real Firebase Email & Password Registration
 */
export async function signupWithEmail(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  try {
    console.log('[Auth] Account creation started for:', email)
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
    if (name.trim()) {
      await updateProfile(credential.user, { displayName: name.trim() })
    }
    console.log('[Auth] Account created successfully, UID exists:', Boolean(credential.user?.uid))
    return { success: true, user: credential.user }
  } catch (err: any) {
    console.error('[Auth] Account creation error:', err.code, err.message)
    let errorMessage = 'Unable to create account.'
    if (err.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email address already exists. Please sign in instead.'
    } else if (err.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use at least 8 characters.'
    } else if (err.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.'
    } else if (err.message) {
      errorMessage = err.message
    }
    return { success: false, error: errorMessage }
  }
}

/**
 * Real Firebase Password Reset Email Dispatch
 */
export async function resetPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log('[Auth] Password reset requested for entered email:', email)
    await sendPasswordResetEmail(auth, email.trim())
    console.log('[Auth] Password reset email successfully dispatched by Firebase')
    return {
      success: true,
      message: `Password reset email sent to ${email.trim()}. Please check your inbox and spam folders.`,
    }
  } catch (err: any) {
    console.error('[Auth] Password reset error:', err.code, err.message)
    let errorMessage = 'Unable to send password reset email.'
    if (err.code === 'auth/user-not-found') {
      errorMessage = 'No user found with this email address. Please register an account first.'
    } else if (err.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.'
    } else if (err.message) {
      errorMessage = err.message
    }
    return { success: false, error: errorMessage }
  }
}

/**
 * Real Firebase Logout
 */
export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    console.log('[Auth] Logging out current user')
    await signOut(auth)
    localStorage.removeItem('contractsense_auth_token')
    console.log('[Auth] User successfully logged out')
    return { success: true }
  } catch (err: any) {
    console.error('[Auth] Sign out error:', err)
    localStorage.removeItem('contractsense_auth_token')
    return { success: true }
  }
}

export {
  app,
  auth,
  googleProvider,
  appleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
}
export type { FirebaseUser }
