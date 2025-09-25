# 🎨 Asset Creation Guide for Mountain Farm Game

## 🚧 Refined Folder Structure (clean, consistent, future‑proof)

Use this as the canonical layout for all images and sounds. It matches how the JS expects to build paths and leaves room for sustainability features, badges, and UI growth.

```
assets/
    images/
        crops/                 # All crop growth sprites
            corn-stage-1.png
            corn-stage-2.png
            corn-stage-3.png
            corn-stage-4.png
            wheat-stage-1.png
            wheat-stage-2.png
            wheat-stage-3.png
            wheat-stage-4.png
            rice-stage-1.png
            rice-stage-2.png
            rice-stage-3.png
            rice-stage-4.png
            potato-stage-1.png
            potato-stage-2.png
            potato-stage-3.png
            potato-stage-4.png

        environment/           # Backgrounds, soils, plot borders
            background-sky.png
            background-mountain.png
            alluvial-soil-full.png
            plot-border.png

        buildings/             # Static structures (market, storage, fences)
            market-stall.png
            storage-barn.png
            silo.png
            fence-horizontal.png
            fence-vertical.png
            gate.png

        sustainable/           # Sustainability visuals
            water/
                drip-controller.png
                drip-pipes.png
                rainwater-tank.png
                well.png
            soil/
                compost-pit.png
                mulch.png            # add when available
            energy/
                solar-array.png      # add when available
                wind-turbine.png     # add when available
                biogas-plant.png     # add when available
            badges/                # tiny overlays for plots
                drip.png
                rainwater.png
                compost.png

        effects/               # Visual effects
            water-splash.png
            water-effect.png
            fertilizer-effect.png
            sparkle.png
            dust-puff.png
            level-up.png

        tools/                 # Tools used by actions
            watering-can.png
            fertilizer.png
            shovel.png
            hoe.png

        ui/                    # UI icons and controls
            icons/
                icon-plant.png
                icon-water.png
                icon-fertilize.png
                icon-harvest.png
                market-icon.png
                buildings-icon.png
                fertilizer-icon.png
                lock-icon.png
            seeds/               # seed packet icons
                corn.png            # from corn-seed.png
                wheat.png           # from wheat-seed.png
                rice.png            # from rice-seed.png
                potato.png          # from potato-seed.png
            currency/
                coin.png
                coin-stack.png
                gem.png
                gem-stack.png
            buttons/
                button-normal.png
                button-hover.png
                button-pressed.png

    sounds/
        river.mp4              # as-is for now
        sky.mp4                # as-is for now
```

Naming guide
- kebab-case filenames, e.g., `corn-stage-3.png`, `water-splash.png`
- crop frames: `<crop>-stage-<1..4>.png`
- seed icons: `assets/images/ui/seeds/<crop>.png`
- sustainability badges: `assets/images/sustainable/badges/<name>.png`

Code alignment (what to update when you move files)
- Seed icons in JS currently reference `assets/images/ui/seeds-*.png` → update to `assets/images/ui/seeds/<crop>.png` (corn, wheat, rice, potato)
- Sustainable item icons are referenced from `assets/images/buildings/…` in some places → update those to `assets/images/sustainable/...`
- If you prefer “corn” over “maize”, either rename the files to `corn-stage-*.png` and update references, or keep both names temporarily.


## Visual Style Guide

### 🎯 Target Style: Hay Day Inspired
- **Art Style**: Cartoon/stylized 3D rendered to 2D sprites
- **Colors**: Bright, saturated, cheerful palette
- **Lighting**: Soft, warm lighting with gentle shadows
- **Textures**: Clean, polished look with subtle details

## 📋 Complete Asset List

### 🏞️ Environment Assets

#### Background Elements
- `background-mountain.png` (1200x700) - Main mountain background
- `background-sky.png` (1200x300) - Sky gradient with clouds
- `river-tiles.png` (64x64 tileset) - River water animation frames
- `clouds.png` (various sizes) - Floating cloud sprites

#### Terrain & Plots
- `plot-alluvial.png` (120x100) - Riverbank soil texture
- `plot-rocky.png` (100x80) - Rocky hillside soil
- `plot-fertile.png` (130x110) - Rich plateau soil  
- `plot-mountain.png` (100x80) - Mountain soil texture
- `plot-locked.png` (overlay) - Locked plot overlay
- `plot-border.png` - Plot boundary/fence sprites

### 🌾 Crop Assets (Each crop needs 4 growth stages)

#### Corn
- `corn-stage1.png` (32x32) - Seed in soil
- `corn-stage2.png` (48x48) - Small sprout
- `corn-stage3.png` (64x64) - Growing plant
- `corn-stage4.png` (80x80) - Mature corn stalks

#### Wheat  
- `wheat-stage1.png` (32x32) - Planted seeds
- `wheat-stage2.png` (48x48) - Green shoots
- `wheat-stage3.png` (64x64) - Growing wheat
- `wheat-stage4.png` (80x80) - Golden wheat ready

#### Rice
- `rice-stage1.png` (32x32) - Rice seeds in water
- `rice-stage2.png` (48x48) - Rice sprouts
- `rice-stage3.png` (64x64) - Green rice plants
- `rice-stage4.png` (80x80) - Mature rice heads

#### Potato
- `potato-stage1.png` (32x32) - Planted potato
- `potato-stage2.png` (48x48) - Small potato plant
- `potato-stage3.png` (64x64) - Leafy potato bush
- `potato-stage4.png` (80x80) - Mature potato plant

