/**
 * TOKN SDK Integration for StreamFlix Demo
 * This file integrates with the official TOKN SDK according to the documentation
 */


//default functionality for the tokn integration setup values and calls
class ToknIntegration {
    constructor() {
        this.tokn = null;
        this.isInitialized = false;
        this.config = null;
    }

    /**
     * Initialize the TOKN SDK integration
     */
    async init() {
        try {
            // Fetch configuration from the API
            this.config = await this.fetchConfig(); //grab configuration for class construction defaults.
            
            // Wait for TOKN SDK to be available
            await this.waitForToknSDK();
            
            // Initialize the TOKN SDK
            console.log('TOKN SDK Configuration:', {
                clientId: this.config.toknClientId,
                apiUrl: window.location.origin,
                authUrl: 'https://toknmvp.web.app',
                redirectUri: this.config.redirectUri,
                fullConfig: this.config
            });
            //establish client data for verification in "this.tokn" construction as object
            this.tokn = new ToknSDK({
                clientId: this.config.toknClientId,
                apiUrl: window.location.origin, // Use our Cloudflare function as the API endpoint
                authUrl: 'https://toknmvp.web.app',
                redirectUri: this.config.redirectUri,
                popupWidth: 500,
                popupHeight: 700,
                timeout: 300000,
                autoRender: true,
                onVerified: (data) => this.handleVerificationSuccess(data),
                onError: (error) => this.handleVerificationError(error)
            });
            
            this.isInitialized = true;
            this.logToConsole('✅ TOKN SDK initialized successfully');
            
            // Check for existing verification
            await this.checkExistingVerification();
            
        } catch (error) {
            console.error('Failed to initialize TOKN SDK:', error);
            this.logToConsole(`❌ SDK initialization failed: ${error.message}`);
        }
    }

    /**
     * Wait for TOKN SDK to be available
     */
    async waitForToknSDK() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait
            
