// Base farming functionality shared across all farm pages

// Game state
let gameState = {
    resources: {
        seeds: 1000,
        coins: 50,
        water: 95
    },
    selectedTool: 'plant',
    selectedCrop: 'rice',
    plots: {},
    season: 'spring',
    day: 15,
    soilType: 'alluvial',
    // Dynamic farm parameters
    params: {
        soilHealth: 0.7,     // 0..1
        groundwater: 0.6,    // 0..1
        ph: 6.5,
        weather: 'normal'    // normal | drought | flood | hail
    },
    // Sustainable practices and fertilizer type
    practices: {
        mulching: false,
        dripIrrigation: false,
        compost: false,
        excessChemicalFertilizer: false
    },
    fertilizerType: 'natural', // natural | artificial
    // Inventory and price map
    inventory: {}, // { crop: qtyKg }
    priceMap: {},
    lastPriceMap: {}, // for price delta/news
    // Storage and capacities
    storage: {
        silo: {},   // cereals
        barn: {}    // produce and others
    },
    capacities: {
        silo: 100,
        barn: 100
    },
    // Rolling news feed (strings)
    news: [],
    // Limited sustainable assets inventory (placements available)
    sustainableAssets: {
        compost: 2,
        drip: 2,
        rainwater: 2,
        mulch: 4,
        solar: 4,
        wind: 4,
        biogas: 4,
        trees: 4
    },
    // Global counts of installed farm-wide assets (derived from plot placements)
    globalAssetCounts: {
        solar: 0,
        wind: 0,
        biogas: 0,
        trees: 0
    }
};

// Economy and action costs (tweak freely)
const COSTS = {
    seeds: { rice: 1, wheat: 1, potato: 1, maize: 1, tea: 2 },
    assets: { compost: 15, drip: 25, rainwater: 20, mulch: 5, solar: 60, wind: 80, biogas: 70, trees: 10 },
    fertilizer: { natural: 1, artificial: 2 }
};

// Initialize base farm functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Farm Base JS Loaded');
    
    // Setup common UI elements
    setupNavigationButtons();
    setupToolSelection();
    setupCropSelection();
    setupResourceDisplay();
    
    // Load saved game state if exists
    // Note: Specific farm pages may override tool/crop after this loads.
    loadGameState();
    
    // Update displays
    // Dynamically adjust baseline resources and capacities based on installed assets and prior progress
    try {
        applyDynamicEconomy();
    } catch (e) { console.warn('Dynamic economy init failed', e); }
    updateResourceDisplay();
});

function setupNavigationButtons() {
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
}

function setupToolSelection() {
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all tools
            toolBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked tool
            this.classList.add('active');
            
            // Update selected tool
            gameState.selectedTool = this.dataset.tool;
            console.log('Selected tool:', gameState.selectedTool);
            
            // Update cursor or visual feedback
            updateCursor();
        });
    });
}

function setupCropSelection() {
    const cropOptions = document.querySelectorAll('.crop-option');
    cropOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all crops
            cropOptions.forEach(o => o.classList.remove('active'));
            
            // Add active class to clicked crop
            this.classList.add('active');
            
            // Update selected crop
            gameState.selectedCrop = this.dataset.crop;
            console.log('Selected crop:', gameState.selectedCrop);
        });
    });
}

function setupResourceDisplay() {
    // Update resource displays periodically
    setInterval(updateResourceDisplay, 1000);
}

function updateResourceDisplay() {
    const seedsCount = document.getElementById('seeds-count');
    const coinsCount = document.getElementById('coins-count');
    const waterCount = document.getElementById('water-count');
    
    if (seedsCount) seedsCount.textContent = gameState.resources.seeds;
    if (coinsCount) coinsCount.textContent = Math.round(gameState.resources.coins || 0);
    if (waterCount) waterCount.textContent = gameState.resources.water;

    // Government support indicator when low on funds/resources
    const low = gameState.resources.coins < 20 || gameState.resources.seeds < 5 || gameState.resources.water < 10;
    // Backward-compat panel (older pages)
    const govPanel = document.getElementById('gov-support-panel');
    if (govPanel) {
        govPanel.style.display = low ? 'block' : 'none';
    }
    // New UI: highlight Govt tab when low
    const govTab = document.querySelector('.icon-tab[data-target="sec-gov"]');
    if (govTab) {
        if (low) govTab.classList.add('attention'); else govTab.classList.remove('attention');
    }

    // Update sustainable asset badges/buttons if present
    updateAssetBadges();
}

function updateCursor() {
    const body = document.body;
    body.className = body.className.replace(/cursor-\w+/g, '');
    body.classList.add(`cursor-${gameState.selectedTool}`);
}

// Plot management functions
function getPlotKey(row, col) {
    return `${row}-${col}`;
}

function getPlotState(row, col) {
    const key = getPlotKey(row, col);
    return gameState.plots[key] || {
        crop: null,
        stage: 0,
        plantedTime: null,
        watered: false,
        ready: false,
        assets: {}
    };
}

function setPlotState(row, col, state) {
    const key = getPlotKey(row, col);
    gameState.plots[key] = { ...getPlotState(row, col), ...state };
    saveGameState();
}

