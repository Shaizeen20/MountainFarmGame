# Assets Migration Checklist (safe reorg)

Use these steps to reorganize the assets into the refined structure without breaking the game. The commands are Windows PowerShell friendly. Run from the project root.

## 0) Dry-run and backup
- Ensure the game runs before changes
- Optionally zip the `assets/` folder

## 1) Create new folders
```powershell
New-Item -ItemType Directory -Force assets/images/ui/icons | Out-Null
New-Item -ItemType Directory -Force assets/images/ui/seeds | Out-Null
New-Item -ItemType Directory -Force assets/images/ui/currency | Out-Null
New-Item -ItemType Directory -Force assets/images/sustainable/water | Out-Null
New-Item -ItemType Directory -Force assets/images/sustainable/soil | Out-Null
New-Item -ItemType Directory -Force assets/images/sustainable/energy | Out-Null
New-Item -ItemType Directory -Force assets/images/sustainable/badges | Out-Null
```

## 2) Move seed icons into `ui/seeds/`
```powershell
Move-Item assets/images/ui/corn-seed.png assets/images/ui/seeds/corn.png -Force
Move-Item assets/images/ui/wheat-seed.png assets/images/ui/seeds/wheat.png -Force
Move-Item assets/images/ui/rice-seed.png assets/images/ui/seeds/rice.png -Force
Move-Item assets/images/ui/potato-seed.png assets/images/ui/seeds/potato.png -Force
```

## 3) (Optional) Standardize maize → corn
If you want to use `corn` everywhere:
```powershell
if (Test-Path assets/images/crops/maize-stage-1.png) {
  Copy-Item assets/images/crops/maize-stage-1.png assets/images/crops/corn-stage-1.png -Force
  Copy-Item assets/images/crops/maize-stage-2.png assets/images/crops/corn-stage-2.png -Force
  Copy-Item assets/images/crops/maize-stage-3.png assets/images/crops/corn-stage-3.png -Force
  Copy-Item assets/images/crops/maize-stage-4.png assets/images/crops/corn-stage-4.png -Force
}
```

## 4) Move sustainable items to themed folders
```powershell
# water
Move-Item assets/images/sustainable/drip-controller.png assets/images/sustainable/water/drip-controller.png -Force
Move-Item assets/images/sustainable/drip-pipes.png assets/images/sustainable/water/drip-pipes.png -Force
Move-Item assets/images/sustainable/rainwater-tank.png assets/images/sustainable/water/rainwater-tank.png -Force
Move-Item assets/images/sustainable/well.png assets/images/sustainable/water/well.png -Force

# soil
Move-Item assets/images/sustainable/compost-pit.png assets/images/sustainable/soil/compost-pit.png -Force
```

## 5) Verify in code
- Update seed icon lookups in JS from `assets/images/ui/seeds-*.png` to `assets/images/ui/seeds/<crop>.png`
- Update sustainable icon lookups from `assets/images/buildings/...` to `assets/images/sustainable/<theme>/...`
- Optionally add a fallback: try new path, then old path

## 6) Test
- Load the Alluvial page and check:
  - Left sidebar crop icons show
  - Sustainable badges/hubs show
  - Planting renders correct crop frames

If anything is missing, check the browser console for 404s and adjust the paths accordingly.
