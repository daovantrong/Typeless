# TypeLess - Auto Form Filler

Browser extension for Chrome/Edge to automatically fill forms with pre-saved profiles.

![TypeLess Banner](icons/icon.png)

## Screenshots
![Media Preview](Screenshot.png)

## ✨ Key Features

### 🚀 Core Form Filling
- ⚡ **One-Click Fill**: Fill entire forms instantly with saved profiles
- 📝 **Unlimited Profiles**: Create and manage unlimited profiles for different scenarios
- 🎯 **Smart Field Detection**: Automatically identifies form fields and matches them with profile data
- 🔄 **Quick Switch**: Seamlessly switch between profiles for different contexts

### 🧠 Smart Fill Technology
- 🤖 **Mock Data Generation**: Automatically generate realistic test data (names, emails, phones, addresses)
- ⚡ **Lightning Fill**: Click the bolt icon to instantly populate empty fields
- 🎲 **Randomized Data**: Each Smart Fill generates unique, realistic data for testing

### 🌍 Multi-Language Support
- 🇺🇸 English
- 🇻🇳 Vietnamese  
- 🇨🇳 Simplified Chinese
- 🇹🇼 Traditional Chinese
- 🇯🇵 Japanese
- 🇰🇷 Korean
- 🔄 **Dynamic Translation**: Interface and field labels translate automatically
- 🎨 **Optimized Fonts**: WOFF2 format with language-specific fonts for better performance

### 🛠️ Advanced Tools
- 💾 **Save HTML**: Export current form state as HTML file for debugging
- 🖱️ **Unlock Right-Click**: Bypass websites that disable context menus
- 📸 **Screenshot Capture**: Take full page or visible area screenshots
- 📱 **Mobile Emulation**: Simulate Android/iOS user agents and behaviors
- 🔄 **User Agent Switching**: Change browser user agent for testing

### 💾 Data Management
- 📤 **Export Profiles**: Backup all profiles to JSON file
- 📥 **Import Profiles**: Restore profiles from backup file
- 📋 **Copy/Paste**: Duplicate profiles between tabs or machines
- 🗑️ **Delete Management**: Remove individual profiles or clear all data

### 🏢 Enterprise Deployment
- ⚙️ **Pre-configured Profiles**: Deploy default profiles via `default.json` configuration
- 📦 **Bulk Deployment**: Standard profiles across entire organization
- 🧪 **Testing Templates**: Consistent test data for development teams
- 📋 **Compliance Workflows**: Approved form-filling templates for regulatory needs
- 🌐 **Offline Distribution**: Complete setup without internet connectivity

*Enterprise feature primarily designed for offline deployment scenarios. Requires modifying extension files before distribution and works when installing from an extracted folder in developer mode rather than individual users installing from extension stores.*

### ⌨️ Keyboard Shortcuts
- `Ctrl+Shift+H` (`Command+Shift+H` on Mac): Toggle toolbar visibility

### 🎨 User Interface
- � **Modern Design**: Clean, intuitive interface with Material Design icons
- 🎯 **Floating Toolbar**: Non-intrusive toolbar that appears on all pages
- 📱 **Responsive**: Works perfectly on desktop and mobile browsers
- 🌙 **Theme Support**: Consistent styling across different browser themes

### 🔒 Privacy & Security
- 🔐 **100% Local Storage**: All data stored locally on your device
- 🚫 **No Cloud Servers**: No data ever leaves your browser
- 🛡️ **No Tracking**: No analytics or usage tracking
- 🔒 **Secure Encryption**: Browser's built-in secure storage API

## 📥 Installation

### Chrome/Edge Developer Mode

1. **Download Source**
   - Clone or download this repository.
   - Unzip the file.

2. **Open Extensions Page**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

3. **Enable Developer Mode**
   - Toggle the switch in the top right corner.

4. **Load Extension**
   - Click "Load unpacked".
   - Select the `typeless_1.0.5` folder.

### 🏢 Enterprise Setup (Optional)

For enterprise deployment with pre-configured profiles:

1. **Configure Default Profiles**
   - Open `default.json` in the extension folder
   - Replace the empty `profiles: []` array with your profile data
   - Follow the same JSON format as exported profiles

2. **Distribute Extension**
   - Package the modified extension folder
   - Deploy to users via your preferred method
   - Users install in developer mode as described above

3. **Automatic Profile Loading**
   - Profiles from `default.json` are automatically imported on first install
   - Users can still create, import, or manage their own profiles
   - No internet connection required for profile deployment

