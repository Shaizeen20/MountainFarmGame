// Alluvial Farm specific functionality with landscape view interactions

document.addEventListener('DOMContentLoaded', function() {
    console.log('Alluvial Farm JS Loaded');
    
    // Initialize specific alluvial farm features
    setupLandscapePlots();
    setupRiverInteractions();
    setupWeatherEffects();
    
    // Override base plot visual updates
    window.farmBase.updatePlotVisuals = updateAlluvialPlotVisuals;
});

function setupLandscapePlots() {
    const farmingPlots = document.querySelectorAll('.farming-plot');
    
    farmingPlots.forEach(plot => {
        const row = parseInt(plot.dataset.row);
        const col = parseInt(plot.dataset.col);
        
        // Add click handler for plot interactions
        plot.addEventListener('click', function(e) {
            e.preventDefault();
            handlePlotClick(row, col, plot);
        });
        
        // Add hover effects
        plot.addEventListener('mouseenter', function() {
            if (!plot.classList.contains('has-crop')) {
                plot.style.filter = 'brightness(1.2) contrast(1.1)';
            }
        });
        
        plot.addEventListener('mouseleave', function() {
            plot.style.filter = '';
        });
        
        // Initialize plot visual state
        updatePlotVisual(row, col, plot);
    });
}

function handlePlotClick(row, col, plotElement) {
    const plotState = window.farmBase.getPlotState(row, col);
    const tool = window.farmBase.gameState.selectedTool;
    const crop = window.farmBase.gameState.selectedCrop;
    
    switch(tool) {
        case 'canal':
            // Irrigation tool
            if (plotState.crop) {
                if (window.farmBase.waterPlot(row, col)) {
                    addWaterEffect(plotElement);
                }
            } else {
                window.farmBase.showMessage('Dig irrigation channels first, then plant!', 'info');
            }
            break;
            
        case 'plant':
            // Planting tool
            if (!plotState.crop) {
                if (window.farmBase.plantCrop(row, col, crop)) {
                    addSeedDropAnimation(plotElement, crop);
                    updatePlotVisual(row, col, plotElement);
                    startGrowthTimer(row, col, plotElement);
                }
            } else if (plotState.ready) {
                if (window.farmBase.harvestCrop(row, col)) {
                    updatePlotVisual(row, col, plotElement);
                    // Add simple harvest feedback
                    plotElement.style.filter = 'brightness(1.5)';
                    setTimeout(() => plotElement.style.filter = '', 500);
                }
            } else {
                window.farmBase.showMessage('This plot already has crops growing!', 'warning');
            }
            break;
            
        case 'water':
            // Watering tool
            if (plotState.crop) {
                if (window.farmBase.waterPlot(row, col)) {
                    addWaterEffect(plotElement);
                }
            } else {
                window.farmBase.showMessage('Plant something first!', 'warning');
            }
            break;
            
        case 'harvest':
            // Harvesting tool
            if (plotState.crop && plotState.ready) {
                if (window.farmBase.harvestCrop(row, col)) {
                    updatePlotVisual(row, col, plotElement);
                    // Add simple harvest feedback
                    plotElement.style.filter = 'brightness(1.5)';
                    setTimeout(() => plotElement.style.filter = '', 500);
                }
            } else if (plotState.crop) {
                window.farmBase.showMessage('Crop is not ready for harvest yet!', 'warning');
            } else {
                window.farmBase.showMessage('Nothing to harvest here!', 'warning');
            }
            break;
    }
}

