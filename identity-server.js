const express = require('express');
const axios = require('axios');
const morgan = require('morgan');
const app = express();
const port = 3001;

// Constants for URLs
const MAIN_SERVER_URL = 'http://localhost:3000';

// Mock user data for demonstration
const users = {
    'user@example.com': 'password123'
};

// Mock storage for access tokens, UUIDs, and redirect URLs
const accessTokens = {};
const uuidStore = {};
const redirectUrls = {};

// Middleware to parse JSON bodies
app.use(express.json());

// Morgan middleware for HTTP request logging
app.use(morgan('combined'));

// Identity endpoint for login and redirection
app.post('/identity', async (req, res) => {
    const { username, password, next } = req.query;

    // Log login attempt
    console.log(`[INFO] Login attempt: ${username} from URL ${next}`);

    // Validate credentials
    if (users[username] === password) {
        // Generate a mock UUID (in real scenarios use UUID library or token generator)
        const uuid = `uuid-${Date.now()}`;
        uuidStore[username] = uuid;

        // Generate a mock access token (in real scenarios use a secure token generator)
        const accessToken = `token-${Date.now()}`;
        accessTokens[uuid] = accessToken;

        // Store the redirect URL
        redirectUrls[uuid] = next;

        // Respond to the client
        console.log(`[INFO] Successful login for user ${username}. sso-id=${uuid}`);
        res.status(200).json({
            message: 'Logged in successfully.',
            user: {
                uuid
            }
        });
    } else {
        // Log failed login attempt
        console.warn(`[WARN] Unauthorized login attempt for username ${username}`);
        res.status(401).json({
            message: 'Unauthorized',
            error: 'Invalid username or password'
        });
    }
});

// Endpoint to check SSO status
app.get('/sso-status', (req, res) => {
    const { 'sso-id': ssoId } = req.query;

    if (ssoId && accessTokens[ssoId]) {
        // Log and respond with success if the SSO ID is found
        console.log(`[INFO] SSO status check for sso-id=${ssoId} - Status: Logged in`);
        res.status(200).json({
            status: 'success',
            message: 'User is logged in.',
            ssoId,
            token: accessTokens[ssoId]
        });
    } else {
        // Log and respond with failure if the SSO ID is not found
        console.warn(`[WARN] SSO status check failed for sso-id=${ssoId} - User not logged in`);
        res.status(401).json({
            status: 'error',
            message: 'User is not logged in.',
            data: null
        });
    }
});

// Endpoint to get access token
app.get('/access-token', (req, res) => {
    const { 'sso-id': ssoId } = req.query;
    if (accessTokens[ssoId]) {
        console.log(`[INFO] Access token request for sso-id=${ssoId}`);
        return res.json({
            ssoId,
            accessToken: accessTokens[ssoId]
        });
    }
    console.warn(`[WARN] Access token request failed for sso-id=${ssoId} - Token not found`);
    res.status(404).json({
        message: 'Access token not found',
        error: 'Invalid sso-id or expired token'
    });
});

// Logout endpoint
app.get('/logout', async (req, res) => {
    const { 'sso': ssoId } = req.query;
    if (ssoId) {
        if (accessTokens[ssoId]) {

            // Invalidate the access token
            console.log(`[INFO] Logging out from identity server sso-id=${ssoId}`);
            delete accessTokens[ssoId];

            // Find and call the redirect URL's logout endpoint
            const redirectUrl = redirectUrls[ssoId];
            if (redirectUrl) {
                try {
                    await axios.get(`${redirectUrl}?sso-id=${encodeURIComponent(ssoId)}`);
                    console.log(`[INFO] Logout request sent to ${redirectUrl} for sso-id=${ssoId}`);
                } catch (error) {
                    console.error(`[ERROR] Failed to call logout on ${redirectUrl} for sso-id=${ssoId}`, error.message);
                }
            }

            // Clean up the UUID storage
            delete uuidStore[Object.keys(uuidStore).find(key => uuidStore[key] === ssoId)];
            delete redirectUrls[ssoId];

            return res.send('Logged out.');
        } else {
            console.warn(`[WARN] Logout failed for sso-id=${ssoId} - Invalid request`);
            return res.status(400).send('Invalid request.');
        }
    }
    res.status(400).send('Invalid request.');
});

app.listen(port, () => {
    console.log(`Identity server running at http://localhost:${port}`);
});
