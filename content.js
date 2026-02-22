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

console.log(`%c
╔══╗─────────╔╗────╔═╗╔═╗╔╗───╔══╗╔═╗╔═╗╔═╦╗╔══╗──╔═╗╔═╗╔═╗
╚╗╔╝╔╦╗╔═╗╔═╗║║─╔═╗║═╣║═╣║╚╦╦╗╚╗╔╝║╬║║║║║║║║║╔═╣──║╬║║╬║║║║
─║║─║║║║╬║║╩╣║╚╗║╩╣╠═║╠═║║╬║║║─║║─║╗╣║║║║║║║║╚╗║╔╗║╔╝║╗╣║║║
─╚╝─╠╗║║╔╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╬╗║─╚╝─╚╩╝╚═╝╚╩═╝╚══╝╚╝╚╝─╚╩╝╚═╝
────╚═╝╚╝──────────────────╚═╝

TypeLess - Auto Form Filler
v1.0.2 by TRONG.PRO
`, 'color: #667eea; font-weight: bold;');

// Content script
(function () {
    'use strict';
    console.log('🚀 Auto Form Filler content script loaded');

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
            const fieldType = type === 'select' ? 'select' :
                type === 'textarea' ? 'textarea' :
                    element.type || 'text';

            // Generate unique identifier for the field
            const id = element.id || element.name || this.generateFieldId(element);

            // NEW: Skip hidden elements (invisible inputs often cause "breaking HTML" side effects)
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden' || element.offsetWidth === 0 || element.offsetHeight === 0) {
                return null;
            }

            // Get value based on field type
            let value;
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
            }

            return {
                id: id,
                type: fieldType,
                name: element.name || '',
                value: value,
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

            return path.join('_') + '_' + Math.random().toString(36).substr(2, 9);
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
                    this.setFieldValue(element, fieldData.value);
                    filledCount++;
                } else {
                    // console.warn('  ⚠️ Element NOT found');
                }
            });

            // console.log(`\n✅ Total filled: ${filledCount}/${profile.fields.length}`);

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
        setFieldValue(element, value) {
            const tagName = element.tagName.toLowerCase();

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
                // For text inputs and textareas
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        },

        // Show notification
        showNotification(message) {
            const getIcon = (name) => chrome.runtime.getURL(`icons/${name}.svg`);

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
            // Host is just a fixed-position anchor; all visual styling is inside shadow
            host.style.cssText = 'all:initial;position:fixed;top:20px;right:20px;z-index:2147483647;pointer-events:none;display:block;';
            const shadow = host.attachShadow({ mode: 'open' });

            const nStyle = document.createElement('style');
            nStyle.textContent = `
                @keyframes fadeIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
                .notif {
                    background: ${bg};
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
            notif.innerHTML = `<img src="${getIcon(iconName)}"><span>${message}</span>`;
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

            await i18n.init();
            const getIcon = (name) => chrome.runtime.getURL(`icons/${name}.svg`);

            // ── Shadow DOM: isolates toolbar from ALL page CSS ───────────────────
            const host = document.createElement('div');
            host.id = TOOLBAR_ID;
            const shadow = host.attachShadow({ mode: 'open' });
            toolbarShadow = shadow;

            // 1. Link extension stylesheet inside shadow so .toolbar-* classes render
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = chrome.runtime.getURL('styles.css');
            shadow.appendChild(cssLink);

            // 2. Host-level styles — applied via :host because the #id rule is
            //    in the light DOM and cannot pierce the shadow boundary
            const hostStyle = document.createElement('style');
            hostStyle.textContent = `
                :host {
                    display: block !important;
                    position: fixed !important;
                    bottom: 0 !important; left: 0 !important; right: 0 !important;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                    box-shadow: 0 -2px 20px rgba(0,0,0,0.3) !important;
                    z-index: 2147483640 !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
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
          <span class="toolbar-title" id="toolbar-title"><img src="${getIcon('copy')}" style="height:16px; vertical-align:middle"> <span class="title-text">${t('toolbar.title')}</span></span>
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
            document.body.style.marginBottom = '50px';

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
                btn.innerHTML = `<img src="${chrome.runtime.getURL('icons/expand.svg')}">`;
                btn.title = t('btn.expand_tooltip');
                StorageManager.setToolbarVisible(false);
            }
        },

        expandToolbar() {
            const content = toolbarShadow?.getElementById('toolbar-content');
            const btn = toolbarShadow?.getElementById('minimize-toolbar-btn');

            if (content && btn) {
                content.style.display = 'block';
                btn.innerHTML = `<img src="${chrome.runtime.getURL('icons/minimize.svg')}">`;
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
                document.body.style.marginBottom = '50px';
                StorageManager.setToolbarHidden(false);
            }
        },

        async refreshToolbarUI() {
            // Helper to get icon URL
            const getIcon = (name) => chrome.runtime.getURL(`icons/${name}.svg`);

            // Update toolbar title and buttons
            const titleEl = toolbarShadow?.getElementById('toolbar-title');
            if (titleEl) titleEl.innerHTML = `<img src="${getIcon('copy')}" style="height:16px; vertical-align:middle"> <span class="title-text">${t('toolbar.title')}</span>`;

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
                                    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
                                    importedAt: new Date().toISOString()
                                });
                                addedCount++;
                            }
                        }

                        // Save merged profiles
                        await chrome.storage.local.set({ profiles: merged });
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
                            added++;
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
            const allProfiles = await StorageManager.getProfiles();

            // Filter profiles by current page URL
            const currentUrl = window.location.href;
            const profiles = allProfiles.filter(p => p.url === currentUrl);

            // console.log('📋 Loading profiles for URL:', currentUrl);
            // console.log('Total profiles in storage:', allProfiles.length);
            // console.log('Profiles for this page:', profiles.length);

            if (profiles.length === 0) {
                container.innerHTML = `<div class="toolbar-empty">${t('toolbar.empty')}</div>`;
                return;
            }

            container.innerHTML = profiles.map(profile => `
        <div class="profile-btn-wrapper">
          <button class="profile-btn" data-profile-id="${profile.id}">
            <span class="profile-name">${this.escapeHtml(profile.name)}</span>
            <span class="profile-count">${t('field.count', { count: profile.fields?.length || 0 })}</span>
          </button>
          <button class="profile-delete-btn" data-profile-id="${profile.id}" title="${t('btn.delete_profile')}">✕</button>
        </div>
      `).join('');

            // console.log('✅ Profile buttons created, attaching event listeners...');

            // Attach click handlers for applying profile
            container.querySelectorAll('.profile-btn').forEach((btn, index) => {
                // console.log(`  Attaching apply handler to profile button ${index + 1}`);
                btn.addEventListener('click', async () => {
                    // console.log('🖱️ Profile button clicked!', btn.dataset.profileId);
                    const profileId = btn.dataset.profileId;
                    const profile = await StorageManager.getProfile(profileId);
                    if (profile) {
                        // console.log('Loading profile:', profile.name);
                        FormFiller.fillForm(profile);
                    } else {
                        console.error('Profile not found:', profileId);
                    }
                });
            });

            // Attach click handlers for deleting profile
            container.querySelectorAll('.profile-delete-btn').forEach((btn, index) => {
                // console.log(`  Attaching delete handler to delete button ${index + 1}`);
                btn.addEventListener('click', async (e) => {
                    // console.log('🖱️ Delete button clicked!', btn.dataset.profileId);
                    e.stopPropagation(); // Prevent triggering profile apply
                    const profileId = btn.dataset.profileId;
                    const profile = await StorageManager.getProfile(profileId);

                    if (profile && confirm(t('confirm.delete', { name: profile.name }))) {
                        await StorageManager.deleteProfile(profileId);
                        FormFiller.showNotification(t('notify.deleted', { name: profile.name }));
                        this.loadProfiles(); // Reload profiles list
                    }
                });
            });

            // console.log('✅ Event listeners attached successfully!');
        },

        saveCurrentForm() {
            const fields = FormDetector.getAllFields();

            // Filter out null fields (unchecked radios)
            const validFields = fields.filter(f => f !== null);

            if (validFields.length === 0) {
                alert(t('alert.no_fields'));
                return;
            }

            // Create field selection modal
            this.showFieldSelectionModal(validFields);
        },

        showFieldSelectionModal(fields) {
            // ── Shadow DOM host for modal — isolated from page CSS ─────────────
            const modalHost = document.createElement('div');
            modalHost.id = 'auto-filler-modal-host';
            const modalShadow = modalHost.attachShadow({ mode: 'open' });

            const mCssLink = document.createElement('link');
            mCssLink.rel = 'stylesheet';
            mCssLink.href = chrome.runtime.getURL('styles.css');
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
            <button class="modal-close" id="modal-close-btn">✕</button>
          </div>
          <div class="modal-body">
            <div class="modal-section">
              <label class="modal-label">${t('modal.profile_name')}</label>
              <input type="text" class="modal-input" id="profile-name-input" placeholder="Example: Profile 1" value="Profile ${new Date().toLocaleDateString()}">
            </div>
            <div class="modal-section">
              <div class="modal-section-header">
                <label class="modal-label">${t('modal.select_fields', { count: fields.length })}</label>
                <div class="modal-actions">
                  <button class="modal-btn-small" id="select-all-btn">${t('modal.select_all')}</button>
                  <button class="modal-btn-small" id="deselect-all-btn">${t('modal.deselect_all')}</button>
                </div>
              </div>
              <div class="field-list" id="field-list-container">
                ${fields.map((field, index) => {
                // Format value for display
                let displayValue = '';
                if (!field.value || field.value.trim() === '' || field.value === 'unchecked') {
                    displayValue = t('modal.empty_value');
                } else if (field.value === 'checked') {
                    displayValue = t('modal.checked');
                } else if (field.value.length > 50) {
                    displayValue = field.value.substring(0, 50) + '...';
                } else {
                    displayValue = field.value;
                }

                // Helper for icon (internal to this map function or we need to ensure getFieldIcon exists)
                // Checking if getFieldIcon exists in FormFiller. It likely doesn't exist in scope if I don't use 'this' correctly or if it's missing.
                // Actually, looking at previous code, it called 'this.getFieldIcon'.
                // Let's assume getFieldIcon is a method of FormFiller or I should define it.
                // Wait, getFieldIcon was NOT in the previous view_file of content.js!
                // It must have been added or I need to add it.
                // Let's check if getFieldIcon is defined in FormFiller.

                const typeIcon = '📝'; // Default icon

                const hasValue = field.value && field.value !== 'unchecked' && field.value.trim() !== '';
                const checkedAttr = hasValue ? 'checked' : '';

                return `
                  <label class="field-item">
                    <input type="checkbox" class="field-checkbox" data-index="${index}" ${checkedAttr}>
                    <span class="field-type-icon">${this.getFieldIcon(field.type)}</span>
                    <div class="field-info">
                      <div class="field-label-text">${this.escapeHtml(field.label || field.name || 'Field')}</div>
                      <div class="field-value-text" title="${this.escapeHtml(field.value)}">${this.escapeHtml(displayValue)}</div>
                    </div>
                  </label>
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

            // Focus on profile name input
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
                    selectedFields.push(fields[index]);
                });

                if (selectedFields.length === 0) {
                    alert(t('alert.select_field'));
                    return;
                }

                // Save profile
                const profile = {
                    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9), // Generate unique ID
                    name: profileName,
                    fields: selectedFields.map(f => ({
                        id: f.id,
                        selector: f.selector,
                        value: f.value,
                        label: f.label,
                        type: f.type,
                        name: f.name
                    })),
                    url: window.location.href,
                    pageTitle: document.title,
                    createdAt: new Date().toISOString()
                };

                console.log('💾 Saving profile:', profile);

                StorageManager.saveProfile(profile).then(success => {
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
                'text': '📝',
                'email': '📧',
                'tel': '📞',
                'number': '🔢',
                'date': '📅',
                'password': '🔒',
                'select': '📋',
                'textarea': '📄',
                'checkbox': '☑️',
                'radio': '🔘'
            };
            return icons[type] || '📌';
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
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
                sendResponse({ success: true });
            }
        } else if (request.action === 'toggleToolbar') {
            // Keyboard shortcut: Toggle toolbar
            const toolbar = document.getElementById(TOOLBAR_ID);
            if (toolbar) {
                const isHidden = toolbar.style.display === 'none';
                if (isHidden) {
                    ToolbarManager.showToolbar();
                } else {
                    ToolbarManager.hideToolbar();
                }
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
                style.innerHTML = `
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
            const notifications = document.querySelectorAll('.auto-form-filler-notification');
            notifications.forEach(n => n.style.display = 'none');
            
            sendResponse({ success: true });
        } else if (request.action === 'cleanupAfterScreenshot') {
            // Restore visibility if it was visible before
            if (window._toolbarWasVisibleBeforeScreenshot) {
                ToolbarManager.showToolbar();
            }
            
            // Show notifications again (they will fade out eventually)
            const notifications = document.querySelectorAll('.auto-form-filler-notification');
            notifications.forEach(n => n.style.display = '');
            
            delete window._toolbarWasVisibleBeforeScreenshot;
            sendResponse({ success: true });
        } else if (request.action === 'showNotification') {
            // In-page notification triggered by background or popup after an action
            FormFiller.showNotification(request.message || '');
            sendResponse({ success: true });
        } else {
            // Unhandled action – return false so the message channel is not held open unnecessarily
            return false;
        }

        return true; // Keep channel open for all handled async responses
    });

    // Listen for language changes from storage (Real-time sync)
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

})();

/**
 * End of content.js
* ╔══╗─────────╔╗────╔═╗╔═╗╔╗───╔══╗╔═╗╔═╗╔═╦╗╔══╗──╔═╗╔═╗╔═╗
* ╚╗╔╝╔╦╗╔═╗╔═╗║║─╔═╗║═╣║═╣║╚╦╦╗╚╗╔╝║╬║║║║║║║║║╔═╣──║╬║║╬║║║║
* ─║║─║║║║╬║║╩╣║╚╗║╩╣╠═║╠═║║╬║║║─║║─║╗╣║║║║║║║║╚╗║╔╗║╔╝║╗╣║║║
* ─╚╝─╠╗║║╔╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╬╗║─╚╝─╚╩╝╚═╝╚╩═╝╚══╝╚╝╚╝─╚╩╝╚═╝
* ────╚═╝╚╝──────────────────╚═╝
 */
