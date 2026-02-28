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

// i18n.js - Internationalization module for Auto Form Filler

// Guard: returns false when the extension has been reloaded/invalidated.
// All chrome.* calls should be skipped if this returns false.
function _i18nExtAlive() {
    try { return !!(chrome && chrome.runtime && chrome.runtime.id); }
    catch (_) { return false; }
}

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
            'btn.rename_tooltip': 'Rename profile',

            'toolbar.title': '⚡ TypeLess - Auto Form Filler',
            'toolbar.empty': 'No profiles for this page. Click <img src="icons/save.svg" style="width:14px;height:14px;vertical-align:middle;opacity:0.7"> to save.',
            'toolbar.loading': 'Loading profiles...',

            'notify.refreshed': 'Profile list refreshed',
            'notify.saved': 'Saved profile "{name}" with {count} fields',
            'notify.applied': 'Applied profile "{name}"',
            'notify.deleted': 'Deleted profile "{name}"',
            'notify.exported': 'Exported {count} profiles & settings',
            'notify.imported': 'Import done: +{added} added · ↺{updated} updated · ⚠{skipped} skipped',
            'notify.added_new': 'new',
            'notify.updated': 'updated',
            'notify.skipped': 'skipped',
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

            // ── Privacy Policy (85 keys) ──
            'privacy.menu_label': 'Privacy Policy',
            'privacy.page_title': 'Privacy Policy',
            'privacy.last_updated': 'Last Updated',
            'privacy.last_updated_date': 'February 13, 2026',
            'privacy.overview_title': 'Overview',
            'privacy.overview_desc': 'TypeLess – Auto Form Filler is a browser extension that helps users save and auto-fill web forms. This privacy policy explains how we handle your data.',
            'privacy.collection_title': 'Data Collection',
            'privacy.collection_intro': 'Auto Form Filler collects and stores:',
            'privacy.collection_item1': 'Form data you choose to save (names, addresses, text inputs, selections)',
            'privacy.collection_item2': 'URLs of pages where profiles are created',
            'privacy.collection_item3': 'User preferences (language selection, toolbar visibility)',
            'privacy.storage_title': 'Data Storage',
            'privacy.storage_item1': 'All data is stored locally on your device using the browser\'s built-in storage API (Chrome/Edge)',
            'privacy.storage_item2': 'No cloud storage — data never leaves your browser',
            'privacy.storage_item3': 'No external servers — we don\'t operate any servers',
            'privacy.storage_item4': 'No transmission — your data is never sent anywhere',
            'privacy.usage_title': 'Data Usage',
            'privacy.usage_intro': 'Your saved data is used solely to:',
            'privacy.usage_item1': 'Auto-fill web forms when you choose to apply a profile',
            'privacy.usage_item2': 'Display saved profiles in the extension interface',
            'privacy.usage_item3': 'Remember your preferences (language, toolbar state)',
            'privacy.thirdparty_title': 'Third-Party Access',
            'privacy.thirdparty_item1': 'No third-party sharing — your data is never shared with anyone',
            'privacy.thirdparty_item2': 'No analytics — we don\'t track your usage',
            'privacy.thirdparty_item3': 'No advertising — we don\'t collect data for ads',
            'privacy.thirdparty_item4': 'No external APIs — we don\'t communicate with external services',
            'privacy.control_title': 'User Control',
            'privacy.control_intro': 'You have full control over your data:',
            'privacy.control_item1': 'Delete profiles individually using the delete button in the toolbar',
            'privacy.control_item2': 'Export profiles to backup your data as JSON',
            'privacy.control_item3': 'Import profiles to restore from backup',
            'privacy.control_item4': 'Clear all data by uninstalling the extension',
            'privacy.permissions_title': 'Permissions Explained',
            'privacy.permissions_intro': 'TypeLess requests the following permissions to provide its core functionality. Each permission is used only for its intended purpose and is essential for the extension to work properly.',
            'privacy.perm_core_title': 'Core Permissions',
            'privacy.perm_utility_title': 'Utility Permissions',
            'privacy.perm_advanced_title': 'Advanced Permissions',
            'privacy.perm_host_title': 'Host Permissions',
            'privacy.perm_storage_purpose': 'Save your profiles and preferences locally on your device',
            'privacy.perm_storage_privacy': '100% local storage using Chrome/Edge secure storage API. Data never leaves your device.',
            'privacy.perm_activetab_purpose': 'Interact with form fields on the current webpage',
            'privacy.perm_activetab_privacy': 'No background scanning, only works on explicit user action.',
            'privacy.perm_scripting_purpose': 'Inject the floating toolbar and execute form-filling scripts',
            'privacy.perm_scripting_privacy': 'No background scripts, only user-initiated actions.',
            'privacy.perm_clipwrite_purpose': 'Copy profile data to clipboard for sharing between tabs/machines',
            'privacy.perm_clipwrite_privacy': 'Only writes to clipboard when you explicitly request it.',
            'privacy.perm_clipread_purpose': 'Paste saved profile data (JSON) from clipboard directly into TypeLess',
            'privacy.perm_clipread_privacy': 'Clipboard read only on demand; no passive monitoring or transmission.',
            'privacy.perm_contextmenu_purpose': 'Add TypeLess options to the browser right-click menu',
            'privacy.perm_contextmenu_privacy': 'No data collection, only provides shortcuts to features.',
            'privacy.perm_dnr_purpose': 'Modify request headers to support the User Agent Switching feature',
            'privacy.perm_dnr_privacy': 'No network traffic monitored or redirected; only specific headers overwritten on demand.',
            'privacy.perm_dnrhost_purpose': 'Allow declarativeNetRequest rules to apply across all URLs',
            'privacy.perm_dnrhost_privacy': 'Only activates when user triggers UA switching; no background interception.',
            'privacy.perm_downloads_purpose': 'Download files generated by the extension',
            'privacy.perm_downloads_privacy': 'Only downloads files you explicitly request.',
            'privacy.perm_allurls_purpose': 'Work on any website containing forms',
            'privacy.perm_allurls_privacy': 'Extension only activates when you use it; no background scanning.',
            'privacy.security_title': 'Security Guarantees',
            'privacy.security_data_title': 'Data Protection',
            'privacy.security_local': 'Local Only: All data stored exclusively on your device',
            'privacy.security_notransmit': 'No Transmission: No data ever sent to external servers',
            'privacy.security_noanalytics': 'No Analytics: No usage tracking or behavioral monitoring',
            'privacy.security_nobg': 'No Background Activity: Extension only works when you interact with it',
            'privacy.security_secure': 'Secure Storage: Uses browser\'s built-in encrypted storage API',
            'privacy.security_perm_title': 'Permission Minimization',
            'privacy.security_essential': 'Essential Only: Each permission is required for core functionality',
            'privacy.security_userctrl': 'User Controlled: All actions require explicit user initiation',
            'privacy.security_transparent': 'Transparent: Clear explanations for why each permission is needed',
            'privacy.security_nooverreach': 'No Overreach: No unnecessary or excessive permissions requested',
            'privacy.security_ops_title': 'Operational Security',
            'privacy.security_noremote': 'No Remote Code: All functionality runs locally in your browser',
            'privacy.security_nothirdparty': 'No Third Parties: No integration with external services or APIs',
            'privacy.security_noaccount': 'No Accounts: No registration or login required',
            'privacy.security_offline': 'Offline Capable: Works completely without internet connection',
            'privacy.children_title': "Children's Privacy",
            'privacy.children_desc': 'This extension does not knowingly collect data from children under 13. It is intended for general use and treats all users the same way.',
            'privacy.changes_title': 'Changes to Privacy Policy',
            'privacy.changes_desc': 'We may update this privacy policy occasionally. Changes will be posted with an updated "Last Updated" date.',
            'privacy.contact_title': 'Contact',
            'privacy.contact_website': 'Website',
            'privacy.contact_email': 'Email',
            'privacy.contact_support': 'Extension Support',
            'privacy.contact_support_desc': 'Through the support tab on Chrome Web Store or Microsoft Edge Add-ons',
            'privacy.consent_title': 'Your Consent',
            'privacy.consent_desc': 'By using TypeLess, you consent to this privacy policy.',
            'privacy.created_by': 'Created by',
            'privacy.version': 'Version',
            'privacy.label_purpose': 'Purpose',
            'privacy.label_privacy': 'Privacy',
            'options.select_date': 'Select Date',

            // ── Profile Manager (options page) ──────────────────────────────
            'options.menu_profiles': 'Profiles',
            'options.menu_privacy': 'Privacy Policy',
            'options.profiles_hint': 'Manage, edit and customise your saved profiles and their fields.',
            'options.profiles_search': 'Search profiles...',
            'options.profiles_empty': 'No profiles yet. Save a form from the toolbar to get started.',
            'options.profiles_no_match': 'No profiles match "{query}".',
            'options.back_profiles': 'Back to Profiles',
            'options.edit_profile_title': 'Edit: {name}',
            'options.profile_saved': 'Profile saved!',
            'options.delete_profile_confirm': 'Delete profile "{name}"? This cannot be undone.',
            'options.no_fields': 'No fields saved. Add one below.',
            'options.add_field_btn': 'Add',
            'options.add_field_label_ph': 'Label',
            'options.add_field_selector_ph': 'CSS selector or #id',
            'options.add_field_value_ph': 'Value',
            'options.focus_tip': 'Click the target icon to mark a field that gets focused after the profile is applied.',
            'options.col_label': 'Label',
            'options.col_value': 'Value',
            'options.col_selector': 'Selector',
            'options.col_type': 'Type',
            'options.col_focus': 'Focus',
            'options.col_delete': 'Delete',

            // ── Save Profile Modal ──────────────────────────────────────────
            'modal.focus_col': 'Focus',
            'modal.focus_hint': 'After applying this profile, cursor will jump to this field',

            // ── Guide / Welcome page ────────────────────────────────────────
            'guide.s1_title': '🖥️ Toolbar',
            'guide.s1_desc': 'After installation, the TypeLess toolbar appears at the <strong>bottom of every web page</strong>. You can minimize, hide, or drag it to move.',
            'guide.s1_caption': 'TypeLess toolbar displayed at the bottom of a page',
            'guide.s1_save_desc': 'Save current form as a profile',
            'guide.s1_smartfill_desc': 'Auto-fill from personal info',
            'guide.s1_profilelist_desc': 'Click profile name to fill instantly',
            'guide.s1_utils': 'Utilities',
            'guide.s1_utils_desc': 'Screenshot, save HTML, switch UA',
            'guide.s2_title': '💾 Save Profile',
            'guide.s2_desc': 'Fill in the form as usual, then click the <strong>Save</strong> button on the toolbar. A dialog will appear letting you choose which fields to save.',
            'guide.s2_step1_label': 'Step 2.1 — Click the Save button on the toolbar',
            'guide.s2_step1_caption': 'Save button at the left of the toolbar',
            'guide.s2_step2_label': 'Step 2.2 — Save Profile dialog',
            'guide.s2_step2_desc': 'The dialog shows all fields found on the page. Check the fields you want to save, name the profile, then click <strong>Save Profile</strong>.',
            'guide.s2_step2_caption': 'Save Profile dialog — select fields to save',
            'guide.s2_tip': 'Fields <strong>without a value</strong> (empty) appear dimmed. Use <em>Select All / Deselect</em> to quickly toggle all.',
            'guide.s2_focus_title': '🎯 Choose Focus Field (optional)',
            'guide.s2_focus_caption': '🎯 column — click to select the field focused after apply',
            'guide.s2_focus_desc': 'Click the <strong>🎯</strong> button at the end of a row to mark that field for <strong>auto-focus</strong> (cursor jumps there) right after applying the profile. Handy for continuing to type after auto-fill.',
            'guide.s3_title': '▶️ Apply Profile',
            'guide.s3_desc': 'Next time you visit a page with a form, just click the profile name on the toolbar — all fields will be filled instantly.',
            'guide.s3_caption': 'Click the profile name to auto-fill the form',
            'guide.s3_tip': 'Use <kbd>Ctrl+Shift+H</kbd> to quickly show/hide the toolbar, and <kbd>Ctrl+Shift+F</kbd> (if set) to apply the last profile.',
            'guide.s3_after_label': 'Notification after applying',
            'guide.s3_after_caption': 'Confirmation notification that fill was successful',
            'guide.s4_title': '⚡ Smart Fill',
            'guide.s4_desc': 'Smart Fill automatically detects and fills common fields (full name, email, phone, address…) based on the <strong>Personal Info</strong> you saved in the <em>Personal Info</em> tab.',
            'guide.s4_col1_label': 'Click ⚡ on the toolbar',
            'guide.s4_col1_caption': 'Smart Fill button on the toolbar',
            'guide.s4_col2_label': 'Auto-fill result',
            'guide.s4_col2_caption': 'Fields filled from personal info',
            'guide.s4_tip': 'Set up your personal info in the <strong>Personal Info</strong> tab for Smart Fill to work more accurately. Includes: name, email, phone, date of birth, address.',
            'guide.s5_title': '🗂️ Advanced Profile Management',
            'guide.s5_desc': 'The <strong>Profiles</strong> tab in this settings page lets you edit each profile in detail: rename, change field values, fix CSS selectors, add/remove fields, reset the focus field.',
            'guide.s5_col1_label': 'Profile list',
            'guide.s5_col1_caption': 'Profile list — click Edit to modify',
            'guide.s5_col2_label': 'Edit profile',
            'guide.s5_col2_caption': 'Editor — edit fields, add/remove',
            'guide.s6_title': '⌨️ Shortcuts & Tips',
            'guide.s6_shortcut_key': 'Shortcut',
            'guide.s6_shortcut_fn': 'Function',
            'guide.s6_shortcut1': 'Show / hide toolbar',
            'guide.s6_shortcut2': 'Apply last profile',
            'guide.s6_shortcut3': 'Close Save Profile dialog',
            'guide.s6_shortcut4': 'Quickly add a new field',
            'guide.s6_tip1_title': 'Export / Import data',
            'guide.s6_tip1_desc': 'Use the <em>Data Management</em> tab to back up and transfer profiles to another device.',
            'guide.s6_tip2_title': 'Mobile simulation',
            'guide.s6_tip2_desc': 'The <em>User Agents</em> tab lets you switch UA to view pages as on a phone.',
            'guide.s6_tip3_title': 'Full-page screenshot',
            'guide.s6_tip3_desc': 'The Screenshot button on the toolbar captures the entire page including scrolled content.',
            'guide.s6_tip4_title': 'Unlock form',
            'guide.s6_tip4_desc': 'The Unlock Right Click button removes readonly/disabled from locked input fields.',
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
            if (!_i18nExtAlive()) return false;
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
                if (_i18nExtAlive()) {
                    try { return chrome.runtime.getURL(path); } catch (_) {}
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
        if (_i18nExtAlive()) {
            try { return chrome.runtime.getURL(path); } catch (_) {}
        }
        return path;
    },

    // Apply alt text translations to all [data-i18n-alt] elements in the DOM
    applyAltTexts(root) {
        const scope = root || document;
        scope.querySelectorAll('[data-i18n-alt]').forEach(el => {
            const key = el.getAttribute('data-i18n-alt');
            if (key) el.setAttribute('alt', this.t(key));
        });
    },

    // Get current language
    getCurrentLanguage() {
        return this.currentLang;
    },

    // Save language preference
    async saveLanguage(lang) {
        try {
            if (!_i18nExtAlive()) return false;
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
            if (!_i18nExtAlive()) return undefined;
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
