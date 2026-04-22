// E-Sim By ELECTRON - AI/LLM Integration
// OpenAI GPT-4 integration for AI agents

const express = require('express');
const { users, orders, esims, products } = require('../models/database');

const router = express.Router();

// Initialize OpenAI (use API key from environment)
let openai = null;
try {
    const { OpenAI } = require('openai');
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'sk-demo-key'
    });
} catch (e) {
    console.log('OpenAI not available, using fallback responses');
}

// =====================
// CHAT COMPLETION
// =====================

// Chat with AI
router.post('/chat', async (req, res) => {
    try {
        const { message, userId, context } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Build context from user data
        let systemContext = await buildSystemContext(userId);
        
        // If context provided, merge it
        if (context) {
            systemContext += '\n\n' + context;
        }
        
        let response;
        
        if (openai) {
            // Use real OpenAI API
            const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: systemContext },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });
            
            response = {
                success: true,
                message: completion.choices[0].message.content,
                model: 'gpt-4',
                usage: completion.usage
            };
        } else {
            // Fallback to rule-based responses
            response = await getFallbackResponse(message, userId);
        }
        
        res.json(response);
        
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Chat failed' });
    }
});

// =====================
// STREAMING CHAT
// =====================

router.post('/chat/stream', async (req, res) => {
    try {
        const { message, userId } = req.body;
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const systemContext = await buildSystemContext(userId);
        
        if (openai) {
            const stream = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: systemContext },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                stream: true
            });
            
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
            }
        } else {
            // Fallback streaming
            const response = await getFallbackResponse(message, userId);
            const words = response.message.split(' ');
            
            for (const word of words) {
                res.write(`data: ${JSON.stringify({ content: word + ' ' })}\n\n`);
                await new Promise(r => setTimeout(r, 50));
            }
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
        
    } catch (error) {
        console.error('Stream error:', error);
        res.status(500).json({ error: 'Stream failed' });
    }
});

// =====================
// ANALYZE USER INTENT
// =====================

router.post('/analyze-intent', async (req, res) => {
    try {
        const { message } = req.body;
        
        const prompt = `Analyze the following user message and determine their intent. 
Return a JSON object with:
- intent: (purchase, support, inquiry, cancellation, billing, technical, general)
- entities: (extracted relevant info like country, product, order ID)
- sentiment: (positive, neutral, negative)
- suggested_action: (what the system should do)

Message: "${message}"

Respond only with valid JSON.`;

        let analysis;
        
        if (openai) {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3
            });
            
            analysis = JSON.parse(completion.choices[0].message.content);
        } else {
            analysis = ruleBasedIntentAnalysis(message);
        }
        
        res.json(analysis);
        
    } catch (error) {
        console.error('Intent analysis error:', error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

// =====================
// GENERATE CONTENT
// =====================

router.post('/generate-content', async (req, res) => {
    try {
        const { type, topic, platform, tone } = req.body;
        
        const prompts = {
            social: `Generate a social media post about "${topic}" for ${platform || 'Twitter'}. 
Tone: ${tone || 'professional'}. 
Include relevant hashtags. Keep it under 280 characters for Twitter.`,
            
            blog: `Write a blog post introduction about "${topic}". 
Tone: ${tone || 'professional'}.
Make it engaging and informative.`,
            
            email: `Write a promotional email about "${topic}".
Tone: ${tone || 'friendly'}.
Include a clear call-to-action.`,
            
            ad: `Create a short advertisement for "${topic}".
Tone: ${tone || 'persuasive'}.
Make it compelling and memorable.`
        };
        
        let content;
        
        if (openai) {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [{ 
                    role: 'user', 
                    content: prompts[type] || prompts.social 
                }],
                temperature: 0.8
            });
            
            content = completion.choices[0].message.content;
        } else {
            content = generateFallbackContent(type, topic);
        }
        
        res.json({
            success: true,
            content,
            type,
            topic
        });
        
    } catch (error) {
        console.error('Content generation error:', error);
        res.status(500).json({ error: 'Content generation failed' });
    }
});

// =====================
// SUMMARIZE DATA
// =====================

router.post('/summarize', async (req, res) => {
    try {
        const { data, type } = req.body;
        
        const prompt = `Summarize the following ${type || 'data'} in a clear, concise way.
Focus on key insights and actionable information:

${JSON.stringify(data, null, 2)}`;

        let summary;
        
        if (openai) {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5
            });
            
            summary = completion.choices[0].message.content;
        } else {
            summary = summarizeFallback(data);
        }
        
        res.json({
            success: true,
            summary
        });
        
    } catch (error) {
        console.error('Summary error:', error);
        res.status(500).json({ error: 'Summary failed' });
    }
});

// =====================
// HELPER FUNCTIONS
// =====================

async function buildSystemContext(userId) {
    let context = `You are E-Sim by ELECTRON, a helpful AI assistant for a global eSIM connectivity platform. 
You help customers with:
- Finding and purchasing eSIM plans
- Technical support and activation issues
- Billing inquiries
- Order status and management
- General questions about international data roaming

Always be helpful, polite, and concise.`;

    if (userId) {
        const user = users.get(userId);
        
        if (user) {
            context += `\n\nCurrent user: ${user.name} (${user.email})`;
            
            // Get user's recent orders
            const userOrders = Array.from(orders.values())
                .filter(o => o.userId === userId)
                .slice(-3);
            
            if (userOrders.length > 0) {
                context += `\n\nRecent orders: ${userOrders.length} orders`;
            }
            
            // Get user's eSIMs
            const userEsims = Array.from(esims.values())
                .filter(e => e.userId === userId);
            
            if (userEsims.length > 0) {
                context += `\nActive eSIMs: ${userEsims.length}`;
            }
        }
    }
    
    // Add product info
    context += `\n\nAvailable countries: ${products.map(p => p.country).join(', ')}`;
    context += `\nPricing range: ${Math.min(...products.map(p => p.price))}€ - ${Math.max(...products.map(p => p.price))}€`;
    
    return context;
}

