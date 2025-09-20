/**
 * StreamFlix Demo Application - Updated for Official TOKN SDK Integration
 * Main application logic for the Tokn SDK demo
 */

// Application state
let isInitialized = false;

/**
 * Main application initialization
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 StreamFlix Demo initializing...');
    
    // Wait for TOKN integration to be ready
    waitForToknIntegration();
    
    // Setup all event handlers
    setupEventHandlers();
    
    // Setup UI components
    setupUserInterface();
    
    // Mark as initialized
    isInitialized = true;
    
    console.log('✅ StreamFlix Demo initialized successfully');
});

/**
 * Wait for TOKN integration to be ready
 */
function waitForToknIntegration() {
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max wait
    
    const checkIntegration = () => {
        if (window.toknIntegration && window.toknIntegration.isInitialized) {
            console.log('🛡️ TOKN Integration ready');
            setupIntegrationCallbacks();
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkIntegration, 100);
        } else {
            console.warn('⚠️ TOKN Integration not ready after 10 seconds');
        }
    };
    
    checkIntegration();
}

/**
 * Setup callbacks for TOKN integration
 */
function setupIntegrationCallbacks() {
    if (!window.toknIntegration) return;
    
    // Set up global callbacks
    window.streamFlixDemo = {
        onVerificationSuccess: handleVerificationSuccess,
        onVerificationError: handleVerificationError
    };
    
    console.log('🔗 TOKN Integration callbacks configured');
}

/**
 * Handle successful verification
 */
function handleVerificationSuccess(data) {
    console.log('StreamFlix: Age verification successful!', data);
    
    // Log detailed verification info
    if (window.toknIntegration) {
        window.toknIntegration.logToConsole('🎉 Verification successful - content unlocked!');
        window.toknIntegration.logToConsole(`✅ Age flags received: 16+:${data.ageFlags.is_16_plus}, 18+:${data.ageFlags.is_18_plus}, 21+:${data.ageFlags.is_21_plus}`);
    }
}

/**
 * Handle verification errors
 */
function handleVerificationError(error) {
    console.error('StreamFlix: Age verification failed!', error);
    
    if (window.toknIntegration) {
        window.toknIntegration.logToConsole(`❌ Verification failed: ${error.description || error}`);
    }
}

/**
 * Setup all event handlers
 */
function setupEventHandlers() {
    console.log('🔧 Setting up event handlers...');
    
    // Core functionality
    setupToknVerifyButton();
    setupDemoControlButtons();
    setupVideoCardHandlers();
    setupOverlayHandlers();
    setupModalHandlers(); 
    
    // Enhanced UX
    setupKeyboardShortcuts();
    setupDocumentClickHandlers();
    
    console.log('✅ All event handlers configured');
}

/**
 * Setup Tokn verification button event handler
 */
function setupToknVerifyButton() {
    // The TOKN SDK will automatically render the button
    // We just need to wait for it and attach our event handler
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait time
    
    const attachVerifyButtonListener = () => {
        const verifyButton = document.querySelector('#tokn-verify-button button, #tokn-verify-btn');
        
        if (verifyButton) {
            // Remove any existing listeners to prevent duplicates
            verifyButton.removeEventListener('click', handleVerifyButtonClick);
            
            // Add the event listener
            verifyButton.addEventListener('click', handleVerifyButtonClick);
            
            console.log('✅ Verify button event listener attached');
            if (window.toknIntegration) {
                window.toknIntegration.logToConsole('🛡️ Verify button ready for interaction');
            }
            
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(attachVerifyButtonListener, 100);
        } else {
            console.warn('⚠️ Verify button not found after 5 seconds');
            if (window.toknIntegration) {
                window.toknIntegration.logToConsole('⚠️ Verify button initialization timeout');
            }
        }
    };
    
    // Start checking for the button
    attachVerifyButtonListener();
}

/**
 * Handle verify button clicks
 */
