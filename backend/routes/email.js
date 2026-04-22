// E-Sim By ELECTRON - Email Service Integration
// SendGrid/Resend integration for transactional emails

const express = require('express');

const router = express.Router();

// Initialize email service
let emailService = null;
let sendgrid = null;
let resend = null;

// Try to initialize email provider
try {
    const sgMail = require('@sendgrid/mail');
    if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        sendgrid = sgMail;
        emailService = 'sendgrid';
        console.log('📧 Email service: SendGrid');
    }
} catch (e) {
    console.log('SendGrid not available');
}

try {
    if (process.env.RESEND_API_KEY) {
        const { Resend } = require('resend');
        resend = new Resend(process.env.RESEND_API_KEY);
        emailService = 'resend';
        console.log('📧 Email service: Resend');
    }
} catch (e) {
    console.log('Resend not available');
}

// Default from address
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@esim-electron.com';
const FROM_NAME = process.env.FROM_NAME || 'E-Sim By ELECTRON';

// =====================
// SEND EMAIL
// =====================

router.post('/send', async (req, res) => {
    try {
        const { to, subject, text, html, template, data } = req.body;
        
        if (!to || !subject) {
            return res.status(400).json({ error: 'to and subject are required' });
        }
        
        let message;
        
        // Use template if provided
        if (template) {
            const templateContent = getTemplate(template, data);
            message = {
                to,
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                subject,
                html: templateContent.html,
                text: templateContent.text
            };
        } else {
            message = {
                to,
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                subject,
                text: text || '',
                html: html || text || ''
            };
        }
        
        let result;
        
        if (emailService === 'sendgrid' && sendgrid) {
            result = await sendgrid.send(message);
        } else if (emailService === 'resend' && resend) {
            result = await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to,
                subject,
                html: html || text || '',
                text: text
            });
        } else {
            // Log to console for development
            console.log('📧 [DEV] Email sent:', {
                to: message.to,
                subject: message.subject
            });
            result = { success: true, mode: 'development' };
        }
        
        res.json({
            success: true,
            message: 'Email sent successfully',
            messageId: result?.id || 'dev-mode'
        });
        
    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// =====================
// SEND VERIFICATION EMAIL
// =====================

router.post('/verify-email', async (req, res) => {
    try {
        const { email, name, code } = req.body;
        
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?code=${code}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">⚡ E-Sim By ELECTRON</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2>Vérification de votre adresse email</h2>
                    <p>Bonjour ${name},</p>
                    <p>Merci de votre inscription! Veuillez vérifier votre adresse email en utilisant le code ci-dessous:</p>
                    <div style="background: white; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                        <span style="font-size: 32px; letter-spacing: 10px; font-weight: bold; color: #667eea;">${code}</span>
                    </div>
                    <p>Ou cliquez sur ce lien:</p>
                    <a href="${verificationUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 10px 0;">Vérifier mon email</a>
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">Ce code expire dans 24 heures.</p>
                </div>
                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>© 2026 E-Sim By ELECTRON. Tous droits réservés.</p>
                </div>
            </div>
        `;
        
        const text = `
Vérification de votre adresse email
Bonjour ${name},

Merci de votre inscription! Veuillez vérifier votre adresse email en utilisant le code: ${code}

Ou utilisez ce lien: ${verificationUrl}

Ce code expire dans 24 heures.

© 2026 E-Sim By ELECTRON
        `;
        
        // Send email
        await sendEmail(email, 'Vérifiez votre email - E-Sim', text, html);
        
        res.json({ success: true, message: 'Verification email sent' });
        
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Failed to send verification email' });
    }
});

// =====================
// SEND WELCOME EMAIL
// =====================

router.post('/welcome', async (req, res) => {
    try {
        const { email, name } = req.body;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">⚡ E-Sim By ELECTRON</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2>🎉 Bienvenue ${name}!</h2>
                    <p>Merci d'avoir rejoint E-Sim By ELECTRON!</p>
                    <p>Vous pouvez maintenant:</p>
                    <ul style="line-height: 2;">
                        <li>📱 Acheter des forfaits eSIM pour 150+ pays</li>
                        <li>🌍 Activer votre connexion instantanément</li>
                        <li>💰 Bénéficier de nos offres exclusives</li>
                        <li>🎁 Participer à notre programme de fidélité</li>
                    </ul>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">Commencer maintenant</a>
                </div>
                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>© 2026 E-Sim By ELECTRON. Tous droits réservés.</p>
                </div>
            </div>
        `;
        
        const text = `
Bienvenue ${name}!

Merci d'avoir rejoint E-Sim By ELECTRON!

Vous pouvez maintenant:
- Acheter des forfaits eSIM pour 150+ pays
- Activer votre connexion instantanément
- Bénéficier de nos offres exclusives
- Participer à notre programme de fidélité

Commencer sur: ${process.env.FRONTEND_URL || 'http://localhost:3000'}

© 2026 E-Sim By ELECTRON
        `;
        
        await sendEmail(email, '🎉 Bienvenue chez E-Sim!', text, html);
        
        res.json({ success: true, message: 'Welcome email sent' });
        
    } catch (error) {
        console.error('Welcome email error:', error);
        res.status(500).json({ error: 'Failed to send welcome email' });
    }
});

// =====================
// SEND ORDER CONFIRMATION
// =====================

router.post('/order-confirmation', async (req, res) => {
    try {
        const { email, name, order } = req.body;
        
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.country} ${item.data}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity || 1}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.price}€</td>
            </tr>
        `).join('');
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">⚡ E-Sim By ELECTRON</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2>✅ Commande confirmée!</h2>
                    <p>Bonjour ${name},</p>
                    <p>Merci pour votre commande! Voici le récapitulatif:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background: #667eea; color: white;">
                                <th style="padding: 10px; text-align: left;">Forfait</th>
                                <th style="padding: 10px; text-align: center;">Qté</th>
                                <th style="padding: 10px; text-align: right;">Prix</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                                <td style="padding: 10px; text-align: right; font-weight: bold; color: #667eea;">${order.total}€</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <p style="margin-top: 20px;">Numéro de commande: <strong>${order.id}</strong></p>
                    <p>Vos codes eSIM seront envoyés dès validation du paiement.</p>
                </div>
                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>© 2026 E-Sim By ELECTRON</p>
                </div>
            </div>
        `;
        
        const text = `
Commande confirmée - ${order.id}

Bonjour ${name},

Merci pour votre commande!

Forfaits:
${order.items.map(item => `- ${item.country} ${item.data}: ${item.price}€`).join('\n')}

Total: ${order.total}€

Numéro de commande: ${order.id}

© 2026 E-Sim By ELECTRON
        `;
        
        await sendEmail(email, `✅ Commande ${order.id} confirmée - E-Sim`, text, html);
        
        res.json({ success: true, message: 'Order confirmation sent' });
        
    } catch (error) {
        console.error('Order confirmation error:', error);
        res.status(500).json({ error: 'Failed to send order confirmation' });
    }
});

