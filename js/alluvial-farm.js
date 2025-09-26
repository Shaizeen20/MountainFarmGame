// Alluvial Farm specific functionality with landscape view interactions

document.addEventListener('DOMContentLoaded', function() {
    // Buy item selection logic
    let selectedBuyItem = 'seeds';
    const buyItemBtns = document.querySelectorAll('.buy-item-btn');
    buyItemBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            buyItemBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedBuyItem = btn.getAttribute('data-item');
        });
    });
    // Set default active
    if (buyItemBtns.length) buyItemBtns[0].classList.add('active');

    // Sell item selection logic
    let selectedSellItem = 'rice';
    const sellItemBtns = document.querySelectorAll('.sell-item-btn');
    sellItemBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            sellItemBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSellItem = btn.getAttribute('data-item');
        });
    });
    // Set default active
    if (sellItemBtns.length) sellItemBtns[0].classList.add('active');
    // Sell channel selection logic
    let selectedSellChannel = 'local-market';
    const channelBtns = document.querySelectorAll('.sell-channel-btn');
    channelBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            channelBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSellChannel = btn.getAttribute('data-channel');
        });
    });
    // Set default active
    if (channelBtns.length) channelBtns[0].classList.add('active');
    // ...existing code...
    // ...existing code...
    
    // Initialize specific alluvial farm features
    setupLandscapePlots();
    setupRiverInteractions();
    setupWeatherEffects();
    
    // Override base plot visual updates
    window.farmBase.updatePlotVisuals = updateAlluvialPlotVisuals;
    // Take over base growth so this page uses a fixed 15s growth flow
    window.farmBase.disableBaseGrowth = true;
    // Local parameter tick so UI moves when base growth loop is disabled
    setInterval(() => {
        try {
            const p = window.farmBase.gameState.params;
            // small passive decay in groundwater; clamp
            p.groundwater = Math.max(0, Math.min(1, p.groundwater - 0.0015));
            window.farmBase.updateParametersUI();
            window.farmBase.saveGameState && window.farmBase.saveGameState();
        } catch(e) {}
    }, 4000);

    // Ensure Plant is the default selected tool for this page regardless of saved state
    try {
        window.farmBase.gameState.selectedTool = 'plant';
        // Sync UI active state with selected tool
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(b => b.classList.remove('active'));
        const plantBtn = document.querySelector('.tool-btn[data-tool="plant"]');
        if (plantBtn) plantBtn.classList.add('active');
        if (typeof updateCursor === 'function') updateCursor();
        console.log('🔧 Forced selected tool to plant on load');
    } catch (e) {
        console.warn('Could not sync default tool:', e);
    }

    // Defensive: delegate tool and crop selection to ensure state updates
    document.body.addEventListener('click', function(ev) {
        const toolBtn = ev.target.closest && ev.target.closest('.tool-btn');
        if (toolBtn) {
            const tool = toolBtn.getAttribute('data-tool');
            if (tool) {
                window.farmBase.gameState.selectedTool = tool;
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                toolBtn.classList.add('active');
                if (typeof updateCursor === 'function') updateCursor();
                console.log('🛠️ (delegated) Selected tool:', tool);
            }
        }
        const cropOption = ev.target.closest && ev.target.closest('.crop-option');
        if (cropOption) {
            const crop = cropOption.getAttribute('data-crop');
            if (crop) {
                window.farmBase.gameState.selectedCrop = crop;
                document.querySelectorAll('.crop-option').forEach(o => o.classList.remove('active'));
                cropOption.classList.add('active');
                console.log('🌾 (delegated) Selected crop:', crop);
                renderSelectedCropDetails();
                // Hard-mode hint on selection: preview suitability
                try {
                    const el = document.querySelector('.farming-plot');
                    if (el && typeof window.farmBase.evaluateCropSuitability === 'function') {
                        const r = parseInt(el.getAttribute('data-row')||'1');
                        const c = parseInt(el.getAttribute('data-col')||'1');
                        const evres = window.farmBase.evaluateCropSuitability(crop, r, c);
                        if (!evres.allowed) {
                            window.farmBase.showMessage(evres.reasons && evres.reasons[0] ? evres.reasons[0] : 'Currently unsuitable to plant ' + crop + '.', 'warning');
                        } else if (evres.penalty < 0.95) {
                            const pct = Math.round((1-evres.penalty)*100);
                            window.farmBase.showMessage('Conditions marginal for ' + crop + ' (≈ -' + pct + '% yield).', 'info');
                        }
                    }
                } catch(e) {}
            }
        }
    });
    // initial details render
    renderSelectedCropDetails();

    // Initialize icon tabs and proactive mentor recommendations
    setupIconTabs();
    renderMentorRecommendations();
    // Refresh mentor recommendations periodically as conditions change
    setInterval(renderMentorRecommendations, 6000);


    // Advanced Buy/Sell logic
    const buyBtn = document.getElementById('buy-btn');
    const sellBtn = document.getElementById('sell-btn');
    const buyItem = document.getElementById('buy-item');
    const buyQty = document.getElementById('buy-qty');
    const sellItem = document.getElementById('sell-item');
    const sellQty = document.getElementById('sell-qty');
    const sellChannel = document.getElementById('sell-channel');
    const buySellMsg = document.getElementById('buy-sell-message');
    const yieldMeter = document.getElementById('yield-meter');
    const qualityMeter = document.getElementById('quality-meter');
    const yieldValue = document.getElementById('yield-value');
    const qualityValue = document.getElementById('quality-value');

    // Game state inventory and meters
    const gameState = window.farmBase && window.farmBase.gameState ? window.farmBase.gameState : {};
    if (!gameState.inventory) gameState.inventory = { seeds: 1000, compost: 10, rice: 0, wheat: 0, maize: 0, potato: 0 };
    if (gameState.currency === undefined) gameState.currency = 100;
    if (gameState.yield === undefined) gameState.yield = 70;
    if (gameState.quality === undefined) gameState.quality = 80;

    // Meter UI sync
    function updateMeters() {
        if (yieldMeter) yieldMeter.value = gameState.yield;
        if (yieldValue) yieldValue.textContent = gameState.yield;
        if (qualityMeter) qualityMeter.value = gameState.quality;
        if (qualityValue) qualityValue.textContent = gameState.quality;
    }

    // Inventory UI sync
    function updateInventoryUI() {
        const inv = gameState.inventory;
        const coins = gameState.currency || 0;
        const invList = document.getElementById('inventory-list');
        if (invList) {
            invList.textContent = `Seeds: ${inv.seeds || 0}, Compost: ${inv.compost || 0}, Rice: ${inv.rice || 0}, Wheat: ${inv.wheat || 0}, Maize: ${inv.maize || 0}, Potato: ${inv.potato || 0}, Coins: ${coins}`;
        }
    }

    // Buy logic
    buyBtn && buyBtn.addEventListener('click', function() {
    const item = selectedBuyItem;
        const qty = parseInt(buyQty.value);
        if (!item || qty < 1) return;
        // Prices
        const prices = { seeds: 2, compost: 5 };
        const cost = prices[item] * qty;
        if (gameState.currency < cost) {
            buySellMsg.textContent = `Not enough coins! Need ${cost} coins.`;
            return;
        }
        gameState.currency -= cost;
        gameState.inventory[item] = (gameState.inventory[item] || 0) + qty;
        // Buying compost increases organic quality
        if (item === 'compost') {
            gameState.quality = Math.min(100, gameState.quality + qty);
        }
        buySellMsg.textContent = `Bought ${qty} ${item} for ${cost} coins.`;
        updateInventoryUI();
        updateMeters();
    });

    // Sell logic
    sellBtn && sellBtn.addEventListener('click', function() {
    const crop = selectedSellItem;
        const qty = parseInt(sellQty.value);
        const channel = selectedSellChannel;
        if (!crop || qty < 1 || !channel) return;
        if ((gameState.inventory[crop] || 0) < qty) {
            buySellMsg.textContent = `Not enough ${crop} to sell!`;
            return;
        }
        // Stricter parameter checks
        const params = window.farmBase && window.farmBase.gameState && window.farmBase.gameState.params ? window.farmBase.gameState.params : {};
        if ((params.soilHealth !== undefined && params.soilHealth < 0.5) ||
            (params.groundwater !== undefined && params.groundwater < 0.4) ||
            (params.ph !== undefined && (params.ph < 6.0 || params.ph > 7.5)) ||
            gameState.yield < 40 || gameState.quality < 50) {
            buySellMsg.textContent = `Sale denied: Farm parameters too low. Soil health, groundwater, pH, yield, and quality must be higher for market sales.`;
            return;
        }
        // Dynamic pricing
        let basePrice = 10;
        if (crop === 'rice') basePrice = 12;
        if (crop === 'wheat') basePrice = 10;
        if (crop === 'maize') basePrice = 8;
        if (crop === 'potato') basePrice = 9;
        // Channel multipliers
        let channelMult = 1;
        if (channel === 'local-market') channelMult = 1.2;
        if (channel === 'middleman') channelMult = 1.0;
        if (channel === 'government') channelMult = 0.9;
        // Meter effects
        const yieldMult = 0.5 + (gameState.yield / 200); // 0.5 to 1.0
        const qualityMult = 0.5 + (gameState.quality / 200); // 0.5 to 1.0
        const price = Math.round(basePrice * channelMult * yieldMult * qualityMult * qty);
        gameState.inventory[crop] -= qty;
        gameState.currency += price;
        let channelLabel = '';
        if (channel === 'local-market') channelLabel = 'Local Market';
        if (channel === 'middleman') channelLabel = 'Trader/Middleman';
        if (channel === 'government') channelLabel = 'Government Procurement';
        buySellMsg.textContent = `Sold ${qty} ${crop} via ${channelLabel} for ${price} coins.`;
        // Selling to local market increases yield, to government increases quality
        if (channel === 'local-market') gameState.yield = Math.min(100, gameState.yield + 2 * qty);
        if (channel === 'government') gameState.quality = Math.min(100, gameState.quality + 2 * qty);
        updateInventoryUI();
        updateMeters();
    });

    updateInventoryUI();
    updateMeters();
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
    console.log('🖱️ Plot click at', row, col, 'with tool:', tool, 'crop:', crop);
    
    switch(tool) {
        case 'canal':
            // Placeholder: canal building coming soon
            window.farmBase.showMessage('Canal building coming soon. Use 🌱 to plant or 💧 to water.', 'info');
            break;
            
        case 'plant':
            // Immediate planting: plant first, then show AI probability as feedback
            if (!plotState.crop) {
                console.log('🌱 Planting immediately:', crop, 'at', row, col);
                if (window.farmBase.plantCrop(row, col, crop)) {
                    addSeedDropAnimation(plotElement, crop);
                    updatePlotVisual(row, col, plotElement);
                    startGrowthTimer(row, col, plotElement);
                    // Fetch probability asynchronously and inform player
                    window.farmBase.getProbability(crop, row, col).then(prob => {
                        if (prob < 0.5) {
                            window.farmBase.showMessage('Heads up: success probability is only ' + Math.round(prob*100) + '%. Improve practices or weather.', 'warning');
                        }
                    }).catch(()=>{});
                }
            } else if (plotState.ready) {
                // Do NOT auto-harvest on Plant tool; prompt user to use Harvest tool
                window.farmBase.showMessage('Crop is ready! Switch to Harvest (🌾) to collect.', 'info');
            } else {
                window.farmBase.showMessage('This plot already has crops growing!', 'warning');
            }
            break;
        case 'asset-compost':
            placeSustainableAsset(row, col, plotElement, 'compost');
            break;
        case 'asset-drip':
            placeSustainableAsset(row, col, plotElement, 'drip');
            break;
        case 'asset-rainwater':
            placeSustainableAsset(row, col, plotElement, 'rainwater');
            break;
        case 'asset-mulch':
            placeSustainableAsset(row, col, plotElement, 'mulch');
            break;
        case 'asset-solar':
            placeSustainableAsset(row, col, plotElement, 'solar');
            break;
        case 'asset-wind':
            placeSustainableAsset(row, col, plotElement, 'wind');
            break;
        case 'asset-biogas':
            placeSustainableAsset(row, col, plotElement, 'biogas');
            break;
        case 'asset-trees':
            placeSustainableAsset(row, col, plotElement, 'trees');
            break;
        case 'asset-remove':
            removeOneAsset(row, col, plotElement);
            break;
            
        case 'water':
            // Watering tool
            if (plotState.crop) {
                if (window.farmBase.waterPlot(row, col)) {
                    addWaterEffect(plotElement);
                    // For now, watering also advances growth by one stage
                    nudgeGrowth(row, col, plotElement, 'water');
                }
            } else {
                window.farmBase.showMessage('Plant something first!', 'warning');
            }
            break;
        
        case 'fertilizer':
            // Fertilizer tool speeds growth visually and gives feedback
            if (plotState.crop) {
                applyFertilizerEffect(row, col, plotElement);
                // For now, fertilizer also advances growth by one stage (handled inside effect)
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
                maize: 'assets/images/crops/maize-stage-' + plotState.stage + '.png', // if you later rename to corn, we can map or alias
                wheat: 'assets/images/crops/wheat-stage-' + plotState.stage + '.png',
                potato: 'assets/images/crops/potato-stage-' + plotState.stage + '.png',
                tea: 'assets/images/crops/tea-stage-' + plotState.stage + '.png'
            };
        
        const imagePath = cropImages[plotState.crop];
        console.log('🎨 Rendering crop:', plotState.crop, 'Stage:', plotState.stage, 'Path:', imagePath);
        
        if (imagePath) {
            // Show many plants by tiling small copies across the plot
            // Create a 3x3 grid effect using multiple background images
            // Switch to 2x2 tiling with larger plants to leave room for asset icons
            const images = [imagePath,imagePath,imagePath,imagePath];
            cropOverlay.style.backgroundImage = images.map(p => 'url("' + p + '")').join(', ');
            const unit = '42%';
            const positions = [
                '10% 10%','70% 10%',
                '10% 70%','70% 70%'
            ];
            cropOverlay.style.backgroundSize = Array(4).fill(unit + ' ' + unit).join(', ');
            cropOverlay.style.backgroundRepeat = 'no-repeat';
            cropOverlay.style.backgroundPosition = positions.join(', ');
            // Expand overlay to nearly full plot so the grid fits
            cropOverlay.style.top = '6%';
            cropOverlay.style.left = '6%';
            cropOverlay.style.width = '88%';
            cropOverlay.style.height = '88%';
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

// Icon tab toggling for right sidebar sections
function setupIconTabs() {
    const tabs = Array.from(document.querySelectorAll('.icon-tab'));
    const sections = Array.from(document.querySelectorAll('.tabbed-section'));
    if (tabs.length === 0 || sections.length === 0) return;

    const show = (targetId) => {
        sections.forEach(sec => {
            if (!sec.id) return;
            if (sec.id === targetId) sec.classList.remove('hidden-section');
            else sec.classList.add('hidden-section');
        });
        tabs.forEach(t => t.classList.toggle('active', t.dataset.target === targetId));
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => show(tab.dataset.target));
    });

    // Ensure default visible section matches the active tab, fallback to crop details
    const active = tabs.find(t => t.classList.contains('active'));
    show(active ? active.dataset.target : 'sec-crop');
}

