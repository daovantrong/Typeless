/**
 * ╔════╗─────────────╔╗───────────────╔╗──────╔════╗╔═══╗╔═══╗╔═╗─╔╗╔═══╗──╔═══╗╔═══╗╔═══╗
 * ║╔╗╔╗║─────────────║║───────────────║║──────║╔╗╔╗║║╔═╗║║╔═╗║║║╚╗║║║╔═╗║──║╔═╗║║╔═╗║║╔═╗║
 * ╚╝║║╚╝╔╗─╔╗╔══╗╔══╗║║───╔══╗╔══╗╔══╗║╚═╦╗─╔╗╚╝║║╚╝║╚═╝║║║─║║║╔╗╚╝║║║─╚╝──║╚═╝║║╚═╝║║║─║║
 * ──║║──║║─║║║╔╗║║║═╣║║─╔╗║║═╣║══╣║══╣║╔╗║║─║║──║║──║╔╗╔╝║║─║║║║╚╗║║║║╔═╗──║╔══╝║╔╗╔╝║║─║║
 * ──║║──║╚═╝║║╚╝║║║═╣║╚═╝║║║═╣╠══║╠══║║╚╝║╚═╝║──║║──║║║╚╗║╚═╝║║║─║║║║╚╩═║╔╗║║───║║║╚╗║╚═╝║
 * ──╚╝──╚═╗╔╝║╔═╝╚══╝╚═══╝╚══╝╚══╝╚══╝╚══╩═╗╔╝──╚╝──╚╝╚═╝╚═══╝╚╝─╚═╝╚═══╝╚╝╚╝───╚╝╚═╝╚═══╝
 * ──────╔═╝║─║║──────────────────────────╔═╝║
 * ──────╚══╝─╚╝──────────────────────────╚══╝
 * 
 * TypeLess - Auto Form Filler
 * v1.0.3 by TRONG.PRO
 */

