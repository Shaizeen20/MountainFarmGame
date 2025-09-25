// Mountain Farm specific functionality with landscape view interactions

document.addEventListener('DOMContentLoaded', function() {
    console.log('Mountain Farm JS Loaded');
    
    // Initialize specific mountain farm features
    setupMountainPlots();
    setupFarmCells();
    setupMountainToolSelection();
    setupWeatherSystem();
    setupAltitudeEffects();
    
    // Override base plot visual updates
    window.farmBase.updatePlotVisuals = updateMountainPlotVisuals;

    // Fetch market prices initially and refresh periodically to use real prices
    try {
        if (window.farmBase.fetchPrices) {
            window.farmBase.fetchPrices();
            setInterval(() => window.farmBase.fetchPrices(), 30000);
        }
    } catch(e) { console.warn('Price fetch setup failed', e); }

    // Re-apply dynamic economy after page-specific initializations
    try {
        if (window.farmBase && window.farmBase.saveGameState) {
            // Slight delay to allow loadGameState normalization
            setTimeout(() => {
                if (typeof applyDynamicEconomy === 'function') {
                    applyDynamicEconomy();
                    window.farmBase.updateResourceDisplay();
                    window.farmBase.renderStorageUI && window.farmBase.renderStorageUI();
                }
            }, 100);
        }
    } catch(e) {}

    // Mountain personal tips UI
    try {
        const inEl = document.getElementById('mountain-tip-input');
        const btn = document.getElementById('save-mountain-tip');
        const list = document.getElementById('mountain-tips-list');
        function render(){
            const arr = JSON.parse(localStorage.getItem('mountainTips')||'[]');
            if (list) list.innerHTML = arr.slice(-5).map(t=>'<div>• '+escapeHtml(t)+'</div>').join('');
        }
        function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
        if (btn && inEl) {
            btn.addEventListener('click', function(){
                const v = (inEl.value||'').trim();
                if (!v) return;
                const arr = JSON.parse(localStorage.getItem('mountainTips')||'[]');
                arr.push(v);
                localStorage.setItem('mountainTips', JSON.stringify(arr));
                inEl.value = '';
                render();
                window.farmBase.showMessage('Saved your tip.', 'success');
            });
            render();
        }
    } catch(e) {}
});

// Ensure clicking tool buttons updates selected tool and UI state
function setupMountainToolSelection() {
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            toolBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const tool = this.getAttribute('data-tool');
            if (tool) {
                window.farmBase.gameState.selectedTool = tool;
            }
        });
    });
}

// Support clicks on the center "farm-cell" grid as well as the terrace plots
function setupFarmCells() {
    const cells = document.querySelectorAll('.farm-cell');
    cells.forEach(cell => {
        const row = parseInt(cell.getAttribute('data-row'));
        const col = parseInt(cell.getAttribute('data-col'));
        cell.addEventListener('click', function(e){
            e.preventDefault();
            handleMountainPlotClick(row, col, cell);
        });
    });
}

function setupMountainPlots() {
    const farmingPlots = document.querySelectorAll('.farming-plot');
    
    farmingPlots.forEach(plot => {
        const row = parseInt(plot.dataset.row);
        const col = parseInt(plot.dataset.col);
        
        // Add click handler for plot interactions
        plot.addEventListener('click', function(e) {
            e.preventDefault();
            handleMountainPlotClick(row, col, plot);
        });
        
        // Add hover effects with altitude consideration
        plot.addEventListener('mouseenter', function() {
            if (!plot.classList.contains('has-crop')) {
                const altitude = getMountainAltitude(row);
                const brightness = 1.2 - (altitude * 0.1); // Higher altitude = less bright
                plot.style.filter = `brightness(${brightness}) contrast(1.1)`;
            }
        });
        
        plot.addEventListener('mouseleave', function() {
            plot.style.filter = '';
        });
        
        // Initialize plot visual state
        updateMountainPlotVisual(row, col, plot);
    });
}

