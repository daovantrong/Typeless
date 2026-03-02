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

/**
 * options.js - Logic for the Options page (Settings & Onboarding)
 * v1.0.3 — Profile Manager added
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize i18n
    await i18n.init();
    updateUI();

    // 2. Set language selector correctly
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        const currentLocale = i18n.currentLang || 'en';
        langSelect.value = currentLocale;
        if (!langSelect.value) langSelect.value = 'en';

        langSelect.addEventListener('change', async (e) => {
            const newLang = e.target.value;
            await i18n.setLocale(newLang);
            updateUI();
        });
    }

    // 3. Listen for language changes from other parts
    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area === 'local' && changes.language) {
            const newLang = changes.language.newValue;
            if (newLang && newLang !== i18n.currentLang) {
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

            // Load profiles list when switching to profiles tab
            if (targetId === 'profiles') {
                loadProfilesList();
            }
        });
    });

    // --- Load Settings ---
    await loadSettings();

    // --- Personal Info ---
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
        await StorageManager.setGlobalSettings(settings);
        showStatus('personal-status', i18n.t('options.saved'));
    });

    document.getElementById('clear-personal-btn').addEventListener('click', async () => {
        if (confirm(i18n.t('options.reset_confirm'))) {
            await StorageManager.setGlobalSettings({});
            await loadSettings();
            showStatus('personal-status', i18n.t('options.reset_done'));
        }
    });

    // --- User Agents ---
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

    document.getElementById('reset-ua-btn').addEventListener('click', async () => {
        if (confirm(i18n.t('options.reset_confirm'))) {
            await chrome.storage.local.remove(['ua_android', 'ua_ios', 'ua_macos', 'ua_windows', 'ua_linux']);
            await loadSettings();
            showStatus('ua-status', i18n.t('options.reset_done'));
        }
    });

    // --- Data Management ---
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

    document.getElementById('btn-import')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                // Guard against memory exhaustion from huge files (max 5 MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert(i18n.t('alert.error_import'));
                    return;
                }
                const text = await file.text();
                const importedData = JSON.parse(text);
                const result = await StorageManager.restoreBackupData(importedData);
                alert(i18n.t('notify.imported', {
                    added:   result.added   ?? result.count ?? 0,
                    updated: result.updated ?? 0,
                    skipped: result.skipped ?? 0
                }));
                await loadSettings();
            } catch (error) {
                alert(i18n.t('alert.error_import'));
            }
        };
        input.click();
    });

    // --- Date Picker (Flatpickr Inline) ---
    const dobInput = document.getElementById('setting-dob');
    const calendarEl = document.getElementById('inline-calendar');

    if (dobInput && calendarEl && window.flatpickr) {
        const fp = flatpickr(calendarEl, {
            inline: true,
            dateFormat: "Y/m/d",
            defaultDate: dobInput.value,
            onChange: (selectedDates, dateStr) => {
                dobInput.value = dateStr;
            }
        });

        dobInput.addEventListener('input', (e) => { fp.setDate(e.target.value, false, "Y/m/d"); });
        dobInput.addEventListener('change', (e) => { fp.setDate(e.target.value, true, "Y/m/d"); });
    }

    // --- Demo Form Download ---
    const downloadDemoBtn = document.getElementById('btn-download-demo');
    if (downloadDemoBtn) {
        downloadDemoBtn.addEventListener('click', () => {
            const url = chrome.runtime.getURL('demo-form.html');
            chrome.downloads.download({ url, filename: 'TypeLess-Demo-Form.html', saveAs: true });
        });
    }

    // --- External Extension Settings Link ---
    const externalSettingsLink = document.getElementById('browser-extension-settings');
    if (externalSettingsLink) {
        const id = chrome.runtime.id;
        const isEdge = navigator.userAgent.includes('Edg/');
        const baseUrl = isEdge ? 'edge://extensions/' : 'chrome://extensions/';
        externalSettingsLink.href = `${baseUrl}?id=${id}`;
        externalSettingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: `${baseUrl}?id=${id}` });
        });
    }

    // --- Profile Manager Init ---
    initProfileManager();
});


// ════════════════════════════════════════════════════════════════
// PROFILE MANAGER
// ════════════════════════════════════════════════════════════════

/** Currently-editing profile object (deep copy). */
let _editingProfile = null;
/** Working copy of fields during editing. */
let _editingFields = [];
/** Index of the field that should receive focus after fill. -1 = none. */
let _focusFieldIdx = -1;

