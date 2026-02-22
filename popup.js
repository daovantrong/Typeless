console.log(`%c
╔════╗─────────────╔╗───────────────╔╗──────╔════╗╔═══╗╔═══╗╔═╗─╔╗╔═══╗──╔═══╗╔═══╗╔═══╗
║╔╗╔╗║─────────────║║───────────────║║──────║╔╗╔╗║║╔═╗║║╔═╗║║║╚╗║║║╔═╗║──║╔═╗║║╔═╗║║╔═╗║
╚╝║║╚╝╔╗─╔╗╔══╗╔══╗║║───╔══╗╔══╗╔══╗║╚═╦╗─╔╗╚╝║║╚╝║╚═╝║║║─║║║╔╗╚╝║║║─╚╝──║╚═╝║║╚═╝║║║─║║
──║║──║║─║║║╔╗║║║═╣║║─╔╗║║═╣║══╣║══╣║╔╗║║─║║──║║──║╔╗╔╝║║─║║║║╚╗║║║║╔═╗──║╔══╝║╔╗╔╝║║─║║
──║║──║╚═╝║║╚╝║║║═╣║╚═╝║║║═╣╠══║╠══║║╚╝║╚═╝║──║║──║║║╚╗║╚═╝║║║─║║║║╚╩═║╔╗║║───║║║╚╗║╚═╝║
──╚╝──╚═╗╔╝║╔═╝╚══╝╚═══╝╚══╝╚══╝╚══╝╚══╩═╗╔╝──╚╝──╚╝╚═╝╚═══╝╚╝─╚═╝╚═══╝╚╝╚╝───╚╝╚═╝╚═══╝
──────╔═╝║─║║──────────────────────────╔═╝║
──────╚══╝─╚╝──────────────────────────╚══╝

TypeLess - Auto Form Filler
v1.0.2 by TRONG.PRO
`, 'color: #667eea; font-weight: bold;');

// Popup script for profile management
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize i18n
    await i18n.init();
    translateUI();

    // Listen for language changes
    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area === 'local' && changes.language) {
            const newLang = changes.language.newValue;
            if (newLang && newLang !== i18n.currentLang) {
                await i18n.setLocale(newLang); // reload translation JSON
                translateUI();
            }
        }
    });

    initTabs();
    await loadProfiles();

    // New features
    initUtilities();
    await initUserAgent();

    attachEventListeners();
});

// Translate UI elements
function translateUI() {
    const t = (key) => i18n.t(key);

    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.innerHTML = t(key);
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });

    // Translate titles
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });

}

// Load and display all profiles
// --- Tab Switching Logic ---
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}