function getMountainAltitude(row) {
    // Higher rows = higher altitude, more challenging conditions
    const altitudes = {
        1: 0.8, // High altitude - harsh conditions
        2: 0.5, // Mid slope - moderate conditions  
        3: 0.2  // Lower slope - better conditions
    };
    return altitudes[row] || 0.5;
}

function handleMountainPlotClick(row, col, plotElement) {
    const plotState = window.farmBase.getPlotState(row, col);
    const tool = window.farmBase.gameState.selectedTool;
    const crop = window.farmBase.gameState.selectedCrop;
    const altitude = getMountainAltitude(row);
    
    console.log(`Mountain Plot (${row},${col}) clicked with tool: ${tool}, altitude: ${altitude}`);
    
    switch(tool) {
        case 'alpine':
            // Alpine plow tool - prepares harsh mountain soil
            if (!plotState.crop) {
                prepareMountainSoil(row, col, plotElement);
            } else {
                window.farmBase.showMessage('Plot already has crops!', 'warning');
            }
            break;
            
        case 'plant':
            // Plant hardy mountain crops
            if (!plotState.crop) {
                if (canPlantAtAltitude(crop, altitude)) {
                    if (window.farmBase.plantCrop(row, col, crop)) {
                        updateMountainPlotVisual(row, col, plotElement);
                        addMountainPlantingEffect(plotElement, altitude);
                    }
                } else {
                    window.farmBase.showMessage(`${crop} cannot survive at this altitude!`, 'error');
                }
            } else if (plotState.ready) {
                if (window.farmBase.harvestCrop(row, col)) {
                    updateMountainPlotVisual(row, col, plotElement);
                    addMountainHarvestEffect(plotElement);
                }
            } else {
                window.farmBase.showMessage('This plot already has crops growing!', 'warning');
            }
            break;
            
        case 'greenhouse':
            // Build greenhouse for protection
            buildGreenhouse(row, col, plotElement);
            break;
            
        case 'windbreak':
            // Build windbreak protection
            buildWindbreak(row, col, plotElement);
            break;
            
        case 'harvest':
            // Harvesting tool
            if (plotState.crop && plotState.ready) {
                if (window.farmBase.harvestCrop(row, col)) {
                    updateMountainPlotVisual(row, col, plotElement);
                    addMountainHarvestEffect(plotElement);
                }
            } else if (plotState.crop) {
                window.farmBase.showMessage('Crop is not ready for harvest yet!', 'warning');
            } else {
                window.farmBase.showMessage('Nothing to harvest here!', 'warning');
            }
            break;
            
        case 'inspect':
            // Inspect plot conditions
            inspectMountainConditions(row, col, plotElement);
            break;
        case 'asset-compost':
            placeSustainableAssetMountain(row, col, plotElement, 'compost');
            break;
        case 'asset-mulch':
            placeSustainableAssetMountain(row, col, plotElement, 'mulch');
            break;
        case 'asset-drip':
            placeSustainableAssetMountain(row, col, plotElement, 'drip');
            break;
        case 'asset-rainwater':
            placeSustainableAssetMountain(row, col, plotElement, 'rainwater');
            break;
        case 'asset-solar':
            placeSustainableAssetMountain(row, col, plotElement, 'solar');
            break;
        case 'asset-wind':
            placeSustainableAssetMountain(row, col, plotElement, 'wind');
            break;
        case 'asset-biogas':
            placeSustainableAssetMountain(row, col, plotElement, 'biogas');
            break;
        case 'asset-trees':
            placeSustainableAssetMountain(row, col, plotElement, 'trees');
            break;
        case 'asset-remove':
            removeOneAssetMountain(row, col, plotElement);
            break;
    }
}

function canPlantAtAltitude(crop, altitude) {
    const altitudeTolerance = {
        buckwheat: 0.9,  // Very hardy, can grow at high altitude
        barley: 0.7,     // Hardy, good for mountain farming
        potato: 0.6,     // Moderately hardy
        herbs: 0.8,      // Alpine herbs are adapted to mountains
        rye: 0.8,        // Hardy grain
        oats: 0.5        // Less hardy, needs lower altitudes
    };
    
    return altitude <= (altitudeTolerance[crop] || 0.5);
}

