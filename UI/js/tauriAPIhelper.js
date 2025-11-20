// UI/js/tauriApiHelper.js

/* ====== Tauri API Helper ====== */

/**
 * Wrapper untuk invoke dengan error handling
 * @param {string} command - Nama Tauri command
 * @param {object} params - Parameters untuk command
 * @returns {Promise<any>} - Data dari response
 * @throws {Error} - Jika terjadi error
 */
export async function invokeCommand(command, params = {}) {
  try {
    // Memastikan API Tauri tersedia
    if (!window.__TAURI__ || !window.__TAURI__.invoke) {
      throw new Error("Tauri API (window.__TAURI__.invoke) not found.");
    }
    
    const response = await window.__TAURI__.invoke(command, params);
    
    if (response && typeof response === 'object') {
      if (response.success === false) {
        throw new Error(response.error || 'Unknown error');
      }
      return response.data !== undefined ? response.data : response;
    }
    
    return response;
  } catch (error) {
    console.error(`Error invoking ${command}:`, error);
    throw error;
  }
}