async function handleVerifyButtonClick(event) {
    event.preventDefault();
    
    console.log('🛡️ Age verification button clicked');
    if (window.toknIntegration) {
        window.toknIntegration.logToConsole('🎯 User initiated age verification flow');
        await window.toknIntegration.startVerification();
    }
}

/**
 * Setup demo control buttons with modern event delegation
 */
function setupDemoControlButtons() {
    // Define button actions mapping
    const buttonActions = new Map([
        ['Check All Content Access', () => handleCheckAllAgeGates()],
        ['Simulate Logout', () => handleSimulateLogout()],
        ['Show Console', () => handleShowConsole()],
        ['Refresh Status', () => handleRefreshStatus()]
    ]);
    
    // Use event delegation for better performance
    document.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        
        const buttonText = button.textContent.trim();
        const action = buttonActions.get(buttonText);
        
        if (action) {
            event.preventDefault();
            console.log(`🎮 Demo control: ${buttonText}`);
            action();
        }
    });
    
    console.log('✅ Demo control buttons configured');
}

/**
 * Handle check all age gates action
 */
async function handleCheckAllAgeGates() {
    if (!window.toknIntegration) return;
    
    await window.toknIntegration.checkAllAgeGates();
}

/**
 * Handle simulate logout action
 */
async function handleSimulateLogout() {
    if (!window.toknIntegration) return;
    
    console.log('🚪 Simulating logout...');
    await window.toknIntegration.logout();
}

/**
 * Handle show console action
 */
function handleShowConsole() {
    const consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) return;
    
    const isVisible = consoleOutput.style.display !== 'none';
    consoleOutput.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible && toknDemo) {
        toknDemo.logToConsole('👨‍💻 Console output opened for debugging');
    }
    
    console.log(`🖥️ Console output ${isVisible ? 'hidden' : 'shown'}`);
}

/**
 * Handle refresh status action
 */
async function handleRefreshStatus() {
    if (!window.toknIntegration) return;
    
    console.log('🔄 Refreshing verification status...');
    const status = await window.toknIntegration.getStatus();
    
    if (status.verified && status.ageFlags) {
        window.toknIntegration.updateStatusDisplay(status.ageFlags);
        window.toknIntegration.updateAgeGates(status.ageFlags);
    }
    
    window.toknIntegration.logToConsole('🔄 Age verification status refreshed');
    window.toknIntegration.showNotification('Status refreshed', 'info');
}

/**
 * Setup video card event handlers
 */
function setupVideoCardHandlers() {
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach((card, index) => {
        const playButton = card.querySelector('.play-button');
        if (playButton) {
            playButton.addEventListener('click', (event) => {
                event.stopPropagation();
                handleVideoPlay(card);
            });
            
            // Add hover effects for better UX
            playButton.addEventListener('mouseenter', () => {
                playButton.style.transform = 'translate(-50%, -50%) scale(1.1)';
            });
            
            playButton.addEventListener('mouseleave', () => {
                playButton.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        }
    });
    
    console.log(`✅ ${videoCards.length} video card handlers configured`);
}

/**
 * Handle video play button clicks
 */
async function handleVideoPlay(card) {
    if (!window.toknIntegration) return;
    
    const minAge = parseInt(card.getAttribute('data-min-age'));
    const title = card.querySelector('.video-title').textContent;
    const rating = card.querySelector('.age-rating')?.textContent || 'G';
    
    console.log(`🎬 Attempting to play: ${title} (${rating})`);
    
    if (minAge && !(await window.toknIntegration.isVerified(minAge))) {
        // Content is age-restricted and user not verified
        const message = `Age verification required for ${minAge}+ content`;
        window.toknIntegration.showNotification(message, 'error');
        window.toknIntegration.logToConsole(`🔒 Blocked: ${title} requires ${minAge}+ verification`);
        
        // Offer verification
        setTimeout(async () => {
            if (confirm(`"${title}" requires age verification (${minAge}+).\n\nWould you like to verify your age now?`)) {
                await window.toknIntegration.startVerification();
            }
        }, 500);
        
    } else {
        // Content is accessible
        window.toknIntegration.showNotification(`Playing: ${title}`, 'success');
        window.toknIntegration.logToConsole(`▶️ Started playing: ${title} (${rating})`);
        simulateVideoPlayback(title, rating);
    }
}

/**
 * Setup overlay handlers for modal interactions
 */
function setupOverlayHandlers() {
    const overlay = document.getElementById('overlay');
    if (!overlay) return;
    
    // Close overlay when clicking outside modal
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeOverlay();
        }
    });
    
    // Close overlay with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && overlay.classList.contains('active')) {
            closeOverlay();
        }
    });
    
    console.log('✅ Overlay handlers configured');
}