function initProfileManager() {
    // Search
    document.getElementById('profile-search').addEventListener('input', (e) => {
        renderProfileList(e.target.value.trim().toLowerCase());
    });

    document.getElementById('btn-refresh-profiles-list')?.addEventListener('click', async () => {
        await loadProfilesList();
    });

    document.getElementById('btn-delete-all-profiles')?.addEventListener('click', async () => {
        if (!_allProfiles || _allProfiles.length === 0) return;
        if (!confirm(i18n.t('options.confirm_delete_all') || `Xóa tất cả ${_allProfiles.length} profile? Thao tác này không thể hoàn tác.`)) return;
        await StorageManager.clearAllProfiles();
        await loadProfilesList();
    });

    // Back buttons
    document.getElementById('editor-back-btn').addEventListener('click', showProfilesList);
    document.getElementById('editor-back-btn2').addEventListener('click', showProfilesList);

    // Save editor
    document.getElementById('editor-save-btn').addEventListener('click', saveEditingProfile);

    // Delete profile
    document.getElementById('editor-delete-btn').addEventListener('click', deleteEditingProfile);

    // Add field button
    document.getElementById('btn-add-field').addEventListener('click', addNewField);

    // Allow Enter in new-field inputs to trigger add
    ['new-field-label', 'new-field-selector', 'new-field-value'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); addNewField(); }
        });
    });
}

// ── List View ──────────────────────────────────────────────────

let _allProfiles = [];

async function loadProfilesList() {
    _allProfiles = await StorageManager.getProfiles();
    renderProfileList('');

    const badge = document.getElementById('profile-count-badge');
    if (badge) badge.textContent = _allProfiles.length;
}

