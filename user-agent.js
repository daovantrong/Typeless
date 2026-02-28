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

/**
 * User Agent Manager using declarativeNetRequest
 */
const UserAgentManager = {
    // ... (presets remain same or handled by popup)

    /**
     * Set User Agent for a specific tab
     * @param {number} tabId 
     * @param {string} userAgent 
     */
    async setUserAgent(tabId, userAgent) {
        if (!userAgent) {
            await this.clearUserAgent(tabId);
            return;
        }

        const ruleId = this.getRuleIdFromTabId(tabId);

        // Determine request headers based on UA string
        const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);
        const isIos = /iPhone|iPad|iPod/i.test(userAgent);
        const isAndroid = /Android/i.test(userAgent);

        let platform = '"Windows"';
        if (isIos) platform = '"iOS"';
        else if (isAndroid) platform = '"Android"';
        else if (/Mac/i.test(userAgent)) platform = '"macOS"';
        else if (/Linux/i.test(userAgent)) platform = '"Linux"';

        const headers = [
            { header: 'User-Agent', operation: 'set', value: userAgent },
            { header: 'Sec-CH-UA-Mobile', operation: 'set', value: isMobile ? '?1' : '?0' },
            { header: 'Sec-CH-UA-Platform', operation: 'set', value: platform }
        ];

        // Add Sec-CH-UA if Chrome-based (simplified for now, ideally dynamic)
        if (userAgent.includes('Chrome')) {
            // Extract version or default
            headers.push({ header: 'Sec-CH-UA', operation: 'set', value: '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"' });
        }

        // Update Rules
        await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [ruleId],
            addRules: [{
                id: ruleId,
                priority: 1,
                action: {
                    type: 'modifyHeaders',
                    requestHeaders: headers
                },
                condition: {
                    tabIds: [tabId],
                    resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'script', 'stylesheet']
                }
            }]
        });

        // Save state
        await this.saveState(tabId, userAgent);

        // Inject JS overrides immediately
        await this.injectOverrides(tabId, userAgent);
    },

    /**
     * Inject Mobile Emulation Overrides
     */
    async injectOverrides(tabId, userAgent) {
        const isIos = /iPhone|iPad|iPod/i.test(userAgent);
        const isAndroid = /Android/i.test(userAgent);
        const isMobile = isIos || isAndroid;

        if (!isMobile) return; // Only emulate for mobile for now

        let platform = 'Linux x86_64';
        let vendor = 'Google Inc.';
        let device = '';

        if (isIos) {
            platform = 'iPhone';
            vendor = 'Apple Computer, Inc.';
            device = 'iphone';
        } else if (isAndroid) {
            platform = 'Linux armv8l';
            vendor = 'Google Inc.';
            if (userAgent.includes('Samsung')) device = 'samsung';
        }

        // FIX: Use a randomised window key so page scripts cannot predict the
        // property name and either read our config or pre-define it to tamper
        // with the override values.  The key is generated fresh per-injection.
        const configKey = '__TL_' + Math.random().toString(36).substring(2, 11);

        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                world: 'MAIN',
                func: (ua, plat, vend, dev, mobile, key) => {
                    window[key] = {
                        userAgent: ua,
                        platform: plat,
                        vendor: vend,
                        device: dev,
                        isMobile: mobile
                    };
                },
                args: [userAgent, platform, vendor, device, isMobile, configKey]
            });

            await chrome.scripting.executeScript({
                target: { tabId },
                world: 'MAIN',
                func: (key) => {
                    // Alias to the fixed name that mobile-override.js reads,
                    // then immediately delete it — mobile-override.js also deletes
                    // __TypeLess_UA_Config on its first line, so this is belt-and-braces.
                    window.__TypeLess_UA_Config = window[key];
                    try { delete window[key]; } catch (_) { }
                },
                args: [configKey]
            });

            await chrome.scripting.executeScript({
                target: { tabId },
                world: 'MAIN',
                files: ['mobile-override.js']
            });
        } catch (e) {
            console.warn('Failed to inject overrides:', e);
        }
    },

    /**
     * Clear User Agent rule for a tab
     */
    async clearUserAgent(tabId) {
        const ruleId = this.getRuleIdFromTabId(tabId);
        await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [ruleId]
        });
        await this.saveState(tabId, '');
    },

    // ... (rest of methods: getRuleIdFromTabId, saveState, getState)
    // FIX: Chrome declarativeNetRequest requires rule IDs to be integers >= 1.
    // Tab ID 0 (uncommon but valid) would cause an error without this guard.
    getRuleIdFromTabId(tabId) { return Math.max(1, tabId); },
    async saveState(tabId, ua) {
        const key = `ua_${tabId}`;
        if (ua) await chrome.storage.local.set({ [key]: ua });
        else await chrome.storage.local.remove(key);
    },
    async getState(tabId) {
        const key = `ua_${tabId}`;
        const result = await chrome.storage.local.get(key);
        return result[key] || '';
    }
};

// Listen for tab updates to re-inject overrides if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        UserAgentManager.getState(tabId).then(ua => {
            if (ua) UserAgentManager.injectOverrides(tabId, ua);
        });
    }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
    UserAgentManager.clearUserAgent(tabId);
});