// =====================
// SEND PASSWORD RESET
// =====================

router.post('/password-reset', async (req, res) => {
    try {
        const { email, name, resetToken } = req.body;
        
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">⚡ E-Sim By ELECTRON</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2>🔐 Réinitialisation du mot de passe</h2>
                    <p>Bonjour ${name},</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                    <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe:</p>
                    <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">Réinitialiser mon mot de passe</a>
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                </div>
                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>© 2026 E-Sim By ELECTRON</p>
                </div>
            </div>
        `;
        
        const text = `
Réinitialisation du mot de passe

Bonjour ${name},

Vous avez demandé la réinitialisation de votre mot de passe.

Utilisez ce lien: ${resetUrl}

Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

© 2026 E-Sim By ELECTRON
        `;
        
        await sendEmail(email, '🔐 Réinitialisation mot de passe - E-Sim', text, html);
        
        res.json({ success: true, message: 'Password reset email sent' });
        
    } catch (error) {
        console.error('Password reset email error:', error);
        res.status(500).json({ error: 'Failed to send password reset email' });
    }
});

// =====================
// SEND ESIM ACTIVATION
// =====================

router.post('/esim-activation', async (req, res) => {
    try {
        const { email, name, esim } = req.body;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">⚡ E-Sim By ELECTRON</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2>📱 Votre eSIM est prêt!</h2>
                    <p>Bonjour ${name},</p>
                    <p>Votre eSIM pour <strong>${esim.country}</strong> est maintenant actif!</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <p><strong>ICCID:</strong> ${esim.iccid}</p>
                        <p><strong>Data:</strong> ${esim.dataTotal / 1024}GB</p>
                        <p><strong>Expire:</strong> ${new Date(esim.expiresAt).toLocaleDateString()}</p>
                    </div>
                    
                    <h3>Comment installer votre eSIM:</h3>
                    <ol style="text-align: left; line-height: 2;">
                        <li>Allez dans <strong>Réglages > Données mobiles</strong></li>
                        <li>Cliquez sur <strong>Ajouter un forfait</strong></li>
                        <li>Scannez le QR code ci-dessous</li>
                    </ol>
                    
                    ${esim.qrCode ? `<img src="${esim.qrCode}" alt="QR Code" style="max-width: 200px; margin: 20px auto; display: block;">` : ''}
                    
                    <p>Bon voyage avec E-Sim! 🌍✈️</p>
                </div>
                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>© 2026 E-Sim By ELECTRON</p>
                </div>
            </div>
        `;
        
        const text = `
Votre eSIM ${esim.country} est prêt!

ICCID: ${esim.iccid}
Data: ${esim.dataTotal / 1024}GB
Expire: ${new Date(esim.expiresAt).toLocaleDateString()}

Comment installer:
1. Allez dans Réglages > Données mobiles
2. Cliquez sur Ajouter un forfait
3. Scannez votre QR code

Bon voyage avec E-Sim!

© 2026 E-Sim By ELECTRON
        `;
        
        await sendEmail(email, `📱 eSIM ${esim.country} activé - E-Sim`, text, html);
        
        res.json({ success: true, message: 'eSIM activation email sent' });
        
    } catch (error) {
        console.error('eSIM activation email error:', error);
        res.status(500).json({ error: 'Failed to send eSIM activation email' });
    }
});

// =====================
// HELPER FUNCTIONS
// =====================

async function sendEmail(to, subject, text, html) {
    const message = {
        to,
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        subject,
        text,
        html
    };
    
    if (emailService === 'sendgrid' && sendgrid) {
        return await sendgrid.send(message);
    } else if (emailService === 'resend' && resend) {
        return await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to,
            subject,
            html,
            text
        });
    } else {
        console.log('📧 [DEV] Email:', { to, subject });
        return { success: true };
    }
}

function getTemplate(template, data) {
    const templates = {
        // Add custom templates here
    };
    
    return templates[template] || { html: data?.html || '', text: data?.text || '' };
}

module.exports = router;