## 🚀 Usage

### 1. Save Profile
- Fill in information on a web form.
- Click the **TypeLess** icon on the toolbar (bottom right) or popup.
- Select "💾 Save Form".
- Name your profile and choose the fields to save.

### 2. Auto Fill
- **Method 1**: Open Toolbar (bottom right circle button) -> Select Profile.
- **Method 2**: Open Popup (extension icon) -> Click Play ▶️ button.

### 3. Smart Fill (Mock Data)
- Click the lightning bolt ⚡ icon on the toolbar.
- The extension will automatically fill empty fields with random emails, phone numbers, names, etc.

### 4. Manage Profiles
- **Export**: Backup all profiles to a JSON file.
- **Import**: Restore profiles from a JSON file.
- **Copy**: Copy a profile to paste into another tab or machine.

## 🛠️ Project Structure

```
FormFillerExtension/
├── manifest.json          # Extension Configuration (Manifest V3)
├── background.js         # Service Worker (Installation, Context Menus)
├── content.js            # Page logic (Smart Fill, DOM interaction)
├── storage.js            # Storage management (Chrome Storage API)
├── i18n.js               # Internationalization (6 languages)
├── popup.html            # Popup UI
├── popup.js              # Popup Logic
├── options.html          # Settings/Options page
├── options.js            # Options page logic
├── styles.css            # UI Styles (Toolbar, Modal)
├── default.json          # Default profiles configuration (Enterprise)
├── demo-form.html        # Test form for development
├── privacy.html          # Privacy Policy page
├── icons/                # Icons (SVG & PNG)
├── fonts/                # Fonts (Be Vietnam Pro, Material Icons)
└── guide/                # Documentation and descriptions
```

## 🔒 Permissions Explained

TypeLess requires the following permissions to function properly. Each permission is used only for its intended purpose:

### Core Permissions
- **`storage`**: 
  - **Purpose**: Save your profiles and preferences locally on your device
  - **Usage**: Stores form profiles, settings, language preferences
  - **Privacy**: 100% local storage, no cloud synchronization

- **`activeTab`**: 
  - **Purpose**: Interact with the current webpage's form fields
  - **Usage**: Read and write form data on the active tab only
  - **Privacy**: Only accesses the tab you explicitly interact with

- **`scripting`**: 
  - **Purpose**: Inject the floating toolbar and auto-fill functionality
  - **Usage**: Add UI elements and execute form filling scripts
  - **Privacy**: Only runs on pages where you activate the extension

### Utility Permissions
- **`clipboardWrite`**: 
  - **Purpose**: Copy profile data to clipboard for sharing
  - **Usage**: Export profiles or copy form data manually
  - **Privacy**: Only copies data when you explicitly click copy

- **`clipboardRead`**: 
  - **Purpose**: Import profile data from clipboard
  - **Usage**: Paste profile data from other tabs or machines
  - **Privacy**: Only reads clipboard when you explicitly paste

- **`contextMenus`**: 
  - **Purpose**: Add TypeLess options to right-click context menu
  - **Usage**: Quick access to profiles and tools without opening popup
  - **Privacy**: No data collection, only provides shortcuts

### Advanced Permissions
- **`declarativeNetRequest`**: 
  - **Purpose**: Modify network requests for enhanced functionality
  - **Usage**: Handle form submissions and bypass certain restrictions
  - **Privacy**: Only modifies requests related to form operations

- **`declarativeNetRequestWithHostAccess`**: 
  - **Purpose**: Extended network request handling with host permissions
  - **Usage**: Advanced form manipulation and mobile emulation
  - **Privacy**: Limited to form-related requests only

- **`downloads`**: 
  - **Purpose**: Download files (HTML exports, screenshots)
  - **Usage**: Save form HTML states and captured screenshots
  - **Privacy**: Only downloads files you explicitly request

### Host Permissions
- **`<all_urls>`**: 
  - **Purpose**: Work on any website containing forms
  - **Usage**: Universal compatibility across all web forms
  - **Privacy**: Only activates when you use the extension

### Security Guarantees
✅ **No Background Activity**: Extension only works when you interact with it  
✅ **No Data Mining**: No collection of browsing history or personal data  
✅ **No Remote Connections**: All functionality works completely offline  
✅ **Minimal Permissions**: Each permission is essential for core functionality  
✅ **Transparent Usage**: All permissions are clearly explained and justified