// Crop growth system
function plantCrop(row, col, cropType) {
    if (gameState.resources.seeds <= 0) {
        showMessage('Not enough seeds!', 'error');
        return false;
    }
    const seedCost = (COSTS.seeds[cropType] || 1);
    if ((gameState.resources.coins|0) < seedCost) {
        showMessage('Not enough coins to buy seeds!', 'error');
        return false;
    }

    // Hard-mode: evaluate suitability before planting
    if (typeof evaluateCropSuitability === 'function') {
        const evalRes = evaluateCropSuitability(cropType, row, col);
        if (!evalRes.allowed) {
            showMessage(evalRes.reasons && evalRes.reasons[0] ? evalRes.reasons[0] : 'Conditions unsuitable for ' + cropType + '.', 'error');
            return false;
        }
        // If marginal, warn player that yields will be reduced
        if (evalRes.penalty < 0.95) {
            const pct = Math.round((1 - evalRes.penalty) * 100);
            showMessage('Marginal conditions for ' + cropType + ' (≈ -' + pct + '% yield). Improve pH/water/soil.', 'warning');
        }
        // carry base penalty with the plot for harvest time
        setPlotState(row, col, { suitabilityPenalty: evalRes.penalty });
    }
    
    setPlotState(row, col, {
        crop: cropType,
        stage: 1,
        plantedTime: Date.now(),
        watered: false,
        ready: false
    });
    
    gameState.resources.seeds = Math.max(0, (gameState.resources.seeds|0) - 1);
    gameState.resources.coins = Math.max(0, (gameState.resources.coins|0) - seedCost);
    updateResourceDisplay();
    showMessage(`Planted ${cropType}!`, 'success');
    updateParametersForPlotAction(row, col, 'plant');
    updateParametersUI();
    return true;
}

function waterPlot(row, col) {
    if (gameState.resources.water <= 0) {
        showMessage('Not enough water!', 'error');
        return false;
    }
    
    const plotState = getPlotState(row, col);
    if (!plotState.crop) {
        showMessage('Plant something first!', 'warning');
        return false;
    }
    
    // Adaptive water cost based on plot assets
    let waterCost = 5;
    if (plotState.assets && plotState.assets.drip) waterCost = Math.max(2, waterCost - 3);
    if (plotState.assets && plotState.assets.rainwater) waterCost = Math.max(1, waterCost - 1);
    if (plotState.assets && plotState.assets.mulch) waterCost = Math.max(1, waterCost - 1);
    // Intersection hubs: if a hub is installed adjacent, apply a small extra reduction
    const hubEff = getIntersectionWaterEfficiency(row, col);
    waterCost = Math.max(1, Math.round(waterCost * (1 - hubEff)));
    if (gameState.resources.water < waterCost) {
        showMessage('Not enough water for this plot!', 'error');
        return false;
    }
    setPlotState(row, col, { watered: true });
    gameState.resources.water -= waterCost;
    updateResourceDisplay();
    showMessage('Plot watered!', 'success');
    updateParametersForPlotAction(row, col, 'water');
    updateParametersUI();
    return true;
}

function harvestCrop(row, col) {
    const plotState = getPlotState(row, col);
    if (!plotState.ready) {
        showMessage('Crop not ready yet!', 'warning');
        return false;
    }
    
    // Calculate harvest rewards
    const cropPrices = {
        rice: 35,
        maize: 28,
        wheat: 25,
        potato: 20
    };
    // Base yield
    let baseYield = Math.floor(Math.random() * 5) + 3; // 3-7 kg
    // Apply multipliers based on conditions and per-plot assets
    let mult = 1.0;
    const p = gameState.params || {};
    const assets = (plotState.assets) || {};
    // Soil health impact: narrower and harsher
    mult *= (0.85 + (p.soilHealth || 0.5) * 0.3); // soilHealth 0 => 1.0-ish, 1 => 1.15
    // pH impact: stricter; small bonus if near ideal, bigger penalty outside
    const ph = (p.ph || 6.5);
    if (ph >= 6.2 && ph <= 6.8) mult *= 1.06; else mult *= 0.86;
    // Weather adversity
    if (p.weather === 'drought' || p.weather === 'flood' || p.weather === 'hail') mult *= 0.85;
    // Assets: compost improves soil structure, +10%; drip improves water efficiency, +5%; rainwater minor +3%; mulch +4%
    if (assets.compost) mult *= 1.10;
    if (assets.drip) mult *= 1.05;
    if (assets.rainwater) mult *= 1.03;
    if (assets.mulch) mult *= 1.04;
    // Excess chemical fertilizer penalty (harder)
    if (gameState.practices && gameState.practices.excessChemicalFertilizer) mult *= 0.75;
    // Apply hard-mode suitability penalties: baseline from planting + dynamic at harvest
    const baseSuitPenalty = (plotState.suitabilityPenalty != null ? plotState.suitabilityPenalty : 1.0);
    const dynamicPenalty = (typeof computeHarvestPenalty === 'function') ? computeHarvestPenalty(plotState.crop, row, col) : 1.0;
    mult *= baseSuitPenalty * dynamicPenalty;
    // Clamp multiplier (harder bounds)
    mult = clampRange(mult, 0.35, 1.4);
    const finalYield = Math.max(1, Math.round(baseYield * mult));
    // Use dynamic market price if available
    const price = (gameState.priceMap && gameState.priceMap[plotState.crop]) || cropPrices[plotState.crop] || 20;
    const earnings = Math.round(finalYield * price);
    
    gameState.resources.coins = Math.round((gameState.resources.coins || 0) + earnings);
    
    // Reset plot
    setPlotState(row, col, {
        crop: null,
        stage: 0,
        plantedTime: null,
        watered: false,
        ready: false
    });
    
    updateResourceDisplay();
    showMessage(`Harvested ${finalYield}kg of ${plotState.crop} for ₹${earnings}!`, 'success');
    // Update inventory
    updateInventory(plotState.crop, finalYield);
    updateParametersForPlotAction(row, col, 'harvest');
    updateParametersUI();
    return true;
}

