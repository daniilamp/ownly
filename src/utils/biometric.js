/**
 * Biometric Authentication Utilities
 * Uses WebAuthn API for fingerprint/face recognition
 */

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable() {
  try {
    if (!window.PublicKeyCredential) {
      return false;
    }

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (err) {
    console.error('Error checking biometric availability:', err);
    return false;
  }
}

/**
 * Register biometric credential
 */
export async function registerBiometric(userId, userName) {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: {
          name: 'Ownly',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
        },
        timeout: 60000,
        attestation: 'direct',
      },
    });

    if (!credential) {
      throw new Error('Biometric registration cancelled');
    }

    return {
      id: credential.id,
      rawId: Array.from(new Uint8Array(credential.rawId)),
      response: {
        clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
        attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
      },
    };
  } catch (err) {
    throw new Error(`Biometric registration failed: ${err.message}`);
  }
}

/**
 * Authenticate with biometric
 */
export async function authenticateWithBiometric(credentialId) {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge,
        allowCredentials: [
          {
            id: new Uint8Array(credentialId),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'preferred',
        timeout: 60000,
      },
    });

    if (!assertion) {
      throw new Error('Biometric authentication cancelled');
    }

    return {
      id: assertion.id,
      rawId: Array.from(new Uint8Array(assertion.rawId)),
      response: {
        clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
        authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData)),
        signature: Array.from(new Uint8Array(assertion.response.signature)),
      },
    };
  } catch (err) {
    throw new Error(`Biometric authentication failed: ${err.message}`);
  }
}

/**
 * Store biometric credential ID locally
 */
export function saveBiometricCredentialId(credentialId) {
  try {
    localStorage.setItem('ownly_biometric_credential_id', credentialId);
  } catch (err) {
    console.error('Error saving biometric credential ID:', err);
  }
}

/**
 * Get stored biometric credential ID
 */
export function getBiometricCredentialId() {
  try {
    return localStorage.getItem('ownly_biometric_credential_id');
  } catch (err) {
    console.error('Error getting biometric credential ID:', err);
    return null;
  }
}

/**
 * Remove biometric credential
 */
export function removeBiometricCredential() {
  try {
    localStorage.removeItem('ownly_biometric_credential_id');
  } catch (err) {
    console.error('Error removing biometric credential:', err);
  }
}