## 🐛 Troubleshooting

**Q: Fonts displaying as squares?**
A: The extension uses system fonts (Noto Sans CJK) for Chinese/Japanese/Korean to optimize size. Ensure these fonts are installed on your computer.

**Q: Toolbar not showing?**
A: Try refreshing the page (F5). Some sites may block unknown scripts and require manual permission.

## 📝 Changelog

### Version 1.0.6
**UI / UX**
- 🎨 **Toolbar redesign — compact layout**: Toolbar height reduced from ~70 px to 64 px (header 30 px + chip row 34 px). Profile list now renders as a horizontal scrolling row of single-line chips in the format `[N] Profile Name ×`, replacing the previous two-line card layout.
- 🔀 **Drag-and-drop profile reorder**: Profiles can be reordered by dragging in all three surfaces — toolbar chips (left/right), popup profile list (up/down), and options profile list (up/down). Order is persisted to storage immediately.
- 🗑️ **Delete buttons in Options → Profiles tab**: Each profile card now has an `×` delete button inline. A new **"Delete All"** button above the list clears every profile after confirmation.
- 🌐 **Toolbar title now updates on language change**: `refreshToolbarUI()` was missing the `.title-text` element update. Fixed — title now correctly switches language together with all other toolbar buttons.

**Bug fixes**
- 🐛 **Options page not opening on first install**: `openOptionsPage()` silently fails in service worker context right after extension installation. Replaced with `chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })` which is reliable at install time.
- 🐛 **False "restricted page" warning on extension's own pages**: `chrome-extension://` was blocked globally, causing the popup to show a warning when viewed while the Options page was the active tab. Now only other extensions' pages are blocked; the extension's own pages are allowed.
- 🐛 **`file://` pages incorrectly blocked**: Local HTML files (`file://`) were mistakenly listed as restricted pages. Removed — TypeLess works fully on local files when the browser grants file access to extensions.
- 🐛 **"Extension context invalidated" error spam in console**: `loadProfiles()` was called after extension reload/update without checking if the extension context was still alive. Added `_extAlive()` guard and `try/catch` so stale content scripts fail silently.
- 🐛 **`early return` in `onInstalled` skipped `openOptionsPage`**: When `default.json` had an empty `profiles` array, a `return` statement exited the entire `onInstalled` callback before `openOptionsPage()` could run. Refactored to `if/else` block — options page always opens on install.
- 🔒 **`style.innerHTML` → `style.textContent`**: The unlock-right-click feature used `style.innerHTML` to inject static CSS. Changed to `style.textContent` (best practice — eliminates any parser side-effects, even though the string was static).
- 🔒 **Iframe relay: nonce approach replaced with `event.source` trust check**: The previous per-frame nonce (`_RELAY_NONCE`) broke all iframe communication because each frame generates its own nonce independently, so nonces never matched. Replaced with `event.source` hierarchy validation: top frame trusts only direct child `iframe.contentWindow`; child iframes trust only `window.parent` / `window.top`. Equivalent security, correct behavior.

**Storage**
- ➕ **`StorageManager.reorderProfiles(orderedIds)`**: New method to persist drag-and-drop order. Takes an array of profile IDs in the desired order, preserving profiles from other pages that aren't in the reorder set.
- ➕ **`StorageManager.clearAllProfiles()`**: New method to wipe all profiles, used by the Delete All button in Options.

**Security audit (v1.0.6 release)**
- ✅ No `eval()` or `new Function()` usage anywhere
- ✅ No external `fetch()` calls — only `chrome.runtime.getURL(...)` (extension-internal)
- ✅ All user-controlled strings through `innerHTML` wrapped in `escapeHtml()` / `escHtml()`
- ✅ `profile.id` values are timestamp+alphanumeric only — safe in HTML `id=` / `data-*` attributes
- ✅ `chrome.runtime.onMessage` validates `sender.id === chrome.runtime.id` in all listeners
- ✅ `postMessage` iframe relay validates `event.source` against known frame hierarchy
- ✅ JSON import has 5 MB file size cap and structural validation before any storage write
- ✅ Notifications use `textContent` (not `innerHTML`) for user-facing message strings
- ✅ `i18n` translations that contain icon `<img>` HTML are loaded from extension-internal locale files only (not user input) — `innerHTML` usage is intentional and safe

