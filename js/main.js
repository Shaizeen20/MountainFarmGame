// Main entry point for the Mountain Farm Game

// Global game instance
let game;

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    showLoadingScreen();
    
    // Wait a bit for the loading screen to show, then initialize game
    setTimeout(initializeGame, 1000);
});

// Show loading screen
function showLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading-screen';
    loadingScreen.innerHTML = `
        <h1 class="loading-title">MOUNTAIN FARM GAME</h1>
        <div class="loading-bar">
            <div class="loading-progress" id="loading-progress"></div>
        </div>
        <p style="margin-top: 20px; color: #8B4513; font-weight: 600;">Loading your farm...</p>
    `;
    
    document.body.appendChild(loadingScreen);
    
    // Animate loading bar
    const progressBar = document.getElementById('loading-progress');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        progressBar.style.width = progress + '%';
    }, 100);
}

// Hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.remove();
        }, 500);
    }
}

// Initialize the game
async function initializeGame() {
    try {
        // Load placeholder images for missing assets
        await loadPlaceholderAssets();
        
        // Create game instance
        game = new Game();
        
        // Setup additional UI event listeners
        setupAdditionalEventListeners();
        
        // Start the game
        game.start();
        
        // Hide loading screen
        hideLoadingScreen();
        
        console.log('Mountain Farm Game initialized successfully!');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showErrorScreen(error.message);
    }
}

// Load placeholder assets
async function loadPlaceholderAssets() {
    // Assets are now loaded by the Game class itself
    // This function is kept for backwards compatibility
    console.log('Asset loading handled by Game class...');
}

// Setup additional event listeners
function setupAdditionalEventListeners() {
    // Market modal events
    setupMarketEventListeners();
    
    // Info button
    const infoBtn = document.getElementById('info-btn');
    if (infoBtn) {
        infoBtn.addEventListener('click', showGameInfo);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeyDown);
}

// Setup market event listeners
function setupMarketEventListeners() {
    // Close market button
    const closeMarket = document.getElementById('close-market');
    if (closeMarket) {
        closeMarket.addEventListener('click', () => {
            game.toggleMarket();
        });
    }
    
    // Market tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchMarketTab(e.target.dataset.tab);
        });
    });
    
    // Close modal when clicking outside
    const modal = document.getElementById('market-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                game.toggleMarket();
            }
        });
    }
}

// Switch market tab
function switchMarketTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    document.getElementById(`${tabName}-tab`).style.display = 'block';
    
    // Update content based on tab
    if (tabName === 'buy') {
        updateBuyTab();
    } else if (tabName === 'sell') {
        updateSellTab();
    }
}

// Update buy tab content
function updateBuyTab() {
    const buyTab = document.getElementById('buy-tab');
    const marketGrid = buyTab.querySelector('.market-grid');
    
    if (!game || !game.player) return;
    
    const marketData = game.player.getMarketBuyData();
    
    marketGrid.innerHTML = '';
    
    marketData.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'market-item';
        itemElement.innerHTML = `
            <div class="item-image">🌱</div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">${item.cost} coins</div>
            <div class="item-owned">Owned: ${item.owned}</div>
            <button class="buy-btn" onclick="buySeeds('${item.type}', 1)">Buy 1</button>
            <button class="buy-btn" onclick="buySeeds('${item.type}', 5)">Buy 5</button>
        `;
        
        marketGrid.appendChild(itemElement);
    });
}

// Update sell tab content
function updateSellTab() {
    const sellTab = document.getElementById('sell-tab');
    const inventoryGrid = sellTab.querySelector('.inventory-grid');
    
    if (!game || !game.player) return;
    
    const marketData = game.player.getMarketSellData();
    
    inventoryGrid.innerHTML = '';
    
    if (marketData.length === 0) {
        inventoryGrid.innerHTML = '<p style="text-align: center; color: #666;">No crops to sell</p>';
        return;
    }
    
    marketData.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'market-item';
        itemElement.innerHTML = `
            <div class="item-image">${getCropEmoji(item.type)}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">${item.value} coins each</div>
            <div class="item-owned">Owned: ${item.owned}</div>
            <button class="sell-btn" onclick="sellCrops('${item.type}', 1)">Sell 1</button>
            <button class="sell-btn" onclick="sellCrops('${item.type}', ${Math.min(item.owned, 5)})">Sell ${Math.min(item.owned, 5)}</button>
        `;
        
        inventoryGrid.appendChild(itemElement);
    });
}