function prepareMountainSoil(row, col, plotElement) {
    if (window.farmBase.gameState.resources.coins < 10) {
        window.farmBase.showMessage('Need ₹10 to prepare mountain soil!', 'error');
        return;
    }
    
    window.farmBase.gameState.resources.coins -= 10;
    window.farmBase.updateResourceDisplay();
    
    // Mark plot as prepared
    window.farmBase.setPlotState(row, col, { prepared: true });
    
    plotElement.classList.add('prepared');
    addSoilPreparationEffect(plotElement);
    window.farmBase.showMessage('Mountain soil prepared!', 'success');
}

function buildGreenhouse(row, col, plotElement) {
    const cost = 50;
    if (window.farmBase.gameState.resources.coins < cost) {
        window.farmBase.showMessage(`Need ₹${cost} to build greenhouse!`, 'error');
        return;
    }
    
    window.farmBase.gameState.resources.coins -= cost;
    window.farmBase.updateResourceDisplay();
    
    // Mark plot as having greenhouse
    window.farmBase.setPlotState(row, col, { greenhouse: true });
    
    plotElement.classList.add('greenhouse');
    addGreenhouseEffect(plotElement);
    window.farmBase.showMessage('Greenhouse built! Protection from harsh weather.', 'success');
}

function buildWindbreak(row, col, plotElement) {
    const cost = 25;
    if (window.farmBase.gameState.resources.coins < cost) {
        window.farmBase.showMessage(`Need ₹${cost} to build windbreak!`, 'error');
        return;
    }
    
    window.farmBase.gameState.resources.coins -= cost;
    window.farmBase.updateResourceDisplay();
    
    // Mark plot as having windbreak
    window.farmBase.setPlotState(row, col, { windbreak: true });
    
    plotElement.classList.add('windbreak');
    addWindbreakEffect(plotElement);
    window.farmBase.showMessage('Windbreak built! Protection from strong winds.', 'success');
}

function inspectMountainConditions(row, col, plotElement) {
    const altitude = getMountainAltitude(row);
    const plotState = window.farmBase.getPlotState(row, col);
    
    let conditions = [];
    conditions.push(`Altitude Level: ${Math.round(altitude * 100)}%`);
    conditions.push(`Temperature: ${Math.round(18 - altitude * 15)}°C`);
    conditions.push(`Wind Speed: ${Math.round(altitude * 40 + 10)} km/h`);
    
    if (plotState.greenhouse) conditions.push('🏠 Protected by greenhouse');
    if (plotState.windbreak) conditions.push('🌲 Protected by windbreak');
    if (plotState.prepared) conditions.push('🛠️ Soil prepared');
    
    window.farmBase.showMessage(conditions.join(' | '), 'info');
}

function updateMountainPlotVisual(row, col, plotElement) {
    const plotState = window.farmBase.getPlotState(row, col);
    
    // Reset classes
    plotElement.classList.remove('has-crop', 'stage-1', 'stage-2', 'stage-3', 'stage-4', 'ready');
    
    if (plotState.crop) {
        plotElement.classList.add('has-crop');
        plotElement.classList.add(`stage-${plotState.stage}`);
        
        if (plotState.ready) {
            plotElement.classList.add('ready');
        }
        
        // Set crop-specific background for mountain crops
        const mountainCropImages = {
            buckwheat: 'url("assets/crops/buckwheat-stage-' + plotState.stage + '.png")',
            barley: 'url("assets/crops/barley-stage-' + plotState.stage + '.png")',
            potato: 'url("assets/crops/potato-stage-' + plotState.stage + '.png")',
            herbs: 'url("assets/crops/herbs-stage-' + plotState.stage + '.png")',
            rye: 'url("assets/crops/rye-stage-' + plotState.stage + '.png")',
            oats: 'url("assets/crops/oats-stage-' + plotState.stage + '.png")'
        };
        
        // Get appropriate mountain plot background based on row
        let plotBackground = '';
        if (row === 1) plotBackground = 'url("assets/environment/plot-rocky.png")';
        else if (row === 2) plotBackground = 'url("assets/environment/plot-mountain.png")';
        else plotBackground = 'url("assets/environment/plot-fertile.png")';
        
        if (mountainCropImages[plotState.crop]) {
            plotElement.style.backgroundImage = `${mountainCropImages[plotState.crop]}, ${plotBackground}`;
            plotElement.style.backgroundSize = 'cover, cover';
            plotElement.style.backgroundPosition = 'center, center';
        }
    } else {
        // Reset to default mountain plot appearance based on altitude
        if (row === 1) {
            plotElement.style.backgroundImage = 'url("assets/environment/plot-rocky.png")';
        } else if (row === 2) {
            plotElement.style.backgroundImage = 'url("assets/environment/plot-mountain.png")';
        } else {
            plotElement.style.backgroundImage = 'url("assets/environment/plot-fertile.png")';
        }
        plotElement.style.backgroundSize = 'cover';
        plotElement.style.backgroundPosition = 'center';
    }
    
    // Add special building effects
    if (plotState.greenhouse) {
        plotElement.classList.add('greenhouse');
    }
    if (plotState.windbreak) {
        plotElement.classList.add('windbreak');
    }
    if (plotState.prepared) {
        plotElement.classList.add('prepared');
    }
}

