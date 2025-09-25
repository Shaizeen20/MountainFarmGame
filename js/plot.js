// Plot class for the Mountain Farm Game

class Plot {
    constructor(id, x, y, width, height, soilType, unlockCost = 0) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.soilType = soilType;
        this.soilConfig = GAME_CONFIG.SOIL_TYPES[soilType];
        this.unlockCost = unlockCost;
        this.isUnlocked = unlockCost === 0; // River plot is unlocked by default
        this.crop = null;
        this.isSelected = false;
        this.lastWatered = 0;
        this.fertilized = false;
        this.fertilizerExpiry = 0;
    }

    // Check if a point is inside this plot
    containsPoint(x, y) {
        return Utils.pointInRect(x, y, this.x, this.y, this.width, this.height);
    }

    // Plant a crop on this plot
    plantCrop(cropType, currentTime) {
        if (!this.isUnlocked) {
            return { success: false, message: 'Plot is locked!' };
        }

        if (this.crop !== null) {
            return { success: false, message: 'Plot already has a crop!' };
        }

        if (!Crop.canPlantOnSoil(cropType, this.soilType)) {
            return { success: false, message: `${GAME_CONFIG.CROPS[cropType].name} cannot grow in ${this.soilConfig.name}!` };
        }

        this.crop = new Crop(cropType, currentTime);
        return { success: true, message: `${GAME_CONFIG.CROPS[cropType].name} planted successfully!` };
    }

    // Harvest crop from this plot
    harvestCrop() {
        if (!this.crop || !this.crop.isReady) {
            return null;
        }

        const harvestResult = this.crop.harvest();
        
        // Apply soil fertility bonus
        if (harvestResult) {
            const bonus = this.crop.calculateHarvestBonus(this.soilConfig.fertility);
            harvestResult.value += bonus;
            
            // Apply fertilizer bonus if active
            if (this.isFertilized()) {
                harvestResult.value = Math.floor(harvestResult.value * 1.5);
                harvestResult.fertilized = true;
            }
        }

        this.crop = null;
        this.fertilized = false;
        return harvestResult;
    }

    // Update plot state
    update(currentTime) {
        if (this.crop) {
            this.crop.update(currentTime);
        }

        // Check if fertilizer has expired
        if (this.fertilized && currentTime > this.fertilizerExpiry) {
            this.fertilized = false;
        }
    }

    // Water the plot
    water(currentTime) {
        if (!this.isUnlocked) return false;
        
        this.lastWatered = currentTime;
        
        // Watering gives a small growth boost
        if (this.crop && !this.crop.isReady) {
            // Reduce remaining grow time by 10%
            const remainingTime = this.crop.getTimeToHarvest(currentTime);
            const reduction = remainingTime * 0.1;
            this.crop.plantTime += reduction;
        }
        
        return true;
    }

    // Apply fertilizer to the plot
    fertilize(currentTime) {
        if (!this.isUnlocked) return false;
        
        this.fertilized = true;
        this.fertilizerExpiry = currentTime + (5 * 60 * 1000); // 5 minutes
        return true;
    }

    // Check if plot is currently fertilized
    isFertilized() {
        return this.fertilized && Date.now() < this.fertilizerExpiry;
    }

    // Check if plot needs watering
    needsWatering(currentTime) {
        const timeSinceWatered = currentTime - this.lastWatered;
        return timeSinceWatered > (2 * 60 * 1000); // 2 minutes
    }

    // Unlock this plot
    unlock() {
        this.isUnlocked = true;
    }

    // Get plot status
    getStatus() {
        if (!this.isUnlocked) return 'Locked';
        if (!this.crop) return 'Empty';
        if (this.crop.isReady) return 'Ready to harvest';
        return 'Growing';
    }

    // Get plot info for UI
    getInfo() {
        const info = {
            id: this.id,
            soilType: this.soilConfig.name,
            status: this.getStatus(),
            isUnlocked: this.isUnlocked,
            unlockCost: this.unlockCost,
            fertilized: this.isFertilized(),
            needsWater: this.needsWatering(Date.now())
        };

        if (this.crop) {
            info.crop = this.crop.getInfo();
        }

        return info;
    }

    // Draw the plot on canvas
    draw(ctx, currentTime, assets = {}, isDetailView = false) {
        const plotColor = this.isUnlocked ? this.soilConfig.color : '#666666';
        
        // In detail view, draw larger and more detailed
        const scale = isDetailView ? 2 : 1;
        const plotWidth = this.width * scale;
        const plotHeight = this.height * scale;
        const plotX = isDetailView ? this.x - this.width / 2 : this.x;
        const plotY = isDetailView ? this.y - this.height / 2 : this.y;
        
        // Draw soil background (use asset if available, otherwise color)
        if (assets[`plot-${this.soilType.toLowerCase()}`]) {
            ctx.drawImage(
                assets[`plot-${this.soilType.toLowerCase()}`],
                plotX, plotY, plotWidth, plotHeight
            );
        } else {
            ctx.fillStyle = plotColor;
            ctx.fillRect(plotX, plotY, plotWidth, plotHeight);
        }
        
        // Draw border
        ctx.strokeStyle = this.isSelected ? '#FFD700' : '#000000';
        ctx.lineWidth = this.isSelected ? 3 : 1;
        ctx.strokeRect(plotX, plotY, plotWidth, plotHeight);
        
        // Draw soil pattern in detail view
        if (isDetailView) {
            this.drawSoilDetails(ctx, plotX, plotY, plotWidth, plotHeight);
        }
        
        // Draw lock icon if locked
        if (!this.isUnlocked) {
            if (assets['lock-icon']) {
                const iconSize = 32 * scale;
                ctx.drawImage(
                    assets['lock-icon'],
                    plotX + (plotWidth - iconSize) / 2,
                    plotY + (plotHeight - iconSize) / 2,
                    iconSize, iconSize
                );
            } else {
                ctx.fillStyle = '#FFD700';
                ctx.font = `${24 * scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('🔒', plotX + plotWidth / 2, plotY + plotHeight / 2 + 8 * scale);
            }
        }
        
        // Draw crop if present
        if (this.crop && this.isUnlocked) {
            const visual = this.crop.getVisualData();
            const centerX = plotX + plotWidth / 2;
            const centerY = plotY + plotHeight / 2;
            const size = Math.min(plotWidth, plotHeight) * visual.size * 0.6;
            
            // Use crop asset if available, otherwise emoji
            if (assets[visual.assetName]) {
                const cropSize = size * 1.2;
                ctx.drawImage(
                    assets[visual.assetName],
                    centerX - cropSize / 2,
                    centerY - cropSize / 2,
                    cropSize, cropSize
                );
            } else {
                // Fallback to emoji
                ctx.fillStyle = visual.color;
                ctx.font = `${size}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(visual.label, centerX, centerY + size / 3);
            }
            
            // Draw growth indicator
            if (!this.crop.isReady) {
                const progress = this.crop.getGrowthPercentage(currentTime) / 100;
                const barWidth = this.width * 0.8;
                const barHeight = 4;
                const barX = this.x + (this.width - barWidth) / 2;
                const barY = this.y + this.height - 10;
                
                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Progress
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            }
        }
        
        // Draw status indicators
        if (this.isUnlocked) {
            const indicatorSize = 12;
            let indicatorX = this.x + 5;
            const indicatorY = this.y + 5;
            
            // Fertilizer indicator
            if (this.isFertilized()) {
                if (assets['fertilizer-effect']) {
                    ctx.drawImage(assets['fertilizer-effect'], indicatorX, indicatorY, indicatorSize, indicatorSize);
                } else {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = `${indicatorSize}px Arial`;
                    ctx.textAlign = 'left';
                    ctx.fillText('✨', indicatorX, indicatorY + indicatorSize);
                }
                indicatorX += indicatorSize + 2;
            }
            
            // Water indicator
            if (!this.needsWatering(currentTime)) {
                if (assets['water-effect']) {
                    ctx.drawImage(assets['water-effect'], indicatorX, indicatorY, indicatorSize, indicatorSize);
                } else {
                    ctx.fillStyle = '#4169E1';
                    ctx.font = `${indicatorSize}px Arial`;
                    ctx.textAlign = 'left';
                    ctx.fillText('💧', indicatorX, indicatorY + indicatorSize);
                }
            }
        }
    }

    // Get available crops for this soil type
    getAvailableCrops() {
        return Crop.getCropsForSoil(this.soilType);
    }

    // Draw detailed soil patterns for detail view
    drawSoilDetails(ctx, x, y, width, height) {
        ctx.save();
        
        // Set clipping region to plot bounds
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        
        // Draw soil texture based on type
        if (this.soilType === 'ALUVIAL') {
            // Fertile soil - darker brown with organic matter
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x, y, width, height);
            
            // Add organic particles
            ctx.fillStyle = '#654321';
            for (let i = 0; i < 20; i++) {
                const particleX = x + Math.random() * width;
                const particleY = y + Math.random() * height;
                ctx.fillRect(particleX, particleY, 2, 2);
            }
        } else if (this.soilType === 'MOUNTAIN') {
            // Rocky soil - lighter brown with stones
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(x, y, width, height);
            
            // Add rocks
            ctx.fillStyle = '#696969';
            for (let i = 0; i < 15; i++) {
                const rockX = x + Math.random() * width;
                const rockY = y + Math.random() * height;
                const rockSize = 3 + Math.random() * 4;
                ctx.fillRect(rockX, rockY, rockSize, rockSize);
            }
        } else {
            // River soil - wet dark soil
            ctx.fillStyle = '#2F4F4F';
            ctx.fillRect(x, y, width, height);
            
            // Add water droplets
            ctx.fillStyle = '#4682B4';
            for (let i = 0; i < 10; i++) {
                const dropX = x + Math.random() * width;
                const dropY = y + Math.random() * height;
                ctx.fillRect(dropX, dropY, 1, 1);
            }
        }
        
        // Add furrows for planted plots
        if (this.crop) {
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < 5; i++) {
                const furrowY = y + (i + 1) * (height / 6);
                ctx.beginPath();
                ctx.moveTo(x + 10, furrowY);
                ctx.lineTo(x + width - 10, furrowY);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }

    // Serialize for saving
    serialize() {
        const data = {
            id: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            soilType: this.soilType,
            unlockCost: this.unlockCost,
            isUnlocked: this.isUnlocked,
            lastWatered: this.lastWatered,
            fertilized: this.fertilized,
            fertilizerExpiry: this.fertilizerExpiry
        };

        if (this.crop) {
            data.crop = this.crop.serialize();
        }

        return data;
    }

    // Deserialize from saved data
    static deserialize(data) {
        const plot = new Plot(
            data.id, data.x, data.y, data.width, data.height,
            data.soilType, data.unlockCost
        );
        
        plot.isUnlocked = data.isUnlocked;
        plot.lastWatered = data.lastWatered || 0;
        plot.fertilized = data.fertilized || false;
        plot.fertilizerExpiry = data.fertilizerExpiry || 0;
        
        if (data.crop) {
            plot.crop = Crop.deserialize(data.crop);
        }
        
        return plot;
    }
}