// Proactive mentor recommendations based on current state
function renderMentorRecommendations() {
    const box = document.getElementById('mentor-recos');
    if (!box || !window.farmBase || !window.farmBase.gameState) return;
    const gs = window.farmBase.gameState;
    const p = gs.params || {};
    const recos = [];

    // Water guidance
    if (p.groundwater != null && p.groundwater < 0.4) {
        recos.push('Groundwater is low – install drip irrigation or a rainwater tank; avoid overwatering.');
    } else if (p.groundwater != null && p.groundwater > 0.85) {
        recos.push('High water levels – monitor for waterlogging; prefer short, moderate‑water crops.');
    }

    // Soil health & fertilizer
    if (p.soilHealth != null && p.soilHealth < 0.5) {
        recos.push('Soil health is declining – apply compost and add crop residues after harvest.');
    }
    if (gs.practices && gs.practices.excessChemicalFertilizer) {
        recos.push('Reduce chemical fertilizer use; switch to natural inputs to recover soil health.');
    }

    // pH targeting
    const ph = p.ph;
    const crop = gs.selectedCrop;
    if (typeof ph === 'number' && (ph < 6.0 || ph > 7.0)) {
        recos.push('Soil pH is suboptimal – compost helps buffer toward ~6.5.');
    }
    if (crop === 'tea' && typeof ph === 'number' && (ph > 5.5)) {
        recos.push('Tea prefers acidic soil (pH 4.5–5.5) – consider amending or choose a crop suited to current pH.');
    }

    // Weather
    if (p.weather === 'drought') {
        recos.push('Drought conditions – prioritize maize or short‑duration crops, use mulching and drip.');
    } else if (p.weather === 'flood') {
        recos.push('Flood risk – build drainage, avoid overwatering, and plant tolerant varieties if available.');
    }

    // Storage suggestion if inventory exists
    const inv = gs.inventory || {};
    const invHas = Object.keys(inv).some(k => (inv[k] || 0) > 0);
    if (invHas) {
        recos.push('You have harvest in inventory – consider storing cereals in the silo or selling at current prices.');
    }

    // Asset availability hints
    const sa = gs.sustainableAssets || {};
    if ((sa.drip|0) > 0 && (sa.rainwater|0) > 0 && p.groundwater < 0.6) {
        recos.push('Install available drip/rainwater units on key plots to save water.');
    }

    // Fallback tip
    if (recos.length === 0) recos.push('Keep balancing water, soil health, and pH; rotate crops and use compost regularly.');

    box.innerHTML = recos.slice(0, 3).map(r => '<div>• ' + r + '</div>').join('');
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
    
    // Fixed 15-second growth timer with 4 stages (3.75 seconds each)
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

// Fertilizer animation and effect
function applyFertilizerEffect(row, col, plotElement) {
    // Visual pour animation
    const pour = document.createElement('div');
    pour.className = 'fertilizer-pour';
    pour.style.position = 'absolute';
    pour.style.top = '-10px';
    pour.style.left = '50%';
    pour.style.transform = 'translateX(-50%)';
    pour.style.width = '28px';
    pour.style.height = '28px';
    pour.style.backgroundImage = 'url("assets/images/effects/fertilizer-effect.png")';
    pour.style.backgroundSize = 'contain';
    pour.style.backgroundRepeat = 'no-repeat';
    pour.style.zIndex = '102';
    pour.style.animation = 'fertilizerPour 1.2s ease-in forwards';
    plotElement.appendChild(pour);

    // Sparkles on soil
    setTimeout(() => {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => addGrowthSparkle(plotElement), i * 120);
        }
    }, 600);

    // Light boost: if not ready, nudge stage up by 1 (max 4)
    const state = window.farmBase.getPlotState(row, col);
    if (state && state.crop && state.stage < 4) {
        nudgeGrowth(row, col, plotElement, 'fertilizer');
    }

    // Update parameters based on fertilizer type
    const fertType = (window.farmBase.gameState && window.farmBase.gameState.fertilizerType) || 'natural';
    if (fertType === 'natural') {
        window.farmBase.updateParametersOnAction('fertilize-natural');
    } else {
        window.farmBase.updateParametersOnAction('fertilize-artificial');
    }
    window.farmBase.updateParametersUI();

    setTimeout(() => {
        if (pour.parentNode) pour.remove();
    }, 1400);
}

