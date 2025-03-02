// A unique salt for your application
const APP_SALT = 'multi-chat-app-salt-' + (process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'default-salt');

// Session timeout in milliseconds (default: 8 hours)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000;
const SESSION_LAST_ACTIVE_KEY = 'multi-chat-last-active';

/**
 * Updates the last active timestamp
 */
export function updateLastActive(): void {
  try {
    localStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error updating last active timestamp:', error);
  }
}

/**
 * Checks if the session has timed out
 * @returns True if the session has timed out, false otherwise
 */
export function hasSessionTimedOut(): boolean {
  try {
    const lastActiveStr = localStorage.getItem(SESSION_LAST_ACTIVE_KEY);
    if (!lastActiveStr) return false; // No last active timestamp, assume first visit
    
    const lastActive = parseInt(lastActiveStr, 10);
    const now = Date.now();
    
    return now - lastActive > SESSION_TIMEOUT;
  } catch (error) {
    console.error('Error checking session timeout:', error);
    return false;
  }
}

/**
 * Clears all API keys from localStorage if the session has timed out
 * @returns True if keys were cleared, false otherwise
 */
export function clearKeysIfTimedOut(): boolean {
  if (hasSessionTimedOut()) {
    try {
      // Find all API key items in localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith('_api_key')) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all API keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Update last active timestamp
      updateLastActive();
      
      return keysToRemove.length > 0;
    } catch (error) {
      console.error('Error clearing API keys:', error);
      return false;
    }
  }
  
  // Update last active timestamp
  updateLastActive();
  return false;
}

/**
 * Encrypts an API key before storing it in localStorage
 * @param key The API key to encrypt
 * @returns The encrypted key
 */
export function encryptApiKey(key: string): string {
  if (!key) return '';
  
  try {
    // Simple encryption using base64 encoding with a salt
    // For production, consider using a more robust encryption library
    const saltedKey = key + APP_SALT;
    return btoa(encodeURIComponent(saltedKey));
  } catch (error) {
    console.error('Error encrypting API key:', error);
    return '';
  }
}

/**
 * Decrypts an API key retrieved from localStorage
 * @param encryptedKey The encrypted API key
 * @returns The decrypted key
 */
export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  
  try {
    // Check if the key is already in plain text (not base64 encoded)
    // This helps with backward compatibility for existing keys
    if (encryptedKey.includes('sk-') || encryptedKey.includes('xai-') || 
        encryptedKey.includes('anthropic') || encryptedKey.includes('AIza')) {
      return encryptedKey;
    }
    
    // Try to decode the key
    try {
      // Check if we're dealing with a double-encoded key
      // This can happen if the migration process ran multiple times
      let decodedKey = encryptedKey;
      
      // Try to decode up to 3 times to handle multiple layers of encoding
      for (let i = 0; i < 3; i++) {
        try {
          const decoded = atob(decodedKey);
          decodedKey = decoded;
          
          // If we find a key pattern, we've decoded enough
          if (decoded.includes('sk-') || decoded.includes('xai-') || 
              decoded.includes('anthropic') || decoded.includes('AIza')) {
            break;
          }
        } catch (e) {
          break;
        }
      }
      
      // Try to decode URI component if needed
      try {
        decodedKey = decodeURIComponent(decodedKey);
      } catch (e) {
        // Not URI encoded, continue with current value
      }
      
      // Remove the salt if present
      const result = decodedKey.replace(APP_SALT, '');
      
      // Validate the result looks like an API key
      if (result.includes('sk-') || result.includes('xai-') || 
          result.includes('anthropic') || result.includes('AIza')) {
        return result;
      } else {
        // If the key is very long, it might be corrupted - try to find a valid key pattern
        if (result.length > 100) {
          const openaiMatch = result.match(/sk-[a-zA-Z0-9]{48}/);
          if (openaiMatch) {
            return openaiMatch[0];
          }
          
          const anthropicMatch = result.match(/sk-ant-[a-zA-Z0-9]{40,}/);
          if (anthropicMatch) {
            return anthropicMatch[0];
          }
          
          const googleMatch = result.match(/AIza[a-zA-Z0-9_-]{35}/);
          if (googleMatch) {
            return googleMatch[0];
          }
        }
        
        // If we can't find a valid pattern, return the original key
        return encryptedKey;
      }
    } catch (e) {
      // If decoding fails, return the original key
      // This handles the case where the key was stored without encryption
      return encryptedKey;
    }
  } catch (error) {
    console.error('Error decrypting API key:', error);
    throw new Error('Error decrypting API key: ' + error);
  }
}

/**
 * Stores an API key in localStorage with encryption
 * @param provider The provider name (e.g., 'openai', 'anthropic')
 * @param key The API key to store
 */
export function storeApiKey(provider: string, key: string): void {
  if (!provider || !key) return;
  
  try {
    // Update last active timestamp
    updateLastActive();
    
    // Encrypt the key
    const encryptedKey = encryptApiKey(key);
    if (!encryptedKey) {
      console.error(`Failed to encrypt API key for ${provider}`);
      return;
    }
    
    // Store in localStorage
    const storageKey = `${provider.toLowerCase()}_api_key`;
    localStorage.setItem(storageKey, encryptedKey);
  } catch (error) {
    console.error(`Error storing API key for ${provider}:`, error);
  }
}

