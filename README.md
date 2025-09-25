# Mountain Farm Game 🌾

A web-based farming simulation game inspired by Hay Day, set in a beautiful mountain environment. Plant crops, unlock new plots, and build your farming empire from the riverbank to the mountain peaks!

## 🗂️ File Structure (Updated)

The game has been reorganized into multiple HTML files for easier editing:

### Main Game Files

- **`index.html`** - Entry point that redirects to start screen
- **`start.html`** - Welcome screen with game introduction  
- **`game.html`** - Main game interface with canvas and UI
- **`modals.html`** - All modal dialogs (plot actions, seed selection, storage)

### Game Scripts (Unchanged)
- **`js/main.js`** - Game initialization and event handlers
- **`js/game.js`** - Core game engine with rendering and camera
- **`js/plot.js`** - Plot management and farming mechanics
- **`js/player.js`** - Player data, inventory, and progression
- **`js/crop.js`** - Crop growth stages and farming logic
- **`js/utils.js`** - Utility functions and configuration

## ✅ Recent Fixes & Improvements

### Fixed Issues
- **Camera Bounds**: No more empty space visibility, proper zoom limits
- **Missing Images**: Created placeholder icons for all UI elements  
- **Back Button**: Fixed navigation between mountain and farming views
- **Farming Areas**: Enhanced backgrounds with sky gradients and soil textures
- **HTML Organization**: Split into multiple files for easier editing

### Camera Controls (Updated)
- Mountain view: 1.0x to 2.0x zoom range
- Farming areas: 0.8x to 2.5x zoom range
- Proper mouse drag boundaries prevent showing empty space

## 🎮 Game Features

### Core Gameplay
- **Farming System**: Plant, grow, and harvest various crops
- **Multiple Soil Types**: Each plot has unique soil with different crop compatibility
- **Plot Unlocking**: Expand your farm from riverbank to mountain peaks
- **Market System**: Buy seeds and sell crops for profit
- **Resource Management**: Manage coins, gems, and inventory

### Soil Types & Crops
- **🏞️ Alluvial Soil (Riverbank)**: Perfect for rice, corn, and wheat
- **🏔️ Rocky Soil (Hillside)**: Suitable for potatoes and hardy crops  
- **🌱 Fertile Soil (Plateau)**: Grows all crops with high yield
- **⛰️ Mountain Soil**: Good for specialized mountain crops

### Game Systems
- **Experience & Leveling**: Gain XP and level up for rewards
- **Achievements**: Unlock achievements for various milestones
- **Auto-Save**: Progress automatically saved to local storage
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Quick Start
1. Open `index.html` in your web browser
2. The game will load with placeholder assets (colorful rectangles with emojis)
3. Click on the riverbank plot to start farming!

### Installation
```bash
# Clone or download the project
git clone <repository-url>
cd mountain-farm-game

# Open in browser
open index.html
# OR
python -m http.server 8000  # For local server
```

## 🎯 How to Play

### Basic Controls
- **Mouse/Touch**: Click and drag to pan the camera
- **Mouse Wheel**: Zoom in/out
- **Click Plot**: Select and interact with farming plots
- **Keyboard Shortcuts**:
  - `Space`: Pause/Resume game
  - `M`: Open/Close Market
  - `H`: Harvest selected plot (if ready)
  - `I`: Show game information
  - `Esc`: Close all panels

### Getting Started
1. **Select a Plot**: Click on the unlocked riverbank plot
2. **Plant Seeds**: Click "Plant" and choose seeds from your inventory
3. **Wait for Growth**: Crops grow through 4 stages (seed → sprout → half-grown → mature)
4. **Harvest**: Click "Harvest" when crops are ready
5. **Sell Crops**: Use the market to sell harvested crops for coins
6. **Expand**: Unlock new plots with better soil types

### Farming Tips
- Different soils grow different crops - check compatibility!
- Fertilize plots for +50% harvest value
- Water crops to reduce growing time by 10%
- Higher altitude plots cost more but offer better soil
- Save coins to unlock profitable mountain plots

## 📁 Project Structure

```
mountain-farm-game/
├── index.html              # Main game HTML
├── css/
│   └── style.css          # Game styling and UI
├── js/
│   ├── main.js            # Game initialization and main loop
│   ├── game.js            # Main game class and logic
│   ├── player.js          # Player data and progression
│   ├── plot.js            # Farm plot management
│   ├── crop.js            # Crop growing system
│   └── utils.js           # Utility functions and constants
├── assets/
│   ├── images/            # Game images (placeholder support)
│   └── sounds/            # Game audio files
└── README.md              # This file
```