// Render crop details in the right sidebar
function renderSelectedCropDetails() {
    const crop = (window.farmBase.gameState && window.farmBase.gameState.selectedCrop) || 'rice';
    const detailsEl = document.getElementById('crop-details');
    if (!detailsEl) return;
    const info = getCropInfo(crop);
    const price = (window.farmBase.gameState.priceMap && window.farmBase.gameState.priceMap[crop] != null)
        ? Math.round(window.farmBase.gameState.priceMap[crop]) : '–';
    detailsEl.innerHTML = `
        <div><strong>${toTitle(crop)}</strong> — Today: ₹${price}/kg</div>
        <div>Best soil: ${info.soil}</div>
        <div>Water need: ${info.water}</div>
        <div>Season: ${info.season}</div>
        <div>Duration: ${info.duration}</div>
        <div style="margin-top:6px; opacity:0.9;">${info.notes}</div>
    `;
}

function getCropInfo(crop) {
    const map = {
        rice:   { soil: 'Alluvial, clayey', water: 'High', season: 'Kharif', duration: '90–120 days', notes: 'Thrives in standing water; avoid drought stress.' },
        wheat:  { soil: 'Alluvial, loam',  water: 'Moderate', season: 'Rabi',   duration: '100–120 days', notes: 'Prefers cool, dry climate; ensure timely irrigation at tillering and grain filling.' },
        potato: { soil: 'Sandy loam',      water: 'Moderate', season: 'Rabi',   duration: '70–90 days', notes: 'Well-drained soil; avoid waterlogging to prevent rot.' },
        maize:  { soil: 'Alluvial, loam',  water: 'Moderate', season: 'Kharif', duration: '90–110 days', notes: 'Sensitive to moisture stress at tasseling and silking.' },
        tea:    { soil: 'Acidic, well-drained', water: 'High', season: 'Perennial', duration: '—', notes: 'Prefers acidic soils (pH 4.5–5.5); shelter from harsh winds.' }
    };
    return map[crop] || { soil: 'Alluvial', water: 'Moderate', season: '—', duration: '—', notes: '—' };
}

