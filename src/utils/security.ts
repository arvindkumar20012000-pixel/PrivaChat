/**
 * Client-side security utilities: Device identification, PIN lock verification, and persistence.
 */

const PIN_STORAGE_KEY = 'secret_chat_app_pin';
const CLIENT_ID_STORAGE_KEY = 'secret_chat_client_device_id';
export const DEFAULT_PIN = '1402';

/**
 * Validates whether a PIN consists of exactly 4 digits.
 */
export function isPinValidFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * Check if the user has already configured their custom 4-digit PIN.
 */
export function hasUserSetPin(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(PIN_STORAGE_KEY);
    return Boolean(saved && isPinValidFormat(saved));
  } catch {
    return false;
  }
}

/**
 * Retrieve the configured PIN or return default fallback.
 */
export function getStoredPin(): string {
  if (typeof window === 'undefined') return DEFAULT_PIN;
  try {
    const saved = localStorage.getItem(PIN_STORAGE_KEY);
    if (saved && isPinValidFormat(saved)) {
      return saved;
    }
  } catch {
    // LocalStorage unavailable
  }
  return DEFAULT_PIN;
}

/**
 * Save a new 4-digit PIN.
 */
export function saveStoredPin(newPin: string): boolean {
  if (!isPinValidFormat(newPin)) return false;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PIN_STORAGE_KEY, newPin);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Verify entered PIN against the stored PIN.
 */
export function verifyPin(enteredPin: string, targetPin?: string): boolean {
  const actual = targetPin || getStoredPin();
  return enteredPin === actual;
}

/**
 * Retrieve or generate a persistent unique device client ID for 1-on-1 real chat.
 */
export function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return 'client_node';
  try {
    let id = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
      localStorage.setItem(CLIENT_ID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'usr_temp_' + Math.random().toString(36).substring(2, 9);
  }
}