function renderProfileList(searchQuery) {
    const container = document.getElementById('profiles-list');
    const profiles = searchQuery
        ? _allProfiles.filter(p =>
            p.name.toLowerCase().includes(searchQuery) ||
            (p.url || '').toLowerCase().includes(searchQuery))
        : _allProfiles;

    if (profiles.length === 0) {
        // Safe: all user-supplied values are escaped via escHtml() before insertion
        const msg = searchQuery
            ? `<div class="empty-profiles"><div style="font-size:36px"><img src="icons/search.svg" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[search]"></div><p>${i18n.t('options.profiles_no_match', { query: escHtml(searchQuery) })}</p></div>`
            : `<div class="empty-profiles"><div style="font-size:40px">📭</div><p>${i18n.t('options.profiles_empty')}</p></div>`;
        container.innerHTML = msg;
        return;
    }

    container.innerHTML = '';
    profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.dataset.profileId = profile.id;
        card.draggable = true;
        const fieldCount = profile.fields?.length || 0;
        const focusField = profile.fields?.find(f => f.focusAfterFill);
        const focusHint = focusField
            ? `<span title="${i18n.t('options.col_focus')}" style="color:#3291B6;"><img src="icons/target.svg" style="width:1em;height:1em;vertical-align:-0.15em;display:inline-block;" alt="[target]"></span>`
            : '';

        card.innerHTML = `
            <span class="drag-handle" title="Kéo để sắp xếp thứ tự">⠿</span>
            <div class="profile-card-info">
                <div class="profile-card-name">${escHtml(profile.name)}</div>
                <div class="profile-card-meta" title="${escHtml(profile.url || '')}">
                    ${escHtml(profile.url || '—')}
                </div>
            </div>
            <span class="profile-card-badge">${i18n.t('field.count', { count: fieldCount })}</span>
            ${focusHint}
            <button class="btn-edit-profile">${i18n.t('options.btn_edit')}</button>
            <button class="btn-delete-profile" title="${i18n.t('btn.delete_profile')}" style="
                background:#fff0f0; border:1px solid #fca5a5; color:#dc2626;
                border-radius:6px; padding:4px 8px; font-size:16px; line-height:1;
                cursor:pointer; flex-shrink:0; transition:background 0.15s;">×</button>
        `;

        card.querySelector('.btn-edit-profile').addEventListener('click', (e) => {
            e.stopPropagation();
            openProfileEditor(profile);
        });

        card.querySelector('.btn-delete-profile').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm(i18n.t('confirm.delete', { name: profile.name }))) return;
            await StorageManager.deleteProfile(profile.id);
            await loadProfilesList();
        });

        card.addEventListener('click', () => openProfileEditor(profile));
        container.appendChild(card);
    });

    // ── Drag-and-drop reorder for options profile list ────────────────────
    let _dndSrcId = null;
    container.querySelectorAll('.profile-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            _dndSrcId = card.dataset.profileId;
            card.classList.add('is-dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('is-dragging');
            container.querySelectorAll('.profile-card').forEach(c => c.classList.remove('drag-over-top', 'drag-over-bottom'));
        });
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (card.dataset.profileId === _dndSrcId) return;
            const rect = card.getBoundingClientRect();
            container.querySelectorAll('.profile-card').forEach(c => c.classList.remove('drag-over-top', 'drag-over-bottom'));
            card.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drag-over-top' : 'drag-over-bottom');
        });
        card.addEventListener('drop', async (e) => {
            e.preventDefault();
            if (!_dndSrcId || _dndSrcId === card.dataset.profileId) return;
            container.querySelectorAll('.profile-card').forEach(c => c.classList.remove('drag-over-top', 'drag-over-bottom'));

            const rect = card.getBoundingClientRect();
            const insertBefore = e.clientY < rect.top + card.getBoundingClientRect().height / 2;

            const globalIds = _allProfiles.map(p => p.id);
            const srcIdx = globalIds.indexOf(_dndSrcId);
            globalIds.splice(srcIdx, 1);
            const dstIdx = globalIds.indexOf(card.dataset.profileId);
            globalIds.splice(insertBefore ? dstIdx : dstIdx + 1, 0, _dndSrcId);

            await StorageManager.reorderProfiles(globalIds);
            _dndSrcId = null;
            await loadProfilesList();
        });
    });
    // ─────────────────────────────────────────────────────────────────────
}

function showProfilesList() {
    document.getElementById('profiles-view').classList.add('visible');
    document.getElementById('profile-editor').classList.remove('visible');
    loadProfilesList(); // Refresh in case of saves
}

// ── Editor View ────────────────────────────────────────────────

function openProfileEditor(profile) {
    _editingProfile = JSON.parse(JSON.stringify(profile)); // deep copy
    _editingFields = (_editingProfile.fields || []).map((f, i) => ({ ...f, _idx: i }));
    _focusFieldIdx = _editingFields.findIndex(f => f.focusAfterFill);

    // Set header
    document.getElementById('editor-title').textContent = i18n.t('options.edit_profile_title', { name: profile.name });
    document.getElementById('editor-subtitle').textContent = profile.id || '';
    document.getElementById('editor-name').value = profile.name || '';
    document.getElementById('editor-url').value = profile.url || '';

    // Clear add-field inputs
    clearAddFieldRow();

    // Render fields table
    renderFieldsTable();

    // Switch views
    document.getElementById('profiles-view').classList.remove('visible');
    document.getElementById('profile-editor').classList.add('visible');
}