function toTitle(s){ return (s||'').replace(/\b\w/g,c=>c.toUpperCase()); }
// UI bindings for sustainable practices, fertilizer type, weather, and pH controls
document.addEventListener('DOMContentLoaded', function() {
    // Fertilizer type radios
    document.querySelectorAll('input[name="fertilizer-type"]').forEach(inp => {
        inp.addEventListener('change', function() {
            if (this.checked) {
                window.farmBase.setFertilizerType(this.value);
            }
        });
    });
    // Practice toggles
    document.querySelectorAll('.practice-toggle').forEach(chk => {
        chk.addEventListener('change', function() {
            const key = this.getAttribute('data-practice');
            window.farmBase.togglePractice(key, this.checked);
        });
    });
    // Weather select
    const weatherSel = document.getElementById('weather-select');
    if (weatherSel) {
        weatherSel.addEventListener('change', function(){
            window.farmBase.gameState.params.weather = this.value;
            window.farmBase.updateParametersUI();
            window.farmBase.saveGameState && window.farmBase.saveGameState();
        });
    }
    // pH slider
    const phInput = document.getElementById('ph-input');
    if (phInput) {
        phInput.addEventListener('input', function(){
            window.farmBase.gameState.params.ph = parseFloat(this.value);
            window.farmBase.updateParametersUI();
            window.farmBase.saveGameState && window.farmBase.saveGameState();
        });
    }
    // Fetch initial prices for inventory
    if (window.farmBase.fetchPrices) {
        window.farmBase.fetchPrices();
    }

    // Mentor ask button
    const askBtn = document.getElementById('ask-mentor-btn');
    if (askBtn) {
        askBtn.addEventListener('click', function(){
            const q = (document.getElementById('mentor-question') || {}).value || 'Give a quick sustainable tip for my current conditions.';
            const answerEl = document.getElementById('mentor-answer');
            if (answerEl) answerEl.textContent = 'Thinking...';
            window.farmBase.askMentor(q).then(ans => {
                if (answerEl) answerEl.textContent = ans;
            }).catch(() => {
                if (answerEl) answerEl.textContent = 'Try compost, mulching, and drip irrigation to improve soil health and conserve water.';
            });
        });
    }

    // Refresh prices
    const refreshBtn = document.getElementById('refresh-prices-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function(){
            window.farmBase.fetchPrices();
        });
    }

    // Government support
    const govBtn = document.getElementById('gov-support-btn');
    if (govBtn) {
        govBtn.addEventListener('click', function(){
            window.farmBase.applyGovSupport();
        });
    }

    // Market buttons
    const sellAll = document.getElementById('sell-all-btn');
    if (sellAll) sellAll.addEventListener('click', () => window.farmBase.sellAllInventory());
    const storeC = document.getElementById('store-cereals-btn');
    if (storeC) storeC.addEventListener('click', () => window.farmBase.storeAllCereals());
    const storeP = document.getElementById('store-produce-btn');
    if (storeP) storeP.addEventListener('click', () => window.farmBase.storeAllProduce());

    // Start news ticker
    window.farmBase.startNewsTicker && window.farmBase.startNewsTicker();

    // Personal tips input/save
    const tipIn = document.getElementById('personal-tip-input');
    const tipBtn = document.getElementById('save-personal-tip');
    const tipList = document.getElementById('personal-tips-list');
    function renderTips(){
        const arr = JSON.parse(localStorage.getItem('personalTips')||'[]');
        if (!tipList) return;
        tipList.innerHTML = arr.slice(-5).map(t=>'<div>• ' + escapeHtml(t) + '</div>').join('');
    }
    function escapeHtml(s){
        return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
    }
    if (tipBtn && tipIn) {
        tipBtn.addEventListener('click', function(){
            const v = (tipIn.value||'').trim();
            if (!v) return;
            const arr = JSON.parse(localStorage.getItem('personalTips')||'[]');
            arr.push(v);
            localStorage.setItem('personalTips', JSON.stringify(arr));
            tipIn.value = '';
            renderTips();
            window.farmBase.showMessage('Saved your tip.', 'success');
        });
        renderTips();
    }
});

