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

// Background service worker
importScripts('i18n.js', 'storage.js', 'user-agent.js');

// Installation handler
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // console.log('Auto Form Filler installed successfully!');

        // Set default settings
        chrome.storage.local.set({
            toolbarVisible: true,
            profiles: []
        });

        // Open options page to welcome user and show settings
        chrome.runtime.openOptionsPage();
        // Options page is opened above — no extra notification needed on install.
    } else if (details.reason === 'update') {
        console.log('Auto Form Filler updated to version:', chrome.runtime.getManifest().version);
    }

    // Inject content scripts into existing tabs
    const manifest = chrome.runtime.getManifest();
    const contentScripts = manifest.content_scripts[0];

    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });

    // Use Promise.all to inject scripts in parallel for better performance
    await Promise.all(tabs.map(async (tab) => {
        // Skip restricted URLs
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') ||
            tab.url.startsWith('https://chrome.google.com/webstore') ||
            tab.url.startsWith('https://chromewebstore.google.com') ||
            tab.url.startsWith('https://microsoftedge.microsoft.com/addons')) {
            return;
        }

        try {
            // Inject CSS
            if (contentScripts.css) {
                for (const file of contentScripts.css) {
                    await chrome.scripting.insertCSS({
                        target: { tabId: tab.id, allFrames: true },
                        files: [file]
                    });
                }
            }

            // Inject JS
            if (contentScripts.js) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id, allFrames: true },
                    files: contentScripts.js
                });
            }
        } catch (err) {
            console.error(`Failed to inject script into tab ${tab.id}:`, err);
        }
    }));

    // Initial context menu creation
    updateContextMenus();
});


/**
 * Show an in-page notification via the content script.
 * Falls back silently if the tab has no content script (e.g. chrome:// pages).
 * @param {number} tabId
 * @param {string} message  Plain text message to display
 */
