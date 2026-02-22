/**
 * options.js - Logic for the Options page (Settings & Onboarding)
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize i18n
    await i18n.init();
    updateUI();

    // 2. Set language selector correctly
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        // But it's already awaited. Let's make sure the value exists in options.
        const currentLocale = i18n.currentLang || 'en';
        langSelect.value = currentLocale;

        // If it's still empty (e.g. value not in select), fallback to 'en'
        if (!langSelect.value) langSelect.value = 'en';

        langSelect.addEventListener('change', async (e) => {
            const newLang = e.target.value;
            // setLocale already saves to storage
            await i18n.setLocale(newLang);
            updateUI();
        });
    }

    // 3. Listen for language changes from other parts (Popup, etc.)
    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area === 'local' && changes.language) {
            const newLang = changes.language.newValue;
            if (newLang && newLang !== i18n.currentLang) {
                // Use setLocale to ensure JSON is loaded
                await i18n.setLocale(newLang);
                if (langSelect) langSelect.value = newLang;
                updateUI();
            }
        }
    });

    // Navigation Logic
    const menuItems = document.querySelectorAll('.sidebar .menu-item');
    const panels = document.querySelectorAll('.content .tab-panel');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            item.classList.add('active');
            const targetId = item.dataset.target;
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- Load Settings ---
    await loadSettings();

    // --- Event Listeners ---

    // Save Personal Info
    document.getElementById('save-personal-btn').addEventListener('click', async () => {
        const settings = {
            firstName: document.getElementById('setting-firstname').value,
            lastName: document.getElementById('setting-lastname').value,
            email: document.getElementById('setting-email').value,
            phone: document.getElementById('setting-phone').value,
            dob: document.getElementById('setting-dob').value,
            address: document.getElementById('setting-address').value,
            city: document.getElementById('setting-city').value,
            zipCode: document.getElementById('setting-zipcode').value,
            country: document.getElementById('setting-country').value
        };

        // Use StorageManager to save (matches popup logic)
        await StorageManager.setGlobalSettings(settings);
        showStatus('personal-status', i18n.t('options.saved'));
    });

    // Clear Personal Info
    document.getElementById('clear-personal-btn').addEventListener('click', async () => {
        if (confirm(i18n.t('options.reset_confirm'))) {
            await StorageManager.setGlobalSettings({});
            await loadSettings();
            showStatus('personal-status', i18n.t('options.reset_done'));
        }
    });

    // Save User Agents
    document.getElementById('save-ua-btn').addEventListener('click', async () => {
        const settings = {
            ua_android: document.getElementById('setting-ua-android').value,
            ua_ios: document.getElementById('setting-ua-ios').value,
            ua_macos: document.getElementById('setting-ua-macos').value,
            ua_windows: document.getElementById('setting-ua-windows').value,
            ua_linux: document.getElementById('setting-ua-linux').value
        };

        await chrome.storage.local.set(settings);
        showStatus('ua-status', i18n.t('options.saved'));
    });

    // Reset User Agents
    document.getElementById('reset-ua-btn').addEventListener('click', async () => {
        if (confirm(i18n.t('options.reset_confirm'))) {
            await chrome.storage.local.remove(['ua_android', 'ua_ios', 'ua_macos', 'ua_windows', 'ua_linux']);
            await loadSettings();
            showStatus('ua-status', i18n.t('options.reset_done'));
        }
    });

    // Data Management: Export
    document.getElementById('btn-export')?.addEventListener('click', async () => {
        const backupData = await StorageManager.getBackupData();
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `typeless-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Data Management: Import
    document.getElementById('btn-import')?.addEventListener('click', () => {
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
                alert(i18n.t('notify.imported', { added: result.count }));
                await loadSettings();
            } catch (error) {
                alert(i18n.t('alert.error_import'));
            }
        };
        input.click();
    });

    // --- Date Picker Logic (Flatpickr Inline) ---
    const dobInput = document.getElementById('setting-dob');
    const calendarEl = document.getElementById('inline-calendar');

    if (dobInput && calendarEl && window.flatpickr) {
        // 1. Initialize Flatpickr
        const fp = flatpickr(calendarEl, {
            inline: true,
            dateFormat: "Y/m/d",
            defaultDate: dobInput.value,
            onChange: (selectedDates, dateStr, instance) => {
                // Sync Picker -> Text
                dobInput.value = dateStr; // YYYY/MM/DD
                // Trigger change event manually if needed, or save directly?
                // The save button reads from the input, so just updating value is enough.
            }
        });

        // 2. Sync Text -> Picker
        dobInput.addEventListener('input', (e) => {
            const text = e.target.value;
            // distinct update to avoid loop if needed, but setDate handles it
            fp.setDate(text, false, "Y/m/d");
        });

        dobInput.addEventListener('change', (e) => {
            const text = e.target.value;
            fp.setDate(text, true, "Y/m/d"); // true to trigger formatting if valid
        });
    }

    // --- Demo Form Download ---
    const downloadDemoBtn = document.getElementById('btn-download-demo');
    if (downloadDemoBtn) {
        downloadDemoBtn.addEventListener('click', () => {
            const url = chrome.runtime.getURL('demo-form.html');
            chrome.downloads.download({
                url: url,
                filename: 'TypeLess-Demo-Form.html',
                saveAs: true
            });
        });
    }

    // --- External Extension Settings Link ---
    const externalSettingsLink = document.getElementById('browser-extension-settings');
    if (externalSettingsLink) {
        const id = chrome.runtime.id;
        const isEdge = navigator.userAgent.includes('Edg/');
        const baseUrl = isEdge ? 'edge://extensions/' : 'chrome://extensions/';
        externalSettingsLink.href = `${baseUrl}?id=${id}`;

        // Use chrome.tabs.create for internal URLs as direct href might be blocked
        externalSettingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: `${baseUrl}?id=${id}` });
        });
    }
});

// Helper: Load all settings from storage
async function loadSettings() {
    // 1. Load Personal Info from Global Settings
    const settings = await StorageManager.getGlobalSettings();
    if (settings) {
        document.getElementById('setting-firstname').value = settings.firstName || '';
        document.getElementById('setting-lastname').value = settings.lastName || '';
        document.getElementById('setting-email').value = settings.email || '';
        document.getElementById('setting-phone').value = settings.phone || '';
        document.getElementById('setting-dob').value = settings.dob || '';
        // Init picker value if dob exists
        if (settings.dob) {
            const calendarEl = document.getElementById('inline-calendar');
            if (calendarEl && calendarEl._flatpickr) {
                calendarEl._flatpickr.setDate(settings.dob, false);
            }
        }
        document.getElementById('setting-address').value = settings.address || '';
        document.getElementById('setting-city').value = settings.city || '';
        document.getElementById('setting-zipcode').value = settings.zipCode || '';
        document.getElementById('setting-country').value = settings.country || 'Vietnam';
    }

    // 2. Load User Agents (direct from local storage)
    const defaults = getDefaultUserAgents();
    const uaKeys = ['ua_android', 'ua_ios', 'ua_macos', 'ua_windows', 'ua_linux'];
    const uaData = await chrome.storage.local.get(uaKeys);

    document.getElementById('setting-ua-android').value = uaData.ua_android || defaults.ua_android;
    document.getElementById('setting-ua-ios').value = uaData.ua_ios || defaults.ua_ios;
    document.getElementById('setting-ua-macos').value = uaData.ua_macos || defaults.ua_macos;
    document.getElementById('setting-ua-windows').value = uaData.ua_windows || defaults.ua_windows;
    document.getElementById('setting-ua-linux').value = uaData.ua_linux || defaults.ua_linux;
}

/**
 * Generate default User Agents based on current browser version
 */
function getDefaultUserAgents() {
    const match = navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    const chromeVersion = match ? match[1] : '130.0.0.0'; // Consistent fallback across popup & options
    return {
        'ua_android': `Mozilla/5.0 (Linux; Android 16; SM-S938B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36`,
        'ua_ios': `Mozilla/5.0 (iPhone; CPU iPhone OS 26_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Chrome/${chromeVersion} Safari/604.1`,
        'ua_macos': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`,
        'ua_windows': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`,
        'ua_linux': `Mozilla/5.0 (Linux x86_64; Ubuntu 25.04) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
    };
}

// Helper: Show status message
function showStatus(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.style.opacity = '1';
    setTimeout(() => {
        el.style.opacity = '0';
    }, 2000);
}

// Helper: Update UI text based on i18n
function updateUI() {
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
