// Player class for the Mountain Farm Game

class Player {
    constructor() {
        this.coins = 5200;
        this.gems = 50;
        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100;
        
        // Inventory system
        this.inventory = {
            seeds: {
                corn: 5,
                wheat: 10,
                rice: 3,
                potato: 2
            },
            crops: {
                corn: 0,
                wheat: 0,
                rice: 0,
                potato: 0
            },
            tools: {
                fertilizer: 3,
                wateringCan: 1
            }
        };
        
        // Statistics
        this.stats = {
            totalCropsPlanted: 0,
            totalCropsHarvested: 0,
            totalCoinsEarned: 0,
            totalCoinsSpent: 0,
            plotsUnlocked: 1, // Start with river plot
            daysPlayed: 1
        };
        
        // Achievements
        this.achievements = [];
        this.unlockedPlots = ['riverbank']; // Start with riverbank plot
    }

    // Add coins to player
    addCoins(amount) {
        this.coins += amount;
        this.stats.totalCoinsEarned += amount;
        this.checkAchievements();
        this.updateUI();
    }

    // Spend coins
    spendCoins(amount) {
        if (this.coins >= amount) {
            this.coins -= amount;
            this.stats.totalCoinsSpent += amount;
            this.updateUI();
            return true;
        }
        return false;
    }

    // Add gems to player
    addGems(amount) {
        this.gems += amount;
        this.updateUI();
    }

    // Spend gems
    spendGems(amount) {
        if (this.gems >= amount) {
            this.gems -= amount;
            this.updateUI();
            return true;
        }
        return false;
    }

    // Add experience and check for level up
    addExperience(amount) {
        this.experience += amount;
        
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
        
        this.updateUI();
    }

    // Level up the player
    levelUp() {
        this.experience -= this.experienceToNextLevel;
        this.level++;
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
        
        // Level up rewards
        this.addCoins(this.level * 50);
        this.addGems(this.level);
        
        // Show level up notification
        Utils.showTooltip(window.innerWidth / 2, window.innerHeight / 2, 
            `Level Up! You are now level ${this.level}!`);
        
        this.checkAchievements();
    }

    // Buy seeds
    buySeeds(cropType, quantity) {
        const cropConfig = GAME_CONFIG.CROPS[cropType];
        if (!cropConfig) return false;
        
        const totalCost = cropConfig.seedCost * quantity;
        
        if (this.spendCoins(totalCost)) {
            this.inventory.seeds[cropType] = (this.inventory.seeds[cropType] || 0) + quantity;
            return true;
        }
        
        return false;
    }

    // Use seeds for planting
    useSeeds(cropType, quantity = 1) {
        if (this.inventory.seeds[cropType] && this.inventory.seeds[cropType] >= quantity) {
            this.inventory.seeds[cropType] -= quantity;
            this.stats.totalCropsPlanted += quantity;
            return true;
        }
        return false;
    }

    // Add harvested crops to inventory
    addHarvestedCrop(cropType, quantity = 1) {
        this.inventory.crops[cropType] = (this.inventory.crops[cropType] || 0) + quantity;
        this.stats.totalCropsHarvested += quantity;
        this.addExperience(10); // 10 XP per harvest
    }

    // Sell crops
    sellCrops(cropType, quantity) {
        if (this.inventory.crops[cropType] && this.inventory.crops[cropType] >= quantity) {
            const cropConfig = GAME_CONFIG.CROPS[cropType];
            const totalValue = cropConfig.harvestValue * quantity;
            
            this.inventory.crops[cropType] -= quantity;
            this.addCoins(totalValue);
            return true;
        }
        return false;
    }

    // Unlock a new plot
    unlockPlot(plotId, cost) {
        if (this.spendCoins(cost)) {
            this.unlockedPlots.push(plotId);
            this.stats.plotsUnlocked++;
            this.addExperience(50); // 50 XP for unlocking a plot
            return true;
        }
        return false;
    }

    // Check if player can afford something
    canAfford(cost, currency = 'coins') {
        if (currency === 'coins') {
            return this.coins >= cost;
        } else if (currency === 'gems') {
            return this.gems >= cost;
        }
        return false;
    }

    // Get inventory count for specific item
    getInventoryCount(category, item) {
        return this.inventory[category] && this.inventory[category][item] ? 
               this.inventory[category][item] : 0;
    }

    // Update UI elements
    updateUI() {
        const coinElement = document.getElementById('coin-count');
        const gemElement = document.getElementById('gem-count');
        
        if (coinElement) {
            coinElement.textContent = Utils.formatNumber(this.coins);
        }
        
        if (gemElement) {
            gemElement.textContent = Utils.formatNumber(this.gems);
        }
    }