// Visual feedback
function showMessage(text, type = 'info') {
    // Create message element
    const message = document.createElement('div');
    message.className = `game-message ${type}`;
    message.textContent = text;
    
    // Style the message
    Object.assign(message.style, {
        position: 'fixed',
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        borderRadius: '25px',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px',
        zIndex: '1000',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'all 0.3s ease'
    });
    
    // Set background based on type
    const backgrounds = {
        success: 'linear-gradient(45deg, #32CD32, #90EE90)',
        error: 'linear-gradient(45deg, #FF6B6B, #FF8E8E)',
        warning: 'linear-gradient(45deg, #FFD700, #FFA500)',
        info: 'linear-gradient(45deg, #4169E1, #87CEEB)'
    };
    
    message.style.background = backgrounds[type] || backgrounds.info;
    
    // Add to page
    document.body.appendChild(message);
    
    // Animate in
    setTimeout(() => {
        message.style.opacity = '1';
        message.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 300);
    }, 3000);
}

// Save/Load game state
function saveGameState() {
    localStorage.setItem('farmGameState', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('farmGameState');
    if (saved) {
        gameState = { ...gameState, ...JSON.parse(saved) };
        // Normalize newly added sustainable assets with minimum stock
        gameState.sustainableAssets = gameState.sustainableAssets || {};
        const min4 = ['solar','wind','biogas','trees'];
        min4.forEach(k => {
            const cur = gameState.sustainableAssets[k];
            if (typeof cur !== 'number') gameState.sustainableAssets[k] = 4;
            else gameState.sustainableAssets[k] = Math.max(cur, 4);
        });
        // Ensure global counts object exists
        gameState.globalAssetCounts = gameState.globalAssetCounts || { solar:0, wind:0, biogas:0, trees:0 };
    }
}

// Crop growth simulation
function updateCropGrowth() {
    // Allow specific farm pages to control growth timing themselves
    if (window.farmBase && window.farmBase.disableBaseGrowth) {
        return;
    }
    const currentTime = Date.now();
    let hasUpdates = false;
    
    Object.keys(gameState.plots).forEach(plotKey => {
        const plot = gameState.plots[plotKey];
        if (plot.crop && plot.plantedTime) {
            const growthTime = currentTime - plot.plantedTime;
            
            // Growth stages based on time (simplified for demo)
            const stageTime = 30000; // 30 seconds per stage for demo
            const newStage = Math.min(4, Math.floor(growthTime / stageTime) + 1);
            
            if (newStage !== plot.stage) {
                plot.stage = newStage;
                plot.ready = newStage >= 4;
                hasUpdates = true;
            }
        }
    });
    // Passive groundwater decay when time passes
    if (gameState && gameState.params) {
        gameState.params.groundwater = clamp01(gameState.params.groundwater - 0.002);
    }
    
    if (hasUpdates) {
        saveGameState();
        // Trigger visual updates if needed
        updatePlotVisuals();
    }
}

function updatePlotVisuals() {
    // This will be implemented by specific farm pages
    console.log('Updating plot visuals...');
}

// Start growth simulation
setInterval(updateCropGrowth, 5000); // Check every 5 seconds

// Export functions for use by specific farm pages
window.farmBase = {
    gameState,
    plantCrop,
    waterPlot,
    harvestCrop,
    getPlotState,
    setPlotState,
    showMessage,
    updatePlotVisuals,
    // Farm pages can set this to true to take over growth logic (e.g., custom timers)
    disableBaseGrowth: false,
    // New helpers
    setSoilType,
    togglePractice,
    setFertilizerType,
    updateParametersOnAction,
    updateParametersForPlotAction,
    updateParametersUI,
    fetchPrices,
    getProbability,
    askMentor,
    updateInventory,
    applyGovSupport,
    saveGameState,
    // Suitability & difficulty
    evaluateCropSuitability,
    computeHarvestPenalty,
    // Sustainable assets helpers
    setPlotAsset,
    getPracticesForPlot,
    updateAssetBadges,
    // Marketplace/Storage/News
    sellAllInventory,
    storeAllCereals,
    storeAllProduce,
    renderMarketUI,
    renderStorageUI,
    startNewsTicker
};

// ---------- New Features ----------

function setSoilType(type) {
    gameState.soilType = type;
    saveGameState();
}

function togglePractice(key, value) {
    if (key in gameState.practices) {
        gameState.practices[key] = !!value;
        saveGameState();
    }
}

function setFertilizerType(type) {
    if (type === 'natural' || type === 'artificial') {
        gameState.fertilizerType = type;
        saveGameState();
    }
}

function updateInventory(crop, qtyKg) {
    if (!crop || !qtyKg) return;
    gameState.inventory[crop] = (gameState.inventory[crop] || 0) + qtyKg;
    saveGameState();
    renderInventoryUI();
}

function renderInventoryUI() {
    const container = document.getElementById('inventory-list');
    if (!container) return;
    container.innerHTML = '';
    const crops = Object.keys(gameState.inventory);
    if (crops.length === 0) {
        container.textContent = 'No produce yet.';
        // Also refresh market/storage panels to keep UI in sync
        renderMarketUI();
        renderStorageUI();
        return;
    }
    crops.forEach(crop => {
        const qty = gameState.inventory[crop];
        const price = gameState.priceMap[crop] != null ? Math.round(gameState.priceMap[crop]) : '-';
        const row = document.createElement('div');
        row.className = 'inventory-row';
        row.textContent = `${crop}: ${qty} kg @ ₹${price}/kg`;
        container.appendChild(row);
    });
    // Keep related UI updated
    renderMarketUI();
    renderStorageUI();
}

function updateParametersOnAction(action) {
    // Simple heuristics for demo
    const p = gameState.params;
    if (action === 'water') {
        p.groundwater = clamp01(p.groundwater + 0.03);
        if (p.groundwater > 0.9) {
            p.soilHealth = clamp01(p.soilHealth - 0.05); // waterlogging
        }
    }
    if (action === 'plant') {
        p.soilHealth = clamp01(p.soilHealth - 0.01);
    }
    if (action === 'harvest') {
        p.soilHealth = clamp01(p.soilHealth + 0.01); // assume residue incorporation
    }
    if (action === 'fertilize-natural') {
        p.soilHealth = clamp01(p.soilHealth + 0.05);
    }
    if (action === 'fertilize-artificial') {
        p.soilHealth = clamp01(p.soilHealth - 0.03);
        // track bad practice when repeatedly used
        gameState.practices.excessChemicalFertilizer = true;
    }
    saveGameState();
}

// Plot-aware parameter updates influenced by installed assets
function updateParametersForPlotAction(row, col, action) {
    const p = gameState.params;
    const plot = getPlotState(row, col);
    const assets = (plot && plot.assets) || {};
    if (!p) return;

    if (action === 'plant') {
        // Slight soil disturbance; compost mitigates and improves organic matter
        if (assets.compost) {
            p.soilHealth = clamp01(p.soilHealth + 0.008);
            p.ph = moveToward(p.ph, 6.5, 0.05);
        } else {
            p.soilHealth = clamp01(p.soilHealth - 0.005);
        }
        // Mulch installation before/after planting preserves moisture; tiny boost
        if (assets.mulch) p.soilHealth = clamp01(p.soilHealth + 0.003);
    }
    if (action === 'water') {
        // Improve groundwater metric; rainwater/drip improve efficiency
        let delta = 0.02;
        if (assets.rainwater) delta += 0.01; // less aquifer stress due to stored rainwater
        if (assets.drip) delta += 0.005;     // efficient irrigation preserves water
        if (assets.mulch) delta += 0.003;    // mulch reduces evaporation losses
        // Renewable assets can offset pumping costs and reduce groundwater stress slightly
        const gc = gameState.globalAssetCounts || {};
        if ((gc.solar|0) > 0) delta += Math.min(0.01, (gc.solar|0) * 0.002);
        if ((gc.wind|0) > 0) delta += Math.min(0.008, (gc.wind|0) * 0.002);
        // Intersection hubs provide shared infrastructure benefit
        const hubEff = getIntersectionWaterEfficiency(row, col);
        if (hubEff > 0) delta += Math.min(0.01, hubEff * 0.02);
        p.groundwater = clamp01(p.groundwater + delta);
    }
    if (action === 'harvest') {
        // Residue incorporation boosts health; compost enhances
        p.soilHealth = clamp01(p.soilHealth + (assets.compost ? 0.02 : 0.01));
        if (assets.mulch) p.soilHealth = clamp01(p.soilHealth + 0.004);
        // Trees improve microclimate and soil over time
        const gc = gameState.globalAssetCounts || {};
        if ((gc.trees|0) > 0) p.soilHealth = clamp01(p.soilHealth + Math.min(0.01, (gc.trees|0) * 0.002));
    }
    saveGameState();
}

// Compute intersection hub efficiency for a given plot (0..0.1)
function getIntersectionWaterEfficiency(row, col) {
    try {
        // Check presence of hub flags on neighboring plots' assets markers (stored in plot assets)
        // We'll derive efficiency from nearby installed plot-level assets to approximate hubs.
        // Adjacent plots with drip/rainwater add small benefit.
        const neighbors = [
            [row-1, col], [row+1, col], [row, col-1], [row, col+1]
        ];
        let eff = 0;
        neighbors.forEach(([r,c]) => {
            const n = getPlotState(r, c);
            if (n && n.assets) {
                if (n.assets.drip) eff += 0.02;      // 2% per adjacent drip
                if (n.assets.rainwater) eff += 0.015; // 1.5% per adjacent tank
            }
        });
        return Math.min(0.10, eff);
    } catch(e) { return 0; }
}

function updateParametersUI() {
    // Soil fertility bar
    const fertFill = document.querySelector('.stat-fill.fertility');
    if (fertFill) fertFill.style.width = Math.round(gameState.params.soilHealth * 100) + '%';
    // Water level bar (reuse existing river stat)
    const waterFill = document.querySelector('.stat-fill.water');
    if (waterFill) waterFill.style.width = Math.round(gameState.params.groundwater * 100) + '%';
    // Weather text
    const weatherValue = document.querySelector('.weather-value');
    if (weatherValue) weatherValue.textContent = weatherEmoji(gameState.params.weather) + ' ' + titleCase(gameState.params.weather);
    // pH and exact values (optional elements)
    const phEl = document.getElementById('param-ph');
    if (phEl) phEl.textContent = gameState.params.ph.toFixed(1);
    const hEl = document.getElementById('param-health');
    if (hEl) hEl.textContent = gameState.params.soilHealth.toFixed(2);
    const gEl = document.getElementById('param-ground');
    if (gEl) gEl.textContent = gameState.params.groundwater.toFixed(2);

    // Live mentor nudge when parameters go risky
    const hint = document.getElementById('mentor-live-hint');
    if (hint) {
        const p = gameState.params;
        let msg = '';
        if (p.soilHealth < 0.4) msg = 'Soil health is dropping. Add compost or rotate crops.';
        else if (p.groundwater < 0.35) msg = 'Groundwater is low. Use drip or rainwater harvesting.';
        else if (p.ph < 6.0 || p.ph > 7.0) msg = 'pH suboptimal. Use compost to buffer towards 6.5.';
        else if (gameState.practices.excessChemicalFertilizer) msg = 'Reduce chemical fertilizer to protect soil health.';
        hint.textContent = msg || 'All good. Keep practicing sustainable farming.';
    }
}

function fetchPrices() {
    return fetch('http://127.0.0.1:5001/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crops: Object.keys(gameState.inventory).concat(['rice','wheat','potato','maize','tea']) })
    }).then(r => r.json()).then(data => {
        // Capture previous prices for deltas/news
        const prev = { ...(gameState.priceMap || {}) };
        gameState.priceMap = data.prices || {};
        saveGameState();
        renderInventoryUI();
        renderMarketUI(prev);
        // Generate news items for significant moves
        pushPriceNews(prev, gameState.priceMap);
        return gameState.priceMap;
    }).catch(() => {
        // Fallback random prices if backend not running
        const base = { rice: 35, wheat: 25, potato: 20, maize: 28, tea: 250 };
        Object.keys(base).forEach(k => base[k] = Math.max(1, Math.round(base[k] * (0.95 + Math.random()*0.1))));
        const prev = { ...(gameState.priceMap || {}) };
        gameState.priceMap = base;
        renderInventoryUI();
        renderMarketUI(prev);
        pushPriceNews(prev, base);
        return base;
    });
}

