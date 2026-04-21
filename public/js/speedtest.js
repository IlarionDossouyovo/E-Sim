// E-Sim By ELECTRON - Speed Test & Real-time Monitoring

const SpeedTest = {
    // Test download speed
    async testDownload() {
        const testSizes = [100, 500, 1000]; // KB
        const results = [];
        
        for (const size of testSizes) {
            const start = performance.now();
            
            // Simulate download test (in production, use real CDN)
            await fetch(`/api/speed-test?size=${size}&r=${Math.random()}`, {
                cache: 'no-store'
            });
            
            const duration = performance.now() - start;
            const speedMbps = (size * 8) / (duration / 1000) / 1000;
            results.push(speedMbps);
        }
        
        return results.reduce((a, b) => a + b) / results.length;
    },

    // Test upload speed
    async testUpload() {
        const data = new Array(500).fill('a').join(''); // 500KB
        const start = performance.now();
        
        await fetch('/api/speed-test', {
            method: 'POST',
            body: data,
            cache: 'no-store'
        });
        
        const duration = performance.now() - start;
        return (data.length * 8) / (duration / 1000) / 1000;
    },

    // Run complete test
    async runFullTest() {
        const results = {
            download: 0,
            upload: 0,
            latency: 0,
            timestamp: new Date().toISOString()
        };
        
        try {
            results.download = await this.testDownload();
            results.upload = await this.testUpload();
            results.latency = await this.testLatency();
        } catch (e) {
            console.log('Speed test error:', e);
        }
        
        return results;
    },

    // Test latency
    async testLatency() {
        const pings = [];
        const iterations = 5;
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await fetch('/api/health', { cache: 'no-store' });
            pings.push(performance.now() - start);
        }
        
        return Math.round(pings.reduce((a, b) => a + b) / pings.length);
    },

    // Format speed
    formatSpeed(mbps) {
        if (mbps >= 1000) {
            return `${(mbps / 1000).toFixed(1)} Gbps`;
        }
        return `${mbps.toFixed(1)} Mbps`;
    }
};

// Real-time Data Monitor
const DataMonitor = {
    config: {
        updateInterval: 30000, // 30 seconds
        isRunning: false
    },

    // Get current usage (simulated - in production from API)
    async getCurrentUsage(userId, esimId) {
        // In production, fetch from network API
        return {
            dataUsed: Math.random() * 5000, // MB
            dataRemaining: 5000 - Math.random() * 5000,
            speed: Math.random() * 50 + 10, // Mbps
            signal: Math.floor(Math.random() * 30 + 70), // dBm
            networkType: '4G',
            connected: true
        };
    },

    // Start monitoring
    start(userId, esimId, callback) {
        if (this.config.isRunning) return;
        
        this.config.isRunning = true;
        
        const interval = setInterval(async () => {
            if (!this.config.isRunning) {
                clearInterval(interval);
                return;
            }
            
            const usage = await this.getCurrentUsage(userId, esimId);
            callback(usage);
        }, this.config.updateInterval);
        
        return interval;
    },

    // Stop monitoring
    stop(intervalId) {
        this.config.isRunning = false;
        clearInterval(intervalId);
    }
};

// Data Usage Charts
const UsageChart = {
    // Generate usage history data
    generateHistory(days = 7) {
        const data = [];
        const now = new Date();
        
        for (let i = days; i > 0; i--) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            data.push({
                date: date.toISOString().split('T')[0],
                usage: Math.random() * 5000,
                max: 5000
            });
        }
        
        return data;
    },

    // Calculate average
    calculateAverage(data) {
        const total = data.reduce((sum, d) => sum + d.usage, 0);
        return (total / data.length).toFixed(1);
    },

    // Estimate days remaining
    estimateDaysRemaining(currentRemaining, dailyAverage) {
        if (dailyAverage <= 0) return '∞';
        return Math.floor(currentRemaining / dailyAverage);
    }
};

// Coverage Map with Real Data
const CoverageMap = {
    // Get coverage data for area
    async getCoverage(area) {
        // In production, fetch from real network data
        return {
            area,
            coverage: Math.random() * 30 + 70, // 70-100%
            speed4G: Math.random() * 100 + 20, // Mbps
            speed5G: Math.random() * 300 + 100,
            congestion: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            lastUpdated: new Date().toISOString()
        };
    },

    // Get all countries
    async getCountriesCoverage() {
        return [
            { country: 'France', coverage: 98, cities: 45, speed: 85 },
            { country: 'USA', coverage: 95, cities: 120, speed: 75 },
            { country: 'Japon', coverage: 99, cities: 30, speed: 120 },
            { country: 'UK', coverage: 97, cities: 40, speed: 80 },
            { country: 'Allemagne', coverage: 96, cities: 35, speed: 78 },
            { country: 'Espagne', coverage: 94, cities: 25, speed: 70 },
            { country: 'Italie', coverage: 93, cities: 22, speed: 68 },
            { country: 'Australie', coverage: 90, cities: 15, speed: 65 },
            { country: 'Canada', coverage: 88, cities: 20, speed: 72 },
            { country: 'Brésil', coverage: 85, cities: 18, speed: 60 }
        ];
    }
};

// Export
window.speedTest = SpeedTest;
window.dataMonitor = DataMonitor;
window.usageChart = UsageChart;
window.coverageMap = CoverageMap;