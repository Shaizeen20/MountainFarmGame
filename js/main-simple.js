// Simple main page functionality for Mountain Farm Game

document.addEventListener('DOMContentLoaded', function() {
    console.log('Mountain Farm Game - Main Page Loaded');
    
    // Keep soil overlay aligned to the actual displayed image area
    alignSoilOverlayToImage();
    window.addEventListener('resize', alignSoilOverlayToImage);
    window.addEventListener('orientationchange', alignSoilOverlayToImage);
    const img = document.getElementById('mountain-img');
    if (img) {
        if (img.complete) {
            alignSoilOverlayToImage();
        } else {
            img.addEventListener('load', alignSoilOverlayToImage);
        }
    }

    // Handle clickable soil regions
    setupSoilRegions();
    
    // Setup sidebar interactions
    setupSidebarInteractions();
    
    // Initialize sustainability meters
    initializeSustainabilityMeters();
});

function setupSidebarInteractions() {
    // AI Mentor get advice button
    const getAdviceBtn = document.querySelector('.get-advice-btn');
    if (getAdviceBtn) {
        getAdviceBtn.addEventListener('click', function() {
            const tips = [
                "Consider crop rotation to improve soil health and reduce pest problems.",
                "Use organic compost to increase soil nutrients naturally.",
                "Plant cover crops during off-season to prevent soil erosion.",
                "Monitor rainfall patterns to optimize irrigation timing.",
                "Diversify crops to reduce market risk and improve ecosystem health.",
                "Test your soil pH regularly - most crops prefer 6.0-7.0 range.",
                "Use drip irrigation to conserve water and reduce disease.",
                "Integrate livestock grazing to improve soil fertility naturally."
            ];
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            document.querySelector('.tip-text').textContent = randomTip;
        });
    }

    // Government schemes expandable items
    const schemeItems = document.querySelectorAll('.scheme-item.clickable');
    schemeItems.forEach(item => {
        item.addEventListener('click', function() {
            const details = this.querySelector('p');
            const icon = this.querySelector('.expand-icon');
            
            if (details.style.display === 'none' || details.style.display === '') {
                details.style.display = 'block';
                icon.textContent = '−';
                this.style.background = 'rgba(255, 255, 255, 0.15)';
            } else {
                details.style.display = 'none';
                icon.textContent = '+';
                this.style.background = 'rgba(255, 255, 255, 0.05)';
            }
        });
        
        // Initialize in collapsed state
        const details = item.querySelector('p');
        const icon = item.querySelector('.expand-icon');
        if (details && icon) {
            details.style.display = 'none';
            icon.textContent = '+';
        }
    });

    // News items expandable
    const newsItems = document.querySelectorAll('.news-item.clickable');
    newsItems.forEach(item => {
        item.addEventListener('click', function() {
            alert('Full news article would open here. Feature coming soon!');
        });
    });
}

function initializeSustainabilityMeters() {
    // Set initial meter values (these would come from game data)
    const meters = [
        { id: 'soil-health', value: 75 },
        { id: 'organic-score', value: 60 },
        { id: 'water-conservation', value: 45 }
    ];

    meters.forEach(meter => {
        const fill = document.querySelector(`[data-meter="${meter.id}"] .meter-fill`);
        const value = document.querySelector(`[data-meter="${meter.id}"] .meter-value`);
        
        if (fill && value) {
            fill.style.width = meter.value + '%';
            value.textContent = meter.value + '%';
        }
    });

    // Groundwater level
    const groundwaterFill = document.querySelector('.meter-fill[style*="4169E1"]');
    if (groundwaterFill) {
        groundwaterFill.style.width = '68%';
    }
}

function setupSoilRegions() {
    const plateauRegion = document.getElementById('plateau-region');
    const hillsideRegion = document.getElementById('hillside-region');
    const mountainRegion = document.getElementById('mountain-region');
    const alluvialRegion = document.getElementById('alluvial-region');
    
    // Add click handlers for soil regions
    if (plateauRegion) {
        plateauRegion.addEventListener('click', function() {
            console.log('Clicked Plateau Soil Region');
            // Navigate to plateau farming page
            window.location.href = 'plateau-farm.html';
        });
        
        // Add hover text
        plateauRegion.title = 'Click to enter Plateau Soil Farming Area';
    }
    
    if (hillsideRegion) {
        hillsideRegion.addEventListener('click', function() {
            console.log('Clicked Hillside Soil Region');
            // Navigate to hillside farming page
            window.location.href = 'hillside-farm.html';
        });
        hillsideRegion.title = 'Click to enter Hillside Soil Farming Area';
    }
    
    if (mountainRegion) {
        mountainRegion.addEventListener('click', function() {
            console.log('Clicked Mountain Soil Region');
            // Navigate to mountain farming page
            window.location.href = 'mountain-farm.html';
        });
        
        // Add hover text
        mountainRegion.title = 'Click to enter Mountain Soil Farming Area';
    }

    if (alluvialRegion) {
        alluvialRegion.addEventListener('click', function() {
            console.log('Clicked Alluvial Soil Region');
            // Navigate to alluvial farming page
            window.location.href = 'alluvial-farm.html';
        });
        
        // Add hover text
        alluvialRegion.title = 'Click to enter Alluvial Soil Farming Area';
    }
}

// Ensures #soil-regions fits the actual displayed image box when object-fit: contain
function alignSoilOverlayToImage() {
    const wrap = document.getElementById('center-game');
    const img = document.getElementById('mountain-img');
    const overlay = document.getElementById('soil-regions');
    if (!wrap || !img || !overlay) return;

    const wrapRect = wrap.getBoundingClientRect();
    const naturalW = img.naturalWidth || 1;
    const naturalH = img.naturalHeight || 1;
    const wrapW = wrapRect.width;
    const wrapH = wrapRect.height;

    // Calculate fitted image size for object-fit: contain
    const scale = Math.min(wrapW / naturalW, wrapH / naturalH);
    const displayW = naturalW * scale;
    const displayH = naturalH * scale;

    // Centered inside wrapper
    const offsetLeft = (wrapW - displayW) / 2;
    const offsetTop = (wrapH - displayH) / 2;

    // Apply overlay box size/position via CSS variables
    overlay.style.left = offsetLeft + 'px';
    overlay.style.top = offsetTop + 'px';
    overlay.style.width = displayW + 'px';
    overlay.style.height = displayH + 'px';

    // Make overlay position absolute relative to wrapper
    overlay.style.position = 'absolute';
}