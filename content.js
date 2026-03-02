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
 * v1.0.6 by TRONG.PRO
 */

// Content script

// Guard: returns false when the extension has been reloaded/invalidated.
// Content scripts can linger on pages after an extension update — all chrome.*
// calls must be skipped or caught to avoid "Extension context invalidated".
function _extAlive() {
    try { return !!(chrome && chrome.runtime && chrome.runtime.id); }
    catch (_) { return false; }
}

(function () {
    'use strict';

    // Translation helper
    const t = (key, params) => i18n.t(key, params);

    const TOOLBAR_ID = 'auto-form-filler-toolbar';
    let toolbarInjected = false;
    let toolbarShadow = null; // Shadow root for toolbar style isolation

    // Form field detector
    const FormDetector = {
        // Get all fillable fields on the page
        getAllFields(includeUncheckedRadios = false) {
            const fields = [];

            // Find all input, select, and textarea elements
            // IMPORTANT: Exclude elements that are part of the extension's own toolbar
            const inputs = document.querySelectorAll(`input:not(#${TOOLBAR_ID} *):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])`);
            const selects = document.querySelectorAll(`select:not(#${TOOLBAR_ID} *)`);
            const textareas = document.querySelectorAll(`textarea:not(#${TOOLBAR_ID} *)`);

            // Process inputs
            inputs.forEach(input => {
                const fieldInfo = this.getFieldInfo(input, includeUncheckedRadios);
                if (fieldInfo) fields.push(fieldInfo);
            });

            // Process selects (comboboxes)
            selects.forEach(select => {
                const fieldInfo = this.getFieldInfo(select, includeUncheckedRadios);
                if (fieldInfo) fields.push(fieldInfo);
            });

            // Process textareas
            textareas.forEach(textarea => {
                const fieldInfo = this.getFieldInfo(textarea, includeUncheckedRadios);
                if (fieldInfo) fields.push(fieldInfo);
            });

            // Filter out null values
            return fields.filter(f => f !== null);
        },

        // Get field information
        getFieldInfo(element, includeUncheckedRadios = false) {
            const type = element.tagName.toLowerCase();
            // ── Resolve field type — ComboBox must be checked before generic 'text' ──
            // FineUI DDL inputs have type="text" (or readonly text), but they behave
            // as dropdownlists. We give them a dedicated 'dropdownlist' type so the
            // modal can show the right icon and the fill logic picks the right path.
            let fieldType;
            if (type === 'select') {
                fieldType = 'select';
            } else if (type === 'textarea') {
                fieldType = 'textarea';
            } else if (
                typeof EnhancedFormUtils !== 'undefined' &&
                element.tagName === 'INPUT' &&
                element.type !== 'hidden' &&
                element.type !== 'checkbox' &&
                element.type !== 'radio' &&
                EnhancedFormUtils.isWebFormsComboBox(element)
            ) {
                fieldType = 'dropdownlist'; // FineUI / combo-wrap detected
            } else {
                fieldType = element.type || 'text';
            }

            // Generate unique identifier for the field
            const id = element.id || element.name || this.generateFieldId(element);

            // NEW: Skip hidden elements (invisible inputs often cause "breaking HTML" side effects)
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden' || element.offsetWidth === 0 || element.offsetHeight === 0) {
                return null;
            }

            // Get value based on field type
            let value;
            let displayText = null; // Only set for ComboBox fields that have a separate $Value hidden

            if (fieldType === 'checkbox') {
                value = element.checked ? 'checked' : 'unchecked';
            } else if (fieldType === 'radio') {
                // For radio, only save if checked, UNLESS explicitly requested (for Smart Fill)
                if (!element.checked && !includeUncheckedRadios) {
                    return null; // Skip unchecked radios for normal profile saving
                }
                value = element.checked ? element.value : '';
            } else {
                value = element.value;

                // ── FineUI / combo-wrap ComboBox: store the code value from the hidden $Value ──
                // The visible text input holds display text (e.g. "补件 Bù kiện").
                // The hidden input holds the real submit code (e.g. "BJ").
                // We save the CODE as `value` and the DISPLAY TEXT as `displayText`
                // so that when filling from a profile we can restore both correctly.
                if (typeof EnhancedFormUtils !== 'undefined' &&
                    EnhancedFormUtils.isWebFormsComboBox(element)) {
                    const hidden = EnhancedFormUtils.getComboBoxHiddenInput(element);
                    if (hidden) {
                        // hidden.value may be '' if user hasn't interacted yet
                        if (hidden.value !== '') {
                            // text input may be empty (readonly, not shown until user opens DDL)
                            // → fall back to hidden.value as displayText so restore can show it
                            displayText = element.value !== '' ? element.value : hidden.value;
                            value = hidden.value;  // e.g. "BJ" or "无 không có"
                        }
                        // else: hidden is empty → keep element.value as the saved value
                    }
                    // if hidden === null → no $Value input → text IS the value → keep as-is
                }
            }

            return {
                id: id,
                type: fieldType,
                name: element.name || '',
                value: value,
                displayText: displayText,  // non-null only for ComboBox fields with a $Value hidden
                label: this.getFieldLabel(element),
                selector: this.generateSelector(element),
                element: element
            };
        },

        // Get label for a field
        getFieldLabel(element) {
            // console.log('🔍 Finding label for element:', element.id || element.name, element);

            // Try to find associated label by 'for' attribute
            if (element.id) {
                // Also exclude labels within the extension's toolbar
                const label = document.querySelector(`label[for="${element.id}"]:not(#${TOOLBAR_ID} *)`);
                if (label && label.textContent.trim()) {
                    // console.log('✅ Found label by for attribute:', label.textContent.trim());
                    return label.textContent.trim();
                }
            }

            // Try parent label
            const parentLabel = element.closest('label');
            if (parentLabel && parentLabel.textContent.trim()) {
                // console.log('✅ Found parent label:', parentLabel.textContent.trim());
                return parentLabel.textContent.trim();
            }

            // NEW: Check for table cell pattern (label in previous <td>)
            // This is common in ASP.NET forms
            const td = element.closest('td');
            if (td) {
                // console.log('📍 Element is inside <td>, checking previous <td> siblings...');
                // Look for previous <td> with label/header class
                let prevTd = td.previousElementSibling;
                let attempts = 0;
                while (prevTd && attempts < 5) {  // Limit search to avoid infinite loop
                    // console.log('  Checking <td>:', prevTd.className, prevTd.textContent.substring(0, 50));
                    const classes = prevTd.className || '';
                    // Check if it's a label/header cell
                    if (classes.includes('label') || classes.includes('header') ||
                        classes.includes('f-widget-header')) {
                        const labelText = prevTd.textContent.trim();
                        if (labelText) {
                            // console.log('✅ Found label in previous <td>:', labelText);
                            return labelText;
                        }
                    }
                    prevTd = prevTd.previousElementSibling;
                    attempts++;
                }
            }

            // Try previous sibling elements
            let prev = element.previousElementSibling;
            let siblingAttempts = 0;
            while (prev && siblingAttempts < 5) {
                if (prev.tagName === 'LABEL') {
                    // console.log('✅ Found previous LABEL sibling:', prev.textContent.trim());
                    return prev.textContent.trim();
                }
                if (prev.textContent && prev.textContent.trim().length < 50) {
                    // console.log('✅ Found previous text sibling:', prev.textContent.trim());
                    return prev.textContent.trim();
                }
                prev = prev.previousElementSibling;
                siblingAttempts++;
            }

            // Fallback to name or id
            const fallback = element.name || element.id || t('field.unknown');
            // console.log('⚠️ Using fallback label:', fallback);
            return fallback;
        },

        // Generate a selector for the field
        generateSelector(element) {
            if (element.id) return `#${element.id}`;
            if (element.name) return `[name="${element.name}"]`;

            // Generate nth-child selector
            const tagName = element.tagName.toLowerCase();
            const parent = element.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(el => el.tagName.toLowerCase() === tagName);
                const index = siblings.indexOf(element);
                return `${tagName}:nth-of-type(${index + 1})`;
            }

            return tagName;
        },

        // Generate field ID from element attributes
        generateFieldId(element) {
            const path = [];
            let current = element;

            while (current && current !== document.body) {
                const tag = current.tagName.toLowerCase();
                path.unshift(tag);
                current = current.parentElement;
            }

            return path.join('_') + '_' + Math.random().toString(36).substring(2, 11);
        }
    };

    // Form filler
    const FormFiller = {
        // Fill form with profile data
        fillForm(profile) {
            if (!profile || !profile.fields) return;

            // console.log('📝 Filling form with profile:', profile.name);
            // console.log('Total fields to fill:', profile.fields.length);

            let filledCount = 0;

            profile.fields.forEach((fieldData, index) => {
                // console.log(`\n🔍 Field ${index + 1}:`, fieldData.label);
                // console.log('  Type:', fieldData.type, '| Value:', fieldData.value);
                // console.log('  Selector:', fieldData.selector);

                const element = this.findElement(fieldData.selector, fieldData.id);
                if (element) {
                    // console.log('  ✅ Element found!');
                    // Pass displayText so ComboBox display is restored alongside the code value
                    this.setFieldValue(element, fieldData.value, fieldData.displayText || null);
                    filledCount++;
                } else {
                    // console.warn('  ⚠️ Element NOT found');
                }
            });

            // console.log(`\n✅ Total filled: ${filledCount}/${profile.fields.length}`);

            // ── Focus field marked with focusAfterFill ────────────────────────
            const focusField = profile.fields.find(f => f.focusAfterFill);
            if (focusField) {
                const focusEl = this.findElement(focusField.selector, focusField.id);
                if (focusEl) {
                    setTimeout(() => {
                        focusEl.focus();
                        // Only call setSelectionRange on input types that support selection.
                        // Types like 'email', 'checkbox', 'radio', 'number', 'range', etc.
                        // have setSelectionRange on their prototype but throw InvalidStateError when called.
                        const SELECTION_SUPPORTED_TYPES = ['text', 'search', 'url', 'tel', 'password'];
                        const elType = (focusEl.type || '').toLowerCase();
                        const isTextarea = focusEl.tagName === 'TEXTAREA';
                        if (isTextarea || SELECTION_SUPPORTED_TYPES.includes(elType)) {
                            try {
                                const len = (focusEl.value || '').length;
                                focusEl.setSelectionRange(len, len);
                            } catch (e) {
                                // Silently ignore: element type does not support selection
                            }
                        }
                    }, 80);
                }
            }

            // Show notification
            this.showNotification(t('notify.smart', { count: filledCount }));
        },

        // Find element by selector
        findElement(selector, fallbackId) {
            try {
                // Try direct selector first
                let element = document.querySelector(selector);
                if (element) return element;

                // Try by ID
                if (fallbackId) {
                    element = document.getElementById(fallbackId);
                    if (element) return element;

                    // Try by name
                    element = document.querySelector(`[name="${fallbackId}"]`);
                    if (element) return element;
                }

                return null;
            } catch (error) {
                console.error('Error finding element:', error);
                return null;
            }
        },

        // Set value for a field
        setFieldValue(element, value, displayText = null) {
            const tagName = element.tagName.toLowerCase();

            // ── FineUI / combo-wrap ComboBox ──────────────────────────────────────────
            // Must check before the generic text-input path because:
            //   • FineUI DDLs may be readonly (blocking standard user input but NOT programmatic set)
            //   • The real submit value lives in a hidden "$Value" sibling, not in the text input
            //   • For DDLs WITHOUT a hidden $Value, applyComboBoxValue handles them too (text-only path)
            if (tagName === 'input' && element.type !== 'hidden' &&
                element.type !== 'checkbox' && element.type !== 'radio' &&
                typeof EnhancedFormUtils !== 'undefined' &&
                EnhancedFormUtils.isWebFormsComboBox(element)) {
                EnhancedFormUtils.applyComboBoxValue(element, value, displayText);
                return;
            }
            // ──────────────────────────────────────────────────────────────────────────

            if (tagName === 'select') {
                // For select elements, set the value and trigger change event
                element.value = value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (element.type === 'checkbox') {
                // For checkbox: value is boolean or 'true'/'false'
                const shouldCheck = value === true || value === 'true' || value === 'checked';
                element.checked = shouldCheck;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (element.type === 'radio') {
                // For radio: check if this radio's value matches the saved value
                if (element.value === value) {
                    element.checked = true;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            } else {
                // For text inputs and textareas – use enhanced setter if available
                if (typeof EnhancedFormUtils !== 'undefined') {
                    EnhancedFormUtils.setNativeValue(element, value);
                } else {
                    element.value = value;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        },

        // Show notification
        showNotification(message) {
            if (!_extAlive()) return;
            const getIcon = (name) => { try { return chrome.runtime.getURL(`icons/${name}.svg`); } catch (_) { return ''; } };

            // Colour + icon based on message content
            let bg = '#4CAF50';
            let iconName = 'check';
            const lowerMsg = message.toLowerCase();
            if (lowerMsg.includes('error') || lowerMsg.includes('lỗi')) {
                bg = '#e53e3e'; iconName = 'warning';
            } else if (lowerMsg.includes('no fields') || lowerMsg.includes('không tìm thấy')) {
                bg = '#dd6b20'; iconName = 'warning';
            }

            // ── Shadow DOM host — page CSS cannot affect anything inside ────────
            const host = document.createElement('div');
            host.className = 'typeless-notification-host';
            // Host is just a fixed-position anchor; all visual styling is inside shadow
            host.style.cssText = 'all:initial;position:fixed;top:20px;right:20px;z-index:2147483647;pointer-events:none;display:block;';
            const shadow = host.attachShadow({ mode: 'open' });

            const nStyle = document.createElement('style');
            nStyle.textContent = `
                @keyframes fadeIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
                @font-face {
                    font-family: 'Be Vietnam Pro';
                    src: url('${chrome.runtime.getURL('fonts/BeVietnamPro-Regular.woff2')}') format('woff2');
                    font-weight: normal;
                    font-style: normal;
                    font-display: swap;
                }
                .notif {
                    background: ${bg};
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    animation: fadeIn 0.3s ease-out;
                    white-space: nowrap;
                }
                .notif img { width:20px; height:20px; flex-shrink:0; filter:brightness(0) invert(1); }
            `;
            shadow.appendChild(nStyle);

            const notif = document.createElement('div');
            notif.className = 'notif';
            // FIX: Use DOM methods instead of innerHTML to avoid XSS.
            // The img src comes from chrome.runtime.getURL (trusted), but the
            // message string may originate from page content (e.g. error.message).
            const notifImg = document.createElement('img');
            notifImg.src = getIcon(iconName);
            const notifSpan = document.createElement('span');
            notifSpan.textContent = message; // Safe: treats message as plain text
            notif.appendChild(notifImg);
            notif.appendChild(notifSpan);
            shadow.appendChild(notif);
            // ────────────────────────────────────────────────────────────────────

            document.body.appendChild(host);

            setTimeout(() => {
                notif.style.transition = 'opacity 0.3s, transform 0.3s';
                notif.style.opacity = '0';
                notif.style.transform = 'translateY(-10px)';
                setTimeout(() => host.remove(), 300);
            }, 3000);
        }
    };

    // Toolbar manager
    const ToolbarManager = {
        async init() {
            // Only inject in top-level window, NOT in iframes
            if (window !== window.top) {
                return;
            }

            // Always create toolbar
            this.createToolbar();
        },

        async createToolbar() {
            // Remove ALL existing toolbar hosts if any (cleanup for reloads/updates)
            document.querySelectorAll('#' + TOOLBAR_ID).forEach(el => el.remove());
            if (toolbarInjected) return;
            if (!_extAlive()) return;

            await i18n.init();
            const getIcon = (name) => { try { return chrome.runtime.getURL(`icons/${name}.svg`); } catch (_) { return ''; } };

            // ── Shadow DOM: isolates toolbar from ALL page CSS ───────────────────
            const host = document.createElement('div');
            host.id = TOOLBAR_ID;
            const shadow = host.attachShadow({ mode: 'open' });
            toolbarShadow = shadow;

            // 1. Link extension stylesheet inside shadow so .toolbar-* classes render
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            try { cssLink.href = chrome.runtime.getURL('styles.css'); } catch (_) { }
            shadow.appendChild(cssLink);

            // 2. Host-level styles — applied via :host because the #id rule is
            //    in the light DOM and cannot pierce the shadow boundary
            const hostStyle = document.createElement('style');
            hostStyle.textContent = `
                @font-face {
                    font-family: 'Be Vietnam Pro';
                    src: url('${chrome.runtime.getURL('fonts/BeVietnamPro-Regular.woff2')}') format('woff2');
                    font-weight: normal;
                    font-style: normal;
                    font-display: swap;
                }
                :host {
                    display: block !important;
                    position: fixed !important;
                    bottom: 0 !important; left: 0 !important; right: 0 !important;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                    box-shadow: 0 -2px 20px rgba(0,0,0,0.3) !important;
                    z-index: 2147483640 !important;
                    font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                    font-size: 14px !important;
                    line-height: 1.4 !important;
                    box-sizing: border-box !important;
                    margin: 0 !important; padding: 0 !important;
                    cursor: default !important;
                    animation: slideUp 0.3s ease-out;
                }
                :host(.typeless-hidden) { display: none !important; }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `;
            shadow.appendChild(hostStyle);

            // 3. Inner content wrapper
            const inner = document.createElement('div');
            inner.innerHTML = `
        <div class="toolbar-header">
          <span class="toolbar-title"><img src="${getIcon('copy')}"> <span class="title-text">${t('toolbar.title')}</span></span>
          <div class="toolbar-controls">
            <button class="toolbar-btn" id="refresh-profiles-btn" title="${t('notify.refreshed')}"><img src="${getIcon('refresh')}"> <span class="btn-text">${t('btn.refresh_list')}</span></button>
            <button class="toolbar-btn" id="smart-fill-btn" title="${t('btn.smart')}"><img src="${getIcon('flash')}"> <span class="btn-text">${t('btn.smart')}</span></button>
            <button class="toolbar-btn" id="save-profile-btn" title="${t('modal.title')}"><img src="${getIcon('save')}"> <span class="btn-text">${t('btn.save')}</span></button>
            <button class="toolbar-btn" id="lang-btn" title="${t('btn.lang_tooltip')}"><img src="${getIcon('globe')}"> <span class="btn-text">${t('btn.lang')}</span></button>
            <button class="toolbar-btn toolbar-btn-icon" id="minimize-toolbar-btn" title="${t('btn.minimize')}"><img src="${getIcon('minimize')}"></button>
            <button class="toolbar-btn toolbar-btn-icon" id="hide-toolbar-btn" title="${t('btn.hide')}"><img src="${getIcon('close')}"></button>
          </div>
        </div>
        <div class="toolbar-content" id="toolbar-content">
          <div class="toolbar-profiles" id="toolbar-profiles">
            <div class="toolbar-loading">${t('toolbar.loading')}</div>
          </div>
        </div>
            `;
            shadow.appendChild(inner);
            // ────────────────────────────────────────────────────────────────────

            document.body.appendChild(host);
            toolbarInjected = true;
            document.body.style.marginBottom = '64px';

            this.attachEventListeners();
            this.loadProfiles();

            const wasHidden = await StorageManager.getToolbarHidden();
            if (wasHidden) { this.hideToolbar(); return; }

            const minimized = await StorageManager.getToolbarVisible();
            if (minimized === false) { this.minimizeToolbar(); }
        },

        minimizeToolbar() {
            const content = toolbarShadow?.getElementById('toolbar-content');
            const btn = toolbarShadow?.getElementById('minimize-toolbar-btn');

            if (content && btn) {
                content.style.display = 'none';
                btn.innerHTML = `<img src="${_extAlive() ? chrome.runtime.getURL('icons/expand.svg') : ''}">`;
                btn.title = t('btn.expand_tooltip');
                StorageManager.setToolbarVisible(false);
            }
        },

        expandToolbar() {
            const content = toolbarShadow?.getElementById('toolbar-content');
            const btn = toolbarShadow?.getElementById('minimize-toolbar-btn');

            if (content && btn) {
                content.style.display = 'block';
                btn.innerHTML = `<img src="${_extAlive() ? chrome.runtime.getURL('icons/minimize.svg') : ''}">`;
                btn.title = t('btn.minimize_tooltip');
                StorageManager.setToolbarVisible(true);
            }
        },

        hideToolbar() {
            const host = document.getElementById(TOOLBAR_ID);
            if (host) {
                host.classList.add('typeless-hidden');
                document.body.style.marginBottom = '0';
                StorageManager.setToolbarHidden(true);
            }
        },

        showToolbar() {
            const host = document.getElementById(TOOLBAR_ID);
            if (host) {
                host.classList.remove('typeless-hidden');
                document.body.style.marginBottom = '64px';
                StorageManager.setToolbarHidden(false);
            }
        },

        async refreshToolbarUI() {
            if (!_extAlive()) return;
            const getIcon = (name) => { try { return chrome.runtime.getURL(`icons/${name}.svg`); } catch (_) { return ''; } };

            // Update toolbar title text (i18n value may contain HTML img icons)
            const titleText = toolbarShadow?.querySelector('.title-text');
            if (titleText) titleText.innerHTML = t('toolbar.title');

            const refreshBtn = toolbarShadow?.getElementById('refresh-profiles-btn');
            if (refreshBtn) refreshBtn.innerHTML = `<img src="${getIcon('refresh')}"> <span class="btn-text">${t('btn.refresh_list')}</span>`;

            const saveBtn = toolbarShadow?.getElementById('save-profile-btn');
            if (saveBtn) saveBtn.innerHTML = `<img src="${getIcon('save')}"> <span class="btn-text">${t('btn.save')}</span>`;

            const langBtn = toolbarShadow?.getElementById('lang-btn');
            if (langBtn) langBtn.innerHTML = `<img src="${getIcon('globe')}"> <span class="btn-text">${t('btn.lang')}</span>`;
            if (langBtn) langBtn.title = t('btn.lang_tooltip');

            const smartBtn = toolbarShadow?.getElementById('smart-fill-btn');
            if (smartBtn) smartBtn.innerHTML = `<img src="${getIcon('flash')}"> <span class="btn-text">${t('btn.smart')}</span>`;
            if (smartBtn) smartBtn.title = t('btn.smart');

            const minBtn = toolbarShadow?.getElementById('minimize-toolbar-btn');
            if (minBtn) minBtn.title = t('btn.minimize');
            // Don't change innerHTML of minBtn here as it depends on state (up/down)

            const hideBtn = toolbarShadow?.getElementById('hide-toolbar-btn');
            if (hideBtn) hideBtn.title = t('btn.hide');

            // Reload profiles list
            await this.loadProfiles();
        },

        attachEventListeners() {
            // Minimize/Expand toggle
            toolbarShadow?.getElementById('minimize-toolbar-btn')?.addEventListener('click', () => {
                const content = toolbarShadow?.getElementById('toolbar-content');
                if (content && content.style.display === 'none') {
                    this.expandToolbar();
                } else {
                    this.minimizeToolbar();
                }
            });

            // Reload page button
            toolbarShadow?.getElementById('reload-page-btn')?.addEventListener('click', () => {
                window.location.reload();
            });

            // Refresh profiles list button
            toolbarShadow?.getElementById('refresh-profiles-btn')?.addEventListener('click', () => {
                this.loadProfiles();
                FormFiller.showNotification(t('notify.refreshed'));
            });

            // Save current form as profile
            toolbarShadow?.getElementById('save-profile-btn')?.addEventListener('click', () => {
                this.saveCurrentForm();
            });

            // Hide button - completely hide toolbar
            toolbarShadow?.getElementById('hide-toolbar-btn')?.addEventListener('click', () => {
                this.hideToolbar();
            });

            // Language switcher button
            toolbarShadow?.getElementById('lang-btn')?.addEventListener('click', async () => {
                await i18n.switchLanguage();
                await this.refreshToolbarUI();
                FormFiller.showNotification(t('notify.lang_changed'));
            });

            // Export profiles
            toolbarShadow?.getElementById('export-profiles-btn')?.addEventListener('click', async () => {
                try {
                    const profiles = await StorageManager.getProfiles();
                    if (profiles.length === 0) {
                        alert(t('alert.no_export'));
                        return;
                    }

                    // Create JSON file
                    const dataStr = JSON.stringify(profiles, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);

                    // Download file
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `auto-form-filler-profiles-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    FormFiller.showNotification(t('notify.exported', { count: profiles.length }));
                } catch (error) {
                    console.error('Export error:', error);
                    alert(t('error.common') + error.message);
                }
            });

            // Import profiles
            toolbarShadow?.getElementById('import-profiles-btn')?.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.style.display = 'none';

                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) {
                        document.body.removeChild(input);
                        return;
                    }

                    try {
                        // Guard against memory exhaustion from huge files (max 5 MB)
                        if (file.size > 5 * 1024 * 1024) {
                            alert(t('alert.error_import'));
                            document.body.removeChild(input);
                            return;
                        }
                        const text = await file.text();
                        const importedProfiles = JSON.parse(text);

                        if (!Array.isArray(importedProfiles)) {
                            throw new Error('File không đúng định dạng (phải là mảng profiles)');
                        }

                        // Get existing profiles
                        const existingProfiles = await StorageManager.getProfiles();
                        const merged = [...existingProfiles];
                        let addedCount = 0;

                        // Add imported profiles with unique IDs
                        for (const profile of importedProfiles) {
                            // Check if profile already exists (same name + same URL)
                            const exists = merged.find(p =>
                                p.name === profile.name && p.url === profile.url
                            );

                            if (!exists) {
                                // Add with new ID
                                merged.push({
                                    ...profile,
                                    id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 11),
                                    importedAt: new Date().toISOString()
                                });
                                addedCount++;
                            }
                        }

                        // Save merged profiles
                        if (_extAlive()) await chrome.storage.local.set({ profiles: merged });
                        FormFiller.showNotification(t('notify.imported', { added: addedCount, skipped: importedProfiles.length - addedCount }));
                        this.loadProfiles();

                    } catch (error) {
                        console.error('Import error:', error);
                        alert(t('alert.error_import'));
                    } finally {
                        document.body.removeChild(input);
                    }
                };

                document.body.appendChild(input);
                input.click();
            });



            // Smart Fill
            toolbarShadow?.getElementById('smart-fill-btn')?.addEventListener('click', async () => {
                // Load settings first
                const globalSettings = await StorageManager.getGlobalSettings();
                if (typeof SmartFill !== 'undefined') {
                    SmartFill.setSettings(globalSettings);
                }

                // Get exactly the same fields as the Save Profile dialog (skipping unchecked radios)
                const fields = FormDetector.getAllFields();
                let count = 0;
                fields.forEach(field => {
                    const element = field.element;

                    if (element) {
                        if (typeof SmartFill !== 'undefined') {
                            const value = SmartFill.generateValue(element, field.label);
                            if (value && value !== 'unchecked') { // Only count if we have a real value
                                if (typeof EnhancedFormUtils !== 'undefined') {
                                    EnhancedFormUtils.applyValue(element, value);
                                } else {
                                    element.value = value;
                                    element.dispatchEvent(new Event('input', { bubbles: true }));
                                    element.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                                count++;
                            }
                        }
                    }
                });

                // ── Broadcast Smart Fill to all embedded iframes ──────────────────
                ToolbarManager._broadcastToIframes({
                    __typeless_relay: true,
                    action: 'triggerSmartFill',
                    settings: globalSettings || {}
                });
                // ─────────────────────────────────────────────────────────────────

                if (count > 0) {
                    FormFiller.showNotification(t('notify.smart', { count }));
                } else {
                    // Feedback if no fields filled
                    FormFiller.showNotification(t('notify.no_fields_filled'));
                }
            });

            // Copy profiles to clipboard
            toolbarShadow?.getElementById('copy-profiles-btn')?.addEventListener('click', async () => {
                try {
                    const profiles = await StorageManager.getProfiles();
                    const currentUrl = window.location.href;
                    const normalizedCurrentUrl = StorageManager.normalizeUrl(currentUrl);
                    const currentProfiles = profiles.filter(p => StorageManager.normalizeUrl(p.url) === normalizedCurrentUrl);

                    if (currentProfiles.length === 0) {
                        alert(t('alert.no_export'));
                        return;
                    }

                    await navigator.clipboard.writeText(JSON.stringify(currentProfiles, null, 2));
                    FormFiller.showNotification(t('notify.copied'));
                } catch (err) {
                    console.error('Copy error:', err);
                    alert(t('error.common') + err.message);
                }
            });

            // Paste profiles from clipboard
            toolbarShadow?.getElementById('paste-profiles-btn')?.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    if (!text) return;

                    let profiles;
                    try {
                        profiles = JSON.parse(text);
                    } catch (e) {
                        alert(t('alert.invalid_json'));
                        return;
                    }

                    if (!Array.isArray(profiles)) {
                        alert(t('alert.invalid_json'));
                        return;
                    }

                    let added = 0;
                    const currentUrl = window.location.href;

                    for (const p of profiles) {
                        if (p.name && p.fields) {
                            const newProfile = { ...p };
                            newProfile.url = currentUrl;
                            delete newProfile.id;
                            delete newProfile.createdAt;

                            await StorageManager.saveProfile(newProfile);
                            added++; // count regardless of new/updated
                        }
                    }

                    FormFiller.showNotification(t('notify.pasted'));
                    this.loadProfiles();
                } catch (err) {
                    console.error('Paste error:', err);
                    alert(t('alert.error_import'));
                }
            });
        },

        async loadProfiles() {
            const container = toolbarShadow?.getElementById('toolbar-profiles');
            if (!container) return;
            if (!_extAlive()) return; // Skip silently if context invalidated
            let allProfiles;
            try {
                allProfiles = await StorageManager.getProfiles();
            } catch (e) {
                return; // Context invalidated — fail silently
            }

            // Filter profiles by current page URL
            const currentUrl = window.location.href;
            const profiles = allProfiles.filter(p => p.url === currentUrl);

            if (profiles.length === 0) {
                container.innerHTML = `<div class="toolbar-empty">${t('toolbar.empty')}</div>`;
                return;
            }

            // Build chip elements
            container.innerHTML = '';
            let _dragSrcId = null;

            profiles.forEach(profile => {
                const chip = document.createElement('div');
                chip.className = 'profile-chip';
                chip.dataset.profileId = profile.id;
                chip.draggable = true;
                chip.title = profile.name;

                const count = document.createElement('span');
                count.className = 'chip-count';
                count.textContent = profile.fields?.length || 0;

                const name = document.createElement('span');
                name.className = 'chip-name';
                name.textContent = profile.name;

                const del = document.createElement('button');
                del.className = 'chip-delete';
                del.textContent = '×';
                del.title = t('btn.delete_profile');

                chip.appendChild(count);
                chip.appendChild(name);
                chip.appendChild(del);
                container.appendChild(chip);

                // Apply profile on chip click (not delete btn)
                chip.addEventListener('click', async (e) => {
                    if (e.target === del) return;
                    const p = await StorageManager.getProfile(profile.id);
                    if (p) {
                        FormFiller.fillForm(p);
                        ToolbarManager._broadcastToIframes({ __typeless_relay: true, action: 'applyProfile', profile: p });
                    }
                });

                // Delete
                del.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const p = await StorageManager.getProfile(profile.id);
                    if (p && confirm(t('confirm.delete', { name: p.name }))) {
                        await StorageManager.deleteProfile(profile.id);
                        FormFiller.showNotification(t('notify.deleted', { name: p.name }));
                        this.loadProfiles();
                    }
                });

                // ── Drag-and-drop reorder ──
                chip.addEventListener('dragstart', (e) => {
                    _dragSrcId = profile.id;
                    chip.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                });

                chip.addEventListener('dragend', () => {
                    chip.classList.remove('dragging');
                    container.querySelectorAll('.profile-chip').forEach(c => c.classList.remove('drag-over'));
                });

                chip.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    container.querySelectorAll('.profile-chip').forEach(c => c.classList.remove('drag-over'));
                    if (chip.dataset.profileId !== _dragSrcId) chip.classList.add('drag-over');
                });

                chip.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    if (!_dragSrcId || _dragSrcId === profile.id) return;
                    chip.classList.remove('drag-over');

                    // Compute new order from current DOM chips, then swap
                    const chips = Array.from(container.querySelectorAll('.profile-chip'));
                    const ids = chips.map(c => c.dataset.profileId);
                    const srcIdx = ids.indexOf(_dragSrcId);
                    const dstIdx = ids.indexOf(profile.id);
                    if (srcIdx === -1 || dstIdx === -1) return;

                    // We reorder the full allProfiles array (across all URLs)
                    // by moving srcId to just before dstId in the global list
                    const globalIds = allProfiles.map(p => p.id);
                    const srcGlobal = globalIds.indexOf(_dragSrcId);
                    const dstGlobal = globalIds.indexOf(profile.id);
                    globalIds.splice(srcGlobal, 1);
                    const insertAt = globalIds.indexOf(profile.id);
                    // insert before or after depending on direction
                    globalIds.splice(dstIdx < srcIdx ? insertAt : insertAt + 1, 0, _dragSrcId);

                    await StorageManager.reorderProfiles(globalIds);
                    _dragSrcId = null;
                    this.loadProfiles();
                });
            });
        },

        saveCurrentForm() {
            const topFields = FormDetector.getAllFields();

            // Also collect fields from embedded iframes (async)
            this.collectIframeFields().then(iframeFields => {
                const allFields = [...topFields, ...iframeFields];
                const validFields = allFields.filter(f => f !== null);

                if (validFields.length === 0) {
                    alert(t('alert.no_fields'));
                    return;
                }

                // showFieldSelectionModal is now async (reads counter from storage)
                this.showFieldSelectionModal(validFields);
            });
        },

        /**
         * Request field data from all direct child iframes via postMessage.
         * Returns a promise that resolves to an array of serialisable field objects.
         * Elements cannot cross frame boundaries, so the returned objects have
         * element = null; the iframe fill path identifies them by __fromIframe flag.
         */
        collectIframeFields() {
            return new Promise(resolve => {
                const iframes = document.querySelectorAll('iframe');
                if (iframes.length === 0) {
                    resolve([]);
                    return;
                }

                const collected = [];
                let pending = 0;
                const requestId = `tl_${Date.now()}`;

                const handler = (event) => {
                    if (!event.data || !event.data.__typeless_fields_response) return;
                    if (event.data.requestId !== requestId) return;

                    const fields = event.data.fields || [];
                    const src = event.data.frameSrc || '';
                    fields.forEach(f => {
                        collected.push({
                            ...f,
                            element: null,        // cannot serialise DOM nodes
                            __fromIframe: true,
                            __frameSrc: src,
                            displayText: f.displayText || null,
                            label: `[iframe] ${f.label || f.name || f.id}`
                        });
                    });

                    pending--;
                    if (pending <= 0) {
                        window.removeEventListener('message', handler);
                        resolve(collected);
                    }
                };

                window.addEventListener('message', handler);

                iframes.forEach(iframe => {
                    try {
                        iframe.contentWindow.postMessage({
                            __typeless_relay: true,
                            action: 'requestFields',
                            requestId
                        }, '*');
                        pending++;
                    } catch (e) { /* cross-origin frame blocked – skip */ }
                });

                if (pending === 0) {
                    window.removeEventListener('message', handler);
                    resolve([]);
                    return;
                }

                // Timeout: don't wait forever for slow or non-responsive iframes
                setTimeout(() => {
                    window.removeEventListener('message', handler);
                    resolve(collected);
                }, 600);
            });
        },

        async showFieldSelectionModal(fields) {
            // ── Compute default profile name with auto-increment counter ───────────
            // Format: "Profile DD/MM/YYYY X"  where X increments each save, resets per day.
            const now = new Date();
            const dateKey = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
            const dateLabel = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
            const nextNum = await StorageManager.getNextProfileCounter(dateKey);
            const defaultName = `Profile ${dateLabel} ${nextNum}`;
            // ──────────────────────────────────────────────────────────────────────

            // ── Shadow DOM host for modal — isolated from page CSS ─────────────
            const modalHost = document.createElement('div');
            modalHost.id = 'auto-filler-modal-host';
            const modalShadow = modalHost.attachShadow({ mode: 'open' });

            const mCssLink = document.createElement('link');
            mCssLink.rel = 'stylesheet';
            try { mCssLink.href = chrome.runtime.getURL('styles.css'); } catch (_) { }
            modalShadow.appendChild(mCssLink);

            const mHostStyle = document.createElement('style');
            mHostStyle.textContent = `
                :host { display: block; position: fixed; inset: 0; z-index: 2147483647; }
                * { box-sizing: border-box; }
            `;
            modalShadow.appendChild(mHostStyle);

            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'auto-filler-modal-overlay';
            modalShadow.appendChild(modalOverlay);
            // ──────────────────────────────────────────────────────────────────

            modalOverlay.innerHTML = `
        <div class="auto-filler-modal">
          <div class="modal-header">
            <h2>${t('modal.title')}</h2>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="modal-section">
              <label class="modal-label">${t('modal.profile_name')}</label>
              <input type="text" class="modal-input" id="profile-name-input"
                     placeholder="Profile ${dateLabel} ${nextNum}"
                     value="${this.escapeHtml(defaultName)}">
            </div>
            <div class="modal-section">
              <div class="modal-section-header">
                <label class="modal-label">${t('modal.select_fields', { count: fields.length })}</label>
                <div class="modal-actions">
                  <span style="font-size:11px;color:#94a3b8;margin-right:6px;white-space:nowrap;">${_extAlive() ? '<img src="' + chrome.runtime.getURL('icons/target.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[target]">' : '[*]'} = ${t('modal.focus_col') || 'Focus after fill'}</span>
                  <button class="modal-btn-small" id="select-all-btn">${t('modal.select_all')}</button>
                  <button class="modal-btn-small" id="deselect-all-btn">${t('modal.deselect_all')}</button>
                </div>
              </div>
              <div class="field-list" id="field-list-container" style="padding-bottom:4px;">
                ${fields.map((field, index) => {
                // ── Format value for display in the modal ─────────────────────────────
                let displayValue = '';
                let tooltipValue = '';

                const hasValue = !!(
                    (field.value && field.value.trim() !== '' && field.value !== 'unchecked') ||
                    (field.displayText && field.displayText.trim() !== '')
                );

                if (!field.value || field.value.trim() === '' || field.value === 'unchecked') {
                    displayValue = t('modal.empty_value');
                    tooltipValue = t('modal.empty_value');
                } else if (field.value === 'checked') {
                    displayValue = t('modal.checked');
                    tooltipValue = t('modal.checked');
                } else if (field.displayText) {
                    const labelTrunc = field.displayText.length > 42
                        ? field.displayText.substring(0, 42) + '…'
                        : field.displayText;
                    displayValue = `${this.escapeHtml(labelTrunc)} <span class="field-value-code">[${this.escapeHtml(field.value)}]</span>`;
                    tooltipValue = `${field.displayText}  ($Value: ${field.value})`;
                } else if (field.value.length > 50) {
                    displayValue = this.escapeHtml(field.value.substring(0, 50) + '…');
                    tooltipValue = field.value;
                } else {
                    displayValue = this.escapeHtml(field.value);
                    tooltipValue = field.value;
                }

                const checkedAttr = hasValue ? 'checked' : '';

                return `
                  <div class="field-item-row" style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
                    <label class="field-item" style="flex:1;margin-bottom:0;">
                      <input type="checkbox" class="field-checkbox" data-index="${index}" ${checkedAttr}>
                      <span class="field-type-icon">${this.getFieldIcon(field.type)}</span>
                      <div class="field-info">
                        <div class="field-label-text">${this.escapeHtml(field.label || field.name || 'Field')}</div>
                        <div class="field-value-text" title="${this.escapeHtml(tooltipValue)}">${displayValue}</div>
                      </div>
                    </label>
                    <button
                      type="button"
                      class="focus-toggle-btn"
                      data-focus-index="${index}"
                      title="${t('modal.focus_hint') || 'Set cursor focus to this field after apply'}"
                      style="
                        flex-shrink:0;
                        width:30px;height:30px;
                        border-radius:6px;
                        border:2px solid #e2e8f0;
                        background:white;
                        cursor:pointer;
                        display:flex;align-items:center;justify-content:center;
                        font-size:14px;line-height:1;
                        transition:all 0.15s;
                        padding:0;
                        opacity:0.5;
                      "
                    ><img src="${_extAlive() ? chrome.runtime.getURL('icons/target.svg') : ''}" style="width:14px;height:14px;vertical-align:middle;display:inline-block;" alt="[target]"></button>
                  </div>
                `;
            }).join('')}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="modal-btn modal-btn-secondary" id="modal-cancel-btn">${t('modal.cancel')}</button>
            <button class="modal-btn modal-btn-primary" id="modal-save-btn">${t('modal.save')}</button>
          </div>
        </div>
      `;

            document.body.appendChild(modalHost);

            // Focus + select-all on profile name input
            setTimeout(() => {
                modalOverlay.querySelector('#profile-name-input')?.select();
            }, 100);

            // Event listeners
            modalOverlay.querySelector('#modal-close-btn')?.addEventListener('click', () => {
                modalHost.remove();
            });

            modalOverlay.querySelector('#modal-cancel-btn')?.addEventListener('click', () => {
                modalHost.remove();
            });

            modalOverlay.querySelector('#select-all-btn')?.addEventListener('click', () => {
                modalOverlay.querySelectorAll('.field-checkbox').forEach(cb => cb.checked = true);
            });

            modalOverlay.querySelector('#deselect-all-btn')?.addEventListener('click', () => {
                modalOverlay.querySelectorAll('.field-checkbox').forEach(cb => cb.checked = false);
            });

            // ── Focus-field tracking ──────────────────────────────────────────────────
            let focusFieldIndex = -1; // index into original fields[] array

            modalOverlay.querySelectorAll('.focus-toggle-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const idx = parseInt(btn.dataset.focusIndex);

                    if (focusFieldIndex === idx) {
                        // Toggle OFF
                        focusFieldIndex = -1;
                        btn.style.opacity = '0.5';
                        btn.style.borderColor = '#e2e8f0';
                        btn.style.background = 'white';
                    } else {
                        // Deactivate previous
                        if (focusFieldIndex >= 0) {
                            const prev = modalOverlay.querySelector(`.focus-toggle-btn[data-focus-index="${focusFieldIndex}"]`);
                            if (prev) {
                                prev.style.opacity = '0.5';
                                prev.style.borderColor = '#e2e8f0';
                                prev.style.background = 'white';
                            }
                        }
                        // Activate this
                        focusFieldIndex = idx;
                        btn.style.opacity = '1';
                        btn.style.borderColor = '#3291B6';
                        btn.style.background = '#e0f2f1';
                    }
                });
            });

            modalOverlay.querySelector('#modal-save-btn')?.addEventListener('click', () => {
                const profileName = modalOverlay.querySelector('#profile-name-input')?.value.trim();

                if (!profileName) {
                    alert(t('alert.enter_name'));
                    return;
                }

                // Get selected fields
                const selectedFields = [];
                modalOverlay.querySelectorAll('.field-checkbox:checked').forEach(checkbox => {
                    const index = parseInt(checkbox.dataset.index);
                    selectedFields.push({ ...fields[index], _origIdx: index });
                });

                if (selectedFields.length === 0) {
                    alert(t('alert.select_field'));
                    return;
                }

                // ── Consume the counter (increment and persist) ────────────────
                // Only consume when saving, not on modal open, so cancelled saves
                // don't waste a counter slot.
                StorageManager.consumeProfileCounter(dateKey).then(() => { });

                // Save profile
                const profile = {
                    id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 11),
                    name: profileName,
                    fields: selectedFields.map(f => ({
                        id: f.id,
                        selector: f.selector,
                        value: f.value,
                        displayText: f.displayText || null,
                        label: f.label,
                        type: f.type,
                        name: f.name,
                        focusAfterFill: f._origIdx === focusFieldIndex
                    })),
                    url: window.location.href,
                    pageTitle: document.title,
                    createdAt: new Date().toISOString()
                };

                StorageManager.saveProfile(profile).then(result => {
                    const success = result && result.success !== undefined ? result.success : !!result;
                    if (success) {
                        FormFiller.showNotification(t('notify.saved', { name: profileName, count: selectedFields.length }));
                        this.loadProfiles();
                        modalHost.remove();
                    } else {
                        alert(t('alert.error_save'));
                    }
                });
            });

            // Close on overlay click
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    modalHost.remove();
                }
            });

            // Close on Escape key
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    modalHost.remove();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        },

        getFieldIcon(type) {
            const icons = {
                'text': '<img src="' + (chrome.runtime.getURL ? chrome.runtime.getURL('icons/description.svg') : 'icons/description.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[text]">',
                'email': '<img src="' + (chrome.runtime.getURL ? chrome.runtime.getURL('icons/link.svg') : 'icons/link.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[email]">',
                'tel': '<img src="' + (chrome.runtime.getURL ? chrome.runtime.getURL('icons/link.svg') : 'icons/link.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[tel]">',
                'number': '##',
                'date': '<img src="' + (chrome.runtime.getURL ? chrome.runtime.getURL('icons/calendar.svg') : 'icons/calendar.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[date]">',
                'password': '<img src="' + (chrome.runtime.getURL ? chrome.runtime.getURL('icons/lock.svg') : 'icons/lock.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[lock]">',
                'select': '<img src="' + (chrome.runtime.getURL ? chrome.runtime.getURL('icons/clipboard.svg') : 'icons/clipboard.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[clip]">',
                'textarea': '<img src="' + (chrome.runtime.getURL ? chrome.runtime.getURL('icons/description.svg') : 'icons/description.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[text]">',
                'checkbox': '<img src="' + (chrome.runtime.getURL ? chrome.runtime.getURL('icons/check.svg') : 'icons/check.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[x]">',
                'radio': '(o)',
                'dropdownlist': '[v]',   // FineUI DDL / combo-wrap
                'url': '<img src="' + (chrome.runtime.getURL ? chrome.runtime.getURL('icons/link.svg') : 'icons/link.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[url]">',
                'search': '<img src="' + (chrome.runtime.getURL ? chrome.runtime.getURL('icons/search.svg') : 'icons/search.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[search]">',
                'color': '[#]',
                'range': '[--]',
            };
            return icons[type] || '<img src="' + (chrome.runtime.getURL ? chrome.runtime.getURL('icons/empty.svg') : 'icons/empty.svg') + '" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[?]">';
        },

        /**
         * Broadcast a postMessage payload to all direct child iframes.
         * Works for both same-origin and cross-origin iframes (one-way relay only).
         * Each iframe's content script will re-broadcast to its own children,
         * so the message propagates through arbitrarily nested iframe trees.
         */
        _broadcastToIframes(payload) {
            // Source-based trust check (event.source === iframe.contentWindow) replaces
            // the previous nonce approach. No nonce needed in the payload.
            document.querySelectorAll('iframe').forEach(iframe => {
                try {
                    iframe.contentWindow.postMessage(payload, '*');
                } catch (e) { /* blocked or null contentWindow – ignore */ }
            });
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ToolbarManager.init());
    } else {
        ToolbarManager.init();
    }

    // Listen for messages from popup or background
    if (_extAlive()) {
        try {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                // Only accept messages from this extension (security: reject external senders)
                if (!sender || sender.id !== chrome.runtime.id) {
                    return false;
                }

                // Only process in top window
                if (window !== window.top) {
                    return false;
                }

                if (request.action === 'toggleToolbar') {
                    const content = toolbarShadow?.getElementById('toolbar-content');
                    if (content && content.style.display === 'none') {
                        ToolbarManager.expandToolbar();
                    } else {
                        ToolbarManager.minimizeToolbar();
                    }
                    sendResponse({ success: true });
                } else if (request.action === 'showToolbar') {
                    ToolbarManager.showToolbar();
                    sendResponse({ success: true });
                } else if (request.action === 'toggleHideToolbar') {
                    const toolbar = document.getElementById(TOOLBAR_ID);
                    if (toolbar) {
                        const isHidden = toolbar.classList.contains('typeless-hidden');
                        if (isHidden) {
                            ToolbarManager.showToolbar();
                        } else {
                            ToolbarManager.hideToolbar();
                        }
                    } else {
                        // If toolbar doesn't exist, create it (essentially showing it)
                        ToolbarManager.createToolbar();
                    }
                    sendResponse({ success: true });
                } else if (request.action === 'fillForm') {
                    FormFiller.fillForm(request.profile);
                    sendResponse({ success: true });
                } else if (request.action === 'getFields') {
                    // Updated to be consistent with normal saving
                    const fields = FormDetector.getAllFields();
                    sendResponse({ fields });
                } else if (request.action === 'applyProfile') {
                    // Keyboard shortcut: Apply last profile
                    if (request.profile) {
                        FormFiller.fillForm(request.profile);
                        // Relay to iframes
                        ToolbarManager._broadcastToIframes({
                            __typeless_relay: true,
                            action: 'applyProfile',
                            profile: request.profile
                        });
                        sendResponse({ success: true });
                    }
                } else if (request.action === 'updateLanguage') {
                    i18n.init().then(() => {
                        ToolbarManager.refreshToolbarUI();
                        FormFiller.showNotification(t('notify.lang_changed'));
                        sendResponse({ success: true });
                    });
                    return true; // Asynchronous response
                } else if (request.action === 'refreshProfiles') {
                    ToolbarManager.loadProfiles();
                    sendResponse({ success: true });
                } else if (request.action === 'triggerSmartFill') {
                    // Trigger Smart Fill
                    (async () => {
                        try {
                            // Load settings first
                            const globalSettings = await StorageManager.getGlobalSettings();
                            if (typeof SmartFill !== 'undefined') {
                                SmartFill.setSettings(globalSettings);
                            }

                            // Get all fields (use Save dialog logic)
                            const fields = FormDetector.getAllFields();
                            let count = 0;
                            fields.forEach(field => {
                                const element = field.element;

                                if (element) {
                                    if (typeof SmartFill !== 'undefined') {
                                        const value = SmartFill.generateValue(element, field.label);
                                        if (value && value !== 'unchecked') {
                                            if (typeof EnhancedFormUtils !== 'undefined') {
                                                EnhancedFormUtils.applyValue(element, value);
                                            } else {
                                                element.value = value;
                                                element.dispatchEvent(new Event('input', { bubbles: true }));
                                                element.dispatchEvent(new Event('change', { bubbles: true }));
                                            }
                                            count++;
                                        }
                                    }
                                }
                            });

                            // Relay to iframes
                            ToolbarManager._broadcastToIframes({
                                __typeless_relay: true,
                                action: 'triggerSmartFill',
                                settings: globalSettings || {}
                            });

                            if (count > 0) {
                                FormFiller.showNotification(t('notify.smart', { count }));
                            } else {
                                FormFiller.showNotification(t('notify.no_fields_filled'));
                            }
                        } catch (e) {
                            console.error('Smart fill error:', e);
                        }
                    })();
                    sendResponse({ success: true });
                } else if (request.action === 'triggerSaveProfile') {
                    // Trigger Save Profile
                    ToolbarManager.saveCurrentForm();
                    sendResponse({ success: true });
                } else if (request.action === 'triggerRemoveReadonly') {
                    // Remove readonly and disabled attributes
                    let count = 0;
                    // Use a comprehensive selector to find all potentially locked elements
                    const elements = document.querySelectorAll('[readonly], [disabled], [contenteditable="false"]');

                    elements.forEach(el => {
                        let modified = false;

                        if (el.hasAttribute('readonly')) {
                            el.removeAttribute('readonly');
                            modified = true;
                        }
                        if (el.hasAttribute('disabled')) {
                            el.removeAttribute('disabled');
                            modified = true;
                        }
                        if (el.disabled) {
                            el.disabled = false;
                            modified = true;
                        }
                        if (el.getAttribute('contenteditable') === 'false') {
                            el.setAttribute('contenteditable', 'true');
                            modified = true;
                        }

                        if (modified) count++;
                    });

                    // FormFiller.showNotification(`🔓 Đã mở khóa ${ count } phần tử / Unlocked ${ count } elements`);
                    // Better message format
                    FormFiller.showNotification(t('notify.unlocked', { count }));

                    sendResponse({ success: true });
                }

                if (request.action === 'triggerEnableRightClick') {
                    try {
                        // Guard against repeated calls stacking anonymous capture listeners
                        if (!window.__typeLessRightClickEnabled) {
                            const events = ['contextmenu', 'selectstart', 'copy', 'cut', 'paste', 'mousedown', 'mouseup', 'keydown', 'keyup', 'dragstart'];

                            // Named handler so we could remove it if needed
                            const stopPropHandler = (e) => { e.stopPropagation(); };

                            events.forEach(event => {
                                document.addEventListener(event, stopPropHandler, true);
                            });
                            window.__typeLessRightClickEnabled = true;
                        }

                        // 2. Clear inline handlers
                        const events = ['contextmenu', 'selectstart', 'copy', 'cut', 'paste', 'mousedown', 'mouseup', 'keydown', 'keyup', 'dragstart'];
                        events.forEach(e => {
                            document['on' + e] = null;
                            document.body['on' + e] = null;
                            window['on' + e] = null;
                        });

                        // 3. Inject CSS to allow selection
                        const style = document.createElement('style');
                        style.textContent = `
                    * {
                        -webkit-user-select: text !important;
                        -moz-user-select: text !important;
                        -ms-user-select: text !important;
                        user-select: text !important;
                        pointer-events: auto !important;
                    }
                `;
                        document.head.appendChild(style);

                        // 4. Also try to find elements with inline styles inhibiting selection
                        document.querySelectorAll('*').forEach(el => {
                            if (el.style.userSelect === 'none') {
                                el.style.userSelect = 'text';
                            }
                            // Clean up any inline handlers
                            events.forEach(ev => {
                                if (el['on' + ev]) el['on' + ev] = null;
                                if (el.getAttribute('on' + ev)) el.removeAttribute('on' + ev);
                            });
                        });

                        FormFiller.showNotification(t('notify.right_click_enabled'));
                        sendResponse({ success: true });
                    } catch (e) {
                        console.error('Error enabling right click:', e);
                        FormFiller.showNotification('Error: ' + e.message, 'error');
                        sendResponse({ success: false, error: e.message });
                    }
                }

                else if (request.action === 'getRenderedHTML') {
                    // Force update value attributes for inputs so they appear in HTML
                    document.querySelectorAll('input, textarea, select').forEach(el => {
                        if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'email' || el.type === 'tel' || el.type === 'password')) {
                            el.setAttribute('value', el.value);
                        } else if (el.tagName === 'TEXTAREA') {
                            el.textContent = el.value;
                        } else if (el.tagName === 'SELECT') {
                            Array.from(el.options).forEach(opt => {
                                if (opt.selected) opt.setAttribute('selected', 'selected');
                                else opt.removeAttribute('selected');
                            });
                        } else if (el.type === 'checkbox' || el.type === 'radio') {
                            if (el.checked) el.setAttribute('checked', 'checked');
                            else el.removeAttribute('checked');
                        }
                    });

                    // Clone the document to modify it without affecting the live page
                    const clone = document.documentElement.cloneNode(true);

                    // Remove extension elements from the clone
                    const toolbar = clone.querySelector('#' + TOOLBAR_ID);
                    if (toolbar) toolbar.remove();

                    const notifications = clone.querySelectorAll('.auto-form-filler-notification');
                    notifications.forEach(n => n.remove());

                    // Remove injected styles
                    const keyframeStyle = clone.querySelector('#aff-keyframes');
                    if (keyframeStyle) keyframeStyle.remove();

                    const htmlContent = clone.outerHTML;
                    sendResponse({ html: htmlContent });
                }

                else if (request.action === 'prepareForScreenshot') {
                    // Save current visibility state
                    const toolbar = document.getElementById(TOOLBAR_ID);
                    window._toolbarWasVisibleBeforeScreenshot = toolbar && !toolbar.classList.contains('typeless-hidden');

                    // Hide everything
                    ToolbarManager.hideToolbar();

                    // Also hide any notifications
                    const notifications = document.querySelectorAll('.typeless-notification-host, .auto-form-filler-notification');
                    notifications.forEach(n => {
                        n.dataset.originalDisplay = n.style.display;
                        n.style.setProperty('display', 'none', 'important');
                    });

                    sendResponse({ success: true });
                } else if (request.action === 'cleanupAfterScreenshot') {
                    // Restore visibility if it was visible before
                    if (window._toolbarWasVisibleBeforeScreenshot) {
                        ToolbarManager.showToolbar();
                    }

                    // Show notifications again (they will fade out eventually)
                    const notifications = document.querySelectorAll('.typeless-notification-host, .auto-form-filler-notification');
                    notifications.forEach(n => {
                        if (n.dataset.originalDisplay !== undefined) {
                            n.style.display = n.dataset.originalDisplay || ''; // restore original (might be inline block for CSS defaults)
                        } else {
                            n.style.display = '';
                        }
                    });

                    delete window._toolbarWasVisibleBeforeScreenshot;
                    sendResponse({ success: true });
                } else if (request.action === 'showNotification') {
                    // In-page notification triggered by background or popup after an action
                    FormFiller.showNotification(request.message || '');
                    sendResponse({ success: true });
                } else if (request.action === 'ping') {
                    // Background uses this on update to detect tabs that have TypeLess running.
                    // Replying 'pong' signals: "yes, I have an active content script + toolbar."
                    sendResponse({ pong: true });
                } else {
                    // Unhandled action – return false so the message channel is not held open unnecessarily
                    return false;
                }

                return true; // Keep channel open for all handled async responses
            });

            // ═══════════════════════════════════════════════════════════════════════
            // IFRAME RELAY — postMessage listener
            // All frames (including nested iframes) listen for relay messages from
            // their parent frame. This enables the top-frame toolbar to trigger
            // SmartFill / profile-fill / field-collection across all iframe depths.
            // ═══════════════════════════════════════════════════════════════════════
            window.addEventListener('message', async (event) => {
                // Guard: only accept TypeLess relay messages from trusted frame sources.
                // Security model: verify event.source belongs to the expected frame hierarchy
                // instead of using a per-frame nonce (nonces are unique per frame and cannot
                // be shared cross-origin, which broke iframe communication after the security fix).
                //
                // Trust rules:
                //   • Top frame  → only accept from direct child iframes (contentWindow)
                //   • Child iframe → only accept from parent or top frame
                // This ensures messages only flow through the legitimate frame tree and
                // prevents arbitrary cross-origin pages from spoofing relay messages.
                const data = event.data;
                if (!data || !data.__typeless_relay) return;

                let _isTrustedSource = false;
                if (window === window.top) {
                    // Top frame: accept from direct child iframes only
                    const _iframes = document.querySelectorAll('iframe');
                    for (const _f of _iframes) {
                        try {
                            if (event.source === _f.contentWindow) {
                                _isTrustedSource = true;
                                break;
                            }
                        } catch (_) { /* cross-origin contentWindow access blocked */ }
                    }
                } else {
                    // Child iframe: accept from direct parent or top frame
                    _isTrustedSource = (event.source === window.parent) ||
                                       (event.source === window.top);
                }
                if (!_isTrustedSource) return;

                // ── requestFields: parent asks this iframe for its serialisable fields ──
                if (data.action === 'requestFields') {
                    const fields = FormDetector.getAllFields().map(f => ({
                        id: f.id,
                        name: f.name,
                        type: f.type,
                        value: f.value,
                        displayText: f.displayText || null,  // ComboBox display label
                        label: f.label,
                        selector: f.selector,
                        element: undefined  // cannot be serialised across frames
                    }));

                    // Reply to whoever sent the request (parent frame or top frame)
                    try {
                        (event.source || window.parent).postMessage({
                            __typeless_fields_response: true,
                            requestId: data.requestId,
                            fields,
                            frameSrc: window.location.href
                        }, '*');
                    } catch (e) { /* cross-origin parent – ignore */ }

                    // Do NOT forward requestFields downward (parent handles recursion itself)
                    return;
                }

                // ── triggerSmartFill: fill all fields in this frame ───────────────────
                if (data.action === 'triggerSmartFill') {
                    try {
                        const settings = data.settings || {};
                        if (typeof SmartFill !== 'undefined') {
                            SmartFill.setSettings(settings);
                        }
                        const fields = FormDetector.getAllFields();
                        fields.forEach(field => {
                            if (!field.element) return;
                            if (typeof SmartFill !== 'undefined') {
                                const value = SmartFill.generateValue(field.element, field.label);
                                if (value && value !== 'unchecked') {
                                    if (typeof EnhancedFormUtils !== 'undefined') {
                                        EnhancedFormUtils.applyValue(field.element, value);
                                    } else {
                                        field.element.value = value;
                                        field.element.dispatchEvent(new Event('input', { bubbles: true }));
                                        field.element.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                                }
                            }
                        });
                    } catch (e) {
                        console.error('[TypeLess iframe] SmartFill error:', e);
                    }
                }

                // ── applyProfile: fill matched fields in this frame ───────────────────
                if (data.action === 'applyProfile' && data.profile) {
                    try {
                        // fillForm reads fieldData.displayText if present — ComboBox display restored.
                        FormFiller.fillForm(data.profile);
                    } catch (e) {
                        console.error('[TypeLess iframe] applyProfile error:', e);
                    }
                }

                // ── Forward to nested iframes (depth-first propagation) ───────────────
                document.querySelectorAll('iframe').forEach(iframe => {
                    try { iframe.contentWindow.postMessage(data, '*'); } catch (e) { }
                });
            });
        } catch (_) { }
    } // end: if (_extAlive()) try { chrome.runtime.onMessage

    // Listen for language changes from storage (Real-time sync)
    if (_extAlive()) try {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.language) {
                const newLang = changes.language.newValue;
                if (newLang && newLang !== i18n.currentLang) {
                    i18n.init().then(() => {
                        ToolbarManager.refreshToolbarUI();
                        FormFiller.showNotification(t('notify.lang_changed'));
                    });
                }
            }
        });
    } catch (_) { }

    // ═══════════════════════════════════════════════════════════════════════
    // SPA / Client-side routing — auto-refresh profile list on URL change
    //
    // Covers all navigation patterns that DON'T trigger a real page reload:
    //   • pushState / replaceState  (React Router, Vue Router, Next.js, Nuxt…)
    //   • popstate                  (browser Back / Forward in SPA)
    //   • hashchange                (hash-based routing, older SPAs)
    //
    // Strategy:
    //   1. Hook History API in content script (works without extra permissions)
    //   2. Also listen for 'typeless-url-changed' message sent by background.js
    //      via webNavigation.onHistoryStateUpdated (catches edge cases where the
    //      page overwrites history before our hook runs, e.g. prerender/prefetch)
    //
    // A debounce (120 ms) prevents duplicate calls when both paths fire together.
    // ═══════════════════════════════════════════════════════════════════════
    if (window === window.top) { // Only run in top-level frame
        let _spaLastUrl = location.href;
        let _spaDebounceTimer = null;

        function _onUrlChanged(newUrl) {
            if (newUrl === _spaLastUrl) return;
            _spaLastUrl = newUrl;

            clearTimeout(_spaDebounceTimer);
            _spaDebounceTimer = setTimeout(() => {
                // console.log('[TypeLess] SPA URL changed → reload profiles:', newUrl);
                ToolbarManager.loadProfiles();
            }, 120);
        }

        // ── 1. Hook pushState & replaceState ──────────────────────────────
        (function _hookHistory() {
            const _wrap = (origFn) => function (...args) {
                const result = origFn.apply(this, args);
                // args[2] is the new URL (may be relative or absolute)
                const next = args[2]
                    ? new URL(String(args[2]), location.href).href
                    : location.href;
                _onUrlChanged(next);
                return result;
            };

            try {
                history.pushState    = _wrap(history.pushState);
                history.replaceState = _wrap(history.replaceState);
            } catch (e) { /* some pages restrict history access */ }
        })();

        // ── 2. popstate (Back / Forward button) ──────────────────────────
        window.addEventListener('popstate', () => _onUrlChanged(location.href));

        // ── 3. hashchange (hash-based SPA routing) ────────────────────────
        window.addEventListener('hashchange', () => _onUrlChanged(location.href));

        // ── 4. Message from background.js (webNavigation fallback) ────────
        // background.js fires chrome.tabs.sendMessage with action 'spaUrlChanged'
        // when webNavigation.onHistoryStateUpdated or onReferenceFragmentUpdated
        // fires — this catches prefetch/prerender cases that bypass our hooks.
        // The handler is already registered in the chrome.runtime.onMessage block
        // above; we add the action case here via a secondary lightweight listener
        // to keep the SPA logic self-contained in one place.
        if (_extAlive()) try {
            chrome.runtime.onMessage.addListener((request, sender) => {
                if (!sender || sender.id !== chrome.runtime.id) return false;
                if (request.action === 'spaUrlChanged' && request.url) {
                    _onUrlChanged(request.url);
                }
                // return false → don't send a response (fire-and-forget)
            });
        } catch (_) { }
    }

})();

/**
 * End of content.js
* ╔══╗─────────╔╗────╔═╗╔═╗╔╗───╔══╗╔═╗╔═╗╔═╦╗╔══╗──╔═╗╔═╗╔═╗
* ╚╗╔╝╔╦╗╔═╗╔═╗║║─╔═╗║═╣║═╣║╚╦╦╗╚╗╔╝║╬║║║║║║║║║╔═╣──║╬║║╬║║║║
* ─║║─║║║║╬║║╩╣║╚╗║╩╣╠═║╠═║║╬║║║─║║─║╗╣║║║║║║║║╚╗║╔╗║╔╝║╗╣║║║
* ─╚╝─╠╗║║╔╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╬╗║─╚╝─╚╩╝╚═╝╚╩═╝╚══╝╚╝╚╝─╚╩╝╚═╝
* ────╚═╝╚╝──────────────────╚═╝
 */