// Storage management for profiles
const StorageManager = {
  // Get all profiles with soft migration from sync to local
  async getProfiles() {
    try {
      // 1. Try local storage first (New primary)
      let result = await chrome.storage.local.get('profiles');

      // 2. If local is empty, check sync for migration (one-time)
      if (!result.profiles || result.profiles.length === 0) {
        const syncResult = await chrome.storage.sync.get('profiles');
        if (syncResult.profiles && syncResult.profiles.length > 0) {
          // console.log('📦 Migrating profiles from sync to local...');
          await chrome.storage.local.set({ profiles: syncResult.profiles });
          return syncResult.profiles;
        }
      }

      return result.profiles || [];
    } catch (error) {
      if (error.message.includes('Extension context invalidated')) {
        // Cannot use alert() here — this code runs in both content scripts AND the
        // Service Worker (via importScripts). alert() does not exist in SW context
        // and would throw a ReferenceError, crashing the background worker.
        // Content scripts will surface this via the UI when the next action is attempted.
        console.error('[TypeLess] Extension context invalidated. Please reload the page.');
        return [];
      }
      console.error('Error getting profiles:', error);
      return [];
    }
  },

  // Normalize URL for consistent matching
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove query and hash
      let cleanUrl = urlObj.origin + urlObj.pathname;

      // Remove trailing slash
      if (cleanUrl.endsWith('/')) {
        cleanUrl = cleanUrl.slice(0, -1);
      }

      // Remove common index files
      const indexFiles = ['/index.php', '/index.html', '/index.htm', '/default.aspx', '/default.asp'];
      for (const file of indexFiles) {
        if (cleanUrl.endsWith(file)) {
          cleanUrl = cleanUrl.slice(0, -file.length);
          break; // Only remove one level of index file
        }
      }

      return cleanUrl;
    } catch (e) {
      return url; // Fallback
    }
  },

  // Save a new profile — returns {success: bool, isNew: bool}
  async saveProfile(profile) {
    try {
      const profiles = await this.getProfiles();
      const normalizedUrl = this.normalizeUrl(profile.url);

      // Check if profile with same name AND same NORMALIZED URL exists
      const existingIndex = profiles.findIndex(p =>
        p.name === profile.name && this.normalizeUrl(p.url) === normalizedUrl
      );

      let isNew = true;
      if (existingIndex >= 0) {
        // Update existing profile — keep the original ID and creation time
        profiles[existingIndex] = {
          ...profile,
          id: profiles[existingIndex].id,
          createdAt: profiles[existingIndex].createdAt,
          updatedAt: new Date().toISOString()
        };
        isNew = false;
      } else {
        // Add new profile — ensure it has an ID
        const newProfile = {
          ...profile,
          id: profile.id || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          createdAt: profile.createdAt || new Date().toISOString()
        };
        profiles.push(newProfile);
      }

      await chrome.storage.local.set({ profiles });
      return { success: true, isNew };
    } catch (error) {
      console.error('Error saving profile:', error);
      return { success: false, isNew: false };
    }
  },

  // Rename a profile by ID
  async renameProfile(profileId, newName) {
    try {
      newName = (newName || '').trim();
      if (!newName) return false;
      const profiles = await this.getProfiles();
      const idx = profiles.findIndex(p => p.id === profileId);
      if (idx < 0) return false;
      profiles[idx] = { ...profiles[idx], name: newName, updatedAt: new Date().toISOString() };
      await chrome.storage.local.set({ profiles });
      return true;
    } catch (error) {
      console.error('Error renaming profile:', error);
      return false;
    }
  },

  // ── Auto-increment counter for default profile name ──────────────────────
  // Persists across sessions so consecutive saves never collide.
  // Counter is keyed by date string so it resets on new days.
  async getNextProfileCounter(dateKey) {
    try {
      const storageKey = `profileCounter_${dateKey}`;
      const result = await chrome.storage.local.get(storageKey);
      return (result[storageKey] || 0) + 1;
    } catch (e) {
      return 1;
    }
  },

  async consumeProfileCounter(dateKey) {
    try {
      const storageKey = `profileCounter_${dateKey}`;
      const result = await chrome.storage.local.get(storageKey);
      const next = (result[storageKey] || 0) + 1;
      await chrome.storage.local.set({ [storageKey]: next });
      return next;
    } catch (e) {
      return 1;
    }
  },

  // Delete a profile
  async deleteProfile(profileId) {
    try {
      const profiles = await this.getProfiles();
      const filtered = profiles.filter(p => p.id !== profileId);
      await chrome.storage.local.set({ profiles: filtered });
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  },

  // Get a specific profile by ID
  async getProfile(profileId) {
    const profiles = await this.getProfiles();
    return profiles.find(p => p.id === profileId);
  },

  // Get toolbar visibility setting
  async getToolbarVisible() {
    try {
      const result = await chrome.storage.local.get('toolbarVisible');
      return result.toolbarVisible === true; // Default to false (minimized)
    } catch (error) {
      console.error('Error getting toolbar visibility:', error);
      return true;
    }
  },

  // Set toolbar visibility
  async setToolbarVisible(visible) {
    try {
      await chrome.storage.local.set({ toolbarVisible: visible });
      return true;
    } catch (error) {
      console.error('Error setting toolbar visibility:', error);
      return false;
    }
  },

  // Get toolbar hidden state (completely hidden with X button)
  async getToolbarHidden() {
    try {
      const result = await chrome.storage.local.get('toolbarHidden');
      return result.toolbarHidden === true;
    } catch (error) {
      console.error('Error getting toolbar hidden state:', error);
      return false;
    }
  },

  // Set toolbar hidden state (completely hidden with X button)
  async setToolbarHidden(hidden) {
    try {
      await chrome.storage.local.set({ toolbarHidden: hidden });
      return true;
    } catch (error) {
      console.error('Error setting toolbar hidden state:', error);
      return false;
    }
  },

  // --- Global Settings (Local) ---

  async getGlobalSettings() {
    try {
      // Try local first
      let result = await chrome.storage.local.get('globalSettings');

      // Migration from sync if local is empty
      if (!result.globalSettings) {
        const syncResult = await chrome.storage.sync.get('globalSettings');
        if (syncResult.globalSettings) {
          await chrome.storage.local.set({ globalSettings: syncResult.globalSettings });
          return syncResult.globalSettings;
        }
      }
      return result.globalSettings || null;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  },

  async setGlobalSettings(settings) {
    try {
      await chrome.storage.local.set({ globalSettings: settings });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },

  // Get full backup data (profiles + settings + metadata)
  async getBackupData() {
    try {
      const profiles = await this.getProfiles();
      const settings = (await this.getGlobalSettings()) || {};
      return {
        _version: '1.2',
        _exportedAt: new Date().toISOString(),
        _count: profiles.length,
        // Field schema (v1.2): each field may contain:
        //   { id, selector, label, value, displayText, type, name,
        //     focusAfterFill: boolean }  ← NEW in v1.2
        profiles,
        settings
      };
    } catch (error) {
      console.error('Error getting backup data:', error);
      return { _version: '1.2', profiles: [], settings: {} };
    }
  },

  // Validate a single profile object from import
  _isValidProfile(profile) {
    return (
      profile &&
      typeof profile === 'object' &&
      !Array.isArray(profile) &&
      typeof profile.name === 'string' &&
      profile.name.trim() !== '' &&
      Array.isArray(profile.fields)
    );
  },

  // Restore full backup data — returns detailed stats
  async restoreBackupData(data) {
    try {
      let added   = 0;
      let updated = 0;
      let skipped = 0;
      let settingsRestored = false;

      // Handle all import formats:
      //   - plain array:          [{name, fields, ...}, ...]
      //   - backup object:        {profiles: [...], settings: {...}, _version: ...}
      //   - single profile copy:  {id, name, fields, url, ...}
      //
      // v1.2 compatibility: fields may include focusAfterFill (boolean).
      // Older exports without this field are imported as-is (defaults to false).
      const importVersion = (!Array.isArray(data) && data._version) ? data._version : null;

      const profilesToRestore = Array.isArray(data) ? data
        : Array.isArray(data.profiles) ? data.profiles
        : this._isValidProfile(data) ? [data]   // single profile pasted from "copy" button
        : [];

      for (const profile of profilesToRestore) {
        if (!this._isValidProfile(profile)) {
          skipped++;
          continue;
        }
        // Normalise fields: ensure focusAfterFill is always a boolean
        if (Array.isArray(profile.fields)) {
          profile.fields = profile.fields.map(f => ({
            ...f,
            focusAfterFill: f.focusAfterFill === true
          }));
        }
        const result = await this.saveProfile(profile);
        if (result.success) {
          if (result.isNew) added++;
          else updated++;
        } else {
          skipped++;
        }
      }

      // Restore settings if present
      if (!Array.isArray(data) && data.settings && typeof data.settings === 'object') {
        await this.setGlobalSettings(data.settings);
        settingsRestored = true;
      }

      return { count: added + updated, added, updated, skipped, settingsRestored };
    } catch (error) {
      console.error('Error restoring backup data:', error);
      return { count: 0, added: 0, updated: 0, skipped: 0, settingsRestored: false, error: error.message };
    }
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
}

/**
 * End of storage.js
* ╔══╗─────────╔╗────╔═╗╔═╗╔╗───╔══╗╔═╗╔═╗╔═╦╗╔══╗──╔═╗╔═╗╔═╗
* ╚╗╔╝╔╦╗╔═╗╔═╗║║─╔═╗║═╣║═╣║╚╦╦╗╚╗╔╝║╬║║║║║║║║║╔═╣──║╬║║╬║║║║
* ─║║─║║║║╬║║╩╣║╚╗║╩╣╠═║╠═║║╬║║║─║║─║╗╣║║║║║║║║╚╗║╔╗║╔╝║╗╣║║║
* ─╚╝─╠╗║║╔╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╬╗║─╚╝─╚╩╝╚═╝╚╩═╝╚══╝╚╝╚╝─╚╩╝╚═╝
* ────╚═╝╚╝──────────────────╚═╝
 */