### Version 1.0.5
- 🔒 **Security: Background message sender validation**: `background.js` now rejects messages from external web pages — only messages from the extension itself are accepted.
- 🔒 **Security: postMessage relay nonce**: A per-session cryptographic nonce is embedded in all iframe relay messages, preventing malicious cross-origin pages from spoofing TypeLess relay commands.
- 🛡️ **Security: Import file size limit**: JSON import now rejects files larger than 5 MB to prevent memory exhaustion attacks.
- 🏢 **Enterprise: Default profile deployment**: Added `default.json` configuration file for automatic profile loading during enterprise deployment. Pre-configure profiles for bulk deployment without requiring user interaction.
- 🐛 **Bug: Duplicate `toggleToolbar` handler removed**: A dead-code handler using incorrect visibility logic (`style.display === 'none'` instead of `classList.contains('typeless-hidden')`) was silently ignored but has been removed for clarity.
- 🖼️ **Fix: SVG icons not loading** (`web_accessible_resources`): Replaced individual icon entries with `icons/*` wildcard — all icons are now accessible to content scripts injected on external pages.
- 🎨 **Fix: `focus-btn` icon displayed as raw HTML text**: CSS `content: '<img ...>'` is not rendered by browsers. Replaced with `content: ''` + `background-image: url(...)` on the pseudo-element.
- 🔍 **Fix: Search placeholder showing `<img>` tag literal**: The profile search input in the Options page was using an HTML `<img>` tag as a `placeholder` attribute value. Replaced with a properly layered icon `<span>` positioned inside the input container.
- 🔢 **Version bump**: Updated version string from `1.0.3` to `1.0.5` across `manifest.json`, all JS files, and the Options page footer.

### Version 1.0.4
- 🔒 **Security: XSS hardening on notification**: Notification message now uses `textContent` (safe) instead of `innerHTML`, preventing page-injected strings from executing as HTML.
- ✏️ **Inline profile rename**: Rename profiles directly from the popup with a pencil button — no need to delete and re-save.

### Version 1.0.3
- ✏️ **Inline Profile Rename**: Rename profiles directly from the popup with a pencil button — no need to delete and re-save.
- 🎛️ **FineUI / ComboBox Support**: Detects and correctly fills FineUI DropDownList / ComboBox fields (inputs that look like text but behave as dropdowns). Saves both the display text and the hidden code value, and restores both on fill.
- 📸 **Screenshot Fix**: Toolbar is now automatically hidden before a screenshot is taken and restored afterwards, eliminating toolbar overlap in captures.
- 🔒 **Extension Context Guard**: Added `_extAlive()` safety check so content scripts no longer throw *"Extension context invalidated"* errors after the extension is reloaded/updated on an already-open tab.
- 🎯 **Focus After Fill**: Added `focusAfterFill` field property — designate one field to receive focus (with cursor at end) after a profile is applied.
- 📊 **Profile Manager in Settings**: New **Profiles** tab in the Options page to view, search, and edit all saved profiles without opening the popup.
- 📤 **Export Format v1.2**: Exported JSON now includes metadata (`_version`, `_exportedAt`, `_count`) and supports the new `displayText` and `focusAfterFill` field properties for full round-trip fidelity.
- 📥 **Improved Import Notification**: Import result now reports **added / updated / skipped** counts separately instead of a single total.
- 🔢 **Persistent Profile Counter**: Auto-increment counter for default profile names is now persisted per day, preventing name collisions across sessions.
- ♻️ **`saveProfile` API change**: Returns `{ success, isNew }` object instead of a plain boolean, enabling callers to distinguish between a new save and an overwrite.
- 🌐 **Broader Browser Compatibility**: `minimum_chrome_version` lowered from **102** to **88**, supporting more Chrome/Edge installations.
- 🧹 **Code Quality**: Delegated event listeners for profile action buttons (apply / copy / delete / rename) — a single listener now handles all profile cards instead of one per button. Options page code cleaned up and reorganised.

### Version 1.0.2 
- 📱 **Mobile Emulation**: Accurate Android/iOS simulation (User-Agent, Platform, Touch, Client Hints).
- 📸 **Screenshot**: Capture full page or visible area of the form.

### Version 1.0.1
- 🌍 Added 4 languages: 🇨🇳 🇹🇼 🇯🇵 🇰🇷.
- 💾 Added **Save HTML** feature.
- 🎨 UI Updates: Button borders, Bold text, New icons.
- 🐛 Fixed font and translation issues.