            const checkSDK = () => {
                if (typeof ToknSDK !== 'undefined') {
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkSDK, 100);
                } else {
                    reject(new Error('TOKN SDK not loaded after 5 seconds'));
                }
            };
            
            checkSDK();
        });
    }

    /**
     * Fetch configuration from the API
     */
    async fetchConfig() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error(`Config fetch failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch config, using defaults:', error);
            return {
                toknClientId: 'demo-client-123',
                toknApiUrl: 'https://tokn-backend-505250569367.us-east5.run.app',
                redirectUri: window.location.origin + '/api/auth/callback'
            };
        }
    }

    /**
     * Check for existing verification
     */
    async checkExistingVerification() {
        if (!this.tokn) return;
        
        try {
            const status = await this.tokn.getStatus();
            if (status.verified) {
                this.logToConsole('🔍 Found existing verification');
                this.handleVerificationSuccess(status);
            }
        } catch (error) {
            this.logToConsole('No existing verification found');
        }
    }

    /**
     * Handle successful verification
     */
    handleVerificationSuccess(data) {
        this.logToConsole('🎉 Age verification successful!');
        this.logToConsole(`📊 Age flags: 16+:${data.ageFlags.is_16_plus}, 18+:${data.ageFlags.is_18_plus}, 21+:${data.ageFlags.is_21_plus}`);
        
        // Update status display
        this.updateStatusDisplay(data.ageFlags);
        
        // Update age gates
        this.updateAgeGates(data.ageFlags);
        
        // Show success notification
        this.showNotification('Age verification successful! Content unlocked.', 'success');
        
        // Trigger custom callback if provided
        if (window.streamFlixDemo && window.streamFlixDemo.onVerificationSuccess) {
            window.streamFlixDemo.onVerificationSuccess(data);
        }
    }

    /**
     * Handle verification errors
     */
    handleVerificationError(error) {
        this.logToConsole(`❌ Verification failed: ${error.description || error}`);
        this.showNotification('Age verification failed. Please try again.', 'error');
        
        // Trigger custom callback if provided
        if (window.streamFlixDemo && window.streamFlixDemo.onVerificationError) {
            window.streamFlixDemo.onVerificationError(error);
        }
    }

    /**
     * Start verification process
     */
    async startVerification() {
        // capture null or error sdk initiatializations
        if (!this.tokn) {
            this.logToConsole('❌ TOKN SDK not initialized');
            return; //return non value to startVerification
        }
        
        this.logToConsole('🚀 Starting age verification...');
        // try to verify
        try {
            // attempt to call the verify method through current sdk configuration - the method is defined in the SDK that invokes it
            await this.tokn.verify();
        } catch (error) {
            this.handleVerificationError(error);
        }
    }

    /**
     * Check if user is verified for a specific age
     */
    async isVerified(minAge = 18) {
        if (!this.tokn) return false;
        
        try {
            return await this.tokn.isVerified(minAge);
        } catch (error) {
            this.logToConsole(`Error checking verification: ${error.message}`);
            return false;
        }
    }

    /**
     * Get current verification status
     */
    async getStatus() {
        if (!this.tokn) return { verified: false };
        
        try {
            return await this.tokn.getStatus();
        } catch (error) {
            this.logToConsole(`Error getting status: ${error.message}`);
            return { verified: false };
        }
    }

    /**
     * Logout user
     */
    async logout() {
        if (!this.tokn) return;
        
        try {
            await this.tokn.logout();
            this.logToConsole('🚪 Logged out successfully');
            this.updateStatusDisplay({
                is_16_plus: false,
                is_18_plus: false,
                is_21_plus: false
            });
            this.updateAgeGates({
                is_16_plus: false,
                is_18_plus: false,
                is_21_plus: false
            });
            this.showNotification('Logged out - all content is now locked', 'info');
        } catch (error) {
            this.logToConsole(`Logout error: ${error.message}`);
        }
    }

    /**
     * Update status display in the UI
     */
    updateStatusDisplay(ageFlags) {
        const updateStatus = (elementId, isVerified) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = isVerified ? 'Verified' : 'Not Verified';
                element.className = `status-badge ${isVerified ? 'verified' : 'not-verified'}`;
            }
        };

        updateStatus('status-16', ageFlags.is_16_plus);
        updateStatus('status-18', ageFlags.is_18_plus);
        updateStatus('status-21', ageFlags.is_21_plus);
    }

    /**
     * Update age gates based on verification status
     */
    updateAgeGates(ageFlags) {
        const ageGateCards = document.querySelectorAll('.age-gate');
        
        ageGateCards.forEach(card => {
            const minAge = parseInt(card.getAttribute('data-min-age'));
            const overlay = card.querySelector('.age-gate-overlay');
            
            if (overlay) {
                const isAccessible = this.isAgeAccessible(minAge, ageFlags);
                overlay.style.display = isAccessible ? 'none' : 'flex';
                
                if (isAccessible) {
                    card.classList.remove('locked');
                    card.classList.add('unlocked');
                } else {
                    card.classList.remove('unlocked');
                    card.classList.add('locked');
                }
            }
        });
    }

    /**
     * Check if age is accessible based on flags
     */
    isAgeAccessible(minAge, ageFlags) {
        // Ensure ageFlags exists and has the required properties
        if (!ageFlags || typeof ageFlags !== 'object') {
            console.warn('isAgeAccessible: Invalid ageFlags provided', ageFlags);
            return false;
        }

        // Convert to boolean to handle null/undefined values
        const flags = {
            is_16_plus: Boolean(ageFlags.is_16_plus),
            is_18_plus: Boolean(ageFlags.is_18_plus),
            is_21_plus: Boolean(ageFlags.is_21_plus)
        };

        console.log(`Checking age access for ${minAge}+:`, {
            minAge,
            flags,
            result: flags[`is_${minAge}_plus`]
        });

        switch (minAge) {
            case 16: return flags.is_16_plus;
            case 18: return flags.is_18_plus;
            case 21: return flags.is_21_plus;
            default: 
                console.warn(`Unknown age requirement: ${minAge}`);
                return false;
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        const colors = {
            success: '#51cf66',
            error: '#ff6b6b',
            warning: '#ffd43b',
            info: '#339af0'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            z-index: 3000;
            font-size: 0.9rem;
            max-width: 350px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 1.1rem;">${icons[type] || icons.info}</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Log messages to console output
     */
    logToConsole(message) {
        const consoleLog = document.getElementById('console-log');
        if (consoleLog) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.style.cssText = `
                font-family: 'Courier New', monospace;
                font-size: 0.8rem;
                padding: 0.25rem 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            `;
            logEntry.textContent = `[${timestamp}] ${message}`;
            consoleLog.appendChild(logEntry);
            consoleLog.scrollTop = consoleLog.scrollHeight;
        }
        
        // Also log to browser console
        console.log(`[TOKN Integration] ${message}`);
    }

    /**
     * Check all content access levels
     */
    async checkAllAgeGates() {
        if (!this.tokn) return;
        
        this.logToConsole('🔍 Checking all content access levels...');
        
        const contentTypes = [
            { age: 16, type: 'Teen Drama & Romance' },
            { age: 18, type: 'Mature Thrillers & War Films' },
            { age: 21, type: 'Adult Documentaries & Lifestyle' }
        ];
        
        let accessibleCount = 0;
        
        for (const content of contentTypes) {
            const isVerified = await this.isVerified(content.age);
            const status = isVerified ? 'ACCESSIBLE' : 'BLOCKED';
            const emoji = isVerified ? '✅' : '🔒';
            
            this.logToConsole(`${emoji} ${content.age}+ content (${content.type}): ${status}`);
            
            if (isVerified) accessibleCount++;
        }
        
        const message = `Content access check complete: ${accessibleCount}/${contentTypes.length} age categories accessible`;
        this.showNotification(message, 'info');
        this.logToConsole(`📊 Summary: ${message}`);
    }
}

// Global instance
let toknIntegration;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    toknIntegration = new ToknIntegration();
    await toknIntegration.init();
    
    // Make available globally for debugging
    window.toknIntegration = toknIntegration;
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToknIntegration;
}