/**
 * Retrieves and decrypts an API key from localStorage
 * @param provider The provider name (e.g., 'openai', 'anthropic')
 * @returns The decrypted API key or an empty string if not found
 */
export function retrieveApiKey(provider: string): string {
  if (!provider) return '';
  
  try {
    // Check for session timeout and clear keys if needed
    clearKeysIfTimedOut();
    
    // Update last active timestamp
    updateLastActive();
    
    const storageKey = `${provider.toLowerCase()}_api_key`;
    const encryptedKey = localStorage.getItem(storageKey);
    if (!encryptedKey) {
      return '';
    }
    
    try {
      const decryptedKey = decryptApiKey(encryptedKey);
      return decryptedKey;
    } catch (decryptError) {
      console.error(`Error decrypting API key for ${provider}:`, decryptError);
      
      // If decryption fails, return the raw key as fallback
      // This ensures backward compatibility with existing keys
      return encryptedKey;
    }
  } catch (error) {
    console.error(`Error retrieving API key for ${provider}:`, error);
    return '';
  }
}

/**
 * Removes an API key from localStorage
 * @param provider The provider name (e.g., 'openai', 'anthropic')
 */
export function removeApiKey(provider: string): void {
  if (!provider) return;
  
  try {
    localStorage.removeItem(`${provider.toLowerCase()}_api_key`);
  } catch (error) {
    console.error(`Error removing API key for ${provider}:`, error);
  }
}

/**
 * Checks if an API key exists for a provider
 * @param provider The provider name
 * @returns True if an API key exists, false otherwise
 */
export function hasApiKey(provider: string): boolean {
  if (!provider) return false;
  
  try {
    const key = retrieveApiKey(provider);
    return !!key;
  } catch (error) {
    return false;
  }
}

/**
 * Migrates existing API keys to the new encryption format
 * This helps with backward compatibility for existing keys
 */
export function migrateExistingKeys(): void {
  try {
    // Find all API key items in localStorage
    const keysToMigrate = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith('_api_key')) {
        keysToMigrate.push(key);
      }
    }
    
    // Re-encrypt all API keys
    keysToMigrate.forEach(storageKey => {
      const rawValue = localStorage.getItem(storageKey);
      if (!rawValue) return;
      
      // Extract provider from storage key
      const provider = storageKey.replace('_api_key', '');
      
      // Try to extract a valid API key
      let validKey = rawValue;
      
      // Check if the key is already a valid API key
      if (rawValue.includes('sk-') || rawValue.includes('xai-') || 
          rawValue.includes('anthropic') || rawValue.includes('AIza')) {
        // Key is already valid
      } else {
        // Try to decode and find a valid key pattern
        try {
          // Try to decode up to 3 times
          let decodedValue = rawValue;
          for (let i = 0; i < 3; i++) {
            try {
              decodedValue = atob(decodedValue);
              if (decodedValue.includes('sk-') || decodedValue.includes('xai-') || 
                  decodedValue.includes('anthropic') || decodedValue.includes('AIza')) {
                validKey = decodedValue;
                break;
              }
            } catch (e) {
              break;
            }
          }
          
          // If still not found, try regex patterns
          if (!validKey.includes('sk-') && !validKey.includes('xai-') && 
              !validKey.includes('anthropic') && !validKey.includes('AIza')) {
            
            const openaiMatch = validKey.match(/sk-[a-zA-Z0-9]{48}/);
            if (openaiMatch) {
              validKey = openaiMatch[0];
            } else {
              const anthropicMatch = validKey.match(/sk-ant-[a-zA-Z0-9]{40,}/);
              if (anthropicMatch) {
                validKey = anthropicMatch[0];
              } else {
                const googleMatch = validKey.match(/AIza[a-zA-Z0-9_-]{35}/);
                if (googleMatch) {
                  validKey = googleMatch[0];
                }
              }
            }
          }
        } catch (e) {
          // Could not extract valid key
        }
      }
      
      // If we have a valid key, store it properly
      if (validKey) {
        try {
          // Remove the old key
          localStorage.removeItem(storageKey);
          
          // Store with proper encryption
          storeApiKey(provider, validKey);
        } catch (error) {
          console.error(`Error migrating API key for ${provider}:`, error);
          
          // If migration fails, restore the original key
          localStorage.setItem(storageKey, rawValue);
        }
      }
    });
  } catch (error) {
    console.error('Error migrating API keys:', error);
  }
}

/**
 * Completely resets all API keys in localStorage
 * Use this as a last resort if keys are corrupted
 */
export function resetAllApiKeys(): void {
  try {
    // Find all API key items in localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith('_api_key')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all API keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error resetting API keys:', error);
  }
}

// Initialize when this module is imported
if (typeof window !== 'undefined') {
  // Migrate existing keys
  migrateExistingKeys();
  
  // Check for session timeout
  clearKeysIfTimedOut();
} 