async function loadProfiles() {
    const container = document.getElementById('profilesContainer');
    const profiles = await StorageManager.getProfiles();
    const t = (key, params) => i18n.t(key, params);

    if (profiles.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><img src="icons/empty.svg" style="width: 48px; height: 48px; filter: invert(0.5);"></div>
        <p>${t('popup.empty')}</p>
        <p style="margin-top: 5px; font-size: 11px;">${t('popup.empty_hint')}</p>
      </div>
    `;
        return;
    }

    container.innerHTML = profiles.map(profile => `
    <div class="profile-item">
      <div class="profile-header">
        <div class="profile-name">${escapeHtml(profile.name)}</div>
        <div class="profile-actions">
          <button class="icon-btn apply-btn" data-profile-id="${profile.id}" title="${t('btn.apply_tooltip')}">
            <img src="icons/play.svg" class="icon-img">
          </button>
          <button class="icon-btn copy-btn" data-profile-id="${profile.id}" title="${t('btn.copy_tooltip')}">
            <img src="icons/copy.svg" class="icon-img">
          </button>
          <button class="icon-btn delete-btn" data-profile-id="${profile.id}" title="${t('btn.delete_profile')}">
            <img src="icons/delete.svg" class="icon-img">
          </button>
        </div>
      </div>
      <div class="profile-info">
        <span><img src="icons/description.svg" class="icon-img" style="width:12px; height:12px;"> ${t('field.count', { count: profile.fields?.length || 0 })}</span>
        ${profile.createdAt ? `<span><img src="icons/calendar.svg" class="icon-img" style="width:12px; height:12px;"> ${new Date(profile.createdAt).toLocaleDateString(i18n.currentLang === 'vi' ? 'vi-VN' : 'en-US')}</span>` : ''}
      </div>
      ${profile.url ? `<div class="profile-url" title="${escapeHtml(profile.url)}"><img src="icons/link.svg" class="icon-img" style="width:12px; height:12px; vertical-align:middle"> ${escapeHtml(profile.url)}</div>` : ''}
    </div>
  `).join('');

    // Attach profile action listeners
    container.querySelectorAll('.apply-btn').forEach(btn => {
        btn.addEventListener('click', () => applyProfile(btn.dataset.profileId));
    });

    container.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => copyProfile(btn.dataset.profileId));
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteProfile(btn.dataset.profileId));
    });
}

// Copy a single profile
async function copyProfile(profileId) {
    const t = (key) => i18n.t(key);
    const profile = await StorageManager.getProfile(profileId);
    if (!profile) return;

    try {
        await navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
        showNotification(t('notify.copied'));
    } catch (err) {
        console.error('Failed to copy: ', err);
        showNotification(t('alert.error_copy'), 'error');
    }
}

function attachEventListeners() {
    const t = (key, params) => i18n.t(key, params);

    // Open Options Page
    document.getElementById('btn-open-options')?.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });

    // Donation
    document.getElementById('copy-usdt')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText('0x5E5b642C979401C3138379C314d1E229bDD31070');
        // Simple tooltip or alert
        const originalText = e.target.textContent;
        e.target.textContent = i18n.t('notify.copied');
        setTimeout(() => {
            e.target.textContent = originalText;
        }, 1500);
    });



    // Language switcher
    document.getElementById('langBtn')?.addEventListener('click', async () => {
        await i18n.switchLanguage();
        translateUI();
    });

    document.getElementById('btn-ua-settings')?.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Show/Hide Toolbar button (Toggle visibility)
    document.getElementById('showToolbar')?.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: 'toggleHideToolbar' }, (response) => {
            if (chrome.runtime.lastError) {
                showNotification('Error: ' + chrome.runtime.lastError.message, 'error');
            }
        });
    });

    // --- Tools Tab Actions ---

    // --- Tools Tab Actions ---

    // Unlock Right Click
    document.getElementById('btn-unlock-right-click')?.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: 'triggerEnableRightClick' });
        closeAndNotify(t('notify.right_click_enabled'));
    });

    // Copy Profiles (Backup All)
    document.getElementById('btn-copy-profiles')?.addEventListener('click', async () => {
        const backupData = await StorageManager.getBackupData();
        try {
            await navigator.clipboard.writeText(JSON.stringify(backupData, null, 2));
            showNotification(t('notify.copied_all'));
        } catch (err) {
            console.error('Failed to copy: ', err);
            showNotification(t('alert.error_copy'), 'error');
        }
    });

    // Paste Profiles
    document.getElementById('btn-paste-profiles')?.addEventListener('click', async () => {
        try {
            // Updated Logic for new backup format
            const text = await navigator.clipboard.readText();
            let importedData;
            try {
                importedData = JSON.parse(text);
            } catch (e) {
                throw new Error('Invalid JSON');
            }

            const result = await StorageManager.restoreBackupData(importedData);

            if (result.count > 0 || result.settingsRestored) {
                showNotification(t('notify.pasted'));
                await loadProfiles();
                // If settings restored, reload settings form
                if (result.settingsRestored) {
                    await loadSettings();
                }

                // Also refresh toolbar
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) chrome.tabs.sendMessage(tab.id, { action: 'refreshProfiles' });
            } else {
                if (result.error) throw new Error(result.error);
                showNotification(t('alert.no_fields'), 'error'); // Fallback error
            }

        } catch (e) {
            showNotification(t('alert.invalid_json'), 'error');
        }
    });

    // Export Profiles
    document.getElementById('btn-export-profiles')?.addEventListener('click', async () => {
        const backupData = await StorageManager.getBackupData();
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auto-form-filler-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification(t('notify.exported', { count: backupData.profiles.length }));
    });

    // Save Rendered HTML
    document.getElementById('btn-save-html')?.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        chrome.tabs.sendMessage(tab.id, { action: 'getRenderedHTML' }, (response) => {
            if (response && response.html) {
                const blob = new Blob([response.html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const filename = (tab.title || 'page').replace(/[^a-z0-9]/gi, '_').substring(0, 50) + '.html';
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });

        closeAndNotify(t('notify.html_saved') || 'HTML saved to Downloads');
    });

    // Import Profiles
    document.getElementById('btn-import-profiles')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const importedData = JSON.parse(text);

                const result = await StorageManager.restoreBackupData(importedData);

                showNotification(t('notify.imported', { added: result.count, skipped: 0 }));

                await loadProfiles();
                if (result.settingsRestored) {
                    await loadSettings();
                }

                // Refresh toolbar
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) chrome.tabs.sendMessage(tab.id, { action: 'refreshProfiles' });

            } catch (error) {
                console.error(error);
                showNotification(t('alert.error_import'), 'error');
            }
        };
        input.click();
    });
}

// Apply a profile to the current page
async function applyProfile(profileId) {
    const t = (key, params) => i18n.t(key, params);
    const profile = await StorageManager.getProfile(profileId);

    if (!profile) {
        showNotification(t('alert.profile_not_found'), 'error');
        return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        showNotification(t('alert.page_not_supported'), 'error');
        return;
    }

    chrome.tabs.sendMessage(tab.id, {
        action: 'fillForm',
        profile: profile
    }, (response) => {
        if (chrome.runtime.lastError) {
            showNotification(t('alert.error_apply'), 'error');
        } else {
            // Apply shouldn't use system notification, user didn't ask for it.
            // But let's check user request again.
            // "hãy đóng popup ngay sau khi người dùng bấm các nút chức năng chỉ hiển thị text thông báo: +Utilities... +User Agent..."
            // It seems "Utilities" list and "User Agent" list are the target.
            // Apply Profile is not in that list.
            showNotification(`<img src="icons/check.svg" class="icon-img"> ${t('notify.applied', { name: profile.name })}`);
            setTimeout(() => window.close(), 1000);
        }
    });
}

// Delete a profile
async function deleteProfile(profileId) {
    const t = (key, params) => i18n.t(key, params);
    const profile = await StorageManager.getProfile(profileId);

    if (!profile) return;

    const confirmed = confirm(t('confirm.delete', { name: profile.name }));

    if (!confirmed) return;

    const success = await StorageManager.deleteProfile(profileId);

    if (success) {
        showNotification(`<img src="icons/delete.svg" class="icon-img"> ${t('notify.deleted', { name: profile.name })}`);
        await loadProfiles();

        // Notify content script to refresh its list too
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.tabs.sendMessage(tab.id, { action: 'refreshProfiles' });
        }
    } else {
        showNotification(t('alert.error_delete'), 'error');
    }
}

// Show notification in popup
function showNotification(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.innerHTML = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close popup and show in-page notification on the active tab
function closeAndNotify(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: 'showNotification', message })
                .catch(() => {}); // ignore if content script not present
        }
    });
    window.close();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize Utilities (CRX, Screenshot)
 */
function initUtilities() {
    // Screenshot Full
    document.getElementById('btn-screenshot-full')?.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (tab) {
                chrome.runtime.sendMessage({ action: 'captureFullScreenshot', tabId: tab.id });
                closeAndNotify('Taking full page screenshot...');
            }
        });
    });

    // Screenshot Visible
    document.getElementById('btn-screenshot')?.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.runtime.sendMessage({ action: 'captureVisibleScreenshotAndSave', tabId: tab.id });
                closeAndNotify('Taking screenshot...');
            }
        } catch (e) {
            console.error(e);
        }
    });
}

/**
 * Generate default User Agents based on current browser version
 */
function getDefaultUserAgents() {
    // Extract Chrome version from current UA
    const match = navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    const chromeVersion = match ? match[1] : '130.0.0.0';

    // Extract major version for Apple WebKit/Version (simplification)
    const majorVersion = chromeVersion.split('.')[0];

    return {
        // Android 17 - Samsung Galaxy S25 Ultra
        'ua_android': `Mozilla/5.0 (Linux; Android 16; SM-S938B Build/BP2A.250605.031.A3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36`,

        // iOS 26.3 - iPhone 17 Pro Max
        'ua_ios': `Mozilla/5.0 (iPhone; CPU iPhone OS 26_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Chrome/${chromeVersion} Safari/604.1`,

        'ua_macos': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`,
        'ua_windows': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`,
        'ua_linux': `Mozilla/5.0 (Linux x86_64; Ubuntu 25.04) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
    };
}

/**
 * Initialize User Agent Switcher
 */
async function initUserAgent() {
    const uaStatus = document.getElementById('ua-status');
    const defaults = getDefaultUserAgents();

    // Load custom UAs from storage
    const settings = await chrome.storage.local.get(Object.keys(defaults));

    const uas = {
        'default': '', // Clear rule = use browser default
        'android': settings.ua_android || defaults.ua_android,
        'ios':     settings.ua_ios     || defaults.ua_ios,
        'macos':   settings.ua_macos   || defaults.ua_macos,
        'windows': settings.ua_windows || defaults.ua_windows,
        'linux':   settings.ua_linux   || defaults.ua_linux
    };

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    // Helper: apply highlight to whichever button matches currentUA
    function highlightActive(currentUA) {
        let anyActive = false;
        document.querySelectorAll('.ua-btn').forEach(btn => {
            const type = btn.dataset.ua;
            // "default" is active when no UA override is stored (empty string)
            const isActive = (type === 'default')
                ? !currentUA
                : (!!currentUA && currentUA === uas[type]);

            btn.style.background = isActive ? 'var(--primary-color, #667eea)' : '';
            btn.style.color      = isActive ? 'white' : '';
            if (isActive) {
                anyActive = true;
                if (uaStatus) {
                    uaStatus.textContent = type === 'default'
                        ? 'Using default User-Agent'
                        : `Active: ${type}`;
                }
            }
        });
        // Safety net: if nothing matched always fall back to "Default"
        if (!anyActive) {
            const defaultBtn = document.querySelector('.ua-btn[data-ua="default"]');
            if (defaultBtn) {
                defaultBtn.style.background = 'var(--primary-color, #667eea)';
                defaultBtn.style.color = 'white';
                if (uaStatus) uaStatus.textContent = 'Using default User-Agent';
            }
        }
    }

    // STEP 1 — Attach click handlers unconditionally, before any async call.
    // BUG FIX: previously all handlers were wired inside the getUserAgent callback,
    // so if that response was null/error the buttons were permanently unresponsive.
    document.querySelectorAll('.ua-btn').forEach(btn => {
        const type = btn.dataset.ua;
        btn.addEventListener('click', () => {
            const targetUA = uas[type];
            const label = type === 'default'
                ? 'User-Agent reset to Default'
                : `User-Agent switched to ${type.charAt(0).toUpperCase() + type.slice(1)}`;

            // BUG FIX: wait for background ACK before reloading.
            // Previously chrome.tabs.reload() fired immediately after sendMessage(),
            // causing a race where the tab loaded before updateSessionRules() finished,
            // so the new UA rule was not yet active on that first navigation.
            chrome.runtime.sendMessage(
                { action: 'setUserAgent', tabId: tab.id, userAgent: targetUA },
                () => {
                    chrome.tabs.reload(tab.id);
                    closeAndNotify(label);
                }
            );
        });
    });

    // STEP 2 — Optimistic UI: show "Default" selected immediately.
    highlightActive('');

    // STEP 3 — Fetch real state and correct highlight if needed.
    chrome.runtime.sendMessage({ action: 'getUserAgent', tabId: tab.id }, (response) => {
        if (chrome.runtime.lastError || !response || response.error) return;
        highlightActive(response.userAgent || '');
    });
}



/**
 * End of popup.js
* ╔══╗─────────╔╗────╔═╗╔═╗╔╗───╔══╗╔═╗╔═╗╔═╦╗╔══╗──╔═╗╔═╗╔═╗
* ╚╗╔╝╔╦╗╔═╗╔═╗║║─╔═╗║═╣║═╣║╚╦╦╗╚╗╔╝║╬║║║║║║║║║╔═╣──║╬║║╬║║║║
* ─║║─║║║║╬║║╩╣║╚╗║╩╣╠═║╠═║║╬║║║─║║─║╗╣║║║║║║║║╚╗║╔╗║╔╝║╗╣║║║
* ─╚╝─╠╗║║╔╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╬╗║─╚╝─╚╩╝╚═╝╚╩═╝╚══╝╚╝╚╝─╚╩╝╚═╝
* ────╚═╝╚╝──────────────────╚═╝
 */