function sendInPageNotification(tabId, message) {
    if (!tabId) return;
    chrome.tabs.sendMessage(tabId, { action: 'showNotification', message })
        .catch(() => { /* tab may not have content script, ignore */ });
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getProfiles') {
        // Get profiles from storage
        StorageManager.getProfiles().then(profiles => {
            sendResponse({ profiles: profiles || [] });
        });
        return true; // Keep message channel open for async response
    }

    if (request.action === 'saveProfile') {
        // Save profile to storage
        StorageManager.saveProfile(request.profile).then(success => {
            sendResponse({ success });
        });
        return true;
    }

    if (request.action === 'deleteProfile') {
        // Delete profile from storage
        StorageManager.deleteProfile(request.profileId).then(success => {
            sendResponse({ success });
        });
        return true;
    }

    if (request.action === 'notification') {
        // Forward as in-page notification to the active tab's content script
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (tab) sendInPageNotification(tab.id, request.message);
        });
        sendResponse({ success: true });
        return true;
    }

    // --- User Agent Handlers ---
    if (request.action === 'setUserAgent') {
        UserAgentManager.setUserAgent(request.tabId, request.userAgent)
            .then(() => sendResponse({ success: true }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (request.action === 'getUserAgent') {
        UserAgentManager.getState(request.tabId)
            .then(ua => sendResponse({ userAgent: ua }))
            .catch(err => sendResponse({ error: err.message }));
        return true;
    }

    // --- Full Page Screenshot Handler ---
    // --- Full Page Screenshot Handler (Scroll & Stitch in Content Script) ---
    if (request.action === 'captureFullScreenshot') {
        const tabId = request.tabId;

        (async () => {
            try {
                // 0. Hide toolbar before capture
                await new Promise(resolve => {
                    chrome.tabs.sendMessage(tabId, { action: 'prepareForScreenshot' }, () => resolve());
                });
                await new Promise(r => setTimeout(r, 150));

                // 1. Inject screenshot content script
                await chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['screenshot.js']
                });

                // 2. Start capture
                chrome.tabs.sendMessage(tabId, { action: 'startCapture' }, (response) => {
                    // 3. Restore toolbar whether capture succeeded or failed
                    chrome.tabs.sendMessage(tabId, { action: 'cleanupAfterScreenshot' }, () => {});
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse(response);
                    }
                });

            } catch (err) {
                // Restore toolbar on error too
                chrome.tabs.sendMessage(tabId, { action: 'cleanupAfterScreenshot' }, () => {});
                console.error("Full Screenshot Error:", err);
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true; // Keep message channel open
    }

    if (request.action === 'captureVisibleTab') {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            sendResponse({ dataUrl });
        });
        return true; // Async
    }

    if (request.action === 'captureVisibleScreenshotAndSave') {
        const tabId = request.tabId;

        (async () => {
            try {
                // 1. Hide toolbar before capture
                await new Promise(resolve => {
                    chrome.tabs.sendMessage(tabId, { action: 'prepareForScreenshot' }, () => resolve());
                });
                await new Promise(r => setTimeout(r, 150));

                // 2. Get tab title for filename
                const tab = await chrome.tabs.get(tabId).catch(() => null);
                const titlePrefix = (tab && tab.title)
                    ? tab.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)
                    : 'Screenshot_Visible';

                // 3. Capture visible area
                const dataUrl = await new Promise(resolve => {
                    chrome.tabs.captureVisibleTab(null, { format: 'png' }, resolve);
                });

                // 4. Restore toolbar immediately
                chrome.tabs.sendMessage(tabId, { action: 'cleanupAfterScreenshot' });

                if (chrome.runtime.lastError || !dataUrl) {
                    sendInPageNotification(tabId, 'Error: could not capture screenshot');
                    sendResponse({ success: false, error: 'Capture failed' });
                    return;
                }

                // 5. Save to downloads
                const filename = `${titlePrefix}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
                chrome.downloads.download({ url: dataUrl, filename, saveAs: false }, () => {
                    if (chrome.runtime.lastError) {
                        sendInPageNotification(tabId, 'Error saving screenshot');
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendInPageNotification(tabId, '📸 Screenshot saved!');
                        sendResponse({ success: true });
                    }
                });
            } catch (err) {
                console.error('captureVisibleScreenshotAndSave error:', err);
                sendInPageNotification(tabId, 'Error: ' + err.message);
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true; // Keep message channel open (async)
    }

});



// Context menu for quick access
async function updateContextMenus() {
    await i18n.init();
    const t = (key) => i18n.t(key);

    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'smartFill',
            title: t('menu.smart_fill'),
            contexts: ['page', 'editable']
        });

        chrome.contextMenus.create({
            id: 'saveProfile',
            title: t('menu.save_profile'),
            contexts: ['page']
        });

        chrome.contextMenus.create({
            id: 'removeReadonly',
            title: t('menu.remove_readonly'),
            contexts: ['page', 'editable', 'selection']
        });
    });
}

// Listen for storage changes to update context menus (e.g., language change)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.language) {
        updateContextMenus();
    }
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'smartFill') {
        // Send message to content script to trigger Smart Fill
        chrome.tabs.sendMessage(tab.id, { action: 'triggerSmartFill' });
    } else if (info.menuItemId === 'saveProfile') {
        // Send message to content script to trigger Save Profile
        chrome.tabs.sendMessage(tab.id, { action: 'triggerSaveProfile' });
    } else if (info.menuItemId === 'removeReadonly') {
        // Send message to content script to Remove Readonly
        chrome.tabs.sendMessage(tab.id, { action: 'triggerRemoveReadonly' });
    }
});

// Keyboard command listener
chrome.commands.onCommand.addListener(async (command) => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;

        if (command === 'apply-last-profile') {
            // Get last used profile
            chrome.storage.local.get(['lastUsedProfile'], (result) => {
                const lastProfile = result.lastUsedProfile;

                if (lastProfile) {
                    // Send message to content script to apply profile
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'applyProfile',
                        profile: lastProfile
                    });
                } else {
                    // No last profile, just show toolbar
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'showToolbar'
                    });
                }
            });
        } else if (command === 'toggle-toolbar') {
            // Toggle toolbar visibility
            chrome.tabs.sendMessage(tab.id, {
                action: 'toggleToolbar'
            });
        } else if (command === 'open-settings') {
            chrome.runtime.openOptionsPage();
        } else if (command === 'unlock-right-click') {
            chrome.tabs.sendMessage(tab.id, { action: 'triggerEnableRightClick' });
        } else if (command === 'save-html') {
            chrome.tabs.sendMessage(tab.id, { action: 'getRenderedHTML' }, (response) => {
                if (response && response.html) {
                    const blobContent = response.html;
                    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(blobContent);
                    const filename = (tab.title || 'page').replace(/[^a-z0-9]/gi, '_').substring(0, 50) + '.html';

                    chrome.downloads.download({
                        url: dataUrl,
                        filename: filename,
                        saveAs: false
                    }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Download failed:', chrome.runtime.lastError);
                        }
                    });
                }
            });
        } else if (command === 'screenshot-full') {
            // Mirrors the captureFullScreenshot message handler — must hide toolbar
            // before capture and restore it afterwards to avoid toolbar appearing in screenshot.
            const tabId = tab.id;
            (async () => {
                try {
                    // 1. Hide toolbar
                    await new Promise(resolve => {
                        chrome.tabs.sendMessage(tabId, { action: 'prepareForScreenshot' }, () => resolve());
                    });
                    await new Promise(r => setTimeout(r, 150));

                    // 2. Inject screenshot script
                    await chrome.scripting.executeScript({
                        target: { tabId },
                        files: ['screenshot.js']
                    });

                    // 3. Start capture; restore toolbar when done (success or failure)
                    chrome.tabs.sendMessage(tabId, { action: 'startCapture' }, () => {
                        chrome.tabs.sendMessage(tabId, { action: 'cleanupAfterScreenshot' }, () => {});
                    });
                } catch (err) {
                    // Restore toolbar even on error
                    chrome.tabs.sendMessage(tabId, { action: 'cleanupAfterScreenshot' }, () => {});
                    console.error('screenshot-full command error:', err);
                }
            })();
        } else if (command === 'screenshot-visible') {
            const tabId = tab.id;
            // Proper async IIFE — avoids 'await inside non-async callback' bug
            (async () => {
                try {
                    await new Promise(resolve => {
                        chrome.tabs.sendMessage(tabId, { action: 'prepareForScreenshot' }, () => resolve());
                    });
                    await new Promise(r => setTimeout(r, 150));

                    const currentTab = await chrome.tabs.get(tabId).catch(() => null);
                    const titlePrefix = (currentTab && currentTab.title)
                        ? currentTab.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)
                        : 'Screenshot_Visible';

                    const dataUrl = await new Promise(resolve => {
                        chrome.tabs.captureVisibleTab(null, { format: 'png' }, resolve);
                    });

                    chrome.tabs.sendMessage(tabId, { action: 'cleanupAfterScreenshot' });

                    if (chrome.runtime.lastError || !dataUrl) return;

                    const filename = `${titlePrefix}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
                    chrome.downloads.download({ url: dataUrl, filename, saveAs: false }, () => {
                        if (!chrome.runtime.lastError) {
                            sendInPageNotification(tabId, '📸 Screenshot saved!');
                        }
                    });
                } catch (err) {
                    console.error('screenshot-visible command error:', err);
                }
            })();
        } else if (command === 'reset-user-agent') {
            // Reset UA to default
            UserAgentManager.setUserAgent(tab.id, '')
                .then(() => {
                    chrome.tabs.reload(tab.id);
                    // Show in-page notification after reload (toolbar will be visible again)
                    // Small delay to let the page finish loading before sending the message
                    setTimeout(() => sendInPageNotification(tab.id, '🔄 User-Agent reset to Default'), 1500);
                })
                .catch(err => console.error('UA Reset Error:', err));
        }
    } catch (error) {
        console.error('Error handling command:', error);
    }
});