function updateMountainPlotVisuals() {
    const plots = document.querySelectorAll('.farming-plot');
    plots.forEach(plot => {
        const row = parseInt(plot.dataset.row);
        const col = parseInt(plot.dataset.col);
        updateMountainPlotVisual(row, col, plot);
    });
}

function addMountainPlantingEffect(plotElement, altitude) {
    // Different planting effect based on altitude
    const seedEffect = document.createElement('div');
    seedEffect.className = 'mountain-planting-effect';
    
    // Harsher conditions at higher altitude
    const effectIntensity = 1 - altitude * 0.5;
    
    seedEffect.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${15 + effectIntensity * 10}px;
        height: ${15 + effectIntensity * 10}px;
        background: radial-gradient(circle, #8B4513, #A0522D);
        border-radius: 50%;
        pointer-events: none;
        animation: mountainPlanting 2s ease-out forwards;
    `;
    
    plotElement.appendChild(seedEffect);
    
    setTimeout(() => {
        if (seedEffect.parentNode) {
            seedEffect.parentNode.removeChild(seedEffect);
        }
    }, 2000);
}

function addMountainHarvestEffect(plotElement) {
    // Create mountain harvest effect with snow sparkles
    for (let i = 0; i < 6; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'mountain-harvest-sparkle';
        sparkle.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: linear-gradient(45deg, #FFD700, #F0F8FF);
            border-radius: 50%;
            pointer-events: none;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: mountainSparkle 2.5s ease-out forwards;
        `;
        
        plotElement.appendChild(sparkle);
        
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 2500);
    }
}

