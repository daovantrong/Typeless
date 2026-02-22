/**
 * Mobile Emulation Override Script
 * Injected into MAIN world to mock navigator and screen properties.
 */
(function () {
    const config = window.__TypeLess_UA_Config;
    if (!config) return;

    const { userAgent, platform, vendor, device, isMobile } = config;

    const isAndroid = /Android/i.test(userAgent);

    // Helper to override property
    const override = (obj, prop, value) => {
        Object.defineProperty(obj, prop, {
            get: () => value,
            configurable: true,
            enumerable: true
        });
    };

    // 1. Navigator Overrides
    if (userAgent) override(navigator, 'userAgent', userAgent);
    if (platform) override(navigator, 'platform', platform);
    if (vendor) override(navigator, 'vendor', vendor);

    // Hardware Concurrency & Memory (Lower for mobile)
    if (isMobile) {
        override(navigator, 'hardwareConcurrency', 4); // Common for mobile
        override(navigator, 'deviceMemory', 4); // Common for mobile (GB)
        override(navigator, 'maxTouchPoints', 5); // Multitouch
    }

    // Touch Support
    if (isMobile) {
        if (!('ontouchstart' in window)) {
            Object.defineProperty(window, 'ontouchstart', {
                value: null,
                writable: true,
                configurable: true,
                enumerable: true
            });
        }
    }

    // 2. Screen & Viewport Overrides
    if (device === 'iphone') {
        // iPhone 14/15/16 Pro Max approx specs
        const width = 430;
        const height = 932;
        const dpr = 3;

        override(screen, 'width', width);
        override(screen, 'height', height);
        override(screen, 'availWidth', width);
        override(screen, 'availHeight', height);

        // Window inner/outer (Approximate)
        override(window, 'innerWidth', width);
        override(window, 'innerHeight', height); // Browser UI bars might reduce this in reality
        override(window, 'outerWidth', width);
        override(window, 'outerHeight', height);
        override(window, 'devicePixelRatio', dpr);

    } else if (device === 'samsung') {
        // Samsung S24/S25 Ultra approx specs
        const width = 412;
        const height = 915;
        const dpr = 3.5; // High density

        override(screen, 'width', width);
        override(screen, 'height', height);
        override(screen, 'availWidth', width);
        override(screen, 'availHeight', height);

        override(window, 'innerWidth', width);
        override(window, 'innerHeight', height);
        override(window, 'outerWidth', width);
        override(window, 'outerHeight', height);
        override(window, 'devicePixelRatio', dpr);
    }

    // 3. User Agent Data (Client Hints Mocking)
    // This is complex as it requires mocking NavigatorUAData interface.
    // Basic mock:
    if (navigator.userAgentData) {
        const brands = isMobile ?
            [
                { brand: "Chromium", version: "120" },
                { brand: "Google Chrome", version: "120" },
                { brand: "Not=A?Brand", version: "24" }
            ] :
            [
                { brand: "Chromium", version: "120" },
                { brand: "Google Chrome", version: "120" }
            ];

        override(navigator.userAgentData, 'brands', brands);
        override(navigator.userAgentData, 'mobile', isMobile);
        override(navigator.userAgentData, 'platform', platform || (isMobile ? 'Android' : 'Windows'));

        // Mock getHighEntropyValues
        navigator.userAgentData.getHighEntropyValues = async (hints) => {
            return {
                architecture: isMobile ? (platform === 'iPhone' ? 'x86' : 'arm') : 'x86',
                bitness: '64',
                brands: brands,
                mobile: isMobile,
                model: device === 'iphone' ? 'iPhone' : (device === 'samsung' ? 'SM-S938B' : ''),
                platform: platform || 'Windows',
                platformVersion: isMobile ? (platform === 'iPhone' ? '18.0.0' : '17.0.0') : '10.0.0', // Updated Android to 17
                uaFullVersion: '125.0.0.0'
            };
        };
    }

    // Fallback: If platform override didn't work via defineProperty for some reason, try to overwrite proto
    // (Usually defineProperty on instance is enough)

    // Allow website to see 'Linux armv8l' for Android
    if (isAndroid) {
        // Force correct platform for Android
        try {
            Object.defineProperty(navigator, 'platform', { get: () => 'Linux armv8l' });
        } catch (e) { }
    }

})();
