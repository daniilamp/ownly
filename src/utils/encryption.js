/**
 * Encryption Utilities
 * Client-side encryption using Web Crypto API
 * AES-256-GCM with PBKDF2 key derivation
 */

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Import password as key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt document
 * Returns: { encryptedData, iv, authTag, salt }
 */
export async function encryptDocument(fileData, password) {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Encrypt data
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      fileData
    );

    // Extract auth tag (last 16 bytes of encrypted data in GCM mode)
    // Note: Web Crypto API includes auth tag in the ciphertext
    const encryptedArray = new Uint8Array(encryptedData);

    return {
      encryptedData: encryptedArray,
      iv: iv,
      salt: salt,
      // Auth tag is included in encryptedData for Web Crypto API
    };
  } catch (err) {
    throw new Error(`Encryption failed: ${err.message}`);
  }
}

/**
 * Decrypt document
 */
export async function decryptDocument(encryptedData, password, iv, salt) {
  try {
    // Derive key from password using same salt
    const key = await deriveKey(password, salt);

    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedData
    );

    return decryptedData;
  } catch (err) {
    throw new Error(`Decryption failed: ${err.message}`);
  }
}

/**
 * Generate hash of encryption key for verification
 */
export async function generateKeyHash(password, salt) {
  try {
    const key = await deriveKey(password, salt);
    const exported = await crypto.subtle.exportKey('raw', key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', exported);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    throw new Error(`Hash generation failed: ${err.message}`);
  }
}

/**
 * Convert ArrayBuffer to Base64 for storage
 */
export function arrayBufferToBase64(buffer) {
  // Handle both ArrayBuffer and Uint8Array
  let bytes;
  if (buffer instanceof Uint8Array) {
    bytes = buffer;
  } else if (buffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(buffer);
  } else {
    throw new Error('Invalid buffer type');
  }
  
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer for decryption
 */
export function base64ToArrayBuffer(base64) {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Invalid Base64 string');
  }
  
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (err) {
    throw new Error(`Base64 decoding failed: ${err.message}`);
  }
}
