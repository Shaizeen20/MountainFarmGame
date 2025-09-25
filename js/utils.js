// Utility functions for the Mountain Farm Game

class Utils {
    // Generate random number between min and max
    static randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Generate random integer between min and max (inclusive)
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Distance between two points
    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // Check if point is inside rectangle
    static pointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
        return x >= rectX && x <= rectX + rectWidth && 
               y >= rectY && y <= rectY + rectHeight;
    }

    // Check if point is inside circle
    static pointInCircle(x, y, circleX, circleY, radius) {
        return this.distance(x, y, circleX, circleY) <= radius;
    }

    // Format time in MM:SS format
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Format number with commas
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Clamp value between min and max
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Linear interpolation
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Ease in-out animation
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // Show tooltip
    static showTooltip(x, y, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        document.body.appendChild(tooltip);

        // Remove tooltip after 2 seconds
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 2000);
    }

    // Save to localStorage
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    // Load from localStorage
    static loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }

    // Create placeholder image (colored rectangle)
    static createPlaceholderImage(width, height, color, text = '') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        
        // Add border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
        
        // Add text if provided
        if (text) {
            ctx.fillStyle = '#000';
            ctx.font = `${Math.min(width, height) / 4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, width / 2, height / 2);
        }
        
        return canvas.toDataURL();
    }

    // Preload images with fallback to placeholders
    static async loadImage(src, placeholderColor, placeholderText, width = 64, height = 64) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                // Create placeholder image
                const placeholderSrc = this.createPlaceholderImage(width, height, placeholderColor, placeholderText);
                const placeholderImg = new Image();
                placeholderImg.src = placeholderSrc;
                placeholderImg.onload = () => resolve(placeholderImg);
            };
            img.src = src;
        });
    }

    // Load asset with automatic fallback
    static async loadAsset(category, name, placeholderColor, placeholderText, width = 64, height = 64) {
        const assetPaths = {
            crops: 'assets/images/crops/',
            ui: 'assets/images/ui/',
            environment: 'assets/images/environment/',
            buildings: 'assets/images/buildings/',
            effects: 'assets/images/effects/',
            tools: 'assets/images/tools/',
            sustainable: 'assets/images/sustainable/'
        };

        const basePath = assetPaths[category] || 'assets/images/';

        // Build candidate names/paths in order of preference
        const candidates = [];
        const push = (relPath) => candidates.push(`${basePath}${relPath}`);

        if (category === 'ui') {
            push(`${name}.png`);
            push(`icons/${name}.png`);
            push(`seeds/${name}.png`);
            push(`currency/${name}.png`);
            push(`buttons/${name}.png`);
        } else if (category === 'sustainable') {
            // Caller can pass e.g. 'water/drip-controller'
            push(`${name}.png`);
        } else if (category === 'crops') {
            // Accept both with and without dash before stage number
            // e.g., 'wheat-stage1' and 'wheat-stage-1'
            push(`${name}.png`);
            const m = name.match(/^(.*-stage)-?([0-9]+)$/);
            if (m) {
                push(`${m[1]}-${m[2]}.png`);
                push(`${m[1]}${m[2]}.png`);
            }
            // corn ↔ maize synonym support
            if (name.startsWith('corn-')) {
                const maize = name.replace(/^corn-/, 'maize-');
                push(`${maize}.png`);
                const mm = maize.match(/^(.*-stage)-?([0-9]+)$/);
                if (mm) {
                    push(`${mm[1]}-${mm[2]}.png`);
                    push(`${mm[1]}${mm[2]}.png`);
                }
            } else if (name.startsWith('maize-')) {
                const corn = name.replace(/^maize-/, 'corn-');
                push(`${corn}.png`);
                const mc = corn.match(/^(.*-stage)-?([0-9]+)$/);
                if (mc) {
                    push(`${mc[1]}-${mc[2]}.png`);
                    push(`${mc[1]}${mc[2]}.png`);
                }
            }
        } else {
            push(`${name}.png`);
        }

        // Strict image loader (rejects on error) so we can try fallbacks
        const loadStrict = (src) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Image load failed: ' + src));
            img.src = src;
        });

        for (let i = 0; i < candidates.length; i++) {
            try {
                const img = await loadStrict(candidates[i]);
                return img;
            } catch (e) {
                // try next candidate
            }
        }

        // Final fallback: colored placeholder with the first candidate's dimensions
        return this.loadImage(candidates[0] || `${basePath}${name}.png`, placeholderColor, placeholderText, width, height);
    }

    // Animate value over time
    static animateValue(startValue, endValue, duration, callback, easing = this.easeInOut) {
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            const currentValue = startValue + (endValue - startValue) * easedProgress;
            
            callback(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        animate();
    }
}

// Constants for the game
const GAME_CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 700,
    
    // Soil types and their properties
    SOIL_TYPES: {
        ALLUVIAL: {
            name: 'Alluvial Soil',
            color: '#8B4513',
            fertility: 0.9,
            waterRetention: 0.8,
            crops: ['rice', 'maize', 'wheat']
        },
        ROCKY: {
            name: 'Rocky Soil',
            color: '#696969',
            fertility: 0.6,
            waterRetention: 0.4,
            crops: ['potato', 'barley']
        },
        FERTILE: {
            name: 'Fertile Soil',
            color: '#654321',
            fertility: 1.0,
            waterRetention: 0.9,
            crops: ['maize', 'wheat', 'tomato', 'carrot']
        },
        MOUNTAIN: {
            name: 'Mountain Soil',
            color: '#A0522D',
            fertility: 0.7,
            waterRetention: 0.5,
            crops: ['potato', 'barley', 'herbs']
        }
    },
    
    // Crop configurations
    CROPS: {
        maize: {
            name: 'Maize',
            growTime: 15000, // 15 seconds for testing
            seedCost: 10,
            harvestValue: 25,
            color: '#FFD700',
            soilCompatibility: ['ALLUVIAL', 'FERTILE']
        },
        wheat: {
            name: 'Wheat',
            growTime: 15000, // 15 seconds for testing
            seedCost: 5,
            harvestValue: 15,
            color: '#DEB887',
            soilCompatibility: ['ALLUVIAL', 'FERTILE']
        },
        rice: {
            name: 'Rice',
            growTime: 15000, // 15 seconds for testing
            seedCost: 8,
            harvestValue: 20,
            color: '#F5F5DC',
            soilCompatibility: ['ALLUVIAL']
        },
        potato: {
            name: 'Potato',
            growTime: 15000, // 15 seconds for testing
            seedCost: 12,
            harvestValue: 30,
            color: '#DEB887',
            soilCompatibility: ['ROCKY', 'FERTILE', 'MOUNTAIN']
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, GAME_CONFIG };
}