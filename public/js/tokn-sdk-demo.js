/**
 * Updated tokn-sdk-demo.js to use REAL Tokn MVP OAuth flow
 * Replace the simulation with actual API calls
 */

class ToknSDKDemo {
    constructor(config) {
        this.config = {
            clientId: 'demo-client-123', // Your actual OAuth client ID from database
            apiUrl: 'https://tokn-backend-505250569367.us-east5.run.app',
            authUrl: 'https://toknmvp.web.app',
            redirectUri: window.location.origin + '/api/auth/callback',
            // For Cloudflare Pages:
            // apiUrl: 'https://your-tokn-mvp.herokuapp.com',
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

    init() {
        this.renderButton();
        this.logToConsole('Tokn SDK Demo initialized - connecting to REAL Tokn MVP');
        
        // Check for existing verification
        const stored = localStorage.getItem('tokn_access_token');
        if (stored) {
            this.verifyExistingToken(stored);
        }
    }

    renderButton() {
        const container = document.getElementById('tokn-verify-button');
        if (container) {
            container.innerHTML = `
                <button onclick="window.toknDemo?.startVerification()" 
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
     * Start REAL OAuth verification flow
     */
    startVerification() {
        this.logToConsole('🚀 Starting REAL Tokn OAuth verification...');
        
        // Generate PKCE challenge
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = this.generateCodeChallenge(codeVerifier);
        
        // Store code verifier for token exchange
        localStorage.setItem('tokn_code_verifier', codeVerifier);
        
        // Build OAuth authorization URL
        const authUrl = this.buildAuthUrl(codeChallenge);
        
        this.logToConsole(`🔗 Opening OAuth popup: ${this.config.apiUrl}`);
        
        // Open OAuth popup
        this.openOAuthPopup(authUrl);
    }

    /**
     * Generate PKCE code verifier
     */
    generateCodeVerifier() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.base64URLEncode(array);
    }

    /**
     * Generate PKCE code challenge
     */
    async generateCodeChallenge(verifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return this.base64URLEncode(new Uint8Array(digest));
    }

    /**
     * Base64 URL encode
     */
    base64URLEncode(array) {
        return btoa(String.fromCharCode(...array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Build OAuth authorization URL for your Tokn MVP
     */
    buildAuthUrl(codeChallenge) {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: 'age_verification',
            state: this.generateState(),
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });
        
        return `${this.config.apiUrl}/api/oauth/authorize?${params.toString()}`;
    }

    /**
     * Generate random state parameter
     */
    generateState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Open OAuth popup and handle response
     */
    openOAuthPopup(authUrl) {
        const popup = window.open(
            authUrl,
            'tokn-oauth',
            'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
            this.handleVerificationError('Popup blocked. Please allow popups for this site.');
            return;
        }

        // Listen for popup messages
        const messageHandler = (event) => {
            // Verify origin for security
            if (event.origin !== this.config.apiUrl) return;

            if (event.data.type === 'TOKN_OAUTH_SUCCESS') {
                window.removeEventListener('message', messageHandler);
                popup.close();
                this.handleOAuthSuccess(event.data.code);
            } else if (event.data.type === 'TOKN_OAUTH_ERROR') {
                window.removeEventListener('message', messageHandler);
                popup.close();
                this.handleVerificationError(event.data.error);
            }
        };

        window.addEventListener('message', messageHandler);

        // Handle popup closed manually
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener('message', messageHandler);
                this.logToConsole('❌ OAuth popup closed by user');
            }
        }, 1000);
    }

    /**
     * Handle OAuth success - exchange code for tokens
     */
    async handleOAuthSuccess(authorizationCode) {
        try {
            this.logToConsole('✅ OAuth authorization received, exchanging for tokens...');
            
            const codeVerifier = localStorage.getItem('tokn_code_verifier');
            if (!codeVerifier) {
                throw new Error('Missing code verifier');
            }

            // Exchange authorization code for access token
            const tokenResponse = await fetch(`${this.config.apiUrl}/api/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code: authorizationCode,
                    client_id: this.config.clientId,
                    code_verifier: codeVerifier
                })
            });

