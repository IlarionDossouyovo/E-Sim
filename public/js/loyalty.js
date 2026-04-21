// E-Sim By ELECTRON - Loyalty & Rewards System

const LoyaltySystem = {
    // Points configuration
    config: {
        pointsPerEuro: 10,
        pointsToEurorate: 0.01, // 100 points = 1€
        
        tiers: [
            { name: 'Bronze', minPoints: 0, maxPoints: 499, cashback: 5 },
            { name: 'Argent', minPoints: 500, maxPoints: 1999, cashback: 10 },
            { name: 'Or', minPoints: 2000, maxPoints: 999999, cashback: 15 }
        ],
        
        referralBonus: {
            referrer: 500, // points = 5€
            referee: 500  // points = 5€
        }
    },

    // Calculate points for purchase
    calculatePoints(amount) {
        return Math.floor(amount * this.config.pointsPerEuro);
    },

    // Get current tier
    getTier(totalPoints) {
        for (let i = this.config.tiers.length - 1; i >= 0; i--) {
            if (totalPoints >= this.config.tiers[i].minPoints) {
                return this.config.tiers[i];
            }
        }
        return this.config.tiers[0];
    },

    // Calculate cashback for amount
    calculateCashback(totalPoints, amount) {
        const tier = this.getTier(totalPoints);
        const points = this.calculatePoints(amount);
        const cashbackPercent = tier.cashback;
        const cashbackValue = (points * this.config.pointsToEurorate * cashbackPercent) / 100;
        return {
            points,
            tier,
            cashbackPercent,
            cashbackValue: cashbackValue.toFixed(2)
        };
    },

    // Process referral
    processReferral(referrerId, refereeId) {
        // Add bonus to referrer
        // Add discount to referee
        return {
            referrerPoints: this.config.referralBonus.referrer,
            refereeDiscount: this.config.referralBonus.referee * this.config.pointsToEurorate
        };
    },

    // Check tier upgrade
    checkTierUpgrade(oldPoints, newPoints) {
        const oldTier = this.getTier(oldPoints);
        const newTier = this.getTier(newPoints);
        
        return {
            upgraded: newTier.name !== oldTier.name,
            previousTier: oldTier,
            newTier: newTier,
            message: newTier.name !== oldTier.name 
                ? `🎉 Bienvenue au niveau ${newTier.name}! Cashback ${newTier.cashback}%`
                : null
        };
    }
};

// Auto-Topup System
const AutoTopupSystem = {
    config: {
        enabled: false,
        threshold: 500, // MB
        topupAmount: '1GB',
        maxTopupsPerMonth: 3,
        currentTopups: 0
    },

    // Check if auto-topup should trigger
    shouldTrigger(dataRemainingMB) {
        return this.config.enabled && 
               dataRemainingMB <= this.config.threshold && 
               this.config.currentTopups < this.config.maxTopupsPerMonth;
    },

    // Trigger auto-topup
    async trigger(dataRemainingMB) {
        if (!this.shouldTrigger(dataRemainingMB)) {
            return { triggered: false, reason: 'Conditions non remplies' };
        }

        this.config.currentTopups++;
        
        return {
            triggered: true,
            amount: this.config.topupAmount,
            topupCount: this.config.currentTopups,
            remainingTopups: this.config.maxTopupsPerMonth - this.config.currentTopups,
            message: `🔄 Auto-recharge ${this.config.topupAmount} effectuée!`
        };
    },

    // Reset monthly counters
    resetMonthlyCounters() {
        this.config.currentTopups = 0;
    }
};

// Data Rollover System
const DataRolloverSystem = {
    config: {
        enabled: false,
        maxRolloverPercent: 100, // 100% rollover allowed
        rolloverExpiryDays: 30
    },

    // Calculate rollover amount
    calculateRollover(unusedDataGB, nextPlanGB) {
        if (!this.config.enabled) {
            return { enabled: false };
        }

        const maxRollover = nextPlanGB * (this.config.maxRolloverPercent / 100);
        const rolloverAmount = Math.min(unusedDataGB, maxRollover);
        
        return {
            enabled: true,
            unusedData: unusedDataGB,
            rolloverAmount: rolloverAmount.toFixed(1),
            newTotal: (unusedDataGB + nextPlanGB).toFixed(1),
            expiresIn: this.config.rolloverExpiryDays
        };
    }
};

// Notification System
const NotificationSystem = {
    config: {
        email: true,
        push: true,
        inApp: true
    },

    templates: {
        lowData: {
            threshold: 1, // GB
            title: '📊 Data presque épuisée',
            body: 'Il vous reste {remaining}GB sur {total}. Temps restant: {days} jours',
            action: 'Recharger maintenant'
        },
        
        expiryWarning: {
            days: [3, 1],
            title: '⏰ Forfait expire bientôt',
            body: 'Votre forfait {country} expire dans {days} jours',
            action: 'Renouveler'
        },
        
        topupAuto: {
            title: '🔄 Auto-recharge',
            body: '{amount} ajouté automatiquement',
            action: 'Voir les détails'
        },
        
        welcome: {
            title: '🎉 Bienvenue!',
            body: 'Votre eSIM {country} est active. Profitez de votre voyage!',
            action: 'Installer maintenant'
        }
    },

    // Send notification
    async send(notificationType, data) {
        const template = this.templates[notificationType];
        
        if (!template) {
            return { sent: false, reason: 'Template non trouvé' };
        }

        const message = {
            title: template.title,
            body: template.body.replace(/{(\w+)}/g, (_, key) => data[key] || ''),
            action: template.action
        };

        // In production, send via email, push, in-app
        console.log('Notification:', message);
        
        return { sent: true, message };
    }
};

// VPN Service (included)
const VPNService = {
    config: {
        enabled: true,
        servers: 50,
        locations: [
            'France', 'UK', 'USA', 'Allemagne', 'Espagne', 
            'Japon', 'Australie', 'Canada', 'Brésil', 'Singapour'
        ],
        protocol: 'WireGuard',
        encryption: 'AES-256'
    },

    // Get VPN config for eSIM
    getConfig(userId, esimId) {
        return {
            server: `${esimId}.vpn.esim-electron.com`,
            port: 51820,
            protocol: this.config.protocol,
            publicKey: 'generated-key-for-' + userId,
            allowedIPs: '0.0.0.0/0',
            dns: ['1.1.1.1', '8.8.8.8']
        };
    },

    // Check if VPN is included
    isIncluded(planType) {
        return ['premium', 'unlimited'].includes(planType);
    }
};

// Virtual Number Service
const VirtualNumberService = {
    config: {
        enabled: false,
        availableCountries: ['USA', 'UK', 'France', 'Germany'],
        pricePerMonth: 5
    },

    // Get available numbers
    async getAvailableNumbers(country, count = 3) {
        // In production, fetch from provider
        return [
            { number: `+1-555-${Math.random().toString().slice(2,10)}`, country: 'USA' },
            { number: `+44-79${Math.random().toString().slice(2,9)}`, country: 'UK' },
            { number: `+33-6${Math.random().toString().slice(2,9)}`, country: 'France' }
        ];
    },

    // Activate number
    async activate(userId, number, duration = 30) {
        return {
            id: 'vn-' + Math.random().toString().slice(2, 10),
            number,
            expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
            price: this.config.pricePerMonth * duration
        };
    }
};

// Export for use
window.loyaltySystem = LoyaltySystem;
window.autoTopupSystem = AutoTopupSystem;
window.dataRolloverSystem = DataRolloverSystem;
window.notificationSystem = NotificationSystem;
window.vpnService = VPNService;
window.virtualNumberService = VirtualNumberService;