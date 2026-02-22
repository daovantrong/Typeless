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
 * v1.0.2 by TRONG.PRO
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
        alert('⚠️ Extension đã được reload!\n\nVui lòng RELOAD trang này (F5) để tiếp tục sử dụng.');
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

  // Save a new profile
  async saveProfile(profile) {
    try {
      const profiles = await this.getProfiles();
      const normalizedUrl = this.normalizeUrl(profile.url);

      // Check if profile with same name AND same NORMALIZED URL exists
      const existingIndex = profiles.findIndex(p =>
        p.name === profile.name && this.normalizeUrl(p.url) === normalizedUrl
      );

      if (existingIndex >= 0) {
        // Update existing profile - keep the original ID and creation time
        profiles[existingIndex] = {
          ...profile,
          id: profiles[existingIndex].id, // Keep original ID
          createdAt: profiles[existingIndex].createdAt, // Keep original creation time
          updatedAt: new Date().toISOString()
        };
        // console.log('📝 Updated existing profile:', profile.name);
      } else {
        // Add new profile - ensure it has an ID
        const newProfile = {
          ...profile,
          id: profile.id || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          createdAt: profile.createdAt || new Date().toISOString()
        };
        profiles.push(newProfile);
        // console.log('✅ Added new profile:', profile.name);
      }

      await chrome.storage.local.set({ profiles });
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      return false;
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

  // Get full backup data (profiles + settings)
  async getBackupData() {
    try {
      const profiles = await this.getProfiles();
      const settings = (await this.getGlobalSettings()) || {};
      return { profiles, settings };
    } catch (error) {
      console.error('Error getting backup data:', error);
      return { profiles: [], settings: {} };
    }
  },

  // Restore full backup data
  async restoreBackupData(data) {
    try {
      let restoredCount = 0;
      let settingsRestored = false;

      // Handle legacy format (array of profiles)
      const profilesToRestore = Array.isArray(data) ? data : (data.profiles || []);

      // Restore profiles
      for (const profile of profilesToRestore) {
        if (await this.saveProfile(profile)) {
          restoredCount++;
        }
      }

      // Restore settings if present
      if (data.settings && typeof data.settings === 'object' && !Array.isArray(data)) {
        await this.setGlobalSettings(data.settings);
        settingsRestored = true;
      }

      return { count: restoredCount, settingsRestored };
    } catch (error) {
      console.error('Error restoring backup data:', error);
      return { count: 0, settingsRestored: false, error: error.message };
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