## 🎨 Asset Requirements

The game works with placeholder assets, but you can add real images for better visuals:

### Required Images (64x64px recommended)
- `assets/images/coin.png` - Coin currency icon
- `assets/images/gem.png` - Gem currency icon
- `assets/images/corn-seed.png` - Corn seed icon
- `assets/images/wheat-seed.png` - Wheat seed icon
- `assets/images/rice-seed.png` - Rice seed icon
- `assets/images/potato-seed.png` - Potato seed icon
- `assets/images/seeds-icon.png` - Seed toolbar icon
- `assets/images/fertilizer-icon.png` - Fertilizer toolbar icon
- `assets/images/tools-icon.png` - Tools toolbar icon
- `assets/images/buildings-icon.png` - Buildings toolbar icon
- `assets/images/market-icon.png` - Market toolbar icon

### Asset Creation Tips
- Use bright, cartoon-style colors
- Keep consistent art style
- 64x64px works well for icons
- PNG format with transparency recommended
- Consider creating animated GIFs for growing crops

## ⚙️ Technical Details

### Technologies Used
- **HTML5 Canvas**: For game rendering
- **CSS3**: Modern styling with gradients and animations
- **Vanilla JavaScript**: No external dependencies
- **Local Storage**: Save game persistence

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Touch controls supported

### Performance
- Optimized canvas rendering
- Efficient game loop with requestAnimationFrame
- Minimal memory usage
- Responsive design for various screen sizes

## 🎮 Game Configuration

You can modify game settings in `js/utils.js`:

```javascript
const GAME_CONFIG = {
    // Soil types and their properties
    SOIL_TYPES: {
        ALLUVIAL: {
            name: 'Alluvial Soil',
            fertility: 0.9,
            waterRetention: 0.8,
            crops: ['rice', 'corn', 'wheat']
        }
        // ... more soil types
    },
    
    // Crop configurations
    CROPS: {
        corn: {
            name: 'Corn',
            growTime: 30000, // 30 seconds
            seedCost: 10,
            harvestValue: 25
        }
        // ... more crops
    }
};
```

## 🔧 Development

### Adding New Crops
1. Add crop configuration to `GAME_CONFIG.CROPS` in `utils.js`
2. Add soil compatibility
3. Add to seed selection UI in `index.html`
4. Add corresponding seed icon

### Adding New Soil Types
1. Add soil type to `GAME_CONFIG.SOIL_TYPES` in `utils.js`
2. Create new plots with the soil type in `game.js`
3. Update crop compatibility

### Debugging
- Open browser console for debug logs
- Use `window.debugGame()` to access game instance
- Use `window.resetGame()` to reset all progress

## 🚀 Future Enhancements

### Planned Features
- **Buildings**: Barns, silos, processing facilities
- **Livestock**: Chickens, cows, goats with products
- **Seasons**: Dynamic weather and seasonal crops
- **Quests**: NPCs with farming tasks
- **Multiplayer**: Trade with other players
- **Advanced Farming**: Crop rotation, soil quality
- **Mobile App**: Native mobile version

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Credits

- Game concept inspired by Hay Day and similar farming games
- Built with modern web technologies
- Designed for educational and entertainment purposes

---

## 🎮 Quick Reference

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Pause/Resume |
| `M` | Toggle Market |
| `H` | Harvest Selected Plot |
| `I` | Show Game Info |
| `Esc` | Close Panels |

### Crop Growing Times
| Crop | Time | Soil Compatibility |
|------|------|-------------------|
| Wheat | 20s | Alluvial, Fertile |
| Rice | 25s | Alluvial |
| Corn | 30s | Alluvial, Fertile |
| Potato | 35s | Rocky, Fertile, Mountain |

### Plot Unlock Costs
| Plot | Cost | Soil Type |
|------|------|-----------|
| Riverbank | Free | Alluvial |
| Hillside 1 | 500 coins | Rocky |
| Hillside 2 | 750 coins | Rocky |
| Plateau | 1000 coins | Fertile |
| Mountain 1 | 1500 coins | Mountain |
| Mountain 2 | 2000 coins | Mountain |

Enjoy building your mountain farm empire! 🌾🏔️