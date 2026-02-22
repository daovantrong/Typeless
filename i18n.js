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

// i18n.js - Internationalization module for Auto Form Filler
const i18n = {
    // Language dictionary
    translations: {
        en: {
            'lang.en': 'English',
            'lang.vi': 'Tiếng Việt',
            'lang.zh_CN': '中文 (简体)',
            'lang.zh_TW': '中文 (繁體)',
            'lang.ko': '한국어',
            'lang.ja': '日本語',

            'btn.reload': 'Reload Page',
            'btn.refresh_list': 'Refresh List',
            'btn.save': 'Save',
            'btn.cancel': 'Cancel',
            'modal.cancel': 'Cancel',
            'btn.export': 'Export',
            'btn.import': 'Import',
            'btn.minimize': 'Minimize',
            'btn.expand': 'Expand',
            'btn.hide': 'Hide',
            'btn.lang': 'EN',
            'btn.lang_tooltip': 'Switch Language',
            'btn.copy': 'Copy',
            'btn.paste': 'Paste',
            'btn.smart': 'Smart Fill',
            'btn.enable_right_click': 'Unlock Right Click',
            'btn.save_html': 'Save HTML',
            'btn.clear': 'Clear',
            'btn.save_settings': 'Save Settings',
            'btn.reset_ua': 'Reset Defaults',
            'btn.open_options': 'Open Settings',
            'btn.expand_tooltip': 'Expand',
            'btn.minimize_tooltip': 'Minimize',
            'btn.delete_profile': 'Delete profile',
            'btn.copy_tooltip': 'Copy to clipboard',
            'btn.apply_tooltip': 'Apply profile',
            'btn.screenshot_full': 'Screenshot Full',
            'btn.screenshot_visible': 'Screenshot Visible',
            'btn.save_profile': 'Save Profile',
            'btn.delete_confirm': 'Delete',
            'btn.cancel_confirm': 'Cancel',

            'toolbar.title': '⚡ TypeLess - Auto Form Filler',
            'toolbar.empty': 'No profiles for this page. Click <img src="icons/save.svg" style="width:14px;height:14px;vertical-align:middle;opacity:0.7"> to save.',
            'toolbar.loading': 'Loading profiles...',

            'notify.refreshed': 'Profile list refreshed',
            'notify.saved': 'Saved profile "{name}" with {count} fields',
            'notify.applied': 'Applied profile "{name}"',
            'notify.deleted': 'Deleted profile "{name}"',
            'notify.exported': 'Exported {count} profiles & settings',
            'notify.imported': 'Successfully imported {added} profiles!',
            'notify.lang_changed': 'Language changed to English',
            'notify.copied': 'Copied to clipboard!',
            'notify.pasted': 'Pasted from clipboard!',
            'notify.smart': 'Smart filled {count} fields!',
            'notify.right_click_enabled': 'Right click & copy enabled!',
            'notify.html_saved': 'HTML saved successfully',
            'notify.copied_all': 'Copied all profiles to clipboard',
            'notify.no_fields_filled': 'No fields filled',
            'notify.unlocked': 'Unlocked {count} elements',

            'confirm.reload': 'Reload this page?',
            'confirm.delete': 'Delete profile "{name}"?',

            'modal.title': 'Save Profile',
            'modal.profile_name': 'Profile Name:',
            'modal.select_fields': 'Select fields to save ({count} fields):',
            'modal.select_all': '✓ Select All',
            'modal.deselect_all': '✗ Deselect',
            'modal.save': '<img src="icons/save.svg" style="width:16px;height:16px;vertical-align:middle;filter:brightness(0) invert(1);margin-right:4px"> Save Profile',
            'modal.empty_value': '(empty)',
            'modal.checked': '✓ Checked',

            'alert.enter_name': 'Please enter profile name!',
            'alert.select_field': 'Please select at least 1 field!',
            'alert.no_fields': 'No fields found to save!',
            'alert.no_export': 'No profiles to export!',
            'alert.error_save': 'Error saving profile!',
            'alert.error_apply': 'Error applying profile!',
            'alert.page_not_supported': 'This page is not supported!',
            'alert.error_import': 'Error importing file. Please check the format.',
            'alert.invalid_json': 'Invalid JSON data',
            'alert.profile_not_found': 'Profile not found!',
            'alert.error_delete': 'Error deleting profile',
            'alert.error_copy': 'Error copying to clipboard',

            'overwrite.title': '⚠️ Profile "{name}" already exists for this page!',
            'overwrite.current': '• Current profile: {count} fields',
            'overwrite.new': '• New profile: {count} fields',
            'overwrite.confirm': 'Do you want to OVERWRITE the old profile?',
            'overwrite.confirm_btn': 'Overwrite',
            'overwrite.cancel_btn': 'Cancel',

            'field.count': '{count} fields',
            'field.fullname': 'Full Name',
            'field.firstName': 'First Name',
            'field.lastName': 'Last Name',
            'field.email': 'Email',
            'field.phone': 'Phone',
            'field.dob': 'Date of Birth',
            'field.address': 'Address',
            'field.city': 'City',
            'field.zipCode': 'ZIP Code',
            'field.country': 'Country',
            'field.unknown': 'Unknown Field',

            'popup.title': 'TypeLess - Auto Form Filler',
            'popup.subtitle': 'Manage profiles',
            'popup.toggle': 'Expand/Minimize Toolbar',
            'popup.show': 'Show/Hide Toolbar',
            'popup.empty': 'No profiles yet',
            'popup.empty_hint': 'Click "Save" to create a new profile',
            'popup.settings_moved': 'Settings have moved to a dedicated page for better experience.',

            'tab.profiles': 'Profiles',
            'tab.tools': 'Tools',
            'tab.data': 'Data Management',
            'tab.settings': 'Settings',

            'grp.actions': 'Utilities',
            'grp.backup': 'Data Management',
            'grp.extension_settings': 'Extension Settings',

            'settings.personal': 'Personal Info',
            'settings.address': 'Address',

            'footer.by': 'by',
            'footer.enjoy': 'Enjoy my work?',
            'footer.buy': 'Buy me a 🍻',
            'footer.tip': 'or tip via',

            'placeholder.profile_name': 'Example: Profile 1',
            'placeholder.firstName': 'John',
            'placeholder.lastName': 'Smith',
            'placeholder.email': 'email@example.com',
            'placeholder.phone': '0912345678',
            'placeholder.dob': 'YYYY/MM/DD',
            'placeholder.address': '123 Street',
            'placeholder.city': 'Hanoi',
            'placeholder.zipCode': '100000',
            'placeholder.country': 'Vietnam',

            'menu.smart_fill': '⚡ Smart Fill Form',
            'menu.save_profile': 'Save Form as Profile',
            'menu.remove_readonly': '🔓 Remove Readonly & Disabled',

            'label.ua_android': 'Android User-Agent',
            'label.ua_ios': 'iOS User-Agent',
            'label.ua_macos': 'MacOS User-Agent',
            'label.ua_windows': 'Windows User-Agent',
            'label.ua_linux': 'Linux User-Agent',

            'options.welcome_title': 'Welcome to TypeLess!',
            'options.welcome_subtitle': 'Your ultimate auto-filling assistant.',
            'options.personal_hint': 'Data used for Smart Fill feature.',
            'options.language': 'Language',
            'options.menu_welcome': 'Welcome',
            'options.menu_personal': 'Personal Info',
            'options.menu_ua': 'User Agents',
            'options.menu_data': 'Data Management',
            'options.menu_advanced': 'Advanced',
            'options.ua_hint': 'Customize the User-Agent strings used by the switcher.',
            'options.data_hint': 'Backup or restore your profiles and settings.',
            'options.export_desc': 'Download a JSON file containing all your data.',
            'options.import_desc': 'Upload a previously exported JSON file.',
            'options.lang_label': 'Language / Ngôn ngữ',
            'options.test_form_download': 'Download Demo Form',
            'options.test_form_desc': 'Download the demo form to your computer to test auto-fill on a local file.',
            'options.external_settings': 'Advanced Extension Settings',
            'options.external_settings_desc': 'Manage site permissions, shortcuts, and management at browser level.',
            'options.quick_start': 'Quick Start',
            'options.step1': 'Navigate to any form you want to fill.',
            'options.step2_pre': 'Click the ',
            'options.step2_post': ' button on the toolbar to create a profile.',
            'options.step3': 'Next time, just click the profile name to fill instantly!',
            'options.step4_pre': 'Use ',
            'options.step4_mid': 'Smart Fill',
            'options.step4_post': ' to auto-complete common fields like Name, Email, Address.',
            'options.saved': 'Saved!',
            'options.reset_confirm': 'Reset all User-Agent strings to default?',
            'options.reset_done': 'Reset to defaults!',
            'options.dob_hint': '* Select from the calendar on the right or type manually (YYYY/MM/DD).',
            'options.select_date': 'Select Date',
        },
    },

    // Current language
    currentLang: 'en',

    // Track loaded locales
    loadedLocales: new Set(['en']),

    // Load locale data dynamically
    async loadLocale(lang) {
        if (this.loadedLocales.has(lang)) return true;

        try {
            const url = chrome.runtime.getURL(`locales/${lang}.json`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load locale: ${lang}`);

            const data = await response.json();
            this.translations[lang] = data;
            this.loadedLocales.add(lang);
            return true;
        } catch (error) {
            console.error(`Error loading locale ${lang}:`, error);
            return false;
        }
    },

    // Initialize i18n
    async init() {
        // Load saved language preference
        const saved = await this.getLanguage();
        if (saved) {
            this.currentLang = saved;
        } else {
            // Auto-detect browser language
            const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
            if (browserLang.startsWith('vi')) {
                this.currentLang = 'vi';
            } else if (browserLang.startsWith('zh-tw') || browserLang.startsWith('zh-hk')) {
                this.currentLang = 'zh-TW';
            } else if (browserLang.startsWith('zh')) {
                this.currentLang = 'zh-CN';
            } else if (browserLang.startsWith('ko')) {
                this.currentLang = 'ko';
            } else if (browserLang.startsWith('ja')) {
                this.currentLang = 'ja';
            } else {
                this.currentLang = 'en';
            }
        }

        // Load the language file if not English
        if (this.currentLang !== 'en') {
            await this.loadLocale(this.currentLang);
        }

        // Apply language class to body
        if (typeof document !== 'undefined' && document.body) {
            document.body.className = `lang-${this.currentLang}`;
        }

        return this.currentLang;
    },

    // Get translation
    t(key, params = {}) {
        const langData = this.translations[this.currentLang] || this.translations['en'] || {};
        let text = langData[key] || key;

        // Replace parameters
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });

        // Resolve absolute paths for images if any
        if (text.includes('icons/')) {
            const getUrl = (path) => {
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
                    return chrome.runtime.getURL(path);
                }
                return path;
            };
            text = text.replace(/icons\/([\w-]+)\.svg/g, (match) => getUrl(match));
            text = text.replace('__MSG_@@extension_id__/', '');
        }

        return text;
    },

    // Switch language
    async switchLanguage() {
        const languages = ['en', 'vi', 'zh-CN', 'zh-TW', 'ko', 'ja'];
        const currentIndex = languages.indexOf(this.currentLang);
        const nextIndex = (currentIndex + 1) % languages.length;
        const nextLang = languages[nextIndex];

        // Ensure next locale is loaded
        if (nextLang !== 'en') {
            await this.loadLocale(nextLang);
        }

        this.currentLang = nextLang;
        await this.saveLanguage(this.currentLang);

        if (typeof document !== 'undefined' && document.body) {
            document.body.className = `lang-${this.currentLang}`;
        }

        return this.currentLang;
    },

    // Set specific locale
    async setLocale(lang) {
        if (lang !== 'en') {
            const success = await this.loadLocale(lang);
            if (!success) return this.currentLang;
        }

        this.currentLang = lang;
        await this.saveLanguage(lang);

        if (typeof document !== 'undefined' && document.body) {
            document.body.className = `lang-${this.currentLang}`;
        }

        return this.currentLang;
    },

    // Get URL for assets (handles both popup and content script contexts)
    getAssetUrl(path) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            return chrome.runtime.getURL(path);
        }
        return path;
    },

    // Get current language
    getCurrentLanguage() {
        return this.currentLang;
    },

    // Save language preference
    async saveLanguage(lang) {
        try {
            await chrome.storage.local.set({ language: lang });
            return true;
        } catch (error) {
            console.error('Error saving language:', error);
            return false;
        }
    },

    // Get saved language
    async getLanguage() {
        try {
            const result = await chrome.storage.local.get('language');
            return result.language;
        } catch (error) {
            console.error('Error getting language:', error);
            return undefined;
        }
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.i18n = i18n;
}

/**
 * End of i18n.js
* ╔══╗─────────╔╗────╔═╗╔═╗╔╗───╔══╗╔═╗╔═╗╔═╦╗╔══╗──╔═╗╔═╗╔═╗
* ╚╗╔╝╔╦╗╔═╗╔═╗║║─╔═╗║═╣║═╣║╚╦╦╗╚╗╔╝║╬║║║║║║║║║╔═╣──║╬║║╬║║║║
* ─║║─║║║║╬║║╩╣║╚╗║╩╣╠═║╠═║║╬║║║─║║─║╗╣║║║║║║║║╚╗║╔╗║╔╝║╗╣║║║
* ─╚╝─╠╗║║╔╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╬╗║─╚╝─╚╩╝╚═╝╚╩═╝╚══╝╚╝╚╝─╚╩╝╚═╝
* ────╚═╝╚╝──────────────────╚═╝
 */
