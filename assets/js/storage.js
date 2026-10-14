/**
 * CraftCV - Storage Module
 * Resilient localStorage management with try/catch wrapping and in-memory fallback
 */

window.CraftCVStorage = window.CVForgeStorage = (() => {
  const STORAGE_KEY = 'craftcv_data_v1';
  const LEGACY_STORAGE_KEY = 'cvforge_data_v1';
  let memoryFallback = null;

  /**
   * Check if localStorage is supported and accessible
   * @returns {boolean}
   */
  function isStorageAvailable() {
    try {
      const testKey = '__craftcv_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  const hasStorage = isStorageAvailable();

  /**
   * Save resume data and preferences
   * @param {Object} data 
   * @returns {boolean}
   */
  function saveState(data) {
    try {
      const serialized = JSON.stringify(data);
      if (hasStorage) {
        window.localStorage.setItem(STORAGE_KEY, serialized);
      } else {
        memoryFallback = serialized;
      }
      return true;
    } catch (err) {
      console.warn('CraftCV: Storage save failed, fallback used', err);
      memoryFallback = JSON.stringify(data);
      return false;
    }
  }

  /**
   * Load saved resume data and preferences
   * @returns {Object|null}
   */
  function loadState() {
    try {
      let raw = null;
      if (hasStorage) {
        raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
      } else {
        raw = memoryFallback;
      }
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('CraftCV: Storage load failed', err);
      return null;
    }
  }

  /**
   * Clear all stored resume data
   * @returns {boolean}
   */
  function clearState() {
    try {
      if (hasStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      memoryFallback = null;
      return true;
    } catch (err) {
      console.warn('CraftCV: Storage clear failed', err);
      memoryFallback = null;
      return false;
    }
  }

  return {
    saveState,
    loadState,
    clearState,
    isStorageAvailable
  };
})();
