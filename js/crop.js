// Crop class for the Mountain Farm Game

class Crop {
    constructor(type, plantTime) {
        this.type = type;
        this.config = GAME_CONFIG.CROPS[type];
        this.plantTime = plantTime;
        this.growthStage = 0; // 0: seed, 1: sprout, 2: half-grown, 3: mature
        this.isReady = false;
        this.lastUpdateTime = plantTime;
        
        if (!this.config) {
            throw new Error(`Unknown crop type: ${type}`);
        }
    }

    // Update crop growth based on elapsed time
    update(currentTime) {
        if (this.isReady) return;

        const elapsedTime = currentTime - this.plantTime;
        const growthProgress = elapsedTime / this.config.growTime;

        // Determine growth stage based on progress
        if (growthProgress >= 1.0) {
            this.growthStage = 3;
            this.isReady = true;
        } else if (growthProgress >= 0.75) {
            this.growthStage = 3;
        } else if (growthProgress >= 0.5) {
            this.growthStage = 2;
        } else if (growthProgress >= 0.25) {
            this.growthStage = 1;
        } else {
            this.growthStage = 0;
        }

        this.lastUpdateTime = currentTime;
    }

    // Get the visual representation of the crop
    getVisualData() {
        const stages = [
            { 
                color: '#8B4513', 
                size: 0.3, 
                label: '🌱',
                assetName: `${this.type}-stage1`
            }, // Seed
            { 
                color: '#90EE90', 
                size: 0.5, 
                label: '🌿',
                assetName: `${this.type}-stage2`
            }, // Sprout
            { 
                color: '#32CD32', 
                size: 0.7, 
                label: '🌾',
                assetName: `${this.type}-stage3`
            }, // Half-grown
            { 
                color: this.config.color, 
                size: 1.0, 
                label: this.getCropEmoji(),
                assetName: `${this.type}-stage4`
            } // Mature
        ];

        return stages[this.growthStage];
    }

    // Get emoji representation of the crop
    getCropEmoji() {
        const emojiMap = {
            corn: '🌽',
            wheat: '🌾',
            rice: '🌾',
            potato: '🥔'
        };
        return emojiMap[this.type] || '🌱';
    }

    // Get time remaining until harvest
    getTimeToHarvest(currentTime) {
        if (this.isReady) return 0;
        const elapsed = currentTime - this.plantTime;
        return Math.max(0, this.config.growTime - elapsed);
    }

    // Get growth percentage
    getGrowthPercentage(currentTime) {
        const elapsed = currentTime - this.plantTime;
        return Math.min(100, (elapsed / this.config.growTime) * 100);
    }

    // Check if crop can be planted on specific soil type
    static canPlantOnSoil(cropType, soilType) {
        const cropConfig = GAME_CONFIG.CROPS[cropType];
        if (!cropConfig) return false;
        return cropConfig.soilCompatibility.includes(soilType);
    }

    // Get all crops suitable for a soil type
    static getCropsForSoil(soilType) {
        const suitableCrops = [];
        for (const [cropType, config] of Object.entries(GAME_CONFIG.CROPS)) {
            if (config.soilCompatibility.includes(soilType)) {
                suitableCrops.push(cropType);
            }
        }
        return suitableCrops;
    }

    // Harvest the crop
    harvest() {
        if (!this.isReady) {
            return null;
        }

        return {
            type: this.type,
            value: this.config.harvestValue,
            quantity: 1
        };
    }

    // Get crop info for display
    getInfo() {
        return {
            name: this.config.name,
            type: this.type,
            growthStage: this.growthStage,
            isReady: this.isReady,
            plantTime: this.plantTime,
            growTime: this.config.growTime,
            harvestValue: this.config.harvestValue
        };
    }

    // Calculate bonus based on soil fertility
    calculateHarvestBonus(soilFertility) {
        const baseValue = this.config.harvestValue;
        const bonus = Math.floor(baseValue * soilFertility * 0.2); // 20% max bonus
        return bonus;
    }

    // Get crop status text
    getStatusText(currentTime) {
        if (this.isReady) {
            return 'Ready to harvest!';
        }

        const timeRemaining = this.getTimeToHarvest(currentTime);
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        
        return `Growing... ${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
    }

    // Serialize for saving
    serialize() {
        return {
            type: this.type,
            plantTime: this.plantTime,
            growthStage: this.growthStage,
            isReady: this.isReady,
            lastUpdateTime: this.lastUpdateTime
        };
    }

    // Deserialize from saved data
    static deserialize(data) {
        const crop = new Crop(data.type, data.plantTime);
        crop.growthStage = data.growthStage;
        crop.isReady = data.isReady;
        crop.lastUpdateTime = data.lastUpdateTime;
        return crop;
    }
}