- 🔒 **Security: Background message sender validation**: `background.js` now rejects messages from external web pages — only messages from the extension itself are accepted.
- 🔒 **Security: postMessage relay nonce**: A per-session cryptographic nonce is embedded in all iframe relay messages, preventing malicious cross-origin pages from spoofing TypeLess relay commands.
- 🛡️ **Security: Import file size limit**: JSON import now rejects files larger than 5 MB to prevent memory exhaustion attacks.
- 🏢 **Enterprise: Default profile deployment**: Added `default.json` configuration file for automatic profile loading during enterprise deployment. Pre-configure profiles for bulk deployment without requiring user interaction.
- 🐛 **Bug: Duplicate `toggleToolbar` handler removed**: A dead-code handler using incorrect visibility logic (`style.display === 'none'` instead of `classList.contains('typeless-hidden')`) was silently ignored but has been removed for clarity.
- 🖼️ **Fix: SVG icons not loading** (`web_accessible_resources`): Replaced individual icon entries with `icons/*` wildcard — all icons are now accessible to content scripts injected on external pages.
- 🎨 **Fix: `focus-btn` icon displayed as raw HTML text**: CSS `content: '<img ...>'` is not rendered by browsers. Replaced with `content: ''` + `background-image: url(...)` on the pseudo-element.
- 🔍 **Fix: Search placeholder showing `<img>` tag literal**: The profile search input in the Options page was using an HTML `<img>` tag as a `placeholder` attribute value. Replaced with a properly layered icon `<span>` positioned inside the input container.
- 🔢 **Version bump**: Updated version string from `1.0.3` to `1.0.5` across `manifest.json`, all JS files, and the Options page footer.

### Version 1.0.4
- 🔒 **Security: XSS hardening on notification**: Notification message now uses `textContent` (safe) instead of `innerHTML`, preventing page-injected strings from executing as HTML.
- ✏️ **Inline profile rename**: Rename profiles directly from the popup with a pencil button — no need to delete and re-save.

### Version 1.0.3
- ✏️ **Inline Profile Rename**: Rename profiles directly from the popup with a pencil button — no need to delete and re-save.
- 🎛️ **FineUI / ComboBox Support**: Detects and correctly fills FineUI DropDownList / ComboBox fields (inputs that look like text but behave as dropdowns). Saves both the display text and the hidden code value, and restores both on fill.
- 📸 **Screenshot Fix**: Toolbar is now automatically hidden before a screenshot is taken and restored afterwards, eliminating toolbar overlap in captures.
- 🔒 **Extension Context Guard**: Added `_extAlive()` safety check so content scripts no longer throw *"Extension context invalidated"* errors after the extension is reloaded/updated on an already-open tab.
- 🎯 **Focus After Fill**: Added `focusAfterFill` field property — designate one field to receive focus (with cursor at end) after a profile is applied.
- 📊 **Profile Manager in Settings**: New **Profiles** tab in the Options page to view, search, and edit all saved profiles without opening the popup.
- 📤 **Export Format v1.2**: Exported JSON now includes metadata (`_version`, `_exportedAt`, `_count`) and supports the new `displayText` and `focusAfterFill` field properties for full round-trip fidelity.
- 📥 **Improved Import Notification**: Import result now reports **added / updated / skipped** counts separately instead of a single total.
- 🔢 **Persistent Profile Counter**: Auto-increment counter for default profile names is now persisted per day, preventing name collisions across sessions.
- ♻️ **`saveProfile` API change**: Returns `{ success, isNew }` object instead of a plain boolean, enabling callers to distinguish between a new save and an overwrite.
- 🌐 **Broader Browser Compatibility**: `minimum_chrome_version` lowered from **102** to **88**, supporting more Chrome/Edge installations.
- 🧹 **Code Quality**: Delegated event listeners for profile action buttons (apply / copy / delete / rename) — a single listener now handles all profile cards instead of one per button. Options page code cleaned up and reorganised.

### Version 1.0.2 
- 📱 **Mobile Emulation**: Accurate Android/iOS simulation (User-Agent, Platform, Touch, Client Hints).
- 📸 **Screenshot**: Capture full page or visible area of the form.

### Version 1.0.1
- 🌍 Added 4 languages: 🇨🇳 🇹🇼 🇯🇵 🇰🇷.
- 💾 Added **Save HTML** feature.
- 🎨 UI Updates: Button borders, Bold text, New icons.
- 🐛 Fixed font and translation issues.

## 👨‍💻 Author
**TRONG.PRO**

## 📄 License
MIT License