function renderFieldsTable() {
    const tbody = document.getElementById('fields-tbody');
    tbody.innerHTML = '';

    if (_editingFields.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px; font-size:13px;">${i18n.t('options.no_fields')}</td></tr>`;
        return;
    }

    _editingFields.forEach((field, idx) => {
        const tr = document.createElement('tr');
        tr.dataset.idx = idx;

        const isFocus = idx === _focusFieldIdx;
        const typeStr = field.type || 'text';

        tr.innerHTML = `
            <td class="col-label">
                <input type="text" class="field-input" data-field="label" value="${escHtml(field.label || '')}" placeholder="${escHtml(i18n.t('options.add_field_label_ph'))}">
            </td>
            <td class="col-value">
                <input type="text" class="field-input" data-field="value" value="${escHtml(field.value || '')}" placeholder="${escHtml(i18n.t('options.add_field_value_ph'))}">
            </td>
            <td class="col-selector">
                <input type="text" class="field-input" data-field="selector" value="${escHtml(field.selector || '')}" placeholder="${escHtml(i18n.t('options.add_field_selector_ph'))}" style="font-family:monospace;font-size:11px;">
            </td>
            <td class="col-type">
                <span class="field-type-badge">${escHtml(typeStr)}</span>
            </td>
            <td class="col-focus" style="text-align:center;">
                <button class="focus-btn ${isFocus ? 'active' : ''}" title="${escHtml(i18n.t('options.focus_tip'))}" data-action="focus">
                </button>
            </td>
            <td class="col-del" style="text-align:center;">
                <button class="delete-field-btn" title="${escHtml(i18n.t('options.col_delete'))}" data-action="delete">✕</button>
            </td>
        `;

        // Live-sync inputs → _editingFields
        tr.querySelectorAll('.field-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const fieldKey = e.target.dataset.field;
                _editingFields[idx][fieldKey] = e.target.value;
            });
        });

        // Focus toggle
        tr.querySelector('[data-action="focus"]').addEventListener('click', () => {
            if (_focusFieldIdx === idx) {
                // Deactivate
                _focusFieldIdx = -1;
            } else {
                _focusFieldIdx = idx;
            }
            // Update focusAfterFill flags on fields
            _editingFields.forEach((f, i) => { f.focusAfterFill = (i === _focusFieldIdx); });
            // Re-render to reflect UI changes
            renderFieldsTable();
        });

        // Delete field
        tr.querySelector('[data-action="delete"]').addEventListener('click', () => {
            _editingFields.splice(idx, 1);
            // Adjust focus index if needed
            if (_focusFieldIdx === idx) _focusFieldIdx = -1;
            else if (_focusFieldIdx > idx) _focusFieldIdx--;
            renderFieldsTable();
        });

        tbody.appendChild(tr);
    });
}

function addNewField() {
    const labelInput = document.getElementById('new-field-label');
    const selectorInput = document.getElementById('new-field-selector');
    const valueInput = document.getElementById('new-field-value');
    const typeSelect = document.getElementById('new-field-type');

    const label = labelInput.value.trim();
    const selector = selectorInput.value.trim();
    const value = valueInput.value.trim();
    const type = typeSelect.value;

    if (!selector && !label) {
        selectorInput.focus();
        selectorInput.style.borderColor = '#f87171';
        setTimeout(() => { selectorInput.style.borderColor = ''; }, 1500);
        return;
    }

    const newField = {
        label: label || selector,
        selector: selector,
        value: value,
        type: type,
        focusAfterFill: false
    };

    _editingFields.push(newField);
    renderFieldsTable();
    clearAddFieldRow();

    // Focus label input for quick next entry
    labelInput.focus();
}

function clearAddFieldRow() {
    document.getElementById('new-field-label').value = '';
    document.getElementById('new-field-selector').value = '';
    document.getElementById('new-field-value').value = '';
    document.getElementById('new-field-type').value = 'text';
}

