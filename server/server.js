/**
 * StreamFlix Demo Server
 * Express.js server for serving the Tokn SDK demo application
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'", process.env.TOKN_API_URL || "https://api.tokn.co"]
        }
    }
}));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:8080'
        ];
        
        if (NODE_ENV === 'production') {
            // Add production domains
            allowedOrigins.push(
                'https://yourdomain.com',
                'https://demo.yourdomain.com'
            );
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));

// General middleware
app.use(compression());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: NODE_ENV === 'production' ? '1d' : '0',
    etag: true
}));

// API Routes

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});

/**
 * Configuration endpoint for frontend
 */
app.get('/api/config', (req, res) => {
    const toknMvpUrl = process.env.TOKN_MVP_URL || 'https://tokn-backend-505250569367.us-east5.run.app';
    
    res.json({
        toknClientId: process.env.TOKN_CLIENT_ID || 'demo-client-123',
        toknApiUrl: toknMvpUrl,
        toknAuthUrl: process.env.TOKN_AUTH_URL || 'https://tokn-frontend-505250569367.us-east5.run.app',
        environment: NODE_ENV,
        demoMode: false // Now using real backend!
    });
});

/**
 * OAuth callback handler for Tokn integration
 * In production, this would handle the OAuth flow
 */
app.post('/api/auth/callback', async (req, res) => {
    try {
        const { code, code_verifier, client_id } = req.body;
        
        if (!code || !code_verifier || !client_id) {
            return res.status(400).json({
                error: 'Missing required parameters',
                required: ['code', 'code_verifier', 'client_id']
            });
        }
        
        console.log('🔄 Starting real token exchange with Tokn MVP...');
        console.log('Code:', code.substring(0, 10) + '...');
        console.log('Client ID:', client_id);
        
        // Exchange code for access token with your REAL Tokn MVP
        const tokenData = await exchangeCodeForToken(code, code_verifier, client_id);
        
        // Get age verification data using the access token
        const ageVerificationData = await fetchAgeVerification(tokenData.access_token);
        
        console.log('✅ Real age verification successful!');
        console.log('Age flags:', ageVerificationData.ageFlags);
        
        res.json({
            verified: true,
            ageFlags: ageVerificationData.ageFlags,
            verificationDate: new Date().toISOString(),
            source: 'tokn-mvp',
            userId: ageVerificationData.userId
        });
        
    } catch (error) {
        console.error('❌ OAuth callback error:', error);
        res.status(500).json({
            error: 'OAuth exchange failed',
            message: error.message,
            details: error.details || 'No additional details'
        });
    }
});

/**
 * Exchange authorization code for access token - REAL IMPLEMENTATION
 */
async function exchangeCodeForToken(code, codeVerifier, clientId) {
    const toknMvpUrl = process.env.TOKN_MVP_URL || 'https://tokn-backend-505250569367.us-east5.run.app';
    
    console.log('🔗 Calling Tokn MVP token endpoint:', `${toknMvpUrl}/api/oauth/token`);
    
    try {
        const response = await fetch(`${toknMvpUrl}/api/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note: For public clients (like demos), we don't use client_secret
                // PKCE provides the security instead
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                client_id: clientId,
                code_verifier: codeVerifier
                // redirect_uri might be needed depending on your OAuth implementation
            })
        });
        
        console.log('📡 Token exchange response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token exchange failed:', errorText);
            throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
        }
        
        const tokenData = await response.json();
        console.log('🎯 Access token received (length):', tokenData.access_token?.length || 'undefined');
        
        return tokenData;
        
    } catch (error) {
        console.error('Network error during token exchange:', error.message);
        throw new Error(`Failed to connect to Tokn MVP: ${error.message}`);
    }
}

/**
 * Fetch age verification data using access token - REAL IMPLEMENTATION
 */
async function fetchAgeVerification(accessToken) {
    const toknMvpUrl = process.env.TOKN_MVP_URL || 'https://tokn-backend-505250569367.us-east5.run.app';
    
    console.log('🔍 Fetching age verification from:', `${toknMvpUrl}/api/oauth/verify`);
    
    try {
        const response = await fetch(`${toknMvpUrl}/api/oauth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Age verification response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Age verification failed:', errorText);
            throw new Error(`Age verification failed: ${response.status} - ${errorText}`);
        }
        
        const userData = await response.json();
        console.log('👤 User data received (keys):', Object.keys(userData));
        
        // Extract age flags from your Tokn MVP response format
        const ageFlags = {
            is_16_plus: userData.is_16_plus || false,
            is_18_plus: userData.is_18_plus || false,
            is_21_plus: userData.is_21_plus || false
        };
        
        return {
            ageFlags: ageFlags,
            userId: userData.id,
            verificationStatus: userData.verification_status,
            verifiedAt: userData.verified_at
        };
        
    } catch (error) {
        console.error('Network error during age verification:', error.message);
        throw new Error(`Failed to fetch age verification: ${error.message}`);
    }
}