function setupModalHandlers() {
    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        
        switch(action) {
            case 'simulate-success':
                event.preventDefault();
                simulateVerification(true);
                break;
                
            case 'simulate-failure':
                event.preventDefault();
                simulateVerification(false);
                break;
                
            case 'close-overlay':
                event.preventDefault();
                closeOverlay();
                break;
        }
    });
}

/**
 * Setup keyboard shortcuts for power users
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', async (event) => {
        // Don't trigger if user is typing in an input
        if (event.target.tagName === 'INPUT' || 
            event.target.tagName === 'TEXTAREA' || 
            event.target.contentEditable === 'true') {
            return;
        }
        
        // Don't trigger if modifier keys are pressed (avoid conflicts)
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }
        
        switch(event.key.toLowerCase()) {
            case 'v':
                event.preventDefault();
                if (window.toknIntegration) {
                    await window.toknIntegration.startVerification();
                    window.toknIntegration.showNotification('Keyboard shortcut: Age Verification', 'info');
                }
                break;
                
            case 'c':
                event.preventDefault();
                handleCheckAllAgeGates();
                if (window.toknIntegration) {
                    window.toknIntegration.showNotification('Keyboard shortcut: Check Access', 'info');
                }
                break;
                
            case 'l':
                event.preventDefault();
                handleSimulateLogout();
                if (window.toknIntegration) {
                    window.toknIntegration.showNotification('Keyboard shortcut: Logout', 'info');
                }
                break;
                
            case '`':
            case '~':
                event.preventDefault();
                handleShowConsole();
                showNotification('Keyboard shortcut: Toggle Console', 'info');
                break;
                
            case 'r':
                event.preventDefault();
                handleRefreshStatus();
                if (window.toknIntegration) {
                    window.toknIntegration.showNotification('Keyboard shortcut: Refresh Status', 'info');
                }
                break;
                
            case '?':
                event.preventDefault();
                showKeyboardHelp();
                break;
        }
    });
    
    console.log('✅ Keyboard shortcuts configured');
}

/**
 * Setup additional document-level click handlers
 */
function setupDocumentClickHandlers() {
    // Global click tracking for analytics/debugging
    document.addEventListener('click', (event) => {
        const element = event.target;
        const elementInfo = `${element.tagName}${element.className ? '.' + element.className.split(' ')[0] : ''}${element.id ? '#' + element.id : ''}`;
        
        // Log significant interactions
        if (element.matches('button, .play-button, .video-card')) {
            console.log(`👆 User interaction: ${elementInfo}`);
        }
    });
}

/**
 * Setup user interface enhancements
 */
function setupUserInterface() {
    // Add initial demo logging with delay to ensure DOM is ready
    setTimeout(() => {
        if (window.toknIntegration) {
            window.toknIntegration.logToConsole('🎬 StreamFlix demo loaded - 6 videos available');
            window.toknIntegration.logToConsole('🔒 Age-gated content: 4 videos require verification');
            window.toknIntegration.logToConsole('🛡️ Click "Verify Age with Tokn" to unlock restricted content');
            window.toknIntegration.logToConsole('⌨️ Keyboard shortcuts: V=Verify, C=Check, L=Logout, `=Console, R=Refresh, ?=Help');
        }
    }, 1000);
    
    // Add loading states and smooth transitions
    addLoadingStates();
    
    console.log('✅ User interface enhancements applied');
}