            if (!tokenResponse.ok) {
                const error = await tokenResponse.text();
                throw new Error(`Token exchange failed: ${error}`);
            }

            const tokenData = await tokenResponse.json();
            
            this.logToConsole('🎯 Access token received, fetching age verification...');
            
            // Store access token
            localStorage.setItem('tokn_access_token', tokenData.access_token);
            localStorage.removeItem('tokn_code_verifier');

            // Get age verification data
            await this.fetchAgeVerification(tokenData.access_token);

        } catch (error) {
            this.logToConsole(`❌ Token exchange failed: ${error.message}`);
            this.handleVerificationError(error.message);
        }
    }

    /**
     * Fetch age verification data from your Tokn MVP
     */
    async fetchAgeVerification(accessToken) {
        try {
            const response = await fetch(`${this.config.apiUrl}/api/oauth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Age verification failed: ${response.status}`);
            }

            const userData = await response.json();
            
            // Extract age flags from your Tokn MVP response
            const ageFlags = {
                is_16_plus: userData.is_16_plus || false,
                is_18_plus: userData.is_18_plus || false,
                is_21_plus: userData.is_21_plus || false
            };

            this.logToConsole('🎉 REAL age verification data received from Tokn MVP!');
            this.logToConsole(`📊 User Age Verification Status:`);
            this.logToConsole(`   • 16+ Access: ${ageFlags.is_16_plus ? '✅ VERIFIED' : '❌ NOT VERIFIED'}`);
            this.logToConsole(`   • 18+ Access: ${ageFlags.is_18_plus ? '✅ VERIFIED' : '❌ NOT VERIFIED'}`);
            this.logToConsole(`   • 21+ Access: ${ageFlags.is_21_plus ? '✅ VERIFIED' : '❌ NOT VERIFIED'}`);

            // Update internal state
            this.handleVerificationSuccess({
                verified: true,
                ageFlags: ageFlags,
                verificationDate: new Date().toISOString(),
                source: 'tokn-mvp',
                userId: userData.id
            });

        } catch (error) {
            this.logToConsole(`❌ Age verification failed: ${error.message}`);
            this.handleVerificationError(error.message);
        }
    }

    /**
     * Verify existing stored token
     */
    async verifyExistingToken(accessToken) {
        try {
            this.logToConsole('🔍 Checking existing Tokn authentication...');
            await this.fetchAgeVerification(accessToken);
        } catch (error) {
            this.logToConsole('🗑️ Stored token invalid, cleared from storage');
            localStorage.removeItem('tokn_access_token');
        }
    }

    // Keep existing methods for UI updates
    handleVerificationSuccess(data) {
        this.verified = true;
        this.ageFlags = data.ageFlags;
        
        this.updateStatusDisplay();
        this.checkAgeGates();
        
        if (this.config.onVerified) {
            this.config.onVerified(data);
        }
    }

    handleVerificationError(error) {
        this.logToConsole(`❌ Verification failed: ${error}`);
        if (this.config.onError) {
            this.config.onError(error);
        }
    }

    // Keep all existing UI methods unchanged...
    updateStatusDisplay() { /* existing code */ }
    checkAgeGates() { /* existing code */ }
    unlockContent(age) { /* existing code */ }
    isVerified(minAge = 18) { /* existing code */ }
    logout() { 
        localStorage.removeItem('tokn_access_token');
        this.verified = false;
        this.ageFlags = {
            is_16_plus: false,
            is_18_plus: false,
            is_21_plus: false
        };
        this.updateStatusDisplay();
        this.lockAllContent();
        this.logToConsole('🚪 Logged out - cleared Tokn authentication');
    }
    lockAllContent() { /* existing code */ }
    logToConsole(message) { /* existing code */ }
}