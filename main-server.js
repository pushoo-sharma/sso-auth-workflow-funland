const express = require('express');
const axios = require('axios');
const morgan = require('morgan');
const app = express();
const port = 3000;

// Constants for redirect URLs
const IDENTITY_SERVER_URL = 'http://localhost:3001/identity';
const SSO_STATUS_URL = 'http://localhost:3001/sso-status';
const LOGOUT_URL = 'http://localhost:3001/logout';

// Mock storage for redirect URLs
const redirectUrls = {};

// Middleware to parse JSON bodies
app.use(express.json());

// Morgan middleware for HTTP request logging
app.use(morgan('combined'));

// Login endpoint to handle redirection
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const currentUrl = 'http://localhost:3000'; // Ensure this is the correct URL for redirection
    
    redirectUrls[username] = currentUrl;

    const redirectUrl = `${IDENTITY_SERVER_URL}?next=${encodeURIComponent(currentUrl)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

    // Log login attempt
    console.log(`[INFO] Login attempt: ${username} from Redirect URL ${redirectUrl}`);
    
    try {
        const response = await axios.post(redirectUrl);
        const { uuid } = response.data.user;

        // Log successful redirection
        console.log(`[INFO] Redirected to Identity Server for ${username}`);
        
        // Include the access token in the response
        res.status(200).json({
            message: 'Login attempt sucessful.',
            ssoId: uuid
        });
    } catch (error) {
        // Log redirection error
        console.error(`[ERROR] Failed to redirect to Identity Server for ${username} - Error: ${error.message}`);
        res.status(500).send('Internal Server Error during redirection.');
    }
});

// Endpoint to check SSO status
app.get('/sso-status', async (req, res) => {
    const { 'sso-id': ssoId } = req.query;
    if (ssoId) {
        try {
            const response = await axios.get(`${SSO_STATUS_URL}?sso-id=${encodeURIComponent(ssoId)}`);
            // Log SSO status check
            console.log(`[INFO] SSO status check for ID: ${ssoId} - Status: ${response.status}`);
            return res.send(response.data);
        } catch (error) {
            // Log SSO status check error
            console.error(`[ERROR] SSO status check failed for ID: ${ssoId} - Error: ${error.message}`);
            return res.status(401).send('User is not logged in.');
        }
    }
    res.status(400).send('Invalid request.');
});

// Logout endpoint
app.get('/logout', async (req, res) => {
    const { 'sso-id': ssoId, username } = req.query;
    if (ssoId && username) {
        const redirectUrl = redirectUrls[username];
        if (redirectUrl) {
            try {
                await axios.get(`${LOGOUT_URL}?sso-id=${encodeURIComponent(ssoId)}`);
                // Clear the stored URL
                delete redirectUrls[username];
                // Log successful logout
                console.log(`[INFO] User ${username} logged out successfully. Redirecting to ${redirectUrl}`);
                return res.redirect(redirectUrl); // Redirect to the original URL after logout
            } catch (error) {
                // Log logout error
                console.error(`[ERROR] Logout failed for user ${username} - Error: ${error.message}`);
                return res.status(400).send('Invalid request.');
            }
        }
        res.status(400).send('No stored redirect URL found.');
    }
    res.status(400).send('Invalid request.');
});

// Test API endpoint
app.get('/test-api', async (req, res) => {
    const { 'sso-id': ssoId } = req.query;
    if (ssoId) {
        try {
            const ssoResponse = await axios.get(`${SSO_STATUS_URL}?sso-id=${encodeURIComponent(ssoId)}`);
            if (ssoResponse.status === 200) {
                // Token retrived successful
                const { token }= ssoResponse.data;
                // Log successful API access
                console.log(`[INFO] Access granted to test API for Token ID: ${token}`);
                return res.json({ message: 'You have access to the test API!', token});
            }
        } catch (error) {
            // Log API access error
            console.error(`[ERROR] Unauthorized access attempt for SSO ID: ${ssoId} - Error: ${error.message}`);
            return res.status(401).send('Unauthorized. Access to the test API denied.');
        }
    }
    res.status(400).send('Invalid request.');
});

app.listen(port, () => {
    console.log(`Main server running at http://localhost:${port}`);
});