/**
 * Add loading states to improve perceived performance
 */
function addLoadingStates() {
    // Add subtle loading animation to video cards
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

/**
 * Show keyboard shortcuts help
 */
function showKeyboardHelp() {
    const helpMessage = `
🎮 StreamFlix Keyboard Shortcuts:

V - Start Age Verification
C - Check All Content Access  
L - Simulate Logout
R - Refresh Status
\` - Toggle Console Output
? - Show This Help

Esc - Close Modal/Overlay
    `.trim();
    
    alert(helpMessage);
    
    if (window.toknIntegration) {
        window.toknIntegration.logToConsole('❓ Keyboard shortcuts help displayed');
    }
}

/**
 * Simulate video playback with enhanced UX
 */
function simulateVideoPlayback(title, rating) {
    // Create enhanced "Now Playing" indicator
    const playingIndicator = document.createElement('div');
    playingIndicator.className = 'now-playing-indicator';
    playingIndicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: linear-gradient(135deg, #e50914 0%, #d40813 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(229, 9, 20, 0.3);
        z-index: 3000;
        font-size: 0.9rem;
        max-width: 320px;
        transform: translateY(100px);
        transition: transform 0.3s ease;
    `;
    
    playingIndicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="
                width: 40px;
                height: 40px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
            ">▶️</div>
            <div>
                <div style="font-weight: bold; margin-bottom: 0.25rem;">Now Playing</div>
                <div style="opacity: 0.9; font-size: 0.85rem;">${title}</div>
                <div style="opacity: 0.7; font-size: 0.75rem;">Rated: ${rating}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(playingIndicator);
    
    // Animate in
    setTimeout(() => {
        playingIndicator.style.transform = 'translateY(0)';
    }, 100);
    
    // Remove after 5 seconds with animation
    setTimeout(() => {
        playingIndicator.style.transform = 'translateY(100px)';
        setTimeout(() => {
            if (document.body.contains(playingIndicator)) {
                document.body.removeChild(playingIndicator);
            }
        }, 300);
    }, 5000);
}

/**
 * Enhanced notification system (fallback if TOKN integration not available)
 */
function showNotification(message, type = 'info') {
    // Use TOKN integration notification if available
    if (window.toknIntegration && window.toknIntegration.showNotification) {
        window.toknIntegration.showNotification(message, type);
        return;
    }
    
    // Fallback notification system
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
 * Close overlay modal
 */
function closeOverlay() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.classList.remove('active');
        console.log('🔒 Overlay closed');
    }
}

/**
 * Demo control functions for modal simulation
 */
function simulateVerification(success) {
    closeOverlay();
    
    if (success) {
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
        
        // This is for demo purposes - in real implementation, this would come from TOKN SDK
        if (window.toknIntegration) {
            window.toknIntegration.handleVerificationSuccess(mockData);
        }
    } else {
        if (window.toknIntegration) {
            window.toknIntegration.handleVerificationError('User cancelled verification');
        }
    }
}

// Global functions for modal buttons (temporary compatibility)
window.simulateVerification = simulateVerification;
window.closeOverlay = closeOverlay;

/**
 * Utility function to check if app is initialized
 */
function ensureInitialized() {
    if (!isInitialized || !window.toknIntegration) {
        console.warn('⚠️ App not fully initialized yet');
        return false;
    }
    return true;
}

// Export for debugging in console
if (typeof window !== 'undefined') {
    window.streamFlixDemo = {
        toknIntegration: () => window.toknIntegration,
        checkAllAgeGates: handleCheckAllAgeGates,
        simulateLogout: handleSimulateLogout,
        showConsole: handleShowConsole,
        refreshStatus: handleRefreshStatus,
        isInitialized: () => isInitialized
    };
}