// Buy seeds function (global for onclick)
function buySeeds(cropType, quantity) {
    if (game && game.player) {
        const success = game.player.buySeeds(cropType, quantity);
        if (success) {
            Utils.showTooltip(window.innerWidth / 2, 100, 
                `Bought ${quantity} ${GAME_CONFIG.CROPS[cropType].name} seeds!`);
            updateBuyTab();
        } else {
            Utils.showTooltip(window.innerWidth / 2, 100, 'Not enough coins!');
        }
    }
}

// Sell crops function (global for onclick)
function sellCrops(cropType, quantity) {
    if (game && game.player) {
        const success = game.player.sellCrops(cropType, quantity);
        if (success) {
            const totalValue = GAME_CONFIG.CROPS[cropType].harvestValue * quantity;
            Utils.showTooltip(window.innerWidth / 2, 100, 
                `Sold ${quantity} ${GAME_CONFIG.CROPS[cropType].name} for ${totalValue} coins!`);
            updateSellTab();
        } else {
            Utils.showTooltip(window.innerWidth / 2, 100, 'Not enough crops!');
        }
    }
}

// Get crop emoji helper
function getCropEmoji(cropType) {
    const emojiMap = {
        corn: '🌽',
        wheat: '🌾',
        rice: '🌾',
        potato: '🥔'
    };
    return emojiMap[cropType] || '🌱';
}

// Show game info
function showGameInfo() {
    const infoText = `
🌾 MOUNTAIN FARM GAME 🌾

Welcome to your mountain farm! Start by planting crops in your riverside plot and expand your farm up the mountain.

🎮 HOW TO PLAY:
• Click on plots to select them
• Plant seeds from your inventory
• Wait for crops to grow
• Harvest when ready for coins
• Use coins to unlock new plots

🌱 SOIL TYPES:
• Alluvial (River): Great for rice, corn, wheat
• Rocky (Hillside): Good for potatoes
• Fertile (Plateau): Best for all crops
• Mountain: Suitable for hardy crops

💡 TIPS:
• Different soils grow different crops
• Fertilize plots for bonus yield
• Water crops to speed growth
• Save coins to unlock better plots

🏆 GOALS:
• Unlock all mountain plots
• Build a profitable farm
• Achieve farming mastery

Click anywhere to close this message.
    `;
    
    const infoModal = document.createElement('div');
    infoModal.className = 'modal';
    infoModal.style.display = 'block';
    infoModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; white-space: pre-line; line-height: 1.6;">
            ${infoText}
        </div>
    `;
    
    document.body.appendChild(infoModal);
    
    infoModal.addEventListener('click', () => {
        infoModal.remove();
    });
}

// Handle global keyboard shortcuts
function handleGlobalKeyDown(e) {
    // Prevent default behavior for game shortcuts
    switch (e.key) {
        case 'h':
        case 'H':
            if (game && game.selectedPlot && game.selectedPlot.crop && game.selectedPlot.crop.isReady) {
                game.harvestSelectedPlot();
            }
            break;
        case 'm':
        case 'M':
            if (game) {
                game.toggleMarket();
            }
            break;
        case 'i':
        case 'I':
            showGameInfo();
            break;
    }
}

// Show error screen
function showErrorScreen(message) {
    hideLoadingScreen();
    
    const errorScreen = document.createElement('div');
    errorScreen.className = 'loading-screen';
    errorScreen.innerHTML = `
        <h1 class="loading-title">Game Error</h1>
        <p style="color: #FF6B6B; font-weight: 600; margin: 20px 0;">${message}</p>
        <button onclick="location.reload()" style="
            background: linear-gradient(45deg, #32CD32, #90EE90);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        ">Reload Game</button>
    `;
    
    document.body.appendChild(errorScreen);
}

// Handle page visibility changes (pause when tab is not active)
document.addEventListener('visibilitychange', function() {
    if (game) {
        if (document.hidden) {
            // Page is hidden, save game
            game.saveGame();
        } else {
            // Page is visible again, resume if needed
            if (game.isPaused) {
                // Don't auto-resume, let player choose
            }
        }
    }
});

// Auto-save before page unload
window.addEventListener('beforeunload', function() {
    if (game) {
        game.saveGame();
    }
});

// Export for debugging (only in development)
if (typeof window !== 'undefined') {
    window.debugGame = () => game;
    window.resetGame = () => {
        if (game && game.player) {
            game.player.reset();
            localStorage.removeItem('mountainFarmGame');
            localStorage.removeItem('mountainFarmPlayer');
            location.reload();
        }
    };
}