async function getFallbackResponse(message, userId) {
    const lower = message.toLowerCase();
    
    // Order-related
    if (/commande|order|acheter|achat/.test(lower)) {
        return {
            success: true,
            message: "Pour passer une commande, consultez nos forfaits disponibles sur la page d'accueil. Cliquez sur le pays de votre choix, sélectionnez un forfait, et finalisez votre achat!",
            intent: 'purchase'
        };
    }
    
    // Support
    if (/problème|aide|help|support|issue/.test(lower)) {
        return {
            success: true,
            message: "Je suis là pour vous aider! Décrivez votre problème et je ferai de mon mieux pour vous assister. Pour les problèmes techniques, vous pouvez aussi contacter notre support à support@esim-electron.com",
            intent: 'support'
        };
    }
    
    // Activation
    if (/activ|installer|qr|setup/.test(lower)) {
        return {
            success: true,
            message: "Pour activer votre eSIM:\n1. Allez dans Réglages > Données mobiles\n2. Cliquez 'Ajouter un forfait'\n3. Scannez le QR code fourni\n4. Suivez les instructions à l'écran",
            intent: 'technical'
        };
    }
    
    // Countries
    if (/pays|destination| country|où/.test(lower)) {
        const countries = products.map(p => p.country).join(', ');
        return {
            success: true,
            message: `Nous couvrons plus de 150 pays! Voici quelques destinations populaires: ${countries}. Laquelle vous intéresse?`,
            intent: 'inquiry'
        };
    }
    
    // Pricing
    if (/prix|price|cout|cost/.test(lower)) {
        return {
            success: true,
            message: "Nos forfaits commencent à partir de 12€ pour 5GB. Les prix varient selon la destination et la durée. Consultez notre page d'accueil pour voir tous les forfaits!",
            intent: 'inquiry'
        };
    }
    
    // Default
    return {
        success: true,
        message: "Je suis votre assistant E-Sim! Je peux vous aider à:\n- Trouver le forfait idéal pour votre voyage\n- Résoudre les problèmes techniques\n- Suivre vos commandes\n- Répondre à vos questions\n\nComment puis-je vous aider?",
        intent: 'general'
    };
}

function ruleBasedIntentAnalysis(message) {
    const lower = message.toLowerCase();
    
    let intent = 'general';
    if (/achet|commande|payer|buy/.test(lower)) intent = 'purchase';
    else if (/problème|aide|support/.test(lower)) intent = 'support';
    else if (/annul|rembours|refund/.test(lower)) intent = 'cancellation';
    else if (/prix|bill|payment/.test(lower)) intent = 'billing';
    else if (/activ|qr|réseau/.test(lower)) intent = 'technical';
    
    let sentiment = 'neutral';
    if (/merci|great|excellent|awesome/.test(lower)) sentiment = 'positive';
    if (/pas|jamais|terrible|horrible/.test(lower)) sentiment = 'negative';
    
    return { intent, entities: {}, sentiment, suggested_action: 'respond' };
}

function generateFallbackContent(type, topic) {
    const templates = {
        social: `🌍 Découvrez ${topic} avec E-Sim! \n\nConnectez-vous où que vous soyez dans le monde. \n\n#eSIM #Voyage #Connectivité`,
        blog: `Tout ce que vous devez savoir sur ${topic}\n\nDans cet article, nous allons explorer en détail ce sujet passionnant...`,
        email: `Bonjour,\n\nDécouvrez comment ${topic} peut transformer votre expérience de voyage!\n\nCliquez ici pour en savoir plus.\n\nL'équipe E-Sim`,
        ad: `🚀 ${topic}\n\nLa solution ultime pour rester connecté!\n\nEssayez maintenant!`
    };
    
    return templates[type] || templates.social;
}

function summarizeFallback(data) {
    if (Array.isArray(data)) {
        return `Résumé: ${data.length} éléments.`;
    }
    if (typeof data === 'object') {
        const keys = Object.keys(data).slice(0, 5).join(', ');
        return `Résumé: Propriétés disponibles - ${keys}.`;
    }
    return 'Données analysées.';
}

// =====================
// IMAGE GENERATION (DALL-E)
// =====================

router.post('/generate-image', async (req, res) => {
    try {
        const { prompt, size = '1024x1024' } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        
        let imageUrl;
        
        if (openai) {
            const image = await openai.images.generate({
                prompt,
                size,
                n: 1
            });
            
            imageUrl = image.data[0].url;
        } else {
            // Return placeholder
            imageUrl = 'https://via.placeholder.com/1024x1024?text=Image+Generation+Requires+OpenAI';
        }
        
        res.json({
            success: true,
            imageUrl,
            prompt
        });
        
    } catch (error) {
        console.error('Image generation error:', error);
        res.status(500).json({ error: 'Image generation failed' });
    }
});

module.exports = router;