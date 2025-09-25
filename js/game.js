// Main Game class for the Mountain Farm Game

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element with id "gameCanvas" not found');
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Remove minimap for now since it doesn't exist in HTML
        // this.minimap = document.getElementById('minimap');
        // this.minimapCtx = this.minimap.getContext('2d');
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.lastUpdateTime = 0;
        this.selectedPlot = null;
        
        // Camera system
        this.camera = {
            x: 0,
            y: 0,
            scale: 1,
            targetX: 0,
            targetY: 0,
            targetScale: 1
        };
        
        // Mouse/touch input
        this.input = {
            mouseX: 0,
            mouseY: 0,
            isMouseDown: false,
            isDragging: false,
            dragStartX: 0,
            dragStartY: 0
        };
        
        // Game objects
        this.player = new Player();
        this.plots = [];
        this.assets = {}; // Store loaded assets
        this.backgroundImage = null;
        
        // UI state
        this.showPlotInfo = false;
        this.showSeedPanel = false;
        this.showMarket = false;
        this.showPlotDetail = false;
        this.selectedPlotForDetail = null;
        
        // View state - mountain overview vs farming areas
        this.currentView = 'mountain'; // 'mountain', 'aluvial-farm', 'mountain-farm'
        this.farmingAreas = {
            aluvial: [],
            mountain: []
        };
        
        // Mountain click regions
        this.mountainRegions = [
            { type: 'aluvial', x: 200, y: 400, width: 300, height: 200, label: 'Aluvial Soil Area' },
            { type: 'mountain', x: 600, y: 300, width: 400, height: 250, label: 'Mountain Soil Area' }
        ];
        
        // Click tracking for double-click detection
        this.lastClickTime = null;
        this.lastClickedPlot = null;
        this.plotDetailView = null;
        
        // Click tracking for double-click detection
        this.lastClickTime = null;
        this.lastClickedPlot = null;
        this.zoomAnimation = null;
        
        this.initializePlots();
        this.setupEventListeners();
        
        // Initialize assets and load game
        this.loadAssets().then(() => {
            this.loadGame();
        });
    }

    // Load game assets
    async loadAssets() {
        console.log('Loading game assets...');
        
        const assetList = [
            // Environment assets
            { key: 'background-mountain', category: 'environment', name: 'background-mountain', color: '#90EE90', text: '🏔️', width: 1200, height: 700 },
            { key: 'plot-alluvial', category: 'environment', name: 'plot-alluvial', color: '#8B4513', text: '🌊' },
            { key: 'plot-rocky', category: 'environment', name: 'plot-rocky', color: '#696969', text: '🪨' },
            { key: 'plot-fertile', category: 'environment', name: 'plot-fertile', color: '#654321', text: '🌱' },
            { key: 'plot-mountain', category: 'environment', name: 'plot-mountain', color: '#A0522D', text: '⛰️' },
            
            // Crop growth stages
            { key: 'corn-stage1', category: 'crops', name: 'corn-stage1', color: '#8B4513', text: '🌱' },
            { key: 'corn-stage2', category: 'crops', name: 'corn-stage2', color: '#90EE90', text: '🌿' },
            { key: 'corn-stage3', category: 'crops', name: 'corn-stage3', color: '#32CD32', text: '🌾' },
            { key: 'corn-stage4', category: 'crops', name: 'corn-stage4', color: '#FFD700', text: '🌽' },
            
            { key: 'wheat-stage1', category: 'crops', name: 'wheat-stage1', color: '#8B4513', text: '🌱' },
            { key: 'wheat-stage2', category: 'crops', name: 'wheat-stage2', color: '#90EE90', text: '🌿' },
            { key: 'wheat-stage3', category: 'crops', name: 'wheat-stage3', color: '#32CD32', text: '🌾' },
            { key: 'wheat-stage4', category: 'crops', name: 'wheat-stage4', color: '#DEB887', text: '🌾' },
            
            { key: 'rice-stage1', category: 'crops', name: 'rice-stage1', color: '#8B4513', text: '🌱' },
            { key: 'rice-stage2', category: 'crops', name: 'rice-stage2', color: '#90EE90', text: '🌿' },
            { key: 'rice-stage3', category: 'crops', name: 'rice-stage3', color: '#32CD32', text: '🌾' },
            { key: 'rice-stage4', category: 'crops', name: 'rice-stage4', color: '#F5F5DC', text: '🌾' },
            
            { key: 'potato-stage1', category: 'crops', name: 'potato-stage1', color: '#8B4513', text: '🌱' },
            { key: 'potato-stage2', category: 'crops', name: 'potato-stage2', color: '#90EE90', text: '🌿' },
            { key: 'potato-stage3', category: 'crops', name: 'potato-stage3', color: '#32CD32', text: '🌾' },
            { key: 'potato-stage4', category: 'crops', name: 'potato-stage4', color: '#DEB887', text: '🥔' },
            
            // UI assets
            { key: 'coin', category: 'ui', name: 'coin', color: '#FFD700', text: '$' },
            { key: 'gem', category: 'ui', name: 'gem', color: '#4169E1', text: '💎' },
            { key: 'lock-icon', category: 'ui', name: 'lock-icon', color: '#FFD700', text: '🔒' },
            
            // Tool assets
            { key: 'fertilizer-effect', category: 'effects', name: 'fertilizer-effect', color: '#FFD700', text: '✨' },
            { key: 'water-effect', category: 'effects', name: 'water-effect', color: '#4169E1', text: '💧' },
            
            // Building assets
            { key: 'farmhouse', category: 'buildings', name: 'farmhouse', color: '#8B4513', text: '🏠', width: 200, height: 150 },
            { key: 'barn', category: 'buildings', name: 'barn', color: '#DC143C', text: '🏚️', width: 150, height: 120 }
        ];
        
        // Load all assets
        const loadPromises = assetList.map(async (asset) => {
            try {
                const img = await Utils.loadAsset(
                    asset.category, 
                    asset.name, 
                    asset.color, 
                    asset.text,
                    asset.width || 64,
                    asset.height || 64
                );
                return { key: asset.key, image: img };
            } catch (error) {
                console.warn(`Failed to load asset ${asset.key}:`, error);
                return null;
            }
        });
        
        const loadedAssets = await Promise.all(loadPromises);
        
        // Store loaded assets
        loadedAssets.forEach(asset => {
            if (asset) {
                this.assets[asset.key] = asset.image;
            }
        });
        
        console.log(`Loaded ${Object.keys(this.assets).length} assets`);
    }

    // Initialize game plots based on the mountain farm layout
    initializePlots() {
        // Start with no plots - they will be created when entering farming areas
        this.plots = [];
        
        // Don't initialize UI here - it will be done after DOM is ready
    }

    // Setup event listeners for user interaction
    setupEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // UI button events
        this.setupUIEventListeners();
        
        // Window events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', () => this.saveGame());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // Setup UI event listeners
    setupUIEventListeners() {
        // Plot info panel
        const closePlotInfo = document.getElementById('close-plot-info');
        if (closePlotInfo) {
            closePlotInfo.addEventListener('click', () => this.closePlotInfo());
        }
        
        const plantBtn = document.getElementById('plant-btn');
        if (plantBtn) {
            plantBtn.addEventListener('click', () => this.showSeedSelection());
        }
        
        const harvestBtn = document.getElementById('harvest-btn');
        if (harvestBtn) {
            harvestBtn.addEventListener('click', () => this.harvestSelectedPlot());
        }
        
        const unlockBtn = document.getElementById('unlock-btn');
        if (unlockBtn) {
            unlockBtn.addEventListener('click', () => this.unlockSelectedPlot());
        }
        
        // Seed panel
        const closeSeedPanel = document.getElementById('close-seed-panel');
        if (closeSeedPanel) {
            closeSeedPanel.addEventListener('click', () => this.closeSeedPanel());
        }
        
        // Seed selection
        document.querySelectorAll('.seed-item').forEach(item => {
            item.addEventListener('click', (e) => this.selectSeed(e.currentTarget.dataset.crop));
        });
        
        // Toolbar
        document.querySelectorAll('.tool-item').forEach((item, index) => {
            item.addEventListener('click', () => this.handleToolClick(index));
        });
        
        // Pause button
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
        
        // Building buttons
        const barnBtn = document.getElementById('barn-btn');
        if (barnBtn) {
            barnBtn.addEventListener('click', () => this.showStorageView('barn'));
        }
        
        const siloBtn = document.getElementById('silo-btn');
        if (siloBtn) {
            siloBtn.addEventListener('click', () => this.showStorageView('silo'));
        }
        
        // Modal close buttons
        const barnModal = document.getElementById('barn-modal');
        if (barnModal) {
            const closeBtn = barnModal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeStorageView());
            }
        }
        
        const siloModal = document.getElementById('silo-modal');
        if (siloModal) {
            const closeBtn = siloModal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeStorageView());
            }
        }
        
        const plotModal = document.getElementById('plot-modal');
        if (plotModal) {
            const closeBtn = plotModal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closePlotModal());
            }
        }
        
        const seedModal = document.getElementById('seed-modal');
        if (seedModal) {
            const closeBtn = seedModal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeSeedModal());
            }
        }
        
        // Storage modal close button (legacy)
        const closeStorageBtn = document.getElementById('close-storage');
        if (closeStorageBtn) {
            closeStorageBtn.addEventListener('click', () => this.closeStorageView());
        }
        
        // Plot detail view buttons
        const exitDetailBtn = document.getElementById('exit-detail-btn');
        if (exitDetailBtn) {
            exitDetailBtn.addEventListener('click', () => this.exitPlotDetailView());
        }
        
        const detailPlantBtn = document.getElementById('detail-plant-btn');
        if (detailPlantBtn) {
            detailPlantBtn.addEventListener('click', () => this.handlePlantAction());
        }
        
        const detailHarvestBtn = document.getElementById('detail-harvest-btn');
        if (detailHarvestBtn) {
            detailHarvestBtn.addEventListener('click', () => this.handleHarvestAction());
        }
        
        const detailWaterBtn = document.getElementById('detail-water-btn');
        if (detailWaterBtn) {
            detailWaterBtn.addEventListener('click', () => this.handleWaterAction());
        }
    }

    // Handle mouse down event
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.input.mouseX = e.clientX - rect.left;
        this.input.mouseY = e.clientY - rect.top;
        this.input.isMouseDown = true;
        this.input.dragStartX = this.input.mouseX;
        this.input.dragStartY = this.input.mouseY;
        
        // Skip plot interaction if in detail view (handled by UI buttons)
        if (this.plotDetailView && this.plotDetailView.active) {
            return;
        }
        
        // Convert screen coordinates to world coordinates
        const worldX = (this.input.mouseX / this.camera.scale) + this.camera.x;
        const worldY = (this.input.mouseY / this.camera.scale) + this.camera.y;
        
        if (this.currentView === 'mountain') {
            // Check if clicking on mountain regions
            const clickedRegion = this.mountainRegions.find(region => 
                worldX >= region.x && worldX <= region.x + region.width &&
                worldY >= region.y && worldY <= region.y + region.height
            );
            
            if (clickedRegion) {
                this.enterFarmingArea(clickedRegion.type);
                return;
            }
        } else {
            // In farming area - handle plot clicks
            const clickedPlot = this.plots.find(plot => plot.containsPoint(worldX, worldY));
            
            if (clickedPlot) {
                // Check for double-click to enter detail view
                const now = Date.now();
                if (this.lastClickTime && (now - this.lastClickTime) < 500 && this.lastClickedPlot === clickedPlot) {
                    // Double-click detected - show detail view
                    const plotIndex = this.plots.indexOf(clickedPlot);
                    this.showPlotDetailView(plotIndex);
                    this.lastClickTime = null;
                    this.lastClickedPlot = null;
                } else {
                    // Single click - select plot
                    this.selectPlot(clickedPlot);
                    this.lastClickTime = now;
                    this.lastClickedPlot = clickedPlot;
                }
            } else {
                this.deselectPlot();
                this.lastClickTime = null;
                this.lastClickedPlot = null;
            }
        }
    }

    // Handle mouse move event
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.input.mouseX = e.clientX - rect.left;
        this.input.mouseY = e.clientY - rect.top;
        
        if (this.input.isMouseDown) {
            const deltaX = this.input.mouseX - this.input.dragStartX;
            const deltaY = this.input.mouseY - this.input.dragStartY;
            
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                this.input.isDragging = true;
                
                // Calculate bounds based on current view
                let minX = 0, maxX = 0, minY = 0, maxY = 0;
                if (this.currentView === 'mountain') {
                    // Mountain view bounds - keep mountain centered
                    minX = -100;
                    maxX = 100;
                    minY = -50;
                    maxY = 50;
                } else {
                    // Farming view bounds
                    minX = -200;
                    maxX = 400;
                    minY = -100;
                    maxY = 300;
                }
                
                // Pan camera with bounds
                this.camera.targetX = Utils.clamp(
                    this.camera.x - deltaX / this.camera.scale,
                    minX, maxX
                );
                this.camera.targetY = Utils.clamp(
                    this.camera.y - deltaY / this.camera.scale,
                    minY, maxY
                );
                
                this.input.dragStartX = this.input.mouseX;
                this.input.dragStartY = this.input.dragStartY;
            }
        }
    }

    // Handle mouse up event
    handleMouseUp(e) {
        this.input.isMouseDown = false;
        this.input.isDragging = false;
    }

    // Handle mouse wheel for zooming
    handleWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        
        // Different zoom limits based on current view
        let minZoom, maxZoom;
        if (this.currentView === 'mountain') {
            // Mountain view: fit to screen bounds
            minZoom = 1.0;  // Fit mountain to screen
            maxZoom = 2.0;  // Don't zoom too close
        } else {
            // Farming view: closer zoom for plot management
            minZoom = 0.8;
            maxZoom = 2.5;
        }
        
        this.camera.targetScale = Utils.clamp(this.camera.targetScale * zoomFactor, minZoom, maxZoom);
    }

    // Handle touch events (mobile support)
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp(e);
    }

    // Handle keyboard input
    handleKeyDown(e) {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.togglePause();
                break;
            case 'Escape':
                this.closePanels();
                break;
        }
    }

    // Handle window resize
    handleResize() {
        const container = document.querySelector('.game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    // Select a plot
    selectPlot(plot) {
        if (this.selectedPlot) {
            this.selectedPlot.isSelected = false;
        }
        
        this.selectedPlot = plot;
        plot.isSelected = true;
        this.showPlotInfo = true;
        this.updatePlotInfoPanel();
    }

    // Deselect current plot
    deselectPlot() {
        if (this.selectedPlot) {
            this.selectedPlot.isSelected = false;
            this.selectedPlot = null;
        }
        this.closePlotInfo();
    }

    // Update plot info panel
    updatePlotInfoPanel() {
        if (!this.selectedPlot) return;
        
        const panel = document.getElementById('plot-info-panel');
        const plotTitle = document.getElementById('plot-title');
        const soilType = document.getElementById('soil-type');
        const plotStatus = document.getElementById('plot-status');
        const plantBtn = document.getElementById('plant-btn');
        const harvestBtn = document.getElementById('harvest-btn');
        const unlockBtn = document.getElementById('unlock-btn');
        
        const plotInfo = this.selectedPlot.getInfo();
        
        plotTitle.textContent = `${plotInfo.soilType} Plot`;
        soilType.textContent = plotInfo.soilType;
        plotStatus.textContent = plotInfo.status;
        
        // Show/hide buttons based on plot state
        if (!plotInfo.isUnlocked) {
            plantBtn.style.display = 'none';
            harvestBtn.style.display = 'none';
            unlockBtn.style.display = 'block';
            unlockBtn.textContent = `Unlock (${plotInfo.unlockCost} coins)`;
            unlockBtn.disabled = !this.player.canAfford(plotInfo.unlockCost);
        } else if (plotInfo.status === 'Empty') {
            plantBtn.style.display = 'block';
            harvestBtn.style.display = 'none';
            unlockBtn.style.display = 'none';
        } else if (plotInfo.status === 'Ready to harvest') {
            plantBtn.style.display = 'none';
            harvestBtn.style.display = 'block';
            unlockBtn.style.display = 'none';
        } else {
            plantBtn.style.display = 'none';
            harvestBtn.style.display = 'none';
            unlockBtn.style.display = 'none';
        }
        
        panel.style.display = 'block';
    }

    // Close plot info panel
    closePlotInfo() {
        document.getElementById('plot-info-panel').style.display = 'none';
        this.showPlotInfo = false;
    }

    // Show seed selection panel
    showSeedSelection() {
        if (!this.selectedPlot || !this.selectedPlot.isUnlocked) return;
        
        const availableCrops = this.selectedPlot.getAvailableCrops();
        const seedItems = document.querySelectorAll('.seed-item');
        
        seedItems.forEach(item => {
            const cropType = item.dataset.crop;
            const isAvailable = availableCrops.includes(cropType);
            const hasSeeds = this.player.getInventoryCount('seeds', cropType) > 0;
            
            item.style.display = isAvailable ? 'flex' : 'none';
            item.style.opacity = hasSeeds ? '1' : '0.5';
            item.style.pointerEvents = hasSeeds ? 'auto' : 'none';
        });
        
        const seedPanel = document.getElementById('seed-panel');
        if (seedPanel) {
            seedPanel.style.display = 'block';
        }
        this.showSeedPanel = true;
    }

    // Close seed panel
    closeSeedPanel() {
        const seedPanel = document.getElementById('seed-panel');
        if (seedPanel) {
            seedPanel.style.display = 'none';
        }
        this.showSeedPanel = false;
    }

    // Select seed and plant
    selectSeed(cropType) {
        if (!this.selectedPlot || !this.selectedPlot.isUnlocked) return;
        
        if (this.player.useSeeds(cropType, 1)) {
            const result = this.selectedPlot.plantCrop(cropType, Date.now());
            
            if (result.success) {
                Utils.showTooltip(this.input.mouseX, this.input.mouseY, result.message);
                this.closeSeedPanel();
                this.updatePlotInfoPanel();
            } else {
                Utils.showTooltip(this.input.mouseX, this.input.mouseY, result.message);
            }
        } else {
            Utils.showTooltip(this.input.mouseX, this.input.mouseY, 'Not enough seeds!');
        }
    }

    // Harvest selected plot
    harvestSelectedPlot() {
        if (!this.selectedPlot) return;
        
        const harvestResult = this.selectedPlot.harvestCrop();
        
        if (harvestResult) {
            this.player.addHarvestedCrop(harvestResult.type, harvestResult.quantity);
            this.player.addCoins(harvestResult.value);
            
            const message = `Harvested ${harvestResult.quantity} ${GAME_CONFIG.CROPS[harvestResult.type].name} for ${harvestResult.value} coins!`;
            Utils.showTooltip(this.input.mouseX, this.input.mouseY, message);
            
            this.updatePlotInfoPanel();
        }
    }

    // Unlock selected plot
    unlockSelectedPlot() {
        if (!this.selectedPlot || this.selectedPlot.isUnlocked) return;
        
        if (this.player.unlockPlot(this.selectedPlot.id, this.selectedPlot.unlockCost)) {
            this.selectedPlot.unlock();
            Utils.showTooltip(this.input.mouseX, this.input.mouseY, 'Plot unlocked!');
            this.updatePlotInfoPanel();
        } else {
            Utils.showTooltip(this.input.mouseX, this.input.mouseY, 'Not enough coins!');
        }
    }

    // Handle toolbar clicks
    handleToolClick(toolIndex) {
        switch (toolIndex) {
            case 0: // Seeds
                if (this.selectedPlot && this.selectedPlot.isUnlocked && !this.selectedPlot.crop) {
                    this.showSeedSelection();
                }
                break;
            case 1: // Fertilizer
                if (this.selectedPlot && this.selectedPlot.isUnlocked) {
                    if (this.player.getInventoryCount('tools', 'fertilizer') > 0) {
                        this.selectedPlot.fertilize(Date.now());
                        this.player.inventory.tools.fertilizer--;
                        Utils.showTooltip(this.input.mouseX, this.input.mouseY, 'Plot fertilized!');
                    } else {
                        Utils.showTooltip(this.input.mouseX, this.input.mouseY, 'No fertilizer available!');
                    }
                }
                break;
            case 2: // Tools
                // Water the selected plot
                if (this.selectedPlot && this.selectedPlot.isUnlocked) {
                    this.selectedPlot.water(Date.now());
                    Utils.showTooltip(this.input.mouseX, this.input.mouseY, 'Plot watered!');
                }
                break;
            case 3: // Buildings
                Utils.showTooltip(this.input.mouseX, this.input.mouseY, 'Buildings coming soon!');
                break;
            case 4: // Market
                this.toggleMarket();
                break;
        }
    }

    // Toggle market
    toggleMarket() {
        const modal = document.getElementById('market-modal');
        if (modal && modal.classList.contains('show')) {
            modal.classList.remove('show');
            this.showMarket = false;
        } else if (modal) {
            this.updateMarketData();
            modal.classList.add('show');
            this.showMarket = true;
        }
    }

    // Update market data
    updateMarketData() {
        // Implementation for market will be added in the market system
    }

    // Toggle pause
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = this.isPaused ? '▶' : '⏸';
    }

    // Close all panels
    closePanels() {
        this.closePlotInfo();
        this.closeSeedPanel();
        if (this.showMarket) {
            this.toggleMarket();
        }
    }

    // Update camera smoothly
    updateCamera() {
        const lerpFactor = 0.1;
        this.camera.x = Utils.lerp(this.camera.x, this.camera.targetX, lerpFactor);
        this.camera.y = Utils.lerp(this.camera.y, this.camera.targetY, lerpFactor);
        this.camera.scale = Utils.lerp(this.camera.scale, this.camera.targetScale, lerpFactor);
    }

    // Main game update loop
    update(currentTime) {
        if (this.isPaused) return;
        
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        
        // Update camera
        this.updateCamera();
        
        // Update plots
        this.plots.forEach(plot => plot.update(currentTime));
        
        // Auto-save every 30 seconds
        if (Math.floor(currentTime / 30000) > Math.floor((currentTime - deltaTime) / 30000)) {
            this.saveGame();
        }
    }

    // Render the game
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Debug: Fill canvas with a color to confirm rendering is working
        this.ctx.fillStyle = '#87CEEB'; // Sky blue background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for camera transformation
        this.ctx.save();
        
        // Apply camera transformation with plot detail zoom
        if (this.plotDetailView && this.plotDetailView.active) {
            // Apply zoom transformation for plot detail view
            const zoomScale = this.camera.scale * this.plotDetailView.zoomLevel;
            const centerX = this.plotDetailView.centerX;
            const centerY = this.plotDetailView.centerY;
            
            // Calculate the position to center the plot
            const offsetX = (this.canvas.width / 2) / zoomScale - centerX;
            const offsetY = (this.canvas.height / 2) / zoomScale - centerY;
            
            this.ctx.scale(zoomScale, zoomScale);
            this.ctx.translate(offsetX, offsetY);
        } else {
            // Normal camera transformation
            this.ctx.scale(this.camera.scale, this.camera.scale);
            this.ctx.translate(-this.camera.x, -this.camera.y);
        }
        
        // Draw background
        this.drawBackground();
        
        // Draw content based on current view
        if (this.currentView === 'mountain') {
            // Mountain overview - show clickable regions instead of plots
            this.drawMountainRegions();
        } else if (this.plotDetailView && this.plotDetailView.active) {
            // Plot detail view - enhanced plot rendering
            const focusedPlot = this.plots[this.plotDetailView.plotIndex];
            this.drawDetailedGround(focusedPlot);
            focusedPlot.draw(this.ctx, Date.now(), this.assets, true);
        } else {
            // Farming area view - show plots for specific soil type
            this.plots.forEach(plot => plot.draw(this.ctx, Date.now(), this.assets));
        }
        
        // Restore context
        this.ctx.restore();
        
        // Draw UI overlays (only minimap in normal view)
        if (!this.plotDetailView || !this.plotDetailView.active) {
            // this.drawMinimap(); // Disabled for now
        }
    }

    // Draw game background
    drawBackground() {
        console.log('Drawing background, currentView:', this.currentView);
        
        if (this.currentView === 'mountain') {
            // Mountain overview - show full mountain background
            console.log('Drawing mountain background');
            
            // Simple fallback - draw a green rectangle for mountain view
            this.ctx.fillStyle = '#90EE90';
            this.ctx.fillRect(0, 0, 1200, 700);
            
            // Add some mountain-like shapes
            this.ctx.fillStyle = '#8B7355';
            this.ctx.beginPath();
            this.ctx.moveTo(100, 700);
            this.ctx.lineTo(300, 200);
            this.ctx.lineTo(500, 700);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.moveTo(400, 700);
            this.ctx.lineTo(600, 150);
            this.ctx.lineTo(800, 700);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.moveTo(700, 700);
            this.ctx.lineTo(900, 250);
            this.ctx.lineTo(1100, 700);
            this.ctx.fill();
            if (this.assets['background-mountain']) {
                // Position mountain to fill canvas properly
                const canvasAspect = this.canvas.width / this.canvas.height;
                const imageAspect = 1.5; // Approximate mountain image aspect ratio
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (canvasAspect > imageAspect) {
                    // Canvas is wider - fit to height
                    drawHeight = this.canvas.height;
                    drawWidth = drawHeight * imageAspect;
                    drawX = (this.canvas.width - drawWidth) / 2;
                    drawY = 0;
                } else {
                    // Canvas is taller - fit to width
                    drawWidth = this.canvas.width;
                    drawHeight = drawWidth / imageAspect;
                    drawX = 0;
                    drawY = (this.canvas.height - drawHeight) / 2;
                }
                
                this.ctx.drawImage(
                    this.assets['background-mountain'], 
                    drawX, drawY, drawWidth, drawHeight
                );
                
                // Add clouds if available
                if (this.assets['clouds']) {
                    this.ctx.globalAlpha = 0.8;
                    this.ctx.drawImage(this.assets['clouds'], 100, 50, 200, 100);
                    this.ctx.drawImage(this.assets['clouds'], 600, 80, 150, 75);
                    this.ctx.drawImage(this.assets['clouds'], 900, 60, 180, 90);
                    this.ctx.globalAlpha = 1.0;
                }
            } else {
                // Fallback mountain view
                this.drawFallbackMountain();
            }
        } else {
            // Farming area backgrounds
            this.drawFarmingAreaBackground();
        }
    }
    
    // Draw fallback mountain when custom asset not available
    drawFallbackMountain() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Mountain silhouette
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 400);
        this.ctx.lineTo(200, 100);
        this.ctx.lineTo(400, 150);
        this.ctx.lineTo(600, 50);
        this.ctx.lineTo(800, 120);
        this.ctx.lineTo(1000, 80);
        this.ctx.lineTo(1200, 150);
        this.ctx.lineTo(1200, 700);
        this.ctx.lineTo(0, 700);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    // Draw farming area background
    drawFarmingAreaBackground() {
        const soilType = this.currentView.replace('-farm', '');
        
        // Draw sky gradient first
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        if (soilType === 'aluvial') {
            // Rich fertile soil background
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * 0.3);
            
            // Add fertile soil texture
            this.ctx.fillStyle = '#654321';
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * this.canvas.width;
                const y = this.canvas.height * 0.7 + Math.random() * (this.canvas.height * 0.3);
                this.ctx.fillRect(x, y, 2, 2);
            }
            
            // Add some grass patches
            this.ctx.fillStyle = '#228B22';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * this.canvas.width;
                const y = this.canvas.height * 0.7 + Math.random() * 30;
                this.ctx.fillRect(x, y, 3, 6);
            }
        } else {
            // Rocky mountain soil background
            this.ctx.fillStyle = '#A0522D';
            this.ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * 0.3);
            
            // Add rocks
            this.ctx.fillStyle = '#696969';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * this.canvas.width;
                const y = this.canvas.height * 0.7 + Math.random() * (this.canvas.height * 0.3);
                const size = 3 + Math.random() * 6;
                this.ctx.fillRect(x, y, size, size);
            }
            
            // Add some scattered stones
            this.ctx.fillStyle = '#808080';
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * this.canvas.width;
                const y = this.canvas.height * 0.7 + Math.random() * 40;
                const size = 2 + Math.random() * 3;
                this.ctx.fillRect(x, y, size, size);
            }
        }
    }
    
    // Draw clickable mountain regions
    drawMountainRegions() {
        console.log('Drawing mountain regions, count:', this.mountainRegions.length);
        
        this.mountainRegions.forEach((region, index) => {
            console.log(`Drawing region ${index}:`, region);
            
            // Draw region outline
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([10, 5]);
            this.ctx.strokeRect(region.x, region.y, region.width, region.height);
            this.ctx.setLineDash([]);
            
            // Draw region label
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            
            const centerX = region.x + region.width / 2;
            const centerY = region.y + region.height / 2;
            
            this.ctx.strokeText(region.label, centerX, centerY);
            this.ctx.fillText(region.label, centerX, centerY);
            
            // Draw soil type indicator
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#FFF8DC';
            const subText = `Click to enter ${region.type} farming area`;
            this.ctx.strokeText(subText, centerX, centerY + 25);
            this.ctx.fillText(subText, centerX, centerY + 25);
        });
    }

    // Draw detailed ground texture for plot detail view
    drawDetailedGround(plot) {
        const groundSize = 300;
        const startX = plot.x - 100;
        const startY = plot.y - 100;
        
        // Draw soil texture
        if (plot.soilType === 'ALUVIAL') {
            this.ctx.fillStyle = '#8B4513';
        } else {
            this.ctx.fillStyle = '#A0522D';
        }
        
        this.ctx.fillRect(startX, startY, groundSize, groundSize);
        
        // Add texture details
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 1;
        
        // Draw grid pattern for soil
        for (let i = 0; i < 10; i++) {
            const x = startX + (i * groundSize / 10);
            const y = startY + (i * groundSize / 10);
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, startY + groundSize);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(startX + groundSize, y);
            this.ctx.stroke();
        }
        
        // Add some decorative elements
        this.drawGrass(startX, startY, groundSize);
    }

    // Draw grass details
    drawGrass(startX, startY, size) {
        this.ctx.fillStyle = '#228B22';
        
        // Draw small grass patches
        for (let i = 0; i < 20; i++) {
            const x = startX + Math.random() * size;
            const y = startY + Math.random() * size;
            const grassSize = 3 + Math.random() * 2;
            
            this.ctx.fillRect(x, y, grassSize, grassSize * 2);
        }
    }

    // Draw minimap (disabled for now)
    drawMinimap() {
        // Minimap functionality disabled since no minimap element in HTML
        return;
        
        /* 
        this.minimapCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);
        
        // Scale factor for minimap
        const scale = 0.1;
        
        // Draw background
        this.minimapCtx.fillStyle = '#90EE90';
        this.minimapCtx.fillRect(0, 0, this.minimap.width, this.minimap.height);
        
        // Draw plots
        this.plots.forEach(plot => {
            const x = plot.x * scale;
            const y = plot.y * scale;
            const width = plot.width * scale;
            const height = plot.height * scale;
            
            this.minimapCtx.fillStyle = plot.isUnlocked ? plot.soilConfig.color : '#666';
            this.minimapCtx.fillRect(x, y, width, height);
            
            if (plot.isSelected) {
                this.minimapCtx.strokeStyle = '#FFD700';
                this.minimapCtx.lineWidth = 2;
                this.minimapCtx.strokeRect(x, y, width, height);
            }
        });
        
        // Draw camera view
        const viewX = this.camera.x * scale;
        const viewY = this.camera.y * scale;
        const viewWidth = (this.canvas.width / this.camera.scale) * scale;
        const viewHeight = (this.canvas.height / this.camera.scale) * scale;
        
        this.minimapCtx.strokeStyle = '#FF0000';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.strokeRect(viewX, viewY, viewWidth, viewHeight);
        */
    }

    // Game loop
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = Date.now();
        this.update(currentTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    // Start the game
    start() {
        this.isRunning = true;
        this.lastUpdateTime = Date.now();
        
        // Initialize UI for mountain view now that DOM is ready
        this.showMountainUI();
        
        this.gameLoop();
    }

    // Stop the game
    stop() {
        this.isRunning = false;
        this.saveGame();
    }

    // Save game data
    saveGame() {
        const gameData = {
            plots: this.plots.map(plot => plot.serialize()),
            camera: this.camera,
            lastSaved: Date.now()
        };
        
        Utils.saveToStorage('mountainFarmGame', gameData);
        this.player.save();
    }

    // Load game data
    loadGame() {
        // Load player data
        this.player.load();
        
        // Load game data
        const gameData = Utils.loadFromStorage('mountainFarmGame');
        if (gameData && gameData.plots) {
            // Restore plots
            gameData.plots.forEach((plotData, index) => {
                if (index < this.plots.length) {
                    this.plots[index] = Plot.deserialize(plotData);
                }
            });
            
            // Restore camera if available
            if (gameData.camera) {
                this.camera = { ...this.camera, ...gameData.camera };
                this.camera.targetX = this.camera.x;
                this.camera.targetY = this.camera.y;
                this.camera.targetScale = this.camera.scale;
            }
        }
    }

    // Show detailed plot view with zoom animation
    showPlotDetailView(plotIndex) {
        this.plotDetailView = {
            active: true,
            plotIndex: plotIndex,
            zoomLevel: 1,
            targetZoomLevel: 3,
            animating: true,
            centerX: this.plots[plotIndex].x + 60,
            centerY: this.plots[plotIndex].y + 60
        };
        
        // Update UI to show plot detail panel
        const plotDetailView = document.getElementById('plot-detail-view');
        const uiPanel = document.getElementById('ui-panel');
        
        if (plotDetailView) {
            plotDetailView.style.display = 'block';
        }
        if (uiPanel) {
            uiPanel.style.display = 'none';
        }
        
        // Update plot detail info
        const plot = this.plots[plotIndex];
        const detailPlotType = document.getElementById('detail-plot-type');
        const detailCropType = document.getElementById('detail-crop-type');
        const detailGrowthStage = document.getElementById('detail-growth-stage');
        
        if (detailPlotType) {
            detailPlotType.textContent = plot.soilType;
        }
        if (detailCropType) {
            detailCropType.textContent = plot.crop ? plot.crop.type : 'Empty';
        }
        if (detailGrowthStage) {
            detailGrowthStage.textContent = plot.crop ? `Stage ${plot.crop.growthStage + 1}` : 'No crop';
        }
        
        // Start zoom animation
        this.animateZoom();
    }
    
    // Animate zoom effect
    animateZoom() {
        if (!this.plotDetailView || !this.plotDetailView.animating) return;
        
        const zoomSpeed = 0.1;
        const currentZoom = this.plotDetailView.zoomLevel;
        const targetZoom = this.plotDetailView.targetZoomLevel;
        
        if (Math.abs(currentZoom - targetZoom) > 0.1) {
            this.plotDetailView.zoomLevel += (targetZoom - currentZoom) * zoomSpeed;
            requestAnimationFrame(() => this.animateZoom());
        } else {
            this.plotDetailView.zoomLevel = targetZoom;
            this.plotDetailView.animating = false;
        }
    }
    
    // Exit detailed plot view
    exitPlotDetailView() {
        this.plotDetailView = {
            active: false,
            plotIndex: -1,
            zoomLevel: 1,
            targetZoomLevel: 1,
            animating: false,
            centerX: 0,
            centerY: 0
        };
        
        // Hide plot detail panel and show main UI
        const plotDetailView = document.getElementById('plot-detail-view');
        const uiPanel = document.getElementById('ui-panel');
        
        if (plotDetailView) {
            plotDetailView.style.display = 'none';
        }
        if (uiPanel) {
            uiPanel.style.display = 'block';
        }
    }

    // Handle plant action in detail view
    handlePlantAction() {
        if (!this.plotDetailView || this.plotDetailView.plotIndex === -1) return;
        
        const plotIndex = this.plotDetailView.plotIndex;
        this.handlePlotClick(plotIndex);
    }

    // Handle harvest action in detail view
    handleHarvestAction() {
        if (!this.plotDetailView || this.plotDetailView.plotIndex === -1) return;
        
        const plotIndex = this.plotDetailView.plotIndex;
        const plot = this.plots[plotIndex];
        
        if (plot.crop && plot.crop.isHarvestable()) {
            this.harvestCrop(plotIndex);
            // Update the detail view info
            const detailCropType = document.getElementById('detail-crop-type');
            const detailGrowthStage = document.getElementById('detail-growth-stage');
            
            if (detailCropType) {
                detailCropType.textContent = 'Empty';
            }
            if (detailGrowthStage) {
                detailGrowthStage.textContent = 'No crop';
            }
        }
    }

    // Handle water action in detail view
    handleWaterAction() {
        if (!this.plotDetailView || this.plotDetailView.plotIndex === -1) return;
        
        const plotIndex = this.plotDetailView.plotIndex;
        const plot = this.plots[plotIndex];
        
        if (plot.crop && !plot.crop.isHarvestable()) {
            // Add water effect (speeds up growth slightly)
            plot.crop.timeLastWatered = Date.now();
            
            // Show water effect
            this.showEffect(plot.x + 60, plot.y + 60, '💧', '#4a90e2');
        }
    }

    // Show storage building content
    showStorageView(buildingType) {
        const modalId = buildingType === 'barn' ? 'barn-modal' : 'silo-modal';
        const modal = document.getElementById(modalId);
        
        if (!modal) {
            console.warn(`${buildingType} modal not found`);
            return;
        }
        
        // Show the modal using the class method
        modal.classList.add('show');
        
        // Update inventory content
        const inventoryId = buildingType === 'barn' ? 'barn-inventory' : 'silo-inventory';
        const inventoryContainer = document.getElementById(inventoryId);
        
        if (inventoryContainer) {
            inventoryContainer.innerHTML = '';
            
            // Show crops in inventory
            Object.keys(this.player.inventory).forEach(cropType => {
                const quantity = this.player.inventory[cropType];
                if (quantity > 0) {
                    const item = document.createElement('div');
                    item.className = 'storage-item';
                    
                    // Use custom crop image if available
                    const cropImg = this.assets[`crop-${cropType}`] || this.assets[`crop-${cropType}-4`];
                    if (cropImg) {
                        const canvas = document.createElement('canvas');
                        canvas.width = 50;
                        canvas.height = 50;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(cropImg, 0, 0, 50, 50);
                        item.appendChild(canvas);
                    } else {
                        const icon = document.createElement('div');
                        icon.className = 'crop-icon';
                        icon.textContent = Utils.getCropEmoji(cropType);
                        item.appendChild(icon);
                    }
                    
                    const label = document.createElement('div');
                    label.textContent = `${cropType}: ${quantity}`;
                    item.appendChild(label);
                    
                    inventoryContainer.appendChild(item);
                }
            });
            
            if (inventoryContainer.children.length === 0) {
                inventoryContainer.innerHTML = '<div class="no-items">No items stored</div>';
            }
        }
    }

    // Close storage view
    closeStorageView() {
        const barnModal = document.getElementById('barn-modal');
        const siloModal = document.getElementById('silo-modal');
        
        if (barnModal) {
            barnModal.classList.remove('show');
        }
        if (siloModal) {
            siloModal.classList.remove('show');
        }
    }
    
    // Close plot modal
    closePlotModal() {
        const plotModal = document.getElementById('plot-modal');
        if (plotModal) {
            plotModal.classList.remove('show');
        }
    }
    
    // Close seed modal
    closeSeedModal() {
        const seedModal = document.getElementById('seed-modal');
        if (seedModal) {
            seedModal.classList.remove('show');
        }
    }

    // Enter farming area from mountain view
    enterFarmingArea(soilType) {
        this.currentView = `${soilType}-farm`;
        
        // Clear existing plots and create new ones for this soil type
        this.plots = [];
        this.createFarmingPlots(soilType);
        
        // Reset camera for farming view
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.scale = 1.2;
        this.camera.targetX = 0;
        this.camera.targetY = 0;
        this.camera.targetScale = 1.2;
        
        // Hide mountain UI, show farming UI
        this.showFarmingUI();
    }

    // Return to mountain overview
    returnToMountain() {
        this.currentView = 'mountain';
        this.plots = [];
        
        // Reset camera for mountain view
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.scale = 1.0;
        this.camera.targetX = 0;
        this.camera.targetY = 0;
        this.camera.targetScale = 1.0;
        
        // Show mountain UI
        this.showMountainUI();
    }

    // Create farming plots for specific soil type
    createFarmingPlots(soilType) {
        const soilTypeUpper = soilType.toUpperCase();
        
        // Create a 3x4 grid of plots for farming
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const x = 200 + col * 150;
                const y = 150 + row * 150;
                const plotId = `${soilType}-${row}-${col}`;
                
                // First plot is unlocked, others need to be purchased
                const unlockCost = (row === 0 && col === 0) ? 0 : 500 + (row * 4 + col) * 200;
                
                this.plots.push(new Plot(plotId, x, y, 120, 120, soilTypeUpper, unlockCost));
            }
        }
        
        // Update unlocked status based on player data
        this.plots.forEach(plot => {
            if (this.player.unlockedPlots.includes(plot.id)) {
                plot.unlock();
            }
        });
    }

    // Show farming UI elements
    showFarmingUI() {
        // Add a "Back to Mountain" button to the UI
        this.addBackButton();
        
        // Show farming-specific panels
        const uiPanel = document.getElementById('ui-panel');
        if (uiPanel) {
            uiPanel.style.display = 'block';
        }
    }

    // Show mountain view UI
    showMountainUI() {
        // Remove back button if it exists
        this.removeBackButton();
        
        // Hide farming-specific panels with null checks
        const uiPanel = document.getElementById('ui-panel');
        if (uiPanel) {
            uiPanel.style.display = 'none';
        }
        
        const plotInfoPanel = document.getElementById('plot-info-panel');
        if (plotInfoPanel) {
            plotInfoPanel.style.display = 'none';
        }
        
        const plotDetailView = document.getElementById('plot-detail-view');
        if (plotDetailView) {
            plotDetailView.style.display = 'none';
        }
    }

    // Add back to mountain button
    addBackButton() {
        if (document.getElementById('back-to-mountain-btn')) return; // Already exists
        
        const backBtn = document.createElement('button');
        backBtn.id = 'back-to-mountain-btn';
        backBtn.className = 'back-btn';
        backBtn.innerHTML = '🏔️ Back to Mountain';
        backBtn.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: linear-gradient(135deg, #8B4513, #D2691E);
            color: white;
            border: 2px solid #654321;
            border-radius: 8px;
            padding: 10px 15px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
        `;
        
        backBtn.addEventListener('click', () => this.returnToMountain());
        document.body.appendChild(backBtn);
    }

    // Remove back button
    removeBackButton() {
        const backBtn = document.getElementById('back-to-mountain-btn');
        if (backBtn) {
            backBtn.remove();
        }
    }
}