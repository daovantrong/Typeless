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