function updatePlotVisual(row, col, plotElement) {
    const plotState = window.farmBase.getPlotState(row, col);
    
    // Clear existing crop overlays
    const existingOverlays = plotElement.querySelectorAll('.crop-overlay');
    existingOverlays.forEach(overlay => overlay.remove());
    
    // Reset classes
    plotElement.classList.remove('has-crop', 'stage-1', 'stage-2', 'stage-3', 'stage-4', 'ready-harvest');
    
    if (plotState.crop) {
        plotElement.classList.add('has-crop');
        plotElement.classList.add('stage-' + plotState.stage);
        
        if (plotState.ready) {
            plotElement.classList.add('ready-harvest');
        }
        
        // Create crop overlay
        const cropOverlay = document.createElement('div');
        cropOverlay.className = 'crop-overlay crop-stage-' + plotState.stage;
        
        // Set crop image based on type and stage
        const cropImages = {
            rice: 'assets/images/crops/rice-stage-' + plotState.stage + '.png',
            maize: 'assets/images/crops/maize-stage-' + plotState.stage + '.png',
            wheat: 'assets/images/crops/wheat-stage-' + plotState.stage + '.png',
            potato: 'assets/images/crops/potato-stage-' + plotState.stage + '.png'
        };
        
        const imagePath = cropImages[plotState.crop];
        console.log('🎨 Rendering crop:', plotState.crop, 'Stage:', plotState.stage, 'Path:', imagePath);
        
        if (imagePath) {
            cropOverlay.style.backgroundImage = 'url("' + imagePath + '")';
            cropOverlay.style.backgroundSize = 'contain';
            cropOverlay.style.backgroundRepeat = 'no-repeat';
            cropOverlay.style.backgroundPosition = 'center';
            plotElement.appendChild(cropOverlay);
        }
    }
    
    // Add watered effect if plot is watered
    if (plotState.watered) {
        plotElement.classList.add('watered');
        // Remove watered state after some time for visual feedback
        setTimeout(() => {
            plotElement.classList.remove('watered');
        }, 5000);
    }
}

function updateAlluvialPlotVisuals() {
    const plots = document.querySelectorAll('.farming-plot');
    plots.forEach(plot => {
        const row = parseInt(plot.dataset.row);
        const col = parseInt(plot.dataset.col);
        updatePlotVisual(row, col, plot);
    });
}

// Animation Functions
function addSeedDropAnimation(plotElement, cropType) {
    // Create seed animation element
    const seedAnimation = document.createElement('div');
    seedAnimation.className = 'seed-drop-animation';
    
    // Set seed image based on crop type
    const seedImages = {
        potato: 'assets/images/ui/seeds/potato.png',
        rice: 'assets/images/ui/seeds/rice.png',
    maize: 'assets/images/ui/seeds/maize.png',
        wheat: 'assets/images/ui/seeds/wheat.png'
    };
    
    // Set styles individually
    seedAnimation.style.position = 'absolute';
    seedAnimation.style.top = '-20px';
    seedAnimation.style.left = '50%';
    seedAnimation.style.transform = 'translateX(-50%)';
    seedAnimation.style.width = '20px';
    seedAnimation.style.height = '20px';
    seedAnimation.style.backgroundImage = 'url("' + (seedImages[cropType] || seedImages.potato) + '")';
    seedAnimation.style.backgroundSize = 'contain';
    seedAnimation.style.backgroundRepeat = 'no-repeat';
    seedAnimation.style.backgroundPosition = 'center';
    seedAnimation.style.zIndex = '100';
    seedAnimation.style.animation = 'seedDrop 1s ease-in forwards';
    
    plotElement.appendChild(seedAnimation);
    
    // Remove animation element after completion
    setTimeout(() => {
        if (seedAnimation.parentNode) {
            seedAnimation.remove();
        }
    }, 1000);
}

function addWaterDropAnimation(plotElement) {
    // Create multiple water drops for realistic effect
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const waterDrop = document.createElement('div');
            waterDrop.className = 'water-drop-animation';
            
            // Set styles individually
            waterDrop.style.position = 'absolute';
            waterDrop.style.top = '-10px';
            waterDrop.style.left = (20 + Math.random() * 60) + '%';
            waterDrop.style.width = '8px';
            waterDrop.style.height = '12px';
            waterDrop.style.background = 'linear-gradient(180deg, #87CEEB, #4169E1)';
            waterDrop.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
            waterDrop.style.zIndex = '100';
            waterDrop.style.animation = 'waterDrop 0.8s ease-in forwards';
            
            plotElement.appendChild(waterDrop);
            
            // Add splash effect when drop hits
            setTimeout(() => {
                const splash = document.createElement('div');
                splash.className = 'water-splash-effect';
                splash.style.position = 'absolute';
                splash.style.top = '80%';
                splash.style.left = (20 + Math.random() * 60) + '%';
                splash.style.width = '30px';
                splash.style.height = '30px';
                splash.style.backgroundImage = 'url("assets/images/effects/water-splash.png")';
                splash.style.backgroundSize = 'contain';
                splash.style.backgroundRepeat = 'no-repeat';
                splash.style.backgroundPosition = 'center';
                splash.style.zIndex = '99';
                splash.style.animation = 'splashEffect 0.6s ease-out forwards';
                
                plotElement.appendChild(splash);
                
                setTimeout(() => {
                    if (splash.parentNode) splash.remove();
                }, 600);
            }, 700);
            
            setTimeout(() => {
                if (waterDrop.parentNode) {
                    waterDrop.remove();
                }
            }, 800);
        }, i * 150);
    }
}