// Helper to advance growth by one stage with visuals and messages
function nudgeGrowth(row, col, plotElement, source) {
    const state = window.farmBase.getPlotState(row, col);
    if (!state || !state.crop) return;
    const wasStage = state.stage;
    state.stage = Math.min(4, Math.max(1, (state.stage || 1)) + 1);
    let msg = '';
    if (state.stage >= 4) {
        state.ready = true;
        addReadyToHarvestEffect(plotElement);
        msg = (source === 'water' ? 'Watered to full growth!' : 'Fertilizer worked! Crop is ready!');
    } else {
        msg = (source === 'water' ? 'Watering boosted growth!' : 'Fertilizer boosted growth!');
    }
    updatePlotVisual(row, col, plotElement);
    addGrowthSparkle(plotElement);
    window.farmBase.showMessage(msg, 'success');
    console.log('🌱 Growth nudged by', source, 'from stage', wasStage, 'to', state.stage);
}

// Place sustainable asset overlay on plot corners
function placeSustainableAsset(row, col, plotElement, key) {
    // Prevent duplicate placement on same plot
    const state = window.farmBase.getPlotState(row, col);
    if (state && state.assets && state.assets[key]) {
        window.farmBase.showMessage('This plot already has ' + key + ' installed.', 'info');
        return;
    }
    // Save to plot state with inventory check
    if (window.farmBase.setPlotAsset) {
        const ok = window.farmBase.setPlotAsset(row, col, key, true);
        if (!ok) return; // no stock
    }
    // Remove existing icon for this key if present
    const prev = plotElement.querySelector('.asset-icon.' + key);
    if (prev) prev.remove();
    const icon = document.createElement('div');
    icon.className = 'asset-icon ' + key;
    icon.style.position = 'absolute';
    icon.style.width = '28px';
    icon.style.height = '28px';
    icon.style.backgroundSize = 'contain';
    icon.style.backgroundRepeat = 'no-repeat';
    icon.style.zIndex = '103';
    // Positions: compost/rainwater left side; drip right side
    if (key === 'drip') {
        icon.style.right = '4px';
        icon.style.bottom = '4px';
        icon.style.backgroundImage = 'url("assets/images/sustainable/water/drip-controller.png")';
    } else if (key === 'rainwater') {
        icon.style.left = '4px';
        icon.style.bottom = '4px';
        icon.style.backgroundImage = 'url("assets/images/sustainable/water/rainwater-tank.png")';
    } else if (key === 'compost') {
        icon.style.left = '4px';
        icon.style.top = '4px';
        icon.style.backgroundImage = 'url("assets/images/sustainable/soil/compost-pit.png")';
    } else if (key === 'mulch') {
        icon.style.right = '4px';
        icon.style.top = '4px';
        icon.style.backgroundImage = 'url("assets/images/sustainable/soil/mulch.png")';
    } else if (key === 'solar') {
        icon.style.left = '50%';
        icon.style.top = '50%';
        icon.style.transform = 'translate(-50%, -50%)';
        icon.style.backgroundImage = 'url("assets/images/sustainable/energy/solar-pump.png")';
    } else if (key === 'wind') {
        icon.style.left = 'calc(50% - 14px)';
        icon.style.top = '2px';
        icon.style.backgroundImage = 'url("assets/images/sustainable/energy/wind-turbine.png")';
    } else if (key === 'biogas') {
        icon.style.left = '2px';
        icon.style.bottom = '2px';
        icon.style.backgroundImage = 'url("assets/images/sustainable/energy/biogas.png")';
    } else if (key === 'trees') {
        icon.style.right = '2px';
        icon.style.top = '2px';
        icon.style.backgroundImage = 'url("assets/images/sustainable/energy/trees.png")';
    }
    plotElement.appendChild(icon);
    window.farmBase.showMessage('Installed ' + key.replace('-', ' ') + ' on this plot.', 'success');
}

