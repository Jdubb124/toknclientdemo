/**
 * StreamFlix Demo Application
 * Main application logic for the Tokn SDK demo
 */

// Initialize the demo SDK when the page loads
let toknDemo;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Tokn SDK Demo
    toknDemo = new ToknSDKDemo({
        clientId: 'streamflix-demo-client',
        onVerified: (data) => {
            console.log('StreamFlix: Age verification successful!', data);
            showNotification('Age verification successful! Video content unlocked.', 'success');
        },
        onError: (error) => {
            console.error('StreamFlix: Age verification failed!', error);
            showNotification('Age verification failed. Please try again.', 'error');
        }
    });

    setTimeout(() => {
        const verifyButton = document.querySelector('#tokn-verify-button button');
        if (verifyButton) {
            verifyButton.addEventListener('click', () => {
                toknDemo.startVerification();
            });
        }
    }, 200);

    // Set up video card click handlers
    setupVideoCardHandlers();
    
    // Set up overlay close handler
    setupOverlayHandlers();
    
    // Add some initial demo logging
    setTimeout(() => {
        toknDemo.logToConsole('StreamFlix demo loaded - 6 videos available');
        toknDemo.logToConsole('Age-gated content: 4 videos require verification');
        toknDemo.logToConsole('Click "Verify Age with Tokn" to unlock restricted content');
    }, 1000);
});

/**
 * Set up click handlers for video cards
 */
function setupVideoCardHandlers() {
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
        const playButton = card.querySelector('.play-button');
        if (playButton) {
            playButton.addEventListener('click', function(e) {
                e.stopPropagation();
                handleVideoPlay(card);
            });
        }
    });
}

/**
 * Handle video play button clicks
 * @param {HTMLElement} card - The video card element
 */
function handleVideoPlay(card) {
    const minAge = parseInt(card.getAttribute('data-min-age'));
    const title = card.querySelector('.video-title').textContent;
    
    if (minAge && !toknDemo.isVerified(minAge)) {
        showNotification(`Age verification required for ${minAge}+ content`, 'error');
        toknDemo.logToConsole(`Blocked attempt to play ${minAge}+ content without verification`);
        
        // Optionally prompt for verification
        if (confirm(`This content requires age verification (${minAge}+). Would you like to verify your age now?`)) {
            toknDemo.startVerification();
        }
    } else {
        showNotification(`Playing: ${title}`, 'success');
        toknDemo.logToConsole(`Started playing: ${title}`);
        
        // In a real app, this would start video playback
        simulateVideoPlayback(title);
    }
}

/**
 * Simulate video playback (for demo purposes)
 * @param {string} title - Video title
 */
function simulateVideoPlayback(title) {
    // Create a simple "Now Playing" indicator
    const playingIndicator = document.createElement('div');
    playingIndicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(229, 9, 20, 0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 3000;
        font-size: 0.9rem;
        max-width: 300px;
    `;
    playingIndicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>▶️</span>
            <div>
                <div style="font-weight: bold;">Now Playing</div>
                <div style="opacity: 0.8;">${title}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(playingIndicator);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(playingIndicator)) {
            document.body.removeChild(playingIndicator);
        }
    }, 5000);
}

/**
 * Set up overlay handlers
 */
function setupOverlayHandlers() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeOverlay();
            }
        });
    }
}

/**
 * Demo control functions
 */

/**
 * Simulate successful or failed verification
 * @param {boolean} success - Whether to simulate success or failure
 */
function simulateVerification(success) {
    closeOverlay();
    
    if (success) {
        // Simulate successful verification with full age access
        const mockData = {
            verified: true,
            ageFlags: {
                is_16_plus: true,
                is_18_plus: true,
                is_21_plus: true
            },
            verificationDate: new Date().toISOString(),
            userId: 'demo-user-' + Math.random().toString(36).substr(2, 9)
        };
        
        toknDemo.handleVerificationSuccess(mockData);
    } else {
        toknDemo.handleVerificationError('User cancelled verification');
    }
}

/**
 * Close the verification overlay
 */
function closeOverlay() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * Check all age gates and log status
 */
function checkAllAgeGates() {
    toknDemo.logToConsole('Checking all video content access levels...');
    
    const contentTypes = [
        { age: 16, type: 'Teen Drama & Romance' },
        { age: 18, type: 'Mature Thrillers & War Films' },
        { age: 21, type: 'Adult Documentaries & Lifestyle' }
    ];
    
    contentTypes.forEach(content => {
        const isVerified = toknDemo.isVerified(content.age);
        toknDemo.logToConsole(`${content.age}+ content (${content.type}): ${isVerified ? 'ACCESSIBLE' : 'BLOCKED'}`);
    });
    
    // Show summary notification
    const accessibleCount = contentTypes.filter(c => toknDemo.isVerified(c.age)).length;
    showNotification(`Content access check complete: ${accessibleCount}/${contentTypes.length} age categories accessible`, 'info');
}

/**
 * Simulate logout
 */
function simulateLogout() {
    toknDemo.logout();
    showNotification('Logged out - all age-restricted content is now locked', 'info');
}

/**
 * Toggle console output visibility
 */
function showConsoleOutput() {
    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
        const isVisible = consoleOutput.style.display !== 'none';
        consoleOutput.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            toknDemo.logToConsole('Console output opened for debugging');
        }
    }
}

/**
 * Refresh verification status
 */
function refreshStatus() {
    toknDemo.updateStatusDisplay();
    toknDemo.checkAgeGates();
    toknDemo.logToConsole('Age verification status refreshed');
    showNotification('Status refreshed', 'info');
}

/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 3000;
        font-size: 0.9rem;
        max-width: 300px;
        transform: translateX(350px);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(350px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

/**
 * Get notification color based on type
 * @param {string} type - Notification type
 * @returns {string} CSS color value
 */
function getNotificationColor(type) {
    switch (type) {
        case 'success':
            return '#51cf66';
        case 'error':
            return '#ff6b6b';
        case 'warning':
            return '#ffd43b';
        case 'info':
        default:
            return '#339af0';
    }
}

/**
 * Handle OAuth callback (for production use)
 * This would be called when the OAuth popup redirects back
 * @param {URLSearchParams} params - URL parameters from callback
 */
function handleOAuthCallback(params) {
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    
    if (error) {
        toknDemo.handleVerificationError(error);
        return;
    }
    
    if (code && state) {
        // In production, exchange the code for tokens
        exchangeCodeForTokens(code, state);
    }
}

/**
 * Exchange authorization code for access tokens (production)
 * @param {string} code - Authorization code
 * @param {string} state - State parameter for security
 */
async function exchangeCodeForTokens(code, state) {
    try {
        const response = await fetch('/api/auth/callback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, state })
        });
        
        if (response.ok) {
            const data = await response.json();
            toknDemo.handleVerificationSuccess(data);
        } else {
            throw new Error('Token exchange failed');
        }
    } catch (error) {
        toknDemo.handleVerificationError(error.message);
    }
}

/**
 * Utility function to check if we're in demo mode
 * @returns {boolean} Whether we're running in demo mode
 */
function isDemoMode() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.search.includes('demo=true');
}

// Make functions available globally for onclick handlers
window.simulateVerification = simulateVerification;
window.closeOverlay = closeOverlay;
window.checkAllAgeGates = checkAllAgeGates;
window.simulateLogout = simulateLogout;
window.showConsoleOutput = showConsoleOutput;
window.refreshStatus = refreshStatus;