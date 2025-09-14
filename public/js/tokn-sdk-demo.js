/**
 * Tokn SDK Demo Class
 * Simulates the Tokn SDK for demonstration purposes
 * In production, this would be replaced with the actual Tokn SDK
 */
class ToknSDKDemo {
    constructor(config) {
        this.config = {
            clientId: 'streamflix-demo-client',
            apiUrl: 'https://api.tokn.co',
            redirectUri: window.location.origin + '/auth/callback',
            ...config
        };
        
        this.verified = false;
        this.ageFlags = {
            is_16_plus: false,
            is_18_plus: false,
            is_21_plus: false
        };
        
        this.init();
    }

    /**
     * Initialize the SDK
     */
    init() {
        this.renderButton();
        this.logToConsole('Tokn SDK Demo initialized for StreamFlix');
        
        // Check for existing verification (simulate persistence)
        const stored = localStorage.getItem('tokn_demo_verification');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.handleVerificationSuccess(data);
            } catch (error) {
                this.logToConsole('Error parsing stored verification data');
                localStorage.removeItem('tokn_demo_verification');
            }
        }
    }

    /**
     * Render the verification button
     */
    renderButton() {
        const container = document.getElementById('tokn-verify-button');
        if (container) {
            container.innerHTML = `
                <button onclick="window.toknDemo.startVerification()" 
                        style="
                            background: #e50914;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            width: 100%;
                            transition: all 0.3s;
                            font-size: 0.9rem;
                        " 
                        onmouseover="this.style.background='#d40813'"
                        onmouseout="this.style.background='#e50914'">
                    🛡️ Verify Age with Tokn
                </button>
            `;
        }
    }

    /**
     * Start the verification process
     * In production, this would open the Tokn OAuth popup
     */
    startVerification() {
        this.logToConsole('Starting Tokn age verification for video content...');
        
        // In production, this would be:
        // window.open(this.getAuthUrl(), 'tokn-verification', 'width=500,height=600');
        
        // For demo, show our simulation modal
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    /**
     * Generate OAuth authorization URL
     * This is what would be used in production
     */
    getAuthUrl() {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: 'age_verification',
            state: this.generateState()
        });
        
        return `${this.config.apiUrl}/oauth/authorize?${params.toString()}`;
    }

    /**
     * Generate a random state parameter for OAuth security
     */
    generateState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Handle successful verification
     * @param {Object} data - Verification data from Tokn
     */
    handleVerificationSuccess(data) {
        this.verified = true;
        this.ageFlags = data.ageFlags;
        
        this.logToConsole('Age verification successful!');
        this.logToConsole(`is_16_plus: ${data.ageFlags.is_16_plus} (Teen content access)`);
        this.logToConsole(`is_18_plus: ${data.ageFlags.is_18_plus} (Mature content access)`);
        this.logToConsole(`is_21_plus: ${data.ageFlags.is_21_plus} (Adult content access)`);
        
        this.updateStatusDisplay();
        this.checkAgeGates();
        
        // Store for persistence
        localStorage.setItem('tokn_demo_verification', JSON.stringify(data));
        
        // Trigger callback if provided
        if (this.config.onVerified) {
            this.config.onVerified(data);
        }
    }

    /**
     * Handle verification error
     * @param {string} error - Error message
     */
    handleVerificationError(error) {
        this.logToConsole(`Age verification failed: ${error}`);
        if (this.config.onError) {
            this.config.onError(error);
        }
    }

    /**
     * Update the status display panel
     */
    updateStatusDisplay() {
        const status16 = document.getElementById('status-16');
        const status18 = document.getElementById('status-18');
        const status21 = document.getElementById('status-21');

        if (status16) {
            status16.textContent = this.ageFlags.is_16_plus ? 'Verified' : 'Not Verified';
            status16.className = `status-badge ${this.ageFlags.is_16_plus ? 'verified' : 'unverified'}`;
        }

        if (status18) {
            status18.textContent = this.ageFlags.is_18_plus ? 'Verified' : 'Not Verified';
            status18.className = `status-badge ${this.ageFlags.is_18_plus ? 'verified' : 'unverified'}`;
        }

        if (status21) {
            status21.textContent = this.ageFlags.is_21_plus ? 'Verified' : 'Not Verified';
            status21.className = `status-badge ${this.ageFlags.is_21_plus ? 'verified' : 'unverified'}`;
        }
    }

    /**
     * Check all age gates and unlock appropriate content
     */
    checkAgeGates() {
        // Check 16+ content
        if (this.ageFlags.is_16_plus) {
            this.unlockContent(16);
        }

        // Check 18+ content  
        if (this.ageFlags.is_18_plus) {
            this.unlockContent(18);
            // Also unlock the second 18+ content
            this.unlockContentById('content-18-2');
        }

        // Check 21+ content
        if (this.ageFlags.is_21_plus) {
            this.unlockContent(21);
        }
    }

    /**
     * Unlock content by age requirement
     * @param {number} age - Minimum age requirement
     */
    unlockContent(age) {
        const contentCard = document.getElementById(`content-${age}`);
        this.unlockContentCard(contentCard, age);
    }

    /**
     * Unlock content by element ID
     * @param {string} id - Element ID
     */
    unlockContentById(id) {
        const contentCard = document.getElementById(id);
        this.unlockContentCard(contentCard, 18); // Assuming 18+ for the second content
    }

    /**
     * Unlock a specific content card
     * @param {HTMLElement} contentCard - The content card element
     * @param {number} age - Age requirement
     */
    unlockContentCard(contentCard, age) {
        if (contentCard) {
            contentCard.classList.remove('restricted');
            contentCard.classList.add('accessible');
            
            this.logToConsole(`Unlocked ${age}+ video content`);
        }
    }

    /**
     * Check if user is verified for a specific age
     * @param {number} minAge - Minimum age to check
     * @returns {boolean} - Whether user is verified for that age
     */
    isVerified(minAge = 18) {
        switch(minAge) {
            case 16:
                return this.ageFlags.is_16_plus;
            case 18:
                return this.ageFlags.is_18_plus;
            case 21:
                return this.ageFlags.is_21_plus;
            default:
                return false;
        }
    }

    /**
     * Logout and clear verification
     */
    logout() {
        this.verified = false;
        this.ageFlags = {
            is_16_plus: false,
            is_18_plus: false,
            is_21_plus: false
        };
        
        localStorage.removeItem('tokn_demo_verification');
        this.updateStatusDisplay();
        this.lockAllContent();
        this.logToConsole('Logged out - all video content locked');
    }

    /**
     * Lock all age-gated content
     */
    lockAllContent() {
        // Lock all age-gated content
        const ageGatedContent = document.querySelectorAll('.age-gate');
        ageGatedContent.forEach(card => {
            card.classList.remove('accessible');
            card.classList.add('restricted');
        });

        // Reset status badges
        ['status-16', 'status-18', 'status-21'].forEach(id => {
            const badge = document.getElementById(id);
            if (badge) {
                badge.textContent = 'Unknown';
                badge.className = 'status-badge unknown';
            }
        });
    }

    /**
     * Log messages to console and console output
     * @param {string} message - Message to log
     */
    logToConsole(message) {
        const consoleLog = document.getElementById('console-log');
        if (consoleLog) {
            const timestamp = new Date().toLocaleTimeString();
            const entry = document.createElement('div');
            entry.textContent = `[${timestamp}] ${message}`;
            consoleLog.appendChild(entry);
            consoleLog.scrollTop = consoleLog.scrollHeight;
        }
        
        // Also log to browser console
        console.log(`[StreamFlix Tokn Demo] ${message}`);
    }

    /**
     * Get current verification status
     * @returns {Object} Current verification status
     */
    getVerificationStatus() {
        return {
            verified: this.verified,
            ageFlags: { ...this.ageFlags },
            clientId: this.config.clientId
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToknSDKDemo;
}