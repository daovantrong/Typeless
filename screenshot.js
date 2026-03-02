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
 * v1.0.5 by TRONG.PRO
 */

// Screenshot Content Script
(function () {
    if (window.hasTypeLessScreenshotListener) return;
    window.hasTypeLessScreenshotListener = true;

    let isCapturing = false;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'startCapture') {
            if (isCapturing) return;
            isCapturing = true;
            startCapture(sendResponse);
            return true; // Async
        }
    });

    async function startCapture(sendResponse) {
        // Hide scrollbars & toolbar
        const style = document.createElement('style');
        style.textContent = `
            body::-webkit-scrollbar { display: none !important; }
            body { -ms-overflow-style: none !important; scrollbar-width: none !important; }
            #auto-form-filler-toolbar { display: none !important; }
            .auto-form-filler-notification, .typeless-notification-host { display: none !important; }
            * {
                transition: none !important;
                animation: none !important;
            }
        `;
        document.head.appendChild(style);

        const originalScrollPos = {
            x: window.scrollX,
            y: window.scrollY
        };

        // Scroll to top
        window.scrollTo(0, 0);
        await wait(150); // Small delay for layout to settle

        const fullWidth = document.documentElement.scrollWidth;
        const fullHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Create canvas for stitching
        const canvas = document.createElement('canvas');
        canvas.width = fullWidth * devicePixelRatio;
        canvas.height = fullHeight * devicePixelRatio;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            cleanup({ success: false, error: 'Failed to create canvas context' });
            return;
        }

        // Chrome allows ~2 captureVisibleTab calls/second.
        // Use a minimum interval of 600 ms between captures plus retry-with-backoff
        // so we never exceed the quota even on very tall pages.
        const MIN_CAPTURE_INTERVAL_MS = 600;
        const MAX_RETRIES = 4;

        /**
         * Capture with exponential back-off on quota errors.
         * Returns the data URL string, or null on permanent failure.
         */
        async function captureWithRetry() {
            let delay = MIN_CAPTURE_INTERVAL_MS;
            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                await wait(attempt === 0 ? MIN_CAPTURE_INTERVAL_MS : delay);
                const dataUrl = await new Promise(resolve => {
                    chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, (response) => {
                        if (chrome.runtime.lastError) {
                            resolve(null);
                        } else {
                            resolve(response && response.dataUrl);
                        }
                    });
                });
                if (dataUrl) return dataUrl;
                // Back off exponentially before retrying (600 → 1200 → 2400 → 4800 ms)
                delay = Math.min(delay * 2, 5000);
                console.warn(`[TypeLess] captureVisibleTab attempt ${attempt + 1} failed, retrying in ${delay}ms…`);
            }
            console.error('[TypeLess] captureVisibleTab failed after all retries.');
            return null;
        }

        let finished = false;
        try {
            while (!finished) {
                const currentScrollY = window.scrollY;

                const dataUrl = await captureWithRetry();

                if (dataUrl) {
                    await drawImageToCanvas(ctx, dataUrl, 0, currentScrollY * devicePixelRatio);
                }

                if (currentScrollY + windowHeight >= fullHeight) {
                    finished = true;
                } else {
                    window.scrollTo(0, currentScrollY + windowHeight);
                    // Small extra pause for the page to re-paint after scroll
                    await wait(100);
                }
            }

            // Cleanup & Restore
            cleanup();

            // Convert to URL and Download
            canvas.toBlob((blob) => {
                if (!blob) {
                    sendResponse({ success: false, error: 'Failed to create blob' });
                    return;
                }
                const url = URL.createObjectURL(blob);
                const filename = `FullPage_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;

                // Create link and click to download (bypassing Save As if possible)
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();

                // Clean up
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    sendResponse({ success: true });
                }, 100);

            }, 'image/png');


        } catch (error) {
            console.error('Capture failed:', error);
            cleanup({ success: false, error: error.message });
        }

        function cleanup(response) {
            window.scrollTo(originalScrollPos.x, originalScrollPos.y);
            style.remove();
            isCapturing = false;
            if (response) sendResponse(response);
        }
    }

    function drawImageToCanvas(ctx, dataUrl, x, y) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, x, y);
                resolve();
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})();
