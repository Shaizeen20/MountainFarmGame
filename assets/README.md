# 🎨 Asset Directory Structure

This folder contains all visual and audio assets for the Mountain Farm Game. The game automatically loads assets from these specific paths and falls back to placeholder visuals if assets are missing.

## 📁 Folder Structure

```
assets/
├── images/
│   ├── crops/              # Crop growth stages
│   │   ├── corn-stage1.png
│   │   ├── corn-stage2.png
│   │   ├── corn-stage3.png
│   │   ├── corn-stage4.png
│   │   ├── wheat-stage1.png
│   │   ├── wheat-stage2.png
│   │   ├── wheat-stage3.png
│   │   ├── wheat-stage4.png
│   │   ├── rice-stage1.png
│   │   ├── rice-stage2.png
│   │   ├── rice-stage3.png
│   │   ├── rice-stage4.png
│   │   ├── potato-stage1.png
│   │   ├── potato-stage2.png
│   │   ├── potato-stage3.png
│   │   └── potato-stage4.png
│   │
│   ├── environment/        # Background and terrain
│   │   ├── background-mountain.png (1200x700)
│   │   ├── plot-alluvial.png
│   │   ├── plot-rocky.png
│   │   ├── plot-fertile.png
│   │   └── plot-mountain.png
│   │
│   ├── ui/                 # User interface elements
│   │   ├── coin.png
│   │   ├── gem.png
│   │   └── lock-icon.png
│   │
│   ├── buildings/          # Farm structures
│   │   ├── farmhouse.png
│   │   └── barn.png
│   │
│   ├── effects/            # Visual effects
│   │   ├── fertilizer-effect.png
│   │   └── water-effect.png
│   │
│   └── tools/              # Tool icons
│       ├── seeds-icon.png
│       ├── fertilizer-icon.png
│       ├── tools-icon.png
│       ├── buildings-icon.png
│       └── market-icon.png
│
└── sounds/                 # Audio files
    ├── plant-seed.wav
    ├── harvest-crop.wav
    ├── coin-collect.wav
    └── background-music.mp3
```

## 🎯 Asset Requirements

### Priority 1: Core Gameplay (Start Here!)
1. **Crop Growth Stages** (64x64px each)
   - 4 stages per crop type (corn, wheat, rice, potato)
   - Stage 1: Seed/planted
   - Stage 2: Sprout
   - Stage 3: Growing
   - Stage 4: Mature/ready

2. **Soil Textures** (Plot sizes vary)
   - plot-alluvial.png
   - plot-rocky.png
   - plot-fertile.png
   - plot-mountain.png

3. **Currency Icons** (32x32px)
   - coin.png
   - gem.png

### Priority 2: Visual Polish
1. **Background** (1200x700px)
   - background-mountain.png

2. **Buildings** (Various sizes)
   - farmhouse.png
   - barn.png

3. **Effects** (32x32px)
   - fertilizer-effect.png
   - water-effect.png

### Priority 3: Enhanced Experience
1. **Tool Icons** (48x48px)
   - All toolbar icons

2. **Sound Effects**
   - Planting, harvesting, UI sounds

## 🎨 Art Style Guidelines

### Visual Style
- **Theme**: Cartoon/stylized, bright and cheerful
- **Perspective**: Slight isometric/3/4 view
- **Colors**: Bright, saturated palette
- **Lighting**: Warm, soft lighting

### Technical Specs
- **Format**: PNG with transparency
- **Resolution**: Power-of-2 sizes preferred (32, 64, 128, etc.)
- **Compression**: Optimize for web (< 100KB per asset)
- **Color Depth**: 24-bit or 32-bit with alpha

### Hay Day Style Reference
- Clean, polished 3D-rendered appearance
- Soft shadows and highlights
- Vibrant, saturated colors
- Detailed but not cluttered
- Friendly, welcoming aesthetic

## 🛠️ Testing Your Assets

1. **Add your assets** to the appropriate folders
2. **Refresh the game** in your browser
3. **Check the console** for loading messages
4. **Fallback behavior**: Missing assets show placeholder rectangles with emojis

## 📝 Naming Conventions

- Use lowercase with hyphens: `corn-stage1.png`
- Be specific and descriptive
- Match the exact names expected by the game
- Use consistent file extensions (.png for images)

## 🎮 Game Integration

The game automatically:
- ✅ Loads assets from correct paths
- ✅ Falls back to placeholders for missing assets
- ✅ Displays loading progress
- ✅ Handles different image sizes gracefully
- ✅ Optimizes rendering performance

Start with Priority 1 assets for immediate visual impact!