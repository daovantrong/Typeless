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

// Smart field detection and value generation
const SmartFill = {
    // Sample data for generation
    FIRST_NAMES: ["John", "Jane", "David", "Emily", "Michael", "Sarah", "Chris", "Anna", "Robert", "Lisa"],
    LAST_NAMES: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"],
    COMPANIES: ["Acme Corp", "Tech Solutions", "Global Industries", "Innovation Labs", "Digital Ventures"],
    CITIES: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio"],
    COUNTRIES: ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Japan"],
    DOMAINS: ["example.com", "test.com", "demo.com", "sample.org"],

    // Random helpers
    rnd(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    rndInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Generate phone number
    genPhone() {
        const areaCode = this.rndInt(200, 999);
        const prefix = this.rndInt(200, 999);
        const suffix = this.rndInt(1000, 9999);
        return `(${areaCode}) ${prefix}-${suffix}`;
    },

    // Generate email
    genEmail(name = '') {
        const firstName = name ? name.toLowerCase().replace(/[^a-z]/g, '') : this.rnd(this.FIRST_NAMES).toLowerCase();
        const domain = this.rnd(this.DOMAINS);
        const num = Math.random() > 0.5 ? this.rndInt(1, 999) : '';
        return `${firstName}${num}@${domain}`;
    },

    // Generate date (YYYY-MM-DD)
    genDate(yearsBack = 30) {
        const now = new Date();
        const past = new Date();
        past.setFullYear(now.getFullYear() - yearsBack);
        const randomTime = this.rndInt(past.getTime(), now.getTime());
        const date = new Date(randomTime);
        // Format as YYYY/MM/DD
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}/${m}/${d}`;
    },

    // Generate time (HH:MM)
    genTime() {
        const hour = String(this.rndInt(0, 23)).padStart(2, '0');
        const minute = String(this.rndInt(0, 59)).padStart(2, '0');
        return `${hour}:${minute}`;
    },

    // Generate color (#RRGGBB)
    genColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    },

    // Generate password
    genPassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    },

    // Generate address
    genAddress() {
        const num = this.rndInt(10, 9999);
        const streets = ["Main St", "Oak Ave", "Park Rd", "Lake Dr", "Hill Ln", "River St"];
        return `${num} ${this.rnd(streets)}`;
    },

    // Generate ZIP code
    genZip() {
        return String(this.rndInt(10000, 99999));
    },

    // Generate number
    genNumber(min = 1, max = 100) {
        return String(this.rndInt(min, max));
    },

    // Generate URL
    genUrl() {
        const domains = ['example', 'demo', 'test', 'sample'];
        const tlds = ['com', 'org', 'net', 'io'];
        return `https://${this.rnd(domains)}.${this.rnd(tlds)}`;
    },

    // Comprehensive field patterns (imported and adapted)
    FIELD_PATTERNS: {
        fullName: {
            patterns: ['fullname', 'full_name', 'họ và tên', 'ho va ten', 'hoten', 'họ tên', 'tên đầy đủ', 'displayname', 'customer_name', 'user_name', 'realname', 'người liên hệ', 'nguoi lien he'],
            priority: 2
        },
        firstName: {
            patterns: ['firstname', 'first_name', 'fname', 'given_name', 'tên', 'ten', 'tên gọi', 'forename', 'first', 'f_name', 'your-name'],
            priority: 1
        },
        lastName: {
            patterns: ['lastname', 'last_name', 'lname', 'family_name', 'surname', 'họ', 'ho', 'last', 'l_name', 'family'],
            priority: 1
        },
        middleName: {
            patterns: ['middlename', 'middle_name', 'mname', 'tên đệm', 'ten dem', 'tendem', 'tên lót', 'ten lot'],
            priority: 2
        },
        email: {
            patterns: ['email', 'e-mail', 'mail', 'emailaddress', 'thư điện tử', 'thu dien tu', 'điện tử', 'dien tu', 'account_email'],
            priority: 1
        },
        phone: {
            patterns: ['phone', 'telephone', 'tel', 'mobile', 'cellphone', 'số điện thoại', 'sodienthoai', 'điện thoại', 'dien thoai', 'sdt', 'di động', 'contact_number'],
            priority: 1
        },
        username: {
            patterns: ['username', 'user_name', 'userid', 'login', 'tên đăng nhập', 'ten dang nhap', 'tài khoản', 'tai khoan', 'account'],
            priority: 2
        },
        password: {
            patterns: ['password', 'pass', 'pwd', 'mật khẩu', 'mat khau', 'matkhau', 'mk', 'secret'],
            priority: 1
        },
        confirmPassword: {
            patterns: ['confirm_password', 'confirmpassword', 'retype_password', 'xác nhận mật khẩu', 'nhập lại mật khẩu', 'verify_password'],
            priority: 1
        },
        birthDate: {
            patterns: ['birthdate', 'birth_date', 'birthday', 'dob', 'ngày sinh', 'ngay sinh', 'sinh nhật', 'sinh nhat'],
            priority: 2
        },
        gender: {
            patterns: ['gender', 'sex', 'giới tính', 'gioitinh', 'phai'],
            priority: 3
        },
        idNumber: {
            patterns: ['idnumber', 'id_number', 'citizen_id', 'cmnd', 'cccd', 'căn cước', 'chứng minh', 'cmtnd', 'passport', 'passport_number'],
            priority: 2
        },
        address: {
            patterns: ['address', 'street', 'địa chỉ', 'dia chi', 'diachi', 'đường', 'duong', 'số nhà', 'so nha', 'home_address'],
            priority: 2
        },
        city: {
            patterns: ['city', 'town', 'thành phố', 'thanh pho', 'tỉnh', 'tinh', 'province', 'tỉnh thành'],
            priority: 3
        },
        district: {
            patterns: ['district', 'county', 'quận', 'quan', 'huyện', 'huyen', 'thị xã', 'thi xa'],
            priority: 3
        },
        ward: {
            patterns: ['ward', 'commune', 'phường', 'phuong', 'xã', 'xa', 'thôn', 'thon', 'ấp', 'ap', 'khu phố'],
            priority: 3
        },
        postalCode: {
            patterns: ['postalcode', 'postal_code', 'zipcode', 'zip', 'mã bưu điện', 'ma buu dien', 'postcode'],
            priority: 3
        },
        country: {
            patterns: ['country', 'nation', 'quốc gia', 'quoc gia', 'nước', 'nuoc'],
            priority: 3
        },
        company: {
            patterns: ['company', 'organization', 'công ty', 'cong ty', 'cơ quan', 'don vi', 'business', 'employer'],
            priority: 3
        },
        jobTitle: {
            patterns: ['jobtitle', 'job_title', 'position', 'chức vụ', 'chuc vu', 'nghề nghiệp', 'occupation'],
            priority: 3
        },
        cardHolderName: {
            patterns: ['cardholder', 'card_holder', 'name_on_card', 'tên chủ thẻ', 'ten chu the', 'chủ thẻ'],
            priority: 2
        },
        cardNumber: {
            patterns: ['cardnumber', 'card_number', 'credit_card', 'số thẻ', 'so the', 'cc_number'],
            priority: 1
        },
        cardExpiry: {
            patterns: ['expiry', 'expiration', 'exp_date', 'ngày hết hạn', 'ngay het han', 'hạn thẻ'],
            priority: 2
        },
        cardCVV: {
            patterns: ['cvv', 'cvc', 'security_code', 'mã bảo mật', 'ma bao mat'],
            priority: 1
        },
        search: {
            patterns: ['search', 'filter', 'query', 'tìm kiếm', 'tim kiem', 'lọc', 'bộ lọc'],
            priority: 0
        }
    },

    // Detect field type using improved patterns
    detectFieldType(element, externalLabel = '') {
        const type = (element.type || '').toLowerCase();

        // Immediate return for checkable inputs to avoid pattern confusion
        if (type === 'checkbox' || type === 'radio') return type;

        const label = (externalLabel || this.getLabel(element)).toLowerCase();
        const name = (element.name || element.id || element.placeholder || '').toLowerCase();
        const combined = `${label} ${name} ${type} ${element.className}`.toLowerCase();

        // Check each pattern type
        let bestMatch = 'text';
        let highestPriority = 999;

        for (const [key, config] of Object.entries(this.FIELD_PATTERNS)) {
            // Check if any pattern matches using word boundaries for short patterns
            const matched = config.patterns.some(pattern => {
                if (pattern.length <= 3) {
                    // Use word boundary for short patterns (ho, ten, sdt, sđt, vv.)
                    const regex = new RegExp(`\\b${pattern}\\b`, 'i');
                    return regex.test(combined);
                }
                return combined.includes(pattern);
            });

            if (matched) {
                // If priority is higher (lower number), update best match
                if (config.priority < highestPriority) {
                    bestMatch = key;
                    highestPriority = config.priority;
                }
            }
        }

        // Special handling for HTML5 types if no specific pattern matched
        if (bestMatch === 'text') {
            if (type === 'email') return 'email';
            if (type === 'tel') return 'phone';
            if (type === 'date') return 'birthDate'; // changed from date to birthDate for consistency
            if (type === 'time') return 'time';
            if (type === 'password') return 'password';
            if (type === 'url') return 'url';
            if (type === 'number') return 'number';
        }

        return bestMatch;
    },

    // Get label text for element
    getLabel(element) {
        // Try aria-label
        if (element.getAttribute) {
            const ariaLabel = element.getAttribute('aria-label');
            if (ariaLabel) return ariaLabel.trim();
        }

        // Try <label for="id">
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) return label.textContent.trim();
        }

        // Try parent <label>
        let parent = element.parentElement;
        while (parent) {
            if (parent.tagName && parent.tagName.toLowerCase() === 'label') {
                return parent.textContent.trim();
            }
            parent = parent.parentElement;
        }

        return '';
    },

    // Settings data
    settings: {},

    // Set settings data
    setSettings(settings) {
        this.settings = settings || {};
    },

    // Generate smart value based on field type
    generateValue(element, externalLabel = '') {
        const type = this.detectFieldType(element, externalLabel);
        const s = this.settings;

        switch (type) {
            case 'email': return s.email || this.genEmail();
            case 'phone': return s.phone || this.genPhone();
            case 'birthDate':
                if (s.dob) return s.dob.replace(/-/g, '/');
                return this.genDate();
            case 'time': return this.genTime();
            case 'color': return this.genColor();
            case 'password':
            case 'confirmPassword':
                return this.genPassword();
            case 'firstName':
                return s.firstName || this.rnd(this.FIRST_NAMES);
            case 'lastName':
                return s.lastName || this.rnd(this.LAST_NAMES);
            case 'middleName': return '';
            case 'fullName':
                if (s.firstName && s.lastName) return `${s.firstName} ${s.lastName}`;
                if (s.firstName) return s.firstName;
                return s.fullName || `${this.rnd(this.FIRST_NAMES)} ${this.rnd(this.LAST_NAMES)}`;
            case 'address': return s.address || this.genAddress();
            case 'city': return s.city || this.rnd(this.CITIES);
            case 'district': return 'District 1';
            case 'ward': return 'Ward 1';
            case 'postalCode': return s.zipCode || this.genZip();
            case 'country': return s.country || this.rnd(this.COUNTRIES);
            case 'url': return this.genUrl();
            case 'company': return this.rnd(this.COMPANIES);
            case 'jobTitle': return 'Staff';
            case 'username': return s.email ? s.email.split('@')[0] : 'user123';
            case 'idNumber': return String(Date.now()).slice(-9);
            case 'gender': return this.rnd(['Nam', 'Nữ', 'Khác']);
            case 'number': return this.genNumber();
            case 'cardHolderName': return 'NGUYEN VAN A';
            case 'cardNumber': return '4000123456789010';
            case 'cardExpiry': return '12/25';
            case 'cardCVV': return '123';
            case 'radio':
                // For radios, we usually want to select 'Male' or 'Yes' or first option as default
                const radioLabel = (externalLabel || this.getLabel(element)).toLowerCase();
                const radioValue = (element.value || '').toLowerCase();

                // Smart select for common radio groups
                if (radioLabel.includes('giới tính') || radioLabel.includes('gender')) {
                    if (radioValue === 'nam' || radioValue === 'male' || radioValue === '1') return element.value;
                }
                if (radioLabel.includes('đồng ý') || radioLabel.includes('agree') || radioLabel.includes('terms')) {
                    if (radioValue === 'yes' || radioValue === '1' || radioValue === 'true' || radioValue === 'on') return element.value;
                }
                return ''; // Don't check by default unless matched

            case 'checkbox':
                const cbLabel = (externalLabel || this.getLabel(element)).toLowerCase();
                // Always check terms and conditions
                if (cbLabel.includes('đồng ý') || cbLabel.includes('agree') || cbLabel.includes('terms') || cbLabel.includes('điều khoản')) {
                    return 'checked';
                }
                // Randomly check others
                return Math.random() > 0.5 ? 'checked' : 'unchecked';

            case 'search':
                return null; // Skip search fields to avoid triggering site-wide content hiding

            default:
                // Better default: Only fill if we have at least a label or name to go on
                // This prevents filling "unrelated" fields that might be used for layout/JS
                const label = (externalLabel || this.getLabel(element)).toLowerCase();
                const name = (element.name || element.id || '').toLowerCase();

                if (label || name) {
                    return 'Sample Text';
                }
                return null; // Skip completely anonymous fields to be safe
        }
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.SmartFill = SmartFill;
}

/**
 * End of smart-fill.js
* ╔══╗─────────╔╗────╔═╗╔═╗╔╗───╔══╗╔═╗╔═╗╔═╦╗╔══╗──╔═╗╔═╗╔═╗
* ╚╗╔╝╔╦╗╔═╗╔═╗║║─╔═╗║═╣║═╣║╚╦╦╗╚╗╔╝║╬║║║║║║║║║╔═╣──║╬║║╬║║║║
* ─║║─║║║║╬║║╩╣║╚╗║╩╣╠═║╠═║║╬║║║─║║─║╗╣║║║║║║║║╚╗║╔╗║╔╝║╗╣║║║
* ─╚╝─╠╗║║╔╝╚═╝╚═╝╚═╝╚═╝╚═╝╚═╬╗║─╚╝─╚╩╝╚═╝╚╩═╝╚══╝╚╝╚╝─╚╩╝╚═╝
* ────╚═╝╚╝──────────────────╚═╝
 */
