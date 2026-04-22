// E-Sim By ELECTRON - Additional Themes
// Ocean, Forest, Flame, Sunset, Midnight themes

const themes = {
    // 🌊 Ocean Theme
    ocean: {
        name: 'Ocean',
        primary: '#2e3192',
        secondary: '#1bffff',
        accent: '#00d4ff',
        background: '#0a1628',
        surface: '#112240',
        text: '#e6f1ff',
        textSecondary: '#8892b0',
        gradient: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)'
    },
    
    // 🌲 Forest Theme
    forest: {
        name: 'Forest',
        primary: '#11998e',
        secondary: '#38ef7d',
        accent: '#00d97e',
        background: '#0d1f1a',
        surface: '#142820',
        text: '#e8f5e9',
        textSecondary: '#a5d6a7',
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    },
    
    // 🔥 Flame Theme
    flame: {
        name: 'Flame',
        primary: '#f12711',
        secondary: '#f5af19',
        accent: '#ff6b35',
        background: '#1a0a05',
        surface: '#2d1508',
        text: '#fff5eb',
        textSecondary: '#ffccbc',
        gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)'
    },
    
    // 🌅 Golden Hour Theme
    golden: {
        name: 'Golden Hour',
        primary: '#ff9a9e',
        secondary: '#fecfef',
        accent: '#ffb347',
        background: '#1a0f14',
        surface: '#2d1a24',
        text: '#fff0f3',
        textSecondary: '#f8bbd0',
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #f5af19 100%)'
    },
    
    // 🌙 Midnight Theme
    midnight: {
        name: 'Midnight',
        primary: '#0f0c29',
        secondary: '#302b63',
        accent: '#24243e',
        background: '#050510',
        surface: '#0a0a1a',
        text: '#e0e0e0',
        textSecondary: '#909090',
        gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
    },
    
    // 💎 Crystal Theme
    crystal: {
        name: 'Crystal',
        primary: '#a8edea',
        secondary: '#fed6e3',
        accent: '#5ee7df',
        background: '#0f1920',
        surface: '#1a2930',
        text: '#e8f4f8',
        textSecondary: '#90a4ae',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    },
    
    // 🌸 Sakura Theme
    sakura: {
        name: 'Sakura',
        primary: '#ffecd2',
        secondary: '#fcb69f',
        accent: '#ff8fab',
        background: '#1a1015',
        surface: '#2a1a20',
        text: '#fff0f5',
        textSecondary: '#e0b0c0',
        gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    },
    
    // ⚡ Electric Theme
    electric: {
        name: 'Electric',
        primary: '#00f260',
        secondary: '#0575e6',
        accent: '#00ffcc',
        background: '#0a0a1a',
        surface: '#141428',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        gradient: 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)'
    }
};

// Function to get theme CSS
function getThemeCSS(theme) {
    return `
        [data-theme="${theme}"] {
            --primary: ${themes[theme].primary};
            --secondary: ${themes[theme].secondary};
            --accent: ${themes[theme].accent};
            --background: ${themes[theme].background};
            --surface: ${themes[theme].surface};
            --text: ${themes[theme].text};
            --text-secondary: ${themes[theme].textSecondary};
            --gradient: ${themes[theme].gradient};
        }
    `;
}

// Generate all themes CSS
function generateAllThemesCSS() {
    let css = ':root {\n';
    Object.keys(themes).forEach(theme => {
        css += getThemeCSS(theme);
    });
    css += '\n}';
    return css;
}

module.exports = { themes, getThemeCSS, generateAllThemesCSS };