function addSoilPreparationEffect(plotElement) {
    const prepEffect = document.createElement('div');
    prepEffect.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, 
            transparent 0%, 
            rgba(139, 69, 19, 0.3) 25%, 
            transparent 50%, 
            rgba(160, 82, 45, 0.3) 75%, 
            transparent 100%
        );
        pointer-events: none;
        animation: soilPrep 3s ease-out forwards;
    `;
    
    plotElement.appendChild(prepEffect);
    
    setTimeout(() => {
        if (prepEffect.parentNode) {
            prepEffect.parentNode.removeChild(prepEffect);
        }
    }, 3000);
}

function addGreenhouseEffect(plotElement) {
    const greenhouse = document.createElement('div');
    greenhouse.style.cssText = `
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        border: 3px solid rgba(0, 255, 0, 0.6);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        pointer-events: none;
        animation: greenhouseBuild 2s ease-out forwards;
    `;
    
    plotElement.appendChild(greenhouse);
}

function addWindbreakEffect(plotElement) {
    const windbreak = document.createElement('div');
    windbreak.style.cssText = `
        position: absolute;
        top: -3px;
        left: -8px;
        width: 6px;
        height: calc(100% + 6px);
        background: linear-gradient(to bottom, #228B22, #32CD32);
        border-radius: 3px;
        pointer-events: none;
        animation: windbreakBuild 1.5s ease-out forwards;
    `;
    
    plotElement.appendChild(windbreak);
}

function setupWeatherSystem() {
    // Simulate mountain weather patterns
    setInterval(() => {
        const weatherChance = Math.random();
        
        if (weatherChance < 0.05) {
            triggerSnowfall();
        } else if (weatherChance < 0.1) {
            triggerMountainWind();
        } else if (weatherChance < 0.15) {
            triggerSunnyWeather();
        }
    }, 20000); // Check every 20 seconds
}

function triggerSnowfall() {
    window.farmBase.showMessage('❄️ Light snowfall! Temperature drops.', 'info');
    
    // Create snow effect
    createSnowEffect();
    
    // Temporarily reduce growth rates for unprotected crops
    Object.keys(window.farmBase.gameState.plots).forEach(plotKey => {
        const plot = window.farmBase.gameState.plots[plotKey];
        if (plot.crop && !plot.greenhouse) {
            plot.coldSlowed = true;
        }
    });
}

function triggerMountainWind() {
    window.farmBase.showMessage('🌬️ Strong mountain winds!', 'warning');
    
    // Add wind effect
    const windEffect = document.createElement('div');
    windEffect.className = 'mountain-wind';
    document.querySelector('#farming-area').appendChild(windEffect);
    
    setTimeout(() => {
        if (windEffect.parentNode) {
            windEffect.parentNode.removeChild(windEffect);
        }
    }, 5000);
}

function triggerSunnyWeather() {
    window.farmBase.showMessage('☀️ Beautiful mountain sunshine!', 'success');
    
    // Boost growth for all crops
    Object.keys(window.farmBase.gameState.plots).forEach(plotKey => {
        const plot = window.farmBase.gameState.plots[plotKey];
        if (plot.crop) {
            plot.sunBoosted = true;
        }
    });
}

function createSnowEffect() {
    const snowContainer = document.createElement('div');
    snowContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 500;
    `;
    
    // Create snowflakes
    for (let i = 0; i < 30; i++) {
        const snowflake = document.createElement('div');
        snowflake.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #F0F8FF;
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: -10px;
            animation: snowfall ${3 + Math.random() * 2}s linear infinite;
            animation-delay: ${Math.random() * 3}s;
        `;
        snowContainer.appendChild(snowflake);
    }
    
    document.body.appendChild(snowContainer);
    
    // Remove snow effect after 15 seconds
    setTimeout(() => {
        if (snowContainer.parentNode) {
            snowContainer.parentNode.removeChild(snowContainer);
        }
    }, 15000);
}

function setupAltitudeEffects() {
    // Modify growth rates based on altitude
    const originalUpdateCropGrowth = window.farmBase.updateCropGrowth;
    
    window.farmBase.updateCropGrowth = function() {
        Object.keys(window.farmBase.gameState.plots).forEach(plotKey => {
            const [row] = plotKey.split('-').map(Number);
            const plot = window.farmBase.gameState.plots[plotKey];
            
            if (plot.crop) {
                const altitude = getMountainAltitude(row);
                
                // Higher altitude = slower growth unless protected
                if (!plot.greenhouse && !plot.windbreak) {
                    plot.altitudeSlowdown = altitude * 0.5;
                }
            }
        });
        
        // Call original function
        originalUpdateCropGrowth.call(this);
    };
}

// Add CSS animations for mountain effects
const style = document.createElement('style');
style.textContent = `
    @keyframes mountainPlanting {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
        50% { transform: translate(-50%, -50%) scale(1.3) rotate(180deg); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0) rotate(360deg); }
    }
    
    @keyframes mountainSparkle {
        0% { opacity: 1; transform: scale(0) rotate(0deg); }
        50% { opacity: 1; transform: scale(1.5) rotate(180deg); }
        100% { opacity: 0; transform: scale(0) rotate(360deg); }
    }
    
    @keyframes soilPrep {
        0% { opacity: 0; }
        50% { opacity: 0.8; }
        100% { opacity: 0; }
    }
    
    @keyframes greenhouseBuild {
        0% { opacity: 0; transform: scale(0.5); }
        100% { opacity: 1; transform: scale(1); }
    }
    
    @keyframes windbreakBuild {
        0% { opacity: 0; height: 0; }
        100% { opacity: 1; height: calc(100% + 6px); }
    }
    
    @keyframes snowfall {
        to { transform: translateY(100vh) rotate(360deg); }
    }
    
    .farming-plot.prepared {
        border: 2px solid rgba(139, 69, 19, 0.5);
    }
    
    .farming-plot.greenhouse {
        box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
    }
    
    .farming-plot.windbreak {
        border-left: 4px solid #228B22;
    }
`;

document.head.appendChild(style);

// Mountain sustainable asset helpers
function placeSustainableAssetMountain(row, col, plotElement, key) {
    const state = window.farmBase.getPlotState(row, col);
    if (state && state.assets && state.assets[key]) {
        window.farmBase.showMessage('This plot already has ' + key + ' installed.', 'info');
        return;
    }
    if (window.farmBase.setPlotAsset) {
        const ok = window.farmBase.setPlotAsset(row, col, key, true);
        if (!ok) return;
    }
    const prev = plotElement.querySelector('.asset-icon.' + key);
    if (prev) prev.remove();
    const icon = document.createElement('div');
    icon.className = 'asset-icon ' + key;
    icon.style.position = 'absolute';
    icon.style.width = '26px';
    icon.style.height = '26px';
    icon.style.backgroundSize = 'contain';
    icon.style.backgroundRepeat = 'no-repeat';
    icon.style.zIndex = '103';
    if (key === 'drip') { icon.style.right = '4px'; icon.style.bottom = '4px'; icon.style.backgroundImage = 'url("assets/images/sustainable/water/drip-controller.png")'; }
    else if (key === 'rainwater') { icon.style.left = '4px'; icon.style.bottom = '4px'; icon.style.backgroundImage = 'url("assets/images/sustainable/water/rainwater-tank.png")'; }
    else if (key === 'compost') { icon.style.left = '4px'; icon.style.top = '4px'; icon.style.backgroundImage = 'url("assets/images/sustainable/soil/compost-pit.png")'; }
    else if (key === 'mulch') { icon.style.right = '4px'; icon.style.top = '4px'; icon.style.backgroundImage = 'url("assets/images/sustainable/soil/mulch.png")'; }
    else if (key === 'solar') { icon.style.left = '50%'; icon.style.top = '50%'; icon.style.transform = 'translate(-50%, -50%)'; icon.style.backgroundImage = 'url("assets/images/sustainable/energy/solar-pump.png")'; }
    else if (key === 'wind') { icon.style.left = 'calc(50% - 13px)'; icon.style.top = '2px'; icon.style.backgroundImage = 'url("assets/images/sustainable/energy/wind-turbine.png")'; }
    else if (key === 'biogas') { icon.style.left = '2px'; icon.style.bottom = '2px'; icon.style.backgroundImage = 'url("assets/images/sustainable/energy/biogas.png")'; }
    else if (key === 'trees') { icon.style.right = '2px'; icon.style.top = '2px'; icon.style.backgroundImage = 'url("assets/images/sustainable/energy/trees.png")'; }
    plotElement.appendChild(icon);
    window.farmBase.showMessage('Installed ' + key + ' on this plot.', 'success');
}

function removeOneAssetMountain(row, col, plotElement) {
    const state = window.farmBase.getPlotState(row, col);
    if (!state || !state.assets) {
        window.farmBase.showMessage('No assets installed here.', 'info');
        return;
    }
    const keys = ['drip','rainwater','compost','mulch','solar','wind','biogas','trees'];
    const toRemove = keys.find(k => !!state.assets[k]);
    if (!toRemove) { window.farmBase.showMessage('No assets installed here.', 'info'); return; }
    const ok = window.farmBase.setPlotAsset(row, col, toRemove, false);
    if (!ok) return;
    const prev = plotElement.querySelector('.asset-icon.' + toRemove);
    if (prev) prev.remove();
    window.farmBase.showMessage('Removed ' + toRemove + ' and returned to inventory.', 'success');
}