// Gather practices including plot-installed assets for AI probability
function getPracticesForPlot(row, col) {
    const active = new Set();
    // Global toggles
    Object.keys(gameState.practices || {}).forEach(k => {
        if (gameState.practices[k]) active.add(k);
    });
    // Map to normalized keys expected by backend
    const normalized = new Set();
    active.forEach(k => {
        if (k === 'dripIrrigation') normalized.add('drip-irrigation');
        else if (k === 'excessChemicalFertilizer') normalized.add('excess-chemical-fertilizer');
        else normalized.add(k);
    });
    // Per-plot assets
    const assets = (getPlotState(row, col) || {}).assets || {};
    if (assets.compost) normalized.add('compost');
    if (assets.drip) normalized.add('drip-irrigation');
    if (assets.rainwater) normalized.add('rainwater'); // currently ignored by backend but future-ready
    return Array.from(normalized);
}

function getProbability(crop, row, col) {
    const payload = {
        crop,
        soil: gameState.soilType,
        params: {
            ph: gameState.params.ph,
            soilHealth: gameState.params.soilHealth,
            groundwater: gameState.params.groundwater,
            weather: gameState.params.weather
        },
        practices: (typeof row === 'number' && typeof col === 'number') ? getPracticesForPlot(row, col) : Object.keys(gameState.practices).filter(k => gameState.practices[k])
    };
    return fetch('http://127.0.0.1:5001/api/probability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(r => r.json()).then(data => data.probability || 0.5)
      .catch(() => 0.6); // optimistic fallback
}

function askMentor(question) {
    const payload = { question, context: { soil: gameState.soilType, params: gameState.params, practices: gameState.practices } };
    return fetch('http://127.0.0.1:5001/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(r => r.json()).then(data => data.answer)
      .catch(() => 'Try compost, mulching, and drip irrigation to improve soil health and conserve water.');
}

// ---------- Marketplace & Storage & News ----------

function getPrice(crop) {
    if (!crop) return 0;
    const fallback = { rice: 35, wheat: 25, potato: 20, maize: 28, tea: 250 };
    const p = gameState.priceMap && gameState.priceMap[crop];
    return Math.round(p != null ? p : (fallback[crop] || 20));
}

function renderMarketUI(prevPrices) {
    const el = document.getElementById('market-list');
    if (!el) return;
    const prices = gameState.priceMap || {};
    const prev = prevPrices || gameState.lastPriceMap || {};
    const crops = Object.keys({ ...prices, ...prev }).sort();
    if (crops.length === 0) {
        el.textContent = '';
        return;
    }
    el.innerHTML = '';
    crops.forEach(c => {
        const now = prices[c];
        const was = prev[c];
        const row = document.createElement('div');
        row.style.marginBottom = '2px';
        let deltaStr = '';
        if (now != null && was != null) {
            const diff = Math.round(now - was);
            if (diff !== 0) {
                const sign = diff > 0 ? '▲' : '▼';
                const cls = diff > 0 ? 'color:#A7F432;' : 'color:#FFB3B3;';
                deltaStr = ` <span style="${cls}">${sign} ${Math.abs(diff)}</span>`;
            }
        }
        row.innerHTML = `${titleCase(c)}: ₹${Math.round(now != null ? now : 0)}/kg${deltaStr}`;
        el.appendChild(row);
    });
    // Remember last prices after rendering
    gameState.lastPriceMap = { ...(gameState.priceMap || {}) };
    saveGameState();
}

function sellAllInventory() {
    const crops = Object.keys(gameState.inventory || {});
    if (crops.length === 0) {
        showMessage('Nothing to sell.', 'info');
        return 0;
    }
    let totalCoins = 0;
    crops.forEach(crop => {
        const qty = gameState.inventory[crop] || 0;
        if (qty <= 0) return;
        const price = getPrice(crop);
        totalCoins += qty * price;
        gameState.inventory[crop] = 0;
    });
    totalCoins = Math.round(totalCoins);
    if (totalCoins <= 0) {
        showMessage('No marketable produce.', 'info');
        return 0;
    }
    gameState.resources.coins = Math.round((gameState.resources.coins || 0) + totalCoins);
    // Clean zero entries
    Object.keys(gameState.inventory).forEach(k => { if (!gameState.inventory[k]) delete gameState.inventory[k]; });
    saveGameState();
    updateResourceDisplay();
    renderInventoryUI();
    showMessage('Sold all inventory for ₹' + totalCoins + '.', 'success');
    addNews(`Farmers sell produce, earning ₹${totalCoins}.`);
    return totalCoins;
}

function isCereal(crop){ return ['rice','wheat','maize'].includes(crop); }
function isProduce(crop){ return !isCereal(crop); }

function storageUsed(store) {
    const obj = gameState.storage[store] || {};
    return Object.values(obj).reduce((a,b)=>a+(b||0), 0);
}

function renderStorageUI() {
    const siloCapEl = document.getElementById('silo-cap');
    const barnCapEl = document.getElementById('barn-cap');
    const siloList = document.getElementById('silo-list');
    const barnList = document.getElementById('barn-list');
    if (siloCapEl) siloCapEl.textContent = `${storageUsed('silo')}/${gameState.capacities.silo} kg`;
    if (barnCapEl) barnCapEl.textContent = `${storageUsed('barn')}/${gameState.capacities.barn} kg`;
    if (siloList) siloList.innerHTML = '';
    if (barnList) barnList.innerHTML = '';
    // Populate lists
    Object.keys(gameState.storage.silo || {}).forEach(k => {
        const d = document.createElement('div');
        d.textContent = `${titleCase(k)}: ${gameState.storage.silo[k]} kg`;
        if (siloList) siloList.appendChild(d);
    });
    Object.keys(gameState.storage.barn || {}).forEach(k => {
        const d = document.createElement('div');
        d.textContent = `${titleCase(k)}: ${gameState.storage.barn[k]} kg`;
        if (barnList) barnList.appendChild(d);
    });
}

function storeAllCereals() {
    const inv = gameState.inventory || {};
    let moved = 0;
    const cap = gameState.capacities.silo;
    let used = storageUsed('silo');
    Object.keys(inv).forEach(crop => {
        if (!isCereal(crop) || used >= cap) return;
        const free = Math.max(0, cap - used);
        if (free <= 0) return;
        const qty = inv[crop] || 0;
        const move = Math.min(qty, free);
        if (move > 0) {
            gameState.storage.silo[crop] = (gameState.storage.silo[crop] || 0) + move;
            inv[crop] = qty - move;
            used += move;
            moved += move;
        }
    });
    // Clean zero entries
    Object.keys(inv).forEach(k => { if (!inv[k]) delete inv[k]; });
    saveGameState();
    renderInventoryUI();
    renderStorageUI();
    if (moved > 0) {
        showMessage('Stored ' + moved + ' kg of cereals in the silo.', 'success');
        addNews('Silo stocks increased by ' + moved + ' kg.');
    } else {
        showMessage('No cereals stored (check capacity or inventory).', 'info');
    }
    return moved;
}

function storeAllProduce() {
    const inv = gameState.inventory || {};
    let moved = 0;
    const cap = gameState.capacities.barn;
    let used = storageUsed('barn');
    Object.keys(inv).forEach(crop => {
        if (!isProduce(crop) || used >= cap) return;
        const free = Math.max(0, cap - used);
        if (free <= 0) return;
        const qty = inv[crop] || 0;
        const move = Math.min(qty, free);
        if (move > 0) {
            gameState.storage.barn[crop] = (gameState.storage.barn[crop] || 0) + move;
            inv[crop] = qty - move;
            used += move;
            moved += move;
        }
    });
    Object.keys(inv).forEach(k => { if (!inv[k]) delete inv[k]; });
    saveGameState();
    renderInventoryUI();
    renderStorageUI();
    if (moved > 0) {
        showMessage('Stored ' + moved + ' kg of produce in the barn.', 'success');
        addNews('Barn stocks increased by ' + moved + ' kg.');
    } else {
        showMessage('No produce stored (check capacity or inventory).', 'info');
    }
    return moved;
}

function pushPriceNews(prev, now) {
    if (!prev) prev = {};
    if (!now) now = {};
    const lines = [];
    Object.keys(now).forEach(crop => {
        const a = prev[crop];
        const b = now[crop];
        if (a == null || b == null) return;
        const diff = Math.round(b - a);
        if (Math.abs(diff) >= 2) {
            const dir = diff > 0 ? 'up' : 'down';
            lines.push(`${titleCase(crop)} prices ${dir} ₹${Math.abs(diff)}/kg to ₹${Math.round(b)}.`);
        }
    });
    lines.forEach(addNews);
    // Update last prices snapshot
    gameState.lastPriceMap = { ...(now || {}) };
    saveGameState();
}

let newsTickerTimer = null;
let newsIndex = 0;
function addNews(text) {
    if (!text) return;
    gameState.news = gameState.news || [];
    gameState.news.push(text);
    // Keep last 20
    if (gameState.news.length > 20) gameState.news = gameState.news.slice(-20);
}

function startNewsTicker() {
    const box = document.getElementById('news-ticker');
    if (!box) return;
    if (newsTickerTimer) return; // already running
    if (!gameState.news || gameState.news.length === 0) {
        gameState.news = ['Welcome to the Alluvial Valley Farm. Practice sustainability and watch markets.'];
    }
    newsIndex = 0;
    box.textContent = gameState.news[0] || '';
    newsTickerTimer = setInterval(() => {
        if (!gameState.news || gameState.news.length === 0) return;
        newsIndex = (newsIndex + 1) % gameState.news.length;
        box.textContent = gameState.news[newsIndex] || '';
    }, 4000);
}

// Utilities
function clamp01(v){ return Math.max(0, Math.min(1, v)); }
function titleCase(s){ return (s||'').replace(/\b\w/g, c=>c.toUpperCase()); }
function weatherEmoji(w){
    return ({ normal:'🌤️', drought:'☀️', flood:'🌧️', hail:'🌨️'}[w] || '🌤️');
}

function applyGovSupport() {
    // Simple scheme: PM-KISAN-like top-up when struggling
    const low = gameState.resources.coins < 20 || gameState.resources.seeds < 5 || gameState.resources.water < 10;
    if (!low) {
        showMessage('You are currently above the threshold for support.', 'info');
        return;
    }
    gameState.resources.coins += 100;
    gameState.resources.seeds += 50;
    gameState.resources.water += 50;
    saveGameState();
    updateResourceDisplay();
    showMessage('Government support credited: ₹100, +50 seeds, +50 water. Use responsibly for sustainable practices.', 'success');
}

// Sustainable asset placement with inventory limits
function setPlotAsset(row, col, key, value) {
    const plot = getPlotState(row, col);
    if (!plot) return false;
    plot.assets = plot.assets || {};
    const already = !!plot.assets[key];
    // If turning on and not already present, check inventory and coin cost
    if (value && !already) {
        const stock = (gameState.sustainableAssets && typeof gameState.sustainableAssets[key] === 'number')
            ? gameState.sustainableAssets[key] : 0;
        if (stock <= 0) {
            showMessage('No more ' + key + ' units available to install.', 'warning');
            return false;
        }
        const coinCost = (COSTS.assets[key] || 0);
        if ((gameState.resources.coins|0) < coinCost) {
            showMessage('Not enough coins to install ' + key + '.', 'error');
            return false;
        }
        // consume one unit
        gameState.sustainableAssets[key] = stock - 1;
        gameState.resources.coins = Math.max(0, (gameState.resources.coins|0) - coinCost);
    }
    // If turning off and already present, return to inventory (no coin refund)
    if (!value && already) {
        const stock = (gameState.sustainableAssets && typeof gameState.sustainableAssets[key] === 'number')
            ? gameState.sustainableAssets[key] : 0;
        gameState.sustainableAssets[key] = stock + 1;
    }
    // Set the asset flag on the plot
    plot.assets[key] = !!value;
    // Maintain global counts for farm-wide assets
    const globalKeys = ['solar','wind','biogas','trees'];
    if (globalKeys.includes(key)) {
        const counts = gameState.globalAssetCounts || (gameState.globalAssetCounts = {});
        // Recompute from all plots to stay consistent
        const all = { solar:0, wind:0, biogas:0, trees:0 };
        Object.keys(gameState.plots || {}).forEach(k => {
            const a = (gameState.plots[k] && gameState.plots[k].assets) || {};
            globalKeys.forEach(g => { if (a[g]) all[g]++; });
        });
        counts.solar = all.solar;
        counts.wind = all.wind;
        counts.biogas = all.biogas;
        counts.trees = all.trees;
    }
    setPlotState(row, col, { assets: plot.assets });
    updateAssetBadges();
    updateResourceDisplay();
    return true;
}

// Update tool buttons to reflect remaining asset counts and disable when zero
function updateAssetBadges() {
    const map = [
        { tool: 'asset-compost', key: 'compost' },
        { tool: 'asset-drip', key: 'drip' },
        { tool: 'asset-rainwater', key: 'rainwater' },
        { tool: 'asset-mulch', key: 'mulch' },
        { tool: 'asset-solar', key: 'solar' },
        { tool: 'asset-wind', key: 'wind' },
        { tool: 'asset-biogas', key: 'biogas' },
        { tool: 'asset-trees', key: 'trees' }
    ];
    map.forEach(({tool, key}) => {
        const btn = document.querySelector('.tool-btn[data-tool="' + tool + '"]');
        if (!btn) return;
        const nameEl = btn.querySelector('.tool-name');
        const remain = (gameState.sustainableAssets && typeof gameState.sustainableAssets[key] === 'number')
            ? gameState.sustainableAssets[key] : 0;
        if (nameEl) {
            const baseText = nameEl.getAttribute('data-base') || nameEl.textContent.replace(/\s*\(x\d+\)$/, '');
            nameEl.setAttribute('data-base', baseText);
            nameEl.textContent = baseText + ' (x' + remain + ')';
        }
        if (remain <= 0) {
            btn.setAttribute('disabled', 'true');
            btn.classList.add('disabled');
        } else {
            btn.removeAttribute('disabled');
            btn.classList.remove('disabled');
        }
    });
}

// Helpers
function moveToward(value, target, step) {
    if (value < target) return Math.min(target, value + step);
    if (value > target) return Math.max(target, value - step);
    return value;
}
function clampRange(v, min, max){ return Math.max(min, Math.min(max, v)); }

// ---------------- Hard-mode agronomy rules & penalties ----------------
// Baseline crop rules used for suitability checks (soil/pH/water tendencies)
const CROP_RULES = {
    rice:   { soils: ['alluvial','clay','loam'], ph: [6.0, 7.0], water: 'high' },
    wheat:  { soils: ['alluvial','loam'],        ph: [6.0, 7.5], water: 'moderate' },
    potato: { soils: ['sandy', 'loam'],          ph: [5.5, 6.8], water: 'moderate' },
    maize:  { soils: ['alluvial','loam'],        ph: [5.8, 7.2], water: 'moderate' },
    tea:    { soils: ['acidic','loam'],          ph: [4.5, 5.5], water: 'high' }
};

// Evaluate whether a crop can be planted now, and the baseline penalty if marginal
function evaluateCropSuitability(crop, row, col) {
    try {
        const gs = gameState || {};
        const soil = (gs.soilType || 'alluvial').toLowerCase();
        const p = gs.params || {};
        const ph = (typeof p.ph === 'number') ? p.ph : 6.5;
        const gw = (typeof p.groundwater === 'number') ? p.groundwater : 0.5;
        const health = (typeof p.soilHealth === 'number') ? p.soilHealth : 0.6;
        const weather = p.weather || 'normal';
        const plot = getPlotState(row, col);
        const assets = (plot && plot.assets) || {};

        const rule = CROP_RULES[crop] || null;
        const reasons = [];
        let allowed = true;
        let penalty = 1.0; // multiplier applied at harvest

        // Special hard gate: Tea in alluvial requires sustainable setup and acidic-ish pH
        if (crop === 'tea' && soil === 'alluvial') {
            const hasCompost = !!assets.compost;
            const hasMulch = !!assets.mulch;
            if (!(hasCompost && hasMulch)) {
                allowed = false;
                reasons.push('Tea requires compost + mulch installed on alluvial plots.');
            }
            if (ph > 6.0) {
                allowed = false;
                reasons.push('Tea needs acidic soil (pH ≤ 6.0; ideal 4.5–5.5).');
            }
            if (!allowed) return { allowed, penalty: 0.0, reasons };
            // If barely acidic (5.5–6.0), allow with strong penalty
            if (ph > 5.5 && ph <= 6.0) penalty *= 0.75;
        }

        // If no rule, be conservative
        if (!rule) {
            reasons.push('Unknown crop parameters; expect reduced yield.');
            penalty *= 0.85;
        } else {
            // Soil suitability: lenient but penalize if not typically suitable
            const soilOk = rule.soils.some(s => soil.includes(s));
            if (!soilOk) {
                penalty *= 0.85;
                reasons.push('Soil is not ideal for ' + crop + '.');
            }
            // pH suitability bands
            const [lo, hi] = rule.ph;
            if (ph < lo || ph > hi) {
                // Penalize more the further from range
                const dist = (ph < lo) ? (lo - ph) : (ph - hi);
                const phPen = ph < lo ? (ph < lo - 0.5 ? 0.7 : 0.85) : (ph > hi + 0.5 ? 0.7 : 0.85);
                penalty *= phPen;
                reasons.push('Soil pH is outside the ideal range for ' + crop + '.');
            } else {
                // slight bonus for being well within the range center
                const mid = (lo + hi) / 2;
                if (Math.abs(ph - mid) <= 0.2) penalty *= 1.02;
            }
            // Water availability based on crop water need
            if (rule.water === 'high') {
                if (gw < 0.35 && !(assets.drip || assets.rainwater)) {
                    // In drought and no irrigation infrastructure: may be too risky
                    if (weather === 'drought' && gw < 0.25) {
                        allowed = false;
                        reasons.push('Too dry to plant ' + crop + ' without irrigation assets.');
                    } else {
                        penalty *= 0.8;
                        reasons.push('Low water availability; install drip or rainwater tank.');
                    }
                }
                if (weather === 'flood') penalty *= 0.9; // flood risk
            } else if (rule.water === 'moderate') {
                if (gw < 0.3 && !(assets.drip || assets.rainwater)) {
                    penalty *= 0.88;
                    reasons.push('Groundwater is low; irrigation assets would help.');
                }
                if (weather === 'drought') penalty *= 0.92;
            }
        }

        // Soil health: poor health reduces success
        if (health < 0.45) { penalty *= 0.88; reasons.push('Soil health is low; add compost.'); }
        if (health < 0.35) { penalty *= 0.85; }

        // Clamp penalty and finalize
        penalty = clampRange(penalty, 0.5, 1.15);
        return { allowed, penalty, reasons };
    } catch (e) {
        return { allowed: true, penalty: 0.9, reasons: ['Estimator error; proceed cautiously.'] };
    }
}

// Dynamic penalties applied at harvest time based on evolving conditions
function computeHarvestPenalty(crop, row, col) {
    try {
        const gs = gameState || {};
        const p = gs.params || {};
        const ph = (typeof p.ph === 'number') ? p.ph : 6.5;
        const weather = p.weather || 'normal';
        let mult = 1.0;

        // Severe weather hits
        if (weather === 'hail') mult *= 0.85;
        if (weather === 'flood' && crop !== 'rice') mult *= 0.9;
        if (weather === 'drought' && crop === 'rice') mult *= 0.9;

        // pH second-check: harsher if way off
        const rule = CROP_RULES[crop];
        if (rule) {
            const [lo, hi] = rule.ph;
            if (ph < lo - 0.7 || ph > hi + 0.7) mult *= 0.85;
        }

        // Overuse of chemicals hurts quality
        if (gs.practices && gs.practices.excessChemicalFertilizer) mult *= 0.9;

        return clampRange(mult, 0.7, 1.0);
    } catch (e) {
        return 0.9;
    }
}
// Dynamic economy and storage adjustments
function applyDynamicEconomy() {
    // Make seeds/coins dynamic: small bonuses for more installed sustainable assets
    const sa = gameState.sustainableAssets || {};
    const baseSeeds = 800;
    const baseCoins = 40;
    const bonusUnits = (sa.compost|0) + (sa.drip|0) + (sa.rainwater|0) + (sa.mulch|0) + (sa.solar|0) + (sa.wind|0) + (sa.biogas|0) + (sa.trees|0);
    const seeds = Math.max(gameState.resources.seeds|0, baseSeeds + Math.min(300, bonusUnits * 10));
    const coins = Math.max(gameState.resources.coins|0, baseCoins + Math.min(200, bonusUnits * 5));
    gameState.resources.seeds = seeds;
    gameState.resources.coins = coins;

    // Dynamic storage: renewable energy and trees improve logistics/capacity slightly
    const gc = gameState.globalAssetCounts || {};
    const siloBase = 100;
    const barnBase = 100;
    const siloBonus = Math.min(100, ((gc.solar|0) + (gc.wind|0)) * 10);
    const barnBonus = Math.min(100, ((gc.biogas|0) + (gc.trees|0)) * 10);
    gameState.capacities.silo = siloBase + siloBonus;
    gameState.capacities.barn = barnBase + barnBonus;
    saveGameState();
}