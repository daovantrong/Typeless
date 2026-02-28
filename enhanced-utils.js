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
v1.0.3 by TRONG.PRO
`, 'color: #667eea; font-weight: bold;');

// Enhanced form filling utilities
const EnhancedFormUtils = {
    // Set value using native setter (React/Vue compatible)
    setNativeValue(element, value) {
        try {
            // Normalize date format for HTML5 date inputs
            if (element instanceof HTMLInputElement && element.type === 'date' && typeof value === 'string') {
                value = value.replace(/\//g, '-');
            }

            // valueSetter fallback logic
            let valueSetter = null;

            if (element instanceof HTMLInputElement ||
                element instanceof HTMLTextAreaElement ||
                element instanceof HTMLSelectElement) {

                const proto = Object.getPrototypeOf(element);
                valueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

                if (!valueSetter && element instanceof HTMLInputElement) {
                    valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                }
            }

            if (valueSetter) {
                valueSetter.call(element, value);
            } else {
                element.value = value;
            }

            // Dispatch events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));

            // Try InputEvent
            try {
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    data: String(value)
                });
                element.dispatchEvent(inputEvent);
            } catch (e) {
                // Ignore InputEvent errors
            }

            return true;
        } catch (err) {
            // Silently fall back to standard assignment if advanced method fails
            // This avoids "DOMException" noise in console for some edge cases
            try {
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (e) {
                // If even simple assignment fails, it's likely a read-only or invalid element
                // console.warn('[Enhanced] Final fallback failed:', e);
            }
            return false;
        }
    },

    // Apply value with enhanced event dispatching
    applyValue(element, value) {
        // ── ComboBox check (FineUI / combo-wrap) — must come before standard text path ──
        // For DDLs WITH a $Value hidden: applyComboBoxValue sets hidden (code) + display.
        // For DDLs WITHOUT a $Value hidden (e.g. ddlzmb, ddlwh): applyComboBoxValue falls
        // through to the text-only path — same net effect as setNativeValue.
        //
        // NOTE: SmartFill does not supply a displayText here. applyComboBoxValue will use
        // the code value as both hidden and display (functional, slightly ugly display).
        if (element.tagName === 'INPUT' && element.type !== 'hidden' &&
            element.type !== 'checkbox' && element.type !== 'radio' &&
            this.isWebFormsComboBox(element)) {
            this.applyComboBoxValue(element, value /*, displayText = undefined */);
            return;
        }

        if (element.tagName === 'SELECT') {
            // For select elements
            const option = Array.from(element.options).find(opt =>
                opt.value === value || opt.text === value
            );
            if (option) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            }
        } else if (element.type === 'checkbox') {
            // For checkboxes
            const shouldCheck = value === 'on' || value === 'true' || value === true || value === '1' || value === 'checked';
            const shouldUncheck = value === 'off' || value === 'false' || value === false || value === '0' || value === 'unchecked';

            if (shouldCheck) {
                element.checked = true;
            } else if (shouldUncheck) {
                element.checked = false;
            }
            element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        } else if (element.type === 'radio') {
            // For radio: check if this radio's value matches the saved value
            // SmartFill returns the value of the radio it wants to check
            if (value && element.value === value) {
                element.checked = true;
                element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            }
        } else {
            // For text inputs and textareas - use enhanced setter
            this.setNativeValue(element, value);
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // JS ComboBox Support — FineUI / ExtJS / custom combo-wrap patterns
    //
    // Learned from real DOM (repair_input_vie_sap.aspx + _report_.html):
    //
    // ── FineUI DDL (ASP.NET WebForms) ──────────────────────────────────────────
    //   Wrapper:      <div id="ContentPanelN_fieldKey" class="f-ddl-wrap">
    //   Text input:   <input id="ContentPanelN_fieldKey-inputEl" class="f-dropdownlist-text"
    //                        name="ContentPanelN$fieldKey" type="text" [readonly]>
    //   Hidden input: <input id="ContentPanelN_fieldKey-hiddenEl" type="hidden"
    //                        name="ContentPanelN$fieldKey$Value">   ← server reads THIS
    //   List:         <div id="ContentPanelN_fieldKey-list" class="f-ddl-list">
    //
    //   CRITICAL: some DDLs have NO $Value hidden (ddlzmb, ddlwh, ddlyjgg, ddldgwh).
    //   For those, text IS the submitted value → treat as normal text input.
    //
    // ── _report_.html combo-wrap ────────────────────────────────────────────────
    //   Wrapper:      <div class="combo-wrap">
    //   Text input:   <input type="text" id="mainComboText">   ← NO name attribute!
    //   Hidden input: <input type="hidden" name="demoCombo$Value" id="mainComboHidden">
    //   → Must detect via container, not via text-input name lookup
    //
    // ── Page's hidden-value interceptor ────────────────────────────────────────
    //   The page overrides hidden.value via Object.defineProperty (instance property).
    //   To trigger the page's setter (which fires change/input events + badge update),
    //   we MUST use assignment  hidden.value = x  —  NOT the prototype native setter.
    //   Using the prototype setter bypasses the instance override and breaks the page.
    //
    // ── No F() / Ext global API on this page ───────────────────────────────────
    //   buildDDL() is a local function; the fallback DOM approach is the real path.
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Detect if a text input element is paired with a hidden "$Value" input,
     * indicating it is a JS ComboBox whose real submit value lives in the hidden input.
     *
     * Detection order (most-specific first):
     *   1. FineUI id suffix  — id ends with "-inputEl" and a sibling "-hiddenEl" exists
     *   2. Container-based   — parent has class f-ddl-wrap or combo-wrap with a hidden $Value child
     *   3. Name-based        — a document-level hidden input exists with name = textName + "$Value"
     */
    isWebFormsComboBox(element) {
        if (!element || element.tagName !== 'INPUT') return false;
        if (element.type === 'hidden' || element.type === 'checkbox' || element.type === 'radio') return false;

        const doc = element.ownerDocument || document;
        const id  = element.id || '';

        // 1. FineUI pattern: id = "ContentPanel2_ddlblyy-inputEl"
        //    → sibling hidden id = "ContentPanel2_ddlblyy-hiddenEl"
        if (id.endsWith('-inputEl')) {
            const hiddenId = id.replace(/-inputEl$/, '-hiddenEl');
            if (doc.getElementById(hiddenId)) return true;
        }

        // 2. Container-based: parent .f-ddl-wrap or .combo-wrap has a hidden $Value child
        const container = element.closest('.f-ddl-wrap, .combo-wrap, .f-combo-wrap');
        if (container) {
            const hidden = this._findHiddenValueInContainer(container);
            if (hidden) return true;
        }

        // 3. Name-based fallback: look for a document-wide hidden with name = name + "$Value"
        const name = element.name || '';
        if (name && this._findComboBoxHiddenByName(name, doc)) return true;

        return false;
    },

    /**
     * Find the hidden "$Value" input inside a wrapper container (.f-ddl-wrap / .combo-wrap).
     * The hidden input's name must end with "$Value".
     */
    _findHiddenValueInContainer(container) {
        return Array.from(container.querySelectorAll('input[type="hidden"]'))
            .find(h => h.name && h.name.endsWith('$Value')) || null;
    },

    /**
     * Find the hidden "$Value" input by constructing the expected name from the text input name.
     * Used as a last-resort document-wide search.
     */
    _findComboBoxHiddenByName(textInputName, doc) {
        const hiddenName = textInputName + '$Value';
        try {
            return doc.querySelector(
                `input[type="hidden"][name="${hiddenName.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`
            ) || null;
        } catch (e) {
            return Array.from(doc.querySelectorAll('input[type="hidden"]'))
                .find(h => h.name === hiddenName) || null;
        }
    },

    /**
     * Return the hidden "$Value" input paired with this ComboBox text input.
     *
     * Lookup order mirrors isWebFormsComboBox detection:
     *   1. FineUI "-hiddenEl" id suffix
     *   2. Container-based ($Value hidden child inside f-ddl-wrap / combo-wrap)
     *   3. Document-wide name + "$Value" search
     */
    getComboBoxHiddenInput(element) {
        const doc = element.ownerDocument || document;
        const id  = element.id || '';

        // 1. FineUI: ContentPanel2_ddlblyy-inputEl → ContentPanel2_ddlblyy-hiddenEl
        if (id.endsWith('-inputEl')) {
            const hiddenId = id.replace(/-inputEl$/, '-hiddenEl');
            const el = doc.getElementById(hiddenId);
            if (el) return el;
        }

        // 2. Container-based
        const container = element.closest('.f-ddl-wrap, .combo-wrap, .f-combo-wrap');
        if (container) {
            const hidden = this._findHiddenValueInContainer(container);
            if (hidden) return hidden;
        }

        // 3. Name-based
        const name = element.name || '';
        if (name) return this._findComboBoxHiddenByName(name, doc);

        return null;
    },

    /**
     * Apply a value to a JS ComboBox control.
     *
     * The function understands three tiers of framework integration:
     *
     *   Tier 1 — Component API (real FineUI / ExtJS with a running framework):
     *     F("id").setValue(value)  or  Ext.getCmp("id").setValue(value)
     *     These update internal component state + hidden + display all at once.
     *
     *   Tier 2 — DOM fallback (this page's buildDDL / _report_ buildCombo):
     *     Set  hidden.value = codeValue   ← use assignment (NOT native setter) so the
     *       page's Object.defineProperty interceptor fires (badge + events).
     *     Set  textInput.value = displayText
     *     Dispatch input + change + blur events on the text input.
     *
     * @param {HTMLInputElement} element      Visible text input of the combo.
     * @param {string}           value        Code value to submit, e.g. "BJ".
     * @param {string}           [displayText] Display label, e.g. "补件 Bù kiện".
     *                                         Falls back to value if not supplied.
     * @returns {boolean} true if value was successfully applied.
     */
    applyComboBoxValue(element, value, displayText) {
        if (value === null || value === undefined) return false;

        const id      = element.id || '';
        const display = (displayText !== undefined && displayText !== null && displayText !== '')
                        ? displayText : value;
        const win     = (element.ownerDocument || document).defaultView || window;

        // ── Tier 0: FineUI popup <li> click ────────────────────────────────────
        // Most reliable path: find the dropdown popup <ul data-targetid="compId">
        // and click the matching <li data-value="...">. This fires FineUI's own
        // selection handler — properly updating internal state, hidden $Value,
        // and display text all at once.
        //
        // Works for both code/label DDLs (e.g. hidden="BJ", display="补件 Bù kiện")
        // and DDLs where value === display (e.g. "无 không có").
        {
            const compId = id.endsWith('-inputEl') ? id.replace(/-inputEl$/, '') : id;
            if (compId) {
                const doc = element.ownerDocument || document;
                // Popup <ul> has data-targetid = FineUI component id.
                // Try full compId and short name after last underscore.
                const candidateIds = [compId];
                const lastUs = compId.lastIndexOf('_');
                if (lastUs >= 0) candidateIds.push(compId.slice(lastUs + 1));

                for (const tid of candidateIds) {
                    const popup = doc.querySelector(`ul[data-targetid="${CSS.escape(tid)}"]`);
                    if (!popup) continue;

                    const li = Array.from(popup.querySelectorAll('li[data-value]'))
                        .find(el =>
                            el.dataset.value === value   ||
                            el.dataset.value === display ||
                            el.textContent.trim() === value   ||
                            el.textContent.trim() === display
                        );
                    if (li) {
                        try {
                            li.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                            li.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }));
                            li.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true }));
                            console.log(`[TypeLess] ComboBox Tier0 <li>.click: "${li.dataset.value}" → [data-targetid="${tid}"]`);
                            return true;
                        } catch (_) { /* fall through to Tier 1 */ }
                    }
                }
            }
        }

        // ── Tier 1a: Real FineUI — F("ContentPanel2_ddlblyy-inputEl").setValue() ──
        // In a real FineUI deployment, F() accepts the component wrapper id
        // (the -inputEl id stripped), not the raw -inputEl id.
        if (id && typeof win.F === 'function') {
            // Try both the raw id and the wrapper id (without -inputEl suffix)
            const ids = [id];
            if (id.endsWith('-inputEl')) ids.push(id.replace(/-inputEl$/, ''));

            for (const tryId of ids) {
                try {
                    const comp = win.F(tryId);
                    if (comp && typeof comp.setValue === 'function') {
                        comp.setValue(value);
                        console.log(`[TypeLess] ComboBox FineUI F("${tryId}").setValue("${value}")`);
                        return true;
                    }
                } catch (e) { /* component not found — try next */ }
            }
        }

        // ── Tier 1b: ExtJS — Ext.getCmp().setValue() ──────────────────────────
        if (id && win.Ext && typeof win.Ext.getCmp === 'function') {
            const ids = [id];
            if (id.endsWith('-inputEl')) ids.push(id.replace(/-inputEl$/, ''));

            for (const tryId of ids) {
                try {
                    const comp = win.Ext.getCmp(tryId);
                    if (comp && typeof comp.setValue === 'function') {
                        comp.setValue(value);
                        console.log(`[TypeLess] ComboBox ExtJS getCmp("${tryId}").setValue("${value}")`);
                        return true;
                    }
                } catch (e) { /* not found */ }
            }
        }

        // ── Tier 2: DOM fallback ────────────────────────────────────────────────
        // This is the real path for this page's custom buildDDL / buildCombo widgets.
        //
        // The page intercepts hidden.value via Object.defineProperty (instance property):
        //   set(v) { origValDesc.set.call(this, v); dispatchEvent('change'); badge.update(); }
        //
        // We MUST use  hidden.value = x  (JS property assignment) — NOT the prototype setter
        // — so the page's instance-level interceptor fires and syncs the component state.

        const hidden = this.getComboBoxHiddenInput(element);
        if (hidden) {
            // Assignment triggers page's custom setter (interceptor) if defined.
            hidden.value = value;
            // Also dispatch standard events in case page doesn't intercept.
            try { hidden.dispatchEvent(new Event('input',  { bubbles: true })); } catch (_) {}
            try { hidden.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}

            // Update display text on the text input.
            // Use the native prototype setter here so React/Vue watchers (if any) also fire.
            try {
                const setter = Object.getOwnPropertyDescriptor(
                    win.HTMLInputElement.prototype, 'value'
                )?.set;
                if (setter) setter.call(element, display);
                else element.value = display;
            } catch (_) {
                element.value = display;
            }

            // Dispatch events that FineUI/custom DDL listeners respond to.
            try { element.dispatchEvent(new Event('input',  { bubbles: true })); } catch (_) {}
            try { element.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
            try { element.dispatchEvent(new Event('blur',   { bubbles: true })); } catch (_) {}

            console.log(
                `[TypeLess] ComboBox DOM: hidden="${value}", display="${display}"` +
                (element.name ? ` → [name="${element.name}"]` : ` → #${id}`)
            );
            return true;
        }

        // No hidden found — this DDL has no $Value (e.g. ddlwh, ddlzmb on this page).
        // The text input IS the submitted value; set it normally via setNativeValue.
        console.log(`[TypeLess] ComboBox no-hidden: setting text="${display}" → #${id}`);
        this.setNativeValue(element, display);
        try { element.dispatchEvent(new Event('input',  { bubbles: true })); } catch (_) {}
        try { element.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
        // Return true so the caller knows value was applied (even via text-only path).
        return true;
    },

    // Track last used profile for keyboard shortcuts
    saveLastProfile(profile) {
        try {
            chrome.storage.local.set({ lastUsedProfile: profile });
        } catch (error) {
            console.error('[Enhanced] Failed to save last profile:', error);
        }
    },

    // Get last used profile
    async getLastProfile() {
        try {
            const result = await chrome.storage.local.get(['lastUsedProfile']);
            return result.lastUsedProfile || null;
        } catch (error) {
            console.error('[Enhanced] Failed to get last profile:', error);
            return null;
        }
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.EnhancedFormUtils = EnhancedFormUtils;
}

/**
 * End of enhanced-utils.js
* ╔══╗─────────╔╗────╔═╗╔═╗╔╗───╔══╗╔═╗╔═╗╔═╦╗╔══╗──╔═╗╔═╗╔═╗
* ╚╗╔╝╔╦╗╔═╗╔═╗║║─╔═╗║═╣║═╣║╚╦╦╗╚╗╔╝║╬║║║║║║║║║╔═╣──║╬║║╬║║║║
* ─║║─║║║║╬║║╩╣║╚╗║╩╣╠═║╠═║║╬║║║─║║─║╗╣║║║║║║║║╚╗║╔╗║╔╝║╗╣║║║
* ─╚╝─╠╗║║╔╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╬╗║─╚╝─╚╩╝╚═╝╚╩═╝╚══╝╚╝╚╝─╚╩╝╚═╝
* ────╚═╝╚╝──────────────────╚═╝
 */
