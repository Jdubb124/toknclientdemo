/**
 * Tokn SDK - Fixed Version with POST Authorization
 * @version 1.0.1
 */
(function(window) {
    'use strict';
  
    console.log('🚀 Tokn SDK: Loading...');
  
    // Default configuration
    const DEFAULT_CONFIG = {
      apiUrl: 'https://tokn-backend-505250569367.us-east5.run.app',
      authUrl: 'https://toknmvp.web.app',
      popupWidth: 500,
      popupHeight: 700,
      timeout: 300000, // 5 minutes
    };
  
    /**
     * Generate a random string for PKCE and state
     */
    function generateRandomString(length = 32) {
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
      let result = '';
      const randomValues = new Uint8Array(length);
      crypto.getRandomValues(randomValues);
      for (let i = 0; i < length; i++) {
        result += charset[randomValues[i] % charset.length];
      }
      return result;
    }
  
    /**
     * Base64URL encode
     */
    function base64URLEncode(buffer) {
      return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    }
  
    /**
     * Generate PKCE code challenge
     */
    async function generateCodeChallenge(verifier) {
      const encoder = new TextEncoder();
      const data = encoder.encode(verifier);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return base64URLEncode(digest);
    }
  
    /**
     * Main Tokn SDK Class
     */
    class ToknSDK {
      constructor(config = {}) {
        console.log('ToknSDK: Initializing with config:', config);
        
        // Validate required config
        if (!config.clientId) {
          throw new Error('ToknSDK: clientId is required');
        }
  
        // Merge configuration
        this.config = Object.assign({}, DEFAULT_CONFIG, config);
        this.clientId = config.clientId;
        this.redirectUri = config.redirectUri || window.location.origin;
        this.onVerified = config.onVerified || (() => {});
        this.onError = config.onError || ((error) => console.error('Tokn SDK Error:', error));
        
        // Internal state
        this.isInitialized = false;
        this.popup = null;
        this.messageListener = null;
        this.timeoutId = null;
  
        console.log('ToknSDK: Configuration set:', {
          clientId: this.clientId,
          apiUrl: this.config.apiUrl,
          authUrl: this.config.authUrl,
          redirectUri: this.redirectUri
        });
  
        // Initialize
        this.init();
      }
  
      /**
       * Initialize the SDK
       */
      init() {
        if (this.isInitialized) return;
  
        // Check if user already has a valid token
        this.checkExistingVerification();
  
        // Create verification button if auto-render is enabled
        if (this.config.autoRender !== false) {
          this.renderButton();
        }
  
        this.isInitialized = true;
        console.log('ToknSDK: Initialization complete');
      }
  
      /**
       * Check for existing verification
       */
      async checkExistingVerification() {
        const token = this.getStoredToken();
        if (!token) {
          console.log('ToknSDK: No existing token found');
          return;
        }
  
        try {
          const response = await fetch(`${this.config.apiUrl}/oauth/verify`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
  
          if (response.ok) {
            const data = await response.json();
            console.log('Tokn: Existing verification found');
            console.log('is_16_plus:', data.age_flags.is_16_plus);
            console.log('is_18_plus:', data.age_flags.is_18_plus);
            console.log('is_21_plus:', data.age_flags.is_21_plus);
            
            this.onVerified({
              verified: data.verified,
              ageFlags: data.age_flags,
              verificationDate: data.verification_date,
              fromCache: true
            });
          } else {
            // Token is invalid, remove it
            console.log('ToknSDK: Existing token is invalid, clearing');
            this.clearStoredToken();
          }
        } catch (error) {
          console.error('Error checking existing verification:', error);
          this.clearStoredToken();
        }
      }
  
      /**
       * Render the verification button
       */
      renderButton() {
        const container = document.getElementById('tokn-verify-button');
        if (!container) {
          console.warn('ToknSDK: No element with id "tokn-verify-button" found');
          return;
        }
  
        container.innerHTML = `
          <button 
            id="tokn-verify-btn" 
            style="
              background: #2563eb;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              transition: background-color 0.2s;
            "
            onmouseover="this.style.background='#1d4ed8'"
            onmouseout="this.style.background='#2563eb'"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Verify with Tokn
          </button>
        `;
  
        document.getElementById('tokn-verify-btn').addEventListener('click', () => {
          this.startVerification();
        });
        
        console.log('ToknSDK: Button rendered');
      }
  
      /**
       * Start the verification process
       */
      async startVerification() {
        try {
          console.log('ToknSDK: Starting verification process');
          
          // Generate PKCE parameters
          const codeVerifier = generateRandomString(128);
          const codeChallenge = await generateCodeChallenge(codeVerifier);
          const state = generateRandomString(32);
  
          // Store PKCE parameters
          sessionStorage.setItem('tokn_code_verifier', codeVerifier);
          sessionStorage.setItem('tokn_state', state);
  
          console.log('ToknSDK: PKCE parameters generated');
  
          // Build authorization URL for the popup
          // This goes to the FRONTEND OAuth login page, not the API
          const authUrl = new URL(`${this.config.authUrl}/oauth/login`);
          authUrl.searchParams.set('client_id', this.clientId);
          authUrl.searchParams.set('redirect_uri', this.redirectUri);
          authUrl.searchParams.set('response_type', 'code');
          authUrl.searchParams.set('scope', 'age_verification');
          authUrl.searchParams.set('state', state);
          authUrl.searchParams.set('code_challenge', codeChallenge);
          authUrl.searchParams.set('code_challenge_method', 'S256');
  
          console.log('ToknSDK: Opening OAuth login popup:', authUrl.toString());
  
          // Open popup to the frontend OAuth login page
          this.openAuthPopup(authUrl.toString());
  
        } catch (error) {
          console.error('Error starting verification:', error);
          this.onError({
            error: 'initialization_failed',
            description: error.message
          });
        }
      }
  
      /**
       * Open authentication popup
       */
      openAuthPopup(url) {
        // Calculate popup position
        const left = (window.screen.width - this.config.popupWidth) / 2;
        const top = (window.screen.height - this.config.popupHeight) / 2;
  
        // Open popup
        this.popup = window.open(
          url,
          'tokn_auth',
          `width=${this.config.popupWidth},height=${this.config.popupHeight},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );
  
        if (!this.popup) {
          this.onError({
            error: 'popup_blocked',
            description: 'Popup was blocked by browser. Please allow popups for this site.'
          });
          return;
        }
  
        console.log('ToknSDK: Popup opened successfully');
  
        // Set up message listener
        this.setupMessageListener();
  
        // Set up popup monitoring
        this.monitorPopup();
  
        // Set timeout
        this.timeoutId = setTimeout(() => {
          this.closePopup();
          this.onError({
            error: 'timeout',
            description: 'Authentication timed out'
          });
        }, this.config.timeout);
      }
  
      /**
       * Set up postMessage listener
       */
      setupMessageListener() {
        this.messageListener = (event) => {
          // Ignore messages from React DevTools and other extensions
          if (event.data.source && event.data.source.includes('react-devtools')) {
            return;
          }
          
          // Only log Tokn-related messages
          if (event.data.type && event.data.type.startsWith('tokn_')) {
            console.log('ToknSDK: Received message:', event.data);
          }
          
          // Accept messages from any origin for testing
          // In production, validate event.origin
          
          const { type, code, state, error, error_description } = event.data;
  
          if (type === 'tokn_oauth_success') {
            console.log('ToknSDK: OAuth success message received');
            this.handleAuthSuccess(code, state);
          } else if (type === 'tokn_oauth_error') {
            console.log('ToknSDK: OAuth error message received');
            this.handleAuthError(error, error_description);
          }
        };
  
        window.addEventListener('message', this.messageListener);
        console.log('ToknSDK: Message listener set up');
      }
  
      /**
       * Monitor popup for manual close
       */
      monitorPopup() {
        const checkInterval = setInterval(() => {
          if (this.popup && this.popup.closed) {
            clearInterval(checkInterval);
            console.log('ToknSDK: Popup was closed');
            this.cleanup();
          }
        }, 1000);
  
        // Store interval ID for cleanup
        this.popupInterval = checkInterval;
      }
  
      /**
       * Handle successful authentication
       */
      async handleAuthSuccess(code, state) {
        try {
          console.log('ToknSDK: Handling auth success');
          
          // Validate state
          const storedState = sessionStorage.getItem('tokn_state');
          if (state !== storedState) {
            throw new Error('Invalid state parameter');
          }
  
          // Exchange code for token
          const token = await this.exchangeCodeForToken(code);
  
          // Verify and get age flags
          await this.verifyWithToken(token);
  
          this.cleanup();
  
        } catch (error) {
          console.error('Error handling auth success:', error);
          this.cleanup();
          this.onError({
            error: 'token_exchange_failed',
            description: error.message
          });
        }
      }
  
      /**
       * Handle authentication error
       */
      handleAuthError(error, errorDescription) {
        console.log('ToknSDK: Handling auth error:', error);
        this.cleanup();
        this.onError({
          error: error || 'unknown_error',
          description: errorDescription || 'Authentication failed'
        });
      }
  
      /**
       * Exchange authorization code for access token
       */
      async exchangeCodeForToken(code) {
        const codeVerifier = sessionStorage.getItem('tokn_code_verifier');
        
        console.log('ToknSDK: Exchanging code for token');
        
        const response = await fetch(`${this.config.apiUrl}/api/auth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.redirectUri,
            client_id: this.clientId,
            code_verifier: codeVerifier
          })
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error_description || 'Token exchange failed');
        }
  
        const data = await response.json();
        console.log('ToknSDK: Token received successfully');
        
        // Store token
        this.storeToken(data.access_token, data.expires_in);
        
        return data.access_token;
      }
  
      /**
       * Verify token and get age flags
       */
      async verifyWithToken(token) {
        console.log('ToknSDK: Verifying token and getting age flags');
        
        // The Actual API Call to our backend endpoint
        const response = await fetch(`${this.config.apiUrl}/oauth/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('ToknSDK: Verification response:', response);
  
        // If/else statement to handle the response
        if (!response.ok) {
          throw new Error('Verification failed');
        }
  
        // the return data from the API call formatted as a JS object
        const data = await response.json();
        
        // Log to console as requested
        console.log('Tokn: Age verification complete');
        console.log('Full verification response:', data);

        // Log the age flags to the console with detailed info
        console.log('Age flags received from API:', {
          is_16_plus: data.age_flags.is_16_plus,
          is_18_plus: data.age_flags.is_18_plus,
          is_21_plus: data.age_flags.is_21_plus,
          types: {
            is_16_plus: typeof data.age_flags.is_16_plus,
            is_18_plus: typeof data.age_flags.is_18_plus,
            is_21_plus: typeof data.age_flags.is_21_plus
          },
          truthy_values: {
            is_16_plus: !!data.age_flags.is_16_plus,
            is_18_plus: !!data.age_flags.is_18_plus,
            is_21_plus: !!data.age_flags.is_21_plus
          }
        });
  
        // Call success callback
        this.onVerified({
          verified: data.verified,
          ageFlags: data.age_flags,
          verificationDate: data.verification_date,
          expiresAt: data.expires_at
        });
      }
  
      /**
       * Store access token
       */
      storeToken(token, expiresIn) {
        const expiresAt = Date.now() + (expiresIn * 1000);
        localStorage.setItem('tokn_access_token', token);
        localStorage.setItem('tokn_token_expires', expiresAt.toString());
        console.log('ToknSDK: Token stored');
      }
  
      /**
       * Get stored token
       */
      getStoredToken() {
        const token = localStorage.getItem('tokn_access_token');
        const expires = localStorage.getItem('tokn_token_expires');
        
        if (!token || !expires) {
          return null;
        }
  
        // Check if token is expired
        if (Date.now() > parseInt(expires)) {
          this.clearStoredToken();
          return null;
        }
  
        return token;
      }
  
      /**
       * Clear stored token
       */
      clearStoredToken() {
        localStorage.removeItem('tokn_access_token');
        localStorage.removeItem('tokn_token_expires');
      }
  
      /**
       * Close popup and cleanup
       */
      closePopup() {
        if (this.popup && !this.popup.closed) {
          this.popup.close();
        }
        this.cleanup();
      }
  
      /**
       * Cleanup resources
       */
      cleanup() {
        // Clear timeout
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
  
        // Clear popup interval
        if (this.popupInterval) {
          clearInterval(this.popupInterval);
          this.popupInterval = null;
        }
  
        // Remove message listener
        if (this.messageListener) {
          window.removeEventListener('message', this.messageListener);
          this.messageListener = null;
        }
  
        // Clear session storage
        sessionStorage.removeItem('tokn_code_verifier');
        sessionStorage.removeItem('tokn_state');
  
        // Reset popup reference
        this.popup = null;
        
        console.log('ToknSDK: Cleanup complete');
      }
  
      /**
       * Check if user meets minimum age requirement
       */
      async isVerified(minAge = 18) {
        const token = this.getStoredToken();
        if (!token) {
          return false;
        }
  
        try {
          const response = await fetch(`${this.config.apiUrl}/oauth/verify`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
  
          if (!response.ok) {
            return false;
          }
  
          const data = await response.json();
          
          // Convert age flags to proper booleans to handle string values
          const convertToBoolean = (value) => {
            if (value === null || value === undefined) return false;
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') {
              return value.toLowerCase() === 'true' || value === '1';
            }
            if (typeof value === 'number') return value !== 0;
            return Boolean(value);
          };
          
          const ageFlags = {
            is_16_plus: convertToBoolean(data.age_flags.is_16_plus),
            is_18_plus: convertToBoolean(data.age_flags.is_18_plus),
            is_21_plus: convertToBoolean(data.age_flags.is_21_plus)
          };
          
          console.log(`Checking verification for ${minAge}+:`, {
            minAge,
            ageFlags,
            result: ageFlags[`is_${minAge}_plus`]
          });
          
          switch (minAge) {
            case 16:
              return ageFlags.is_16_plus;
            case 18:
              return ageFlags.is_18_plus;
            case 21:
              return ageFlags.is_21_plus;
            default:
              return false;
          }
        } catch (error) {
          console.error('Error checking verification:', error);
          return false;
        }
      }
  
      /**
       * Manually trigger verification
       */
      verify() {
        console.log('ToknSDK: Manual verification triggered');
        this.startVerification();
      }
  
      /**
       * Logout and clear tokens
       */
      async logout() {
        const token = this.getStoredToken();
        
        if (token) {
          try {
            await fetch(`${this.config.apiUrl}/oauth/revoke`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                token: token
              })
            });
          } catch (error) {
            console.error('Error revoking token:', error);
          }
        }
  
        this.clearStoredToken();
        this.cleanup();
        console.log('ToknSDK: Logged out');
      }
  
      /**
       * Get current verification status
       */
      async getStatus() {
        const token = this.getStoredToken();
        if (!token) {
          return { verified: false };
        }
  
        try {
          const response = await fetch(`${this.config.apiUrl}/oauth/verify`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
  
          if (!response.ok) {
            return { verified: false };
          }
  
          const data = await response.json();
          
          // Convert snake_case to camelCase to match callback format
          return {
            verified: data.verified,
            ageFlags: data.age_flags,
            verificationDate: data.verification_date,
            expiresAt: data.expires_at,
            userId: data.user_id
          };
        } catch (error) {
          console.error('Error getting status:', error);
          return { verified: false };
        }
      }
    }
  
    // Export to global scope
    window.ToknSDK = ToknSDK;
    
    // Also create Tokn namespace
    window.Tokn = {
      SDK: ToknSDK,
      version: '1.0.1'
    };
  
    console.log('✅ Tokn SDK: Loaded successfully!');
    console.log('  window.ToknSDK:', typeof window.ToknSDK);
    console.log('  Version:', window.Tokn.version);
  
  })(window);