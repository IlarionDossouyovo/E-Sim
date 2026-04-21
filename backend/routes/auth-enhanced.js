// E-Sim By ELECTRON - Enhanced Authentication
// Features: Registration, Login, Email Verification, Password Reset, 2FA

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { users, orders, esims } = require('../models/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'esim-secret-key-2026';

// Utility functions
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// =====================
// REGISTRATION
// =====================

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        // Check if user exists
        const existingUser = Array.from(users.values()).find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Generate verification token
        const emailToken = generateToken();
        const verificationCode = generateVerificationCode();
        
        // Create user
        const userId = 'user-' + Date.now();
        const user = {
            id: userId,
            name,
            email,
            password: hashedPassword,
            role: 'USER',
            emailVerified: false,
            emailToken,
            verificationCode,
            emailTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        users.set(userId, user);
        
        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // In production, send verification email here
        console.log(`📧 Verification code for ${email}: ${verificationCode}`);
        
        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: false
            },
            requiresVerification: true
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// =====================
// EMAIL VERIFICATION
// =====================

router.post('/verify-email', async (req, res) => {
    try {
        const { code, token } = req.body;
        
        // Find user by verification token
        const user = Array.from(users.values()).find(u => u.emailToken === token);
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }
        
        // Check if already verified
        if (user.emailVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }
        
        // Verify code
        if (user.verificationCode !== code) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }
        
        // Update user
        user.emailVerified = true;
        user.emailToken = null;
        user.verificationCode = null;
        user.emailTokenExpiry = null;
        users.set(user.id, user);
        
        res.json({ message: 'Email verified successfully' });
        
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// =====================
// LOGIN
// =====================

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = Array.from(users.values()).find(u => u.email === email);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            // Return partial auth, require 2FA
            return res.json({
                requiresTwoFactor: true,
                userId: user.id,
                message: 'Please enter your 2FA code'
            });
        }
        
        // Generate session token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// =====================
// TWO-FACTOR AUTHENTICATION
// =====================

// Enable 2FA
router.post('/2fa/enable', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.get(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Generate 2FA secret (in production, use speakeasy or similar)
        const twoFactorSecret = crypto.randomBytes(20).toString('hex');
        
        // Store secret temporarily (user must verify to confirm)
        user.pendingTwoFactorSecret = twoFactorSecret;
        users.set(user.id, user);
        
        // In production, generate QR code for authenticator app
        res.json({
            message: '2FA enabled - verify to confirm',
            secret: twoFactorSecret,
            // In production: generate QR code URL
            qrCodeUrl: `otpauth://totp/E-Sim:${user.email}?secret=${twoFactorSecret}&issuer=E-Sim`
        });
        
    } catch (error) {
        console.error('2FA enable error:', error);
        res.status(500).json({ error: 'Failed to enable 2FA' });
    }
});

// Verify and confirm 2FA
router.post('/2fa/verify', async (req, res) => {
    try {
        const { code, secret } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.get(decoded.userId);
        
        if (!user || user.pendingTwoFactorSecret !== secret) {
            return res.status(400).json({ error: 'Invalid 2FA setup' });
        }
        
        // In production, verify code using speakeasy or similar
        // For demo, accept any 6-digit code
        if (code.length !== 6 || !/^\d+$/.test(code)) {
            return res.status(400).json({ error: 'Invalid code format' });
        }
        
        // Enable 2FA
        user.twoFactorEnabled = true;
        user.twoFactorSecret = secret;
        user.pendingTwoFactorSecret = null;
        users.set(user.id, user);
        
        res.json({ message: '2FA enabled successfully' });
        
    } catch (error) {
        console.error('2FA verify error:', error);
        res.status(500).json({ error: 'Failed to verify 2FA' });
    }
});

// Login with 2FA
router.post('/2fa/login', async (req, res) => {
    try {
        const { userId, code } = req.body;
        
        const user = users.get(userId);
        
        if (!user || !user.twoFactorEnabled) {
            return res.status(400).json({ error: 'Invalid request' });
        }
        
        // In production, verify code using speakeasy
        // For demo, accept any 6-digit code
        if (code.length !== 6 || !/^\d+$/.test(code)) {
            return res.status(401).json({ error: 'Invalid 2FA code' });
        }
        
        // Generate full JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified
            }
        });
        
    } catch (error) {
        console.error('2FA login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Disable 2FA
router.post('/2fa/disable', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.get(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        users.set(user.id, user);
        
        res.json({ message: '2FA disabled successfully' });
        
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ error: 'Failed to disable 2FA' });
    }
});

// =====================
// PASSWORD RESET
// =====================

// Request password reset
router.post('/password/reset-request', async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = Array.from(users.values()).find(u => u.email === email);
        
        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({ message: 'If the email exists, a reset link will be sent' });
        }
        
        // Generate reset token
        const resetToken = generateToken();
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        user.passwordResetToken = resetToken;
        user.passwordResetExpiry = resetExpiry;
        users.set(user.id, user);
        
        // In production, send reset email
        console.log(`🔑 Password reset for ${email}: ${resetToken}`);
        
        res.json({ message: 'If the email exists, a reset link will be sent' });
        
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Request failed' });
    }
});

// Reset password with token
router.post('/password/reset', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password required' });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        // Find user by reset token
        const user = Array.from(users.values()).find(u => u.passwordResetToken === token);
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid reset token' });
        }
        
        // Check expiry
        if (new Date() > user.passwordResetExpiry) {
            return res.status(400).json({ error: 'Reset token expired' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Update password
        user.password = hashedPassword;
        user.passwordResetToken = null;
        user.passwordResetExpiry = null;
        users.set(user.id, user);
        
        res.json({ message: 'Password reset successful' });
        
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Reset failed' });
    }
});

// =====================
// CHANGE PASSWORD (logged in)
// =====================

router.post('/password/change', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.get(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const { currentPassword, newPassword } = req.body;
        
        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        user.password = hashedPassword;
        users.set(user.id, user);
        
        res.json({ message: 'Password changed successfully' });
        
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Password change failed' });
    }
});

// =====================
// GET CURRENT USER
// =====================

router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.get(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
                twoFactorEnabled: user.twoFactorEnabled,
                createdAt: user.createdAt
            }
        });
        
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// =====================
// LOGOUT
// =====================

router.post('/logout', (req, res) => {
    // In production, invalidate token in Redis/database
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;