/**
 * User verification status endpoint
 */
app.get('/api/auth/status', (req, res) => {
    // In production, this would validate the user's session/token
    // and return their current verification status
    
    res.json({
        authenticated: false,
        verified: false,
        ageFlags: {
            is_16_plus: false,
            is_18_plus: false,
            is_21_plus: false
        }
    });
});

/**
 * Logout endpoint
 */
app.post('/api/auth/logout', (req, res) => {
    // In production, this would invalidate the user's session/tokens
    
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * Demo data endpoint for testing
 */
app.get('/api/demo/videos', (req, res) => {
    const videos = [
        {
            id: 1,
            title: 'Family Adventure',
            description: 'A heartwarming family adventure about friendship and courage.',
            duration: '1h 45m',
            rating: 'G',
            minAge: null,
            genre: ['Family', 'Adventure'],
            year: 2024
        },
        {
            id: 2,
            title: 'Teenage Drama Series',
            description: 'Coming-of-age drama with mature themes about relationships and identity.',
            duration: '2h 10m',
            rating: 'PG-13',
            minAge: 16,
            genre: ['Teen Drama', 'Romance'],
            year: 2024
        },
        {
            id: 3,
            title: 'Dark Psychological Thriller',
            description: 'Intense psychological thriller with graphic violence and disturbing themes.',
            duration: '1h 55m',
            rating: 'R',
            minAge: 18,
            genre: ['Psychological', 'Violence'],
            year: 2024
        },
        {
            id: 4,
            title: 'Wine & Spirits Documentary',
            description: 'Educational documentary about wine making and spirits tasting.',
            duration: '45m',
            rating: '21+',
            minAge: 21,
            genre: ['Alcohol', 'Educational'],
            year: 2024
        },
        {
            id: 5,
            title: 'Nature Documentary',
            description: 'Stunning wildlife documentary showcasing the beauty of our planet.',
            duration: '50m',
            rating: 'G',
            minAge: null,
            genre: ['Educational', 'Nature'],
            year: 2024
        },
        {
            id: 6,
            title: 'War Drama Epic',
            description: 'Epic war drama depicting the harsh realities of conflict.',
            duration: '2h 30m',
            rating: 'R',
            minAge: 18,
            genre: ['War', 'Graphic Violence'],
            year: 2024
        }
    ];
    
    res.json(videos);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: 'CORS policy violation',
            message: 'Origin not allowed'
        });
    }
    
    res.status(500).json({
        error: 'Internal server error',
        message: NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'API endpoint not found'
    });
});

// Serve the main application for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
🎬 StreamFlix Demo Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment: ${NODE_ENV}
Port: ${PORT}
URL: http://localhost:${PORT}
API: http://localhost:${PORT}/api
Health: http://localhost:${PORT}/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tokn Client ID: ${process.env.TOKN_CLIENT_ID || 'streamflix-demo-client'}
Tokn API URL: ${process.env.TOKN_API_URL || 'https://api.tokn.co'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;