### 🏠 Buildings & Structures
- `farmhouse.png` (200x150) - Main farmhouse
- `barn.png` (150x120) - Storage barn
- `silo.png` (80x120) - Grain silo
- `well.png` (60x60) - Water well
- `fence-horizontal.png` (64x16) - Horizontal fence
- `fence-vertical.png` (16x64) - Vertical fence
- `gate.png` (64x64) - Farm gate

### 🛠️ Tools & Items
- `seeds-corn.png` (48x48) - Corn seed packet
- `seeds-wheat.png` (48x48) - Wheat seed packet
- `seeds-rice.png` (48x48) - Rice seed packet
- `seeds-potato.png` (48x48) - Potato seed packet
- `fertilizer.png` (48x48) - Fertilizer bag
- `watering-can.png` (48x48) - Watering can
- `shovel.png` (48x48) - Farming shovel
- `hoe.png` (48x48) - Garden hoe

### 💰 Currency & UI
- `coin.png` (32x32) - Gold coin with shine
- `gem.png` (32x32) - Blue gem/diamond
- `coin-stack.png` (48x48) - Stack of coins
- `gem-stack.png` (48x48) - Stack of gems

### 🎯 UI Elements
- `button-normal.png` (9-slice) - Normal button state
- `button-hover.png` (9-slice) - Button hover state
- `button-pressed.png` (9-slice) - Button pressed state
- `panel-background.png` (9-slice) - UI panel background
- `progress-bar-bg.png` (200x20) - Progress bar background
- `progress-bar-fill.png` (200x20) - Progress bar fill
- `icon-plant.png` (32x32) - Plant action icon
- `icon-harvest.png` (32x32) - Harvest action icon
- `icon-water.png` (32x32) - Water action icon
- `icon-fertilize.png` (32x32) - Fertilize action icon

### ⚡ Effect Assets
- `sparkle.png` (32x32) - Magical sparkle effect
- `water-splash.png` (48x48) - Water effect
- `dust-puff.png` (64x64) - Digging dust effect
- `coin-pickup.png` (24x24) - Coin collection effect
- `level-up.png` (96x96) - Level up celebration

### 🔊 Audio Assets (Optional)
- `plant-seed.wav` - Planting sound
- `harvest-crop.wav` - Harvesting sound
- `coin-collect.wav` - Coin collection
- `unlock-plot.wav` - Plot unlock sound
- `background-music.mp3` - Peaceful farm music

## 🎨 Asset Creation Tips

### Art Style Guidelines
1. **Consistent Lighting**: Use warm, top-down lighting (like 10 AM sunlight)
2. **Color Palette**: 
   - Greens: #32CD32, #90EE90, #228B22
   - Browns: #8B4513, #DEB887, #A0522D
   - Blues: #4169E1, #87CEEB, #B0E0E6
   - Yellows: #FFD700, #FFA500, #FFFF00

3. **Perspective**: Slight isometric/3/4 view angle
4. **Shadows**: Soft drop shadows for depth
5. **Outlines**: Subtle dark outlines for definition

### Technical Specifications
- **Format**: PNG with transparency
- **Resolution**: Power of 2 sizes (32x32, 64x64, 128x128, etc.)
- **Compression**: Optimize for web (keep under 100KB per asset)
- **Animation**: Use sprite sheets for multi-frame animations

### Size Guidelines
- **Small Icons**: 32x32px (UI elements, small items)
- **Medium Sprites**: 64x64px (crops, tools)
- **Large Objects**: 128x128px or larger (buildings, backgrounds)
- **Backgrounds**: Match canvas size (1200x700px)

## 🔧 Implementation in Game

### How Assets Are Loaded
```javascript
// The game automatically loads assets from these paths:
const assetPaths = {
    // Crops will look for: assets/images/crops/corn-stage1.png
    crops: 'assets/images/crops/',
    
    // UI elements: assets/images/ui/button-normal.png  
    ui: 'assets/images/ui/',
    
    // Environment: assets/images/environment/background-mountain.png
    environment: 'assets/images/environment/',
    
    // Effects: assets/images/effects/sparkle.png
    effects: 'assets/images/effects/'
};
```

### Folder Structure for Assets
```
assets/
├── images/
│   ├── crops/
│   │   ├── corn-stage1.png
│   │   ├── corn-stage2.png
│   │   └── ... (all crop stages)
│   ├── environment/
│   │   ├── background-mountain.png
│   │   ├── plot-alluvial.png
│   │   └── ... (terrain assets)
│   ├── ui/
│   │   ├── coin.png
│   │   ├── button-normal.png
│   │   └── ... (UI elements)
│   ├── buildings/
│   │   ├── farmhouse.png
│   │   ├── barn.png
│   │   └── ... (structures)
│   └── effects/
│       ├── sparkle.png
│       ├── water-splash.png
│       └── ... (visual effects)
└── sounds/
    ├── plant-seed.wav
    ├── harvest-crop.wav
    └── ... (audio files)
```

## 🎯 Priority Asset List (Start Here)

### Phase 1: Core Gameplay (Most Important)
1. **Coin & Gem icons** - For currency display
2. **4 crop growth stages** for each crop type
3. **Plot soil textures** for different terrain types
4. **Basic UI buttons** and panels

### Phase 2: Polish & Environment  
1. **Mountain background** matching your reference image
2. **Buildings** (farmhouse, barn)
3. **Visual effects** (sparkles, water)
4. **Tool icons** for the toolbar

### Phase 3: Advanced Features
1. **Animation frames** for crop growth
2. **Particle effects** for interactions
3. **Sound effects** for immersion
4. **Additional buildings** and decorations

The game engine is already set up to automatically use your custom assets while falling back to placeholders for missing ones. This means you can add assets gradually and see them appear in the game immediately!

Would you like me to modify the asset loading system or help you set up specific visual effects?