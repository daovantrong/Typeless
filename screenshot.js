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
            .auto-form-filler-notification { display: none !important; }
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

        let finished = false;
        try {
            while (!finished) {
                // Wait a bit for rendering after scroll
                await wait(200);

                const currentScrollY = window.scrollY;

                // Capture current view via background
                const dataUrl = await new Promise(resolve => {
                    chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, (response) => {
                        resolve(response && response.dataUrl);
                    });
                });

                if (dataUrl) {
                    await drawImageToCanvas(ctx, dataUrl, 0, currentScrollY * devicePixelRatio);
                }

                if (currentScrollY + windowHeight >= fullHeight) {
                    finished = true;
                } else {
                    window.scrollTo(0, currentScrollY + windowHeight);
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