// Remove one installed asset from the plot (priority: drip, rainwater, compost)
function removeOneAsset(row, col, plotElement) {
    const state = window.farmBase.getPlotState(row, col);
    if (!state || !state.assets) {
        window.farmBase.showMessage('No assets installed here.', 'info');
        return;
    }
    const keys = ['drip','rainwater','compost','mulch'];
    const toRemove = keys.find(k => !!state.assets[k]);
    if (!toRemove) {
        window.farmBase.showMessage('No assets installed here.', 'info');
        return;
    }
    const ok = window.farmBase.setPlotAsset(row, col, toRemove, false);
    if (!ok) return;
    // Remove icon if present
    const prev = plotElement.querySelector('.asset-icon.' + toRemove);
    if (prev) prev.remove();
    window.farmBase.showMessage('Removed ' + toRemove + ' and returned to inventory.', 'success');
}

// Utility to get the plot DOM at (r,c)
function getPlotEl(r,c){
    return document.querySelector('.farming-plot[data-row="' + r + '"][data-col="' + c + '"]');
}

// Place an intersection (between four tiles) asset hub affecting (r,c),(r+1,c),(r,c+1),(r+1,c+1)
function placeIntersectionAsset(r, c, type) {
    // Create or find a hub element positioned in the center between four plots
    const topLeft = getPlotEl(r,c);
    const topRight = getPlotEl(r, c+1);
    const bottomLeft = getPlotEl(r+1, c);
    const bottomRight = getPlotEl(r+1, c+1);
    if (!topLeft || !topRight || !bottomLeft || !bottomRight) return;
    const parent = topLeft.parentElement; // farming-grid-overlay
    const hub = document.createElement('div');
    hub.className = 'intersection-asset ' + type;
    // position hub roughly at the center of the four plots using their offsets
    const a = topLeft.getBoundingClientRect();
    const b = bottomRight.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const cx = (a.left + b.right) / 2 - parentRect.left;
    const cy = (a.top + b.bottom) / 2 - parentRect.top;
    hub.style.left = (cx - 18) + 'px';
    hub.style.top = (cy - 18) + 'px';
    parent.appendChild(hub);
    // Mark a lightweight effect on the four plots (visual only for now)
    [topLeft, topRight, bottomLeft, bottomRight].forEach(el => {
        el.classList.add('has-hub-' + type);
    });
}