function startGrowthTimer(row, col, plotElement) {
    const plotState = window.farmBase.getPlotState(row, col);
    if (!plotState.crop) return;
    
    console.log('🌱 Starting growth timer for ' + plotState.crop + ' at (' + row + ',' + col + ')');
    
    // Set 15-second growth timer with 4 stages (3.75 seconds each)
    const stageInterval = 3750; // 15 seconds / 4 stages
    let currentStage = 1;
    
    const growthTimer = setInterval(() => {
        currentStage++;
        
        // Update plot state
        if (plotState.crop) {
            plotState.stage = currentStage;
            updatePlotVisual(row, col, plotElement);
            
            // Add growth sparkle effect
            addGrowthSparkle(plotElement);
            
            console.log('🌿 ' + plotState.crop + ' at (' + row + ',' + col + ') grew to stage ' + currentStage);
            
            // Check if fully grown
            if (currentStage >= 4) {
                plotState.ready = true;
                plotElement.classList.add('ready-harvest');
                clearInterval(growthTimer);
                
                // Add ready-to-harvest effect
                addReadyToHarvestEffect(plotElement);
                window.farmBase.showMessage('Your ' + plotState.crop + ' is ready to harvest!', 'success');
            }
        } else {
            clearInterval(growthTimer);
        }
    }, stageInterval);
    
    // Store timer reference for potential cleanup
    plotState.growthTimer = growthTimer;
}

function addGrowthSparkle(plotElement) {
    const sparkle = document.createElement('div');
    sparkle.className = 'growth-sparkle';
    sparkle.style.position = 'absolute';
    sparkle.style.top = (30 + Math.random() * 40) + '%';
    sparkle.style.left = (30 + Math.random() * 40) + '%';
    sparkle.style.width = '10px';
    sparkle.style.height = '10px';
    sparkle.style.background = 'radial-gradient(circle, #FFD700, #FFA500)';
    sparkle.style.borderRadius = '50%';
    sparkle.style.zIndex = '98';
    sparkle.style.animation = 'growthSparkle 1s ease-out forwards';
    
    plotElement.appendChild(sparkle);
    
    setTimeout(() => {
        if (sparkle.parentNode) {
            sparkle.remove();
        }
    }, 1000);
}

function addReadyToHarvestEffect(plotElement) {
    plotElement.classList.add('ready-glow');
    
    // Add floating harvest icon
    const harvestIcon = document.createElement('div');
    harvestIcon.className = 'harvest-ready-icon';
    harvestIcon.innerHTML = '🌾';
    harvestIcon.style.position = 'absolute';
    harvestIcon.style.top = '-15px';
    harvestIcon.style.right = '-10px';
    harvestIcon.style.fontSize = '20px';
    harvestIcon.style.zIndex = '101';
    harvestIcon.style.animation = 'bounceFloat 2s ease-in-out infinite';
    
    plotElement.appendChild(harvestIcon);
}

// Override the water effect function
function addWaterEffect(plotElement) {
    addWaterDropAnimation(plotElement);
    
    // Add water effect overlay
    const waterEffect = document.createElement('div');
    waterEffect.className = 'water-effect-overlay';
    waterEffect.style.position = 'absolute';
    waterEffect.style.top = '0';
    waterEffect.style.left = '0';
    waterEffect.style.right = '0';
    waterEffect.style.bottom = '0';
    waterEffect.style.backgroundImage = 'url("assets/images/effects/water-effect.png")';
    waterEffect.style.backgroundSize = 'cover';
    waterEffect.style.backgroundRepeat = 'no-repeat';
    waterEffect.style.backgroundPosition = 'center';
    waterEffect.style.opacity = '0.7';
    waterEffect.style.zIndex = '95';
    waterEffect.style.animation = 'fadeInOut 2s ease-in-out forwards';
    
    plotElement.appendChild(waterEffect);
    
    setTimeout(() => {
        if (waterEffect.parentNode) {
            waterEffect.remove();
        }
    }, 2000);
}

function setupRiverInteractions() {
    // Simple river interactions
    console.log('River interactions setup');
}

function setupWeatherEffects() {
    // Simple weather effects
    console.log('Weather effects setup');
}