    // Check for achievements
    checkAchievements() {
        const newAchievements = [];
        
        // First harvest achievement
        if (this.stats.totalCropsHarvested >= 1 && !this.achievements.includes('first_harvest')) {
            newAchievements.push('first_harvest');
            this.achievements.push('first_harvest');
        }
        
        // Wealthy farmer achievement
        if (this.coins >= 10000 && !this.achievements.includes('wealthy_farmer')) {
            newAchievements.push('wealthy_farmer');
            this.achievements.push('wealthy_farmer');
        }
        
        // Plot master achievement
        if (this.stats.plotsUnlocked >= 5 && !this.achievements.includes('plot_master')) {
            newAchievements.push('plot_master');
            this.achievements.push('plot_master');
        }
        
        // Show achievement notifications
        newAchievements.forEach(achievement => {
            const achievementData = this.getAchievementData(achievement);
            Utils.showTooltip(window.innerWidth / 2, 100, 
                `Achievement Unlocked: ${achievementData.name}!`);
        });
    }

    // Get achievement data
    getAchievementData(achievementId) {
        const achievements = {
            first_harvest: {
                name: 'First Harvest',
                description: 'Harvest your first crop',
                reward: 'coins:100'
            },
            wealthy_farmer: {
                name: 'Wealthy Farmer',
                description: 'Accumulate 10,000 coins',
                reward: 'gems:10'
            },
            plot_master: {
                name: 'Plot Master',
                description: 'Unlock 5 plots',
                reward: 'coins:500'
            }
        };
        
        return achievements[achievementId] || null;
    }

    // Get player statistics for display
    getStats() {
        return {
            level: this.level,
            experience: this.experience,
            experienceToNextLevel: this.experienceToNextLevel,
            coins: this.coins,
            gems: this.gems,
            ...this.stats
        };
    }

    // Save player data
    save() {
        const saveData = {
            coins: this.coins,
            gems: this.gems,
            level: this.level,
            experience: this.experience,
            experienceToNextLevel: this.experienceToNextLevel,
            inventory: this.inventory,
            stats: this.stats,
            achievements: this.achievements,
            unlockedPlots: this.unlockedPlots,
            lastSaved: Date.now()
        };
        
        return Utils.saveToStorage('mountainFarmPlayer', saveData);
    }

    // Load player data
    load() {
        const saveData = Utils.loadFromStorage('mountainFarmPlayer');
        
        if (saveData) {
            this.coins = saveData.coins || 5200;
            this.gems = saveData.gems || 50;
            this.level = saveData.level || 1;
            this.experience = saveData.experience || 0;
            this.experienceToNextLevel = saveData.experienceToNextLevel || 100;
            this.inventory = saveData.inventory || this.inventory;
            this.stats = saveData.stats || this.stats;
            this.achievements = saveData.achievements || [];
            this.unlockedPlots = saveData.unlockedPlots || ['riverbank'];
            
            this.updateUI();
            return true;
        }
        
        return false;
    }

    // Reset player data
    reset() {
        this.coins = 5200;
        this.gems = 50;
        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100;
        this.inventory = {
            seeds: { corn: 5, wheat: 10, rice: 3, potato: 2 },
            crops: { corn: 0, wheat: 0, rice: 0, potato: 0 },
            tools: { fertilizer: 3, wateringCan: 1 }
        };
        this.stats = {
            totalCropsPlanted: 0,
            totalCropsHarvested: 0,
            totalCoinsEarned: 0,
            totalCoinsSpent: 0,
            plotsUnlocked: 1,
            daysPlayed: 1
        };
        this.achievements = [];
        this.unlockedPlots = ['riverbank'];
        
        this.updateUI();
    }

    // Get market data for buying seeds
    getMarketBuyData() {
        const marketData = [];
        
        for (const [cropType, config] of Object.entries(GAME_CONFIG.CROPS)) {
            marketData.push({
                type: cropType,
                name: config.name,
                cost: config.seedCost,
                owned: this.getInventoryCount('seeds', cropType)
            });
        }
        
        return marketData;
    }

    // Get market data for selling crops
    getMarketSellData() {
        const marketData = [];
        
        for (const [cropType, config] of Object.entries(GAME_CONFIG.CROPS)) {
            const owned = this.getInventoryCount('crops', cropType);
            if (owned > 0) {
                marketData.push({
                    type: cropType,
                    name: config.name,
                    value: config.harvestValue,
                    owned: owned
                });
            }
        }
        
        return marketData;
    }
}