/**
 * Helper: Inject TypeLess scripts into a tab
 */
async function injectTypeLess(tabId) {
    try {
        const manifest = chrome.runtime.getManifest();
        const contentScripts = manifest.content_scripts[0];

        // Inject CSS
        if (contentScripts.css) {
            for (const file of contentScripts.css) {
                await chrome.scripting.insertCSS({
                    target: { tabId, allFrames: true },
                    files: [file]
                });
            }
        }

        // Inject JS
        if (contentScripts.js) {
            await chrome.scripting.executeScript({
                target: { tabId, allFrames: true },
                files: contentScripts.js
            });
        }
        // console.log(`Successfully injected TypeLess into tab ${tabId}`);
    } catch (err) {
        console.error(`Failed to inject script into tab ${tabId}:`, err);
    }
}


// console.log('Auto Form Filler background service worker loaded');

/**
 * End of background.js
* ╔══╗─────────╔╗────╔═╗╔═╗╔╗───╔══╗╔═╗╔═╗╔═╦╗╔══╗──╔═╗╔═╗╔═╗
* ╚╗╔╝╔╦╗╔═╗╔═╗║║─╔═╗║═╣║═╣║╚╦╦╗╚╗╔╝║╬║║║║║║║║║╔═╣──║╬║║╬║║║║
* ─║║─║║║║╬║║╩╣║╚╗║╩╣╠═║╠═║║╬║║║─║║─║╗╣║║║║║║║║╚╗║╔╗║╔╝║╗╣║║║
* ─╚╝─╠╗║║╔╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╬╗║─╚╝─╚╩╝╚═╝╚╩═╝╚══╝╚╝╚╝─╚╩╝╚═╝
* ────╚═╝╚╝──────────────────╚═╝
 */