async function saveEditingProfile() {
    if (!_editingProfile) return;

    const newName = document.getElementById('editor-name').value.trim();
    const newUrl = document.getElementById('editor-url').value.trim();

    if (!newName) {
        document.getElementById('editor-name').focus();
        document.getElementById('editor-name').style.borderColor = '#f87171';
        setTimeout(() => { document.getElementById('editor-name').style.borderColor = ''; }, 1500);
        return;
    }

    // Apply focus flags
    _editingFields.forEach((f, i) => { f.focusAfterFill = (i === _focusFieldIdx); });

    // Build updated profile
    const updatedProfile = {
        ..._editingProfile,
        name: newName,
        url: newUrl,
        fields: _editingFields.map(f => {
            // Remove temp _idx helper
            const { _idx, ...rest } = f;
            return rest;
        }),
        updatedAt: new Date().toISOString()
    };

    const result = await StorageManager.saveProfile(updatedProfile);

    if (result.success) {
        const statusEl = document.getElementById('editor-status');
        statusEl.textContent = i18n.t('options.profile_saved');
        statusEl.style.opacity = '1';
        setTimeout(() => { statusEl.style.opacity = '0'; }, 2500);

        // Update editing state in case of further edits
        _editingProfile = updatedProfile;
        document.getElementById('editor-title').textContent = i18n.t('options.edit_profile_title', { name: newName });
        _allProfiles = await StorageManager.getProfiles();
    } else {
        alert(i18n.t('options.profile_save_failed'));
    }
}

async function deleteEditingProfile() {
    if (!_editingProfile) return;
    const name = _editingProfile.name;
    if (!confirm(i18n.t('options.delete_profile_confirm', { name }))) return;

    const ok = await StorageManager.deleteProfile(_editingProfile.id);
    if (ok) {
        showProfilesList();
    } else {
        alert(i18n.t('options.profile_delete_failed'));
    }
}


// ════════════════════════════════════════════════════════════════
// SETTINGS HELPERS
// ════════════════════════════════════════════════════════════════

async function loadSettings() {
    // 1. Personal Info
    const settings = await StorageManager.getGlobalSettings();
    if (settings) {
        document.getElementById('setting-firstname').value = settings.firstName || '';
        document.getElementById('setting-lastname').value = settings.lastName || '';
        document.getElementById('setting-email').value = settings.email || '';
        document.getElementById('setting-phone').value = settings.phone || '';
        document.getElementById('setting-dob').value = settings.dob || '';
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

    // 2. User Agents
    const defaults = getDefaultUserAgents();
    const uaKeys = ['ua_android', 'ua_ios', 'ua_macos', 'ua_windows', 'ua_linux'];
    const uaData = await chrome.storage.local.get(uaKeys);

    document.getElementById('setting-ua-android').value = uaData.ua_android || defaults.ua_android;
    document.getElementById('setting-ua-ios').value = uaData.ua_ios || defaults.ua_ios;
    document.getElementById('setting-ua-macos').value = uaData.ua_macos || defaults.ua_macos;
    document.getElementById('setting-ua-windows').value = uaData.ua_windows || defaults.ua_windows;
    document.getElementById('setting-ua-linux').value = uaData.ua_linux || defaults.ua_linux;
}

function getDefaultUserAgents() {
    const match = navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    const chromeVersion = match ? match[1] : '130.0.0.0';
    return {
        'ua_android': `Mozilla/5.0 (Linux; Android 16; SM-S938B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36`,
        'ua_ios': `Mozilla/5.0 (iPhone; CPU iPhone OS 26_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Chrome/${chromeVersion} Safari/604.1`,
        'ua_macos': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`,
        'ua_windows': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`,
        'ua_linux': `Mozilla/5.0 (Linux x86_64; Ubuntu 25.04) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
    };
}

function showStatus(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

function updateUI() {
    const t = (key) => i18n.t(key);
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.innerHTML = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });
    // Re-translate dynamically rendered elements in profile list
    document.querySelectorAll('.btn-edit-profile').forEach(btn => {
        btn.textContent = t('options.btn_edit');
    });
    document.querySelectorAll('.btn-delete-profile').forEach(btn => {
        btn.title = t('btn.delete_profile');
    });
    document.querySelectorAll('.profile-card .drag-handle').forEach(el => {
        el.title = t('options.drag_to_reorder') || 'Kéo để sắp xếp thứ tự';
    });
}

function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
