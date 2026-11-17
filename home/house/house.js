HOME.data({
 "format": "house",
 "version": 1,
 "id": "house",
 "name": "Dom w papawerach 5 (G)",
 "type": "house",
 "offset": [0, 0, 0],
 "size": [13200, 9100, 9000],
 "settings": {
  "view": {
   "layers": {
    "ground": {"name": "Ground floor"},
    "attic": {"name": "Attic"},
    "roof": {"name": "Roof"},
    "foundation": {"name": "Foundation"},
    "walls": {"name": "Blocks"},
    "slabs": {"name": "Ring beam and slab"},
    "insulation": {"name": "EPS", "layers": {"facade": {"name": "Facade"}}},
    "openings": {"name": "Windows and doors"},
    "stair": {"name": "Stair"},
    "site": {"name": "Site"},
    "edges": {"name": "Edges"}
   },
   "floors": ["ground", "attic", "roof"],
   "elements": ["foundation", "walls", "slabs", "insulation", "openings", "stair", "site", "edges"],
   "edges": {"color": "#7d807b", "opacity": 0.45, "layers": ["edges"]},
   "light": {
    "exposure": 0.85,
    "sun": {"azimuth": 330, "elevation": 38, "intensity": 1.35, "color": "#fff1dc"},
    "sky": {
     "intensity": 0.6,
     "color": "#cfe0ff",
     "groundColor": "#a9a596",
     "gradient": [[0, "#5f8fc4"], [0.32, "#9dbfe0"], [0.49, "#e4ecef"], [0.51, "#b7bfae"], [1, "#6f7a5e"]]
    },
    "fog": {"color": "#dfe7ea", "near": 60000, "far": 160000},
    "clouds": {"value": 0.7, "sun": 0.2, "sky": 2.2, "blur": 8},
    "inside": {"exposure": 1.05, "sun": {"intensity": 2.6, "reach": 6}, "sky": {"color": "#f4f6f9", "groundColor": "#8a8178", "intensity": 1.5}}
   },
   "cameras": [
    {"name": "Front", "eye": [27500, -6500, 4200], "target": [6600, 4550, 3300]},
    {"name": "Garden", "eye": [-13500, 13500, 3800], "target": [5000, 4550, 3300]},
    {"name": "Above", "eye": [23000, -11500, 17500], "target": [6600, 4550, 2500]}
   ],
   "walk": {
    "eye": 1600,
    "radius": 220,
    "step": 360,
    "headroom": 100,
    "speed": 1400,
    "turn": 90,
    "look": 50,
    "run": 2.2,
    "start": {"x": 11200, "y": 5200, "heading": 180}
   },
   "cutFrom": 500,
   "cutStep": 50,
   "planNote": "Garden at the top, the front at the bottom. Hatched: EPS."
  }
 },
 "source": "Geometry from the archon.pl plans (±23 mm), with the build changes.",
 "notes": [
  "A heat pump instead of a gas boiler: one chimney (the living room), no ventilation shaft and no second chimney.",
  "Build changes: the shower niche in the ground floor bathroom 1000 × 900 mm (walls #7, #8, #10 moved), the attic bathroom door moved 200 mm toward the garden, a cathedral ceiling over the bedroom.",
  "A cantilevered stair (no stringers), no wall under the flight.",
  "Wardrobes 3 and 4 in the attic with narrow doors 700/2050 from the bedroom (archon: an opening without a door and without the wall).",
  "Attic room 6: the wall by the ventilation shaft removed (a heat recovery unit instead of the shaft); shelving in the niche.",
  "The facade (graphite, white, timber) read from the archon renderings: a picture, not a dimension."
 ],
 "geometry": {
  "split": 2720,
  "length": 13200,
  "roof": {
   "pitch": 42,
   "eave": 3864,
   "width": 9100,
   "thickness": 640,
   "x": [-1000, 14200],
   "faces": {"top": "roofGraphite", "bottom": "plasterWhite", "ends": "plasterWhite", "eaves": "graphite", "reveals": "plasterWhite"},
   "cap": "timber",
   "cuts": ["chimney"],
   "layers": ["roof"],
   "windows": [
    {"name": "Bedroom", "label": "940/1400", "x": [1550, 2490], "y": [7820, 8860]},
    {"name": "Stairs", "label": "940/1400", "x": [6390, 7330], "y": [240, 1280]},
    {"name": "Bathroom", "label": "940/1400", "x": [6390, 7330], "y": [7820, 8860]}
   ],
   "windowFrame": {"width": 70, "frame": [-100, 40], "glass": [5, 15], "material": "frame", "glazing": "glass"},
   "clearHeights": [1400, 2200]
  },
  "kinds": {
   "footing": {"name": "footing", "material": "concrete", "cap": "concrete", "thickness": 400, "layers": ["foundation"]},
   "foundation": {"name": "foundation wall", "material": "concrete", "cap": "concrete", "thickness": 240, "layers": ["foundation"]},
   "chimneyFoundation": {"name": "chimney foundation", "material": "concrete", "cap": "concrete", "layers": ["foundation"]},
   "groundSlab": {"name": "ground slab", "material": "concrete", "cap": "concrete", "thickness": 360, "layers": ["foundation"], "walkable": true},
   "block240": {
    "name": "block 240 mm",
    "material": "plasterInside",
    "cap": "block",
    "thickness": 240,
    "layers": ["walls"],
    "opened": true,
    "host": true
   },
   "block120": {
    "name": "block 120 mm",
    "material": "plasterInside",
    "cap": "block",
    "thickness": 120,
    "layers": ["walls"],
    "opened": true,
    "host": true
   },
   "chimney": {"name": "chimney", "material": "plasterInside", "cap": "block", "layers": ["walls"]},
   "eps": {
    "name": "EPS 200 mm",
    "material": "plasterWhite",
    "raw": "insulation",
    "finish": "facade",
    "cap": "insulation",
    "thickness": 200,
    "layers": ["insulation"],
    "opened": true
   },
   "epsSoffit": {
    "name": "EPS of the recess soffit 470 mm",
    "material": "plasterWhite",
    "raw": "insulation",
    "finish": "facade",
    "cap": "insulation",
    "thickness": 470,
    "layers": ["insulation"],
    "opened": true
   },
   "ringBeam": {"name": "ring beam over the portal wing", "material": "plasterInside", "cap": "concrete", "thickness": 240, "layers": ["slabs"]},
   "balustrade": {
    "name": "stair balustrade (plain, assumed: not in the drawings)",
    "material": "tread",
    "cap": "tread",
    "thickness": 40,
    "layers": ["stair"]
   },
   "slab": {"name": "slab with ring beam", "material": "plasterInside", "cap": "concrete", "thickness": 340, "layers": ["slabs"], "walkable": true},
   "ceiling": {
    "name": "ceiling with insulation",
    "material": "plasterInside",
    "cap": "insulation",
    "thickness": 390,
    "layers": ["slabs"],
    "floor": "roof"
   }
  },
  "elements": [
   {"id": "footingLeft", "kind": "footing", "b": [-1000, 14200, 20, 620, -1320, -920]},
   {"id": "footingRight", "kind": "footing", "b": [-1000, 14200, 8480, 9080, -1320, -920]},
   {"id": "footingGarden", "kind": "footing", "b": [20, 620, 620, 8480, -1320, -920]},
   {"id": "footingFront", "kind": "footing", "b": [12580, 13180, 620, 4530, -1320, -920]},
   {"id": "footingRecess", "kind": "footing", "b": [11680, 12580, 3930, 4530, -1320, -920]},
   {"id": "footingEntrance", "kind": "footing", "b": [11680, 12280, 4530, 8480, -1320, -920]},
   {"id": "footingWall4", "kind": "footing", "b": [6240, 9430, 3930, 4530, -1320, -920]},
   {"id": "footingWall7", "kind": "footing", "b": [8830, 9430, 4530, 7960, -1320, -920]},
   {"id": "footingWall2", "kind": "footing", "b": [5050, 5650, 620, 3410, -1320, -920]},
   {"id": "footingChimney", "kind": "footing", "b": [4530, 5650, 3410, 4530, -1320, -920]},
   {"id": "foundationLeft", "kind": "foundation", "b": [-800, 14000, 200, 440, -920, 0]},
   {"id": "foundationRight", "kind": "foundation", "b": [-800, 14000, 8660, 8900, -920, 0]},
   {"id": "foundationGarden", "kind": "foundation", "b": [200, 440, 440, 8660, -920, 0]},
   {"id": "foundationFront", "kind": "foundation", "b": [12760, 13000, 440, 4350, -920, 0]},
   {"id": "foundationRecess", "kind": "foundation", "b": [11860, 12760, 4110, 4350, -920, 0]},
   {"id": "foundationEntrance", "kind": "foundation", "b": [11860, 12100, 4350, 8660, -920, 0]},
   {"id": "foundationWall4", "kind": "foundation", "b": [6540, 9250, 4110, 4350, -920, 0]},
   {"id": "foundationWall7", "kind": "foundation", "b": [9010, 9250, 4350, 7660, -920, 0]},
   {"id": "foundationWall2", "kind": "foundation", "b": [5230, 5470, 440, 3590, -920, 0]},
   {"id": "foundationChimney", "kind": "chimneyFoundation", "b": [4710, 5470, 3590, 4350, -920, 0]},
   {
    "id": "groundSlabGarage",
    "kind": "groundSlab",
    "b": [440, 12760, 440, 4110, -360, 0],
    "cuts": ["foundationWall2", "foundationWall4", "foundationChimney"]
   },
   {
    "id": "groundSlabHouse",
    "kind": "groundSlab",
    "b": [440, 11860, 4110, 8660, -360, 0],
    "cuts": ["foundationWall4", "foundationWall7", "foundationChimney"]
   },
   {"id": "blockLeft", "kind": "block240", "b": [-800, 14000, 200, 440, 0, 2720]},
   {"id": "blockRight", "kind": "block240", "b": [-800, 14000, 8660, 8900, 0, 2720]},
   {"id": "blockGarden", "kind": "block240", "b": [200, 440, 440, 8660, 0, 2720]},
   {"id": "blockGarageFront", "kind": "block240", "b": [12760, 13000, 440, 4350, 0, 2720]},
   {"id": "blockRecess", "kind": "block240", "b": [11860, 12760, 4110, 4350, 0, 2720]},
   {"id": "blockEntrance", "kind": "block240", "b": [11860, 12100, 4350, 8660, 0, 2720]},
   {"id": "epsLeft", "kind": "eps", "b": [-1000, 14200, 0, 200, -920, 9000], "top": "roof", "outer": "-y"},
   {"id": "epsRight", "kind": "eps", "b": [-1000, 14200, 8900, 9100, -920, 9000], "top": "roof", "outer": "+y"},
   {"id": "epsGarden", "kind": "eps", "b": [0, 200, 440, 8660, -920, 9000], "top": "roof", "outer": "-x"},
   {"id": "epsGarageFront", "kind": "eps", "b": [13000, 13200, 440, 4550, -920, 2720], "outer": "+x"},
   {"id": "epsRecessLeft", "kind": "eps", "b": [12300, 13000, 4350, 4550, -920, 2720], "outer": "+y"},
   {"id": "epsEntrance", "kind": "eps", "b": [12100, 12300, 4350, 8460, -920, 2720], "outer": "+x"},
   {"id": "epsRecessRight", "kind": "eps", "b": [12100, 13200, 8460, 8660, -920, 2720], "outer": "-y"},
   {"id": "epsSoffit", "kind": "epsSoffit", "b": [12300, 13200, 4550, 8460, 2250, 2720], "outer": "-h"},
   {"id": "epsFrontGable", "kind": "eps", "b": [13000, 13200, 440, 8660, 2720, 9000], "top": "roof", "outer": "+x"},
   {"id": "epsWingGardenLeft", "kind": "eps", "b": [-800, 0, 440, 640, -920, 9000], "top": "roof", "outer": "+y"},
   {"id": "epsWingGardenRight", "kind": "eps", "b": [-800, 0, 8460, 8660, -920, 9000], "top": "roof", "outer": "-y"},
   {"id": "epsWingFrontLeft", "kind": "eps", "b": [13200, 14000, 440, 640, -920, 9000], "top": "roof", "outer": "+y"},
   {"id": "epsWingFrontRight", "kind": "eps", "b": [13200, 14000, 8460, 8660, -920, 9000], "top": "roof", "outer": "-y"},
   {"id": "epsHeadGardenLeft", "kind": "eps", "b": [-1000, -800, 200, 640, -920, 9000], "top": "roof", "outer": "-x"},
   {"id": "epsHeadGardenRight", "kind": "eps", "b": [-1000, -800, 8460, 8900, -920, 9000], "top": "roof", "outer": "-x"},
   {"id": "epsHeadFrontLeft", "kind": "eps", "b": [14000, 14200, 200, 640, -920, 9000], "top": "roof", "outer": "+x"},
   {"id": "epsHeadFrontRight", "kind": "eps", "b": [14000, 14200, 8460, 8900, -920, 9000], "top": "roof", "outer": "+x"},
   {"id": "chimney", "kind": "chimney", "b": [4710, 5470, 3590, 4350, 0, 9000]},
   {"id": "wall2", "kind": "block240", "b": [5230, 5470, 440, 3590, 0, 2720]},
   {"id": "wall3", "kind": "block120", "b": [6420, 6540, 3200, 4350, 0, 2720]},
   {"id": "wall4", "kind": "block240", "b": [6540, 9250, 4110, 4350, 0, 2720]},
   {"id": "wall5", "kind": "block120", "b": [7220, 7340, 5800, 8660, 0, 2720]},
   {"id": "wall6a", "kind": "block120", "b": [7340, 9010, 6150, 6270, 0, 2720]},
   {"id": "wall6b", "kind": "block120", "b": [9250, 11860, 6150, 6270, 0, 2720]},
   {"id": "wall7", "kind": "block240", "b": [9010, 9250, 4350, 7660, 0, 2720]},
   {"id": "wall8", "kind": "block120", "b": [9250, 9850, 7540, 7660, 0, 2720]},
   {"id": "wall9", "kind": "block120", "b": [9250, 11860, 4110, 4230, 0, 2720]},
   {"id": "wall10", "kind": "block120", "b": [9850, 9970, 7540, 8660, 0, 2720]},
   {"id": "slab", "kind": "slab", "b": [200, 13000, 200, 8900, 2720, 3060], "cuts": ["stairVoid", "chimney"]},
   {"id": "beamWingGardenLeft", "kind": "ringBeam", "b": [-800, 200, 200, 440, 2720, 3060]},
   {"id": "beamWingGardenRight", "kind": "ringBeam", "b": [-800, 200, 8660, 8900, 2720, 3060]},
   {"id": "beamWingFrontLeft", "kind": "ringBeam", "b": [13000, 14000, 200, 440, 2720, 3060]},
   {"id": "beamWingFrontRight", "kind": "ringBeam", "b": [13000, 14000, 8660, 8900, 2720, 3060]},
   {"id": "kneeLeft", "kind": "block240", "b": [-800, 14000, 200, 440, 3060, 9000], "top": "roof"},
   {"id": "kneeRight", "kind": "block240", "b": [-800, 14000, 8660, 8900, 3060, 9000], "top": "roof"},
   {"id": "gableGarden", "kind": "block240", "b": [200, 440, 440, 8660, 3060, 9000], "top": "roof"},
   {"id": "gableFront", "kind": "block240", "b": [12760, 13000, 440, 8660, 3060, 9000], "top": "roof"},
   {"id": "ceiling", "kind": "ceiling", "b": [3760, 12760, 440, 8660, 5910, 6300], "top": "roof", "cuts": ["chimney"]},
   {"id": "loftWall", "kind": "block120", "b": [3640, 3760, 440, 8660, 5910, 9000], "top": "roof", "floor": "roof"},
   {"id": "attic1", "kind": "block120", "b": [3640, 3760, 440, 3910, 3060, 5910], "top": "roof"},
   {"id": "attic2", "kind": "block120", "b": [3640, 3760, 5530, 8660, 3060, 5910], "top": "roof"},
   {"id": "attic3a", "kind": "block120", "b": [3760, 5350, 5530, 5650, 3060, 5910], "top": "roof"},
   {"id": "attic3b", "kind": "block120", "b": [5470, 9010, 5530, 5650, 3060, 5910], "top": "roof"},
   {"id": "attic4", "kind": "block120", "b": [3760, 4710, 3790, 3910, 3060, 5910], "top": "roof"},
   {"id": "attic5", "kind": "block120", "b": [5350, 5470, 440, 3590, 3060, 5910], "top": "roof"},
   {"id": "attic6", "kind": "block120", "b": [5350, 5470, 4350, 8660, 3060, 5910], "top": "roof"},
   {"id": "attic7", "kind": "block120", "b": [7370, 7490, 440, 3410, 3060, 5910], "top": "roof"},
   {"id": "attic8", "kind": "block120", "b": [7490, 9010, 3290, 3410, 3060, 5910], "top": "roof"},
   {"id": "attic9", "kind": "block120", "b": [8200, 8320, 5650, 8660, 3060, 5910], "top": "roof"},
   {"id": "attic12", "kind": "block120", "b": [9010, 9130, 440, 5650, 3060, 5910], "top": "roof"},
   {"id": "attic13", "kind": "block120", "b": [9130, 12760, 4410, 4530, 3060, 5910], "top": "roof"},
   {"id": "balustradeN", "kind": "balustrade", "b": [5470, 6460, 4350, 4390, 3060, 4060]},
   {"id": "balustradeE", "kind": "balustrade", "b": [6420, 6460, 2730, 4350, 3060, 4060]}
  ],
  "voids": [{"id": "stairVoid", "name": "stair void", "boxes": [[5470, 6420, 440, 4350, 2720, 3060], [6420, 7370, 440, 2730, 2720, 3060]]}],
  "openingKinds": {
   "window": {"glazed": {"sill": true}},
   "glassDoor": {"glazed": {"sill": false}, "passage": true},
   "gate": {"leaf": "gate"},
   "entrance": {"leaf": "entrance", "glazed": {"sill": false}, "passage": true},
   "door": {"passage": true, "door": "inner"}
  },
  "openings": [
   {"kind": "window", "label": "6000/2400", "b": [0, 440, 1550, 7550, 0, 2400], "outer": "-x", "cols": 4},
   {"kind": "window", "label": "2000/1000", "b": [7620, 9620, 0, 440, 1100, 2100], "outer": "-y"},
   {"kind": "window", "label": "2500/2400", "b": [830, 3330, 8660, 9100, 0, 2400], "outer": "+y"},
   {"kind": "window", "label": "1900/1300", "b": [4720, 6620, 8660, 9100, 1100, 2400], "outer": "+y", "cols": 2},
   {"kind": "window", "label": "1000/1300", "b": [8030, 9030, 8660, 9100, 1100, 2400], "outer": "+y"},
   {"kind": "gate", "label": "2750/2250", "b": [12760, 13200, 1150, 3900, 0, 2250], "outer": "+x"},
   {"kind": "entrance", "label": "1600/2100", "b": [11860, 12300, 4550, 6150, 0, 2100], "outer": "+x", "leaf": 1000},
   {"kind": "glassDoor", "label": "800/2100", "b": [11860, 12300, 6610, 7410, 0, 2100], "outer": "+x"},
   {"kind": "door", "label": "870/2050", "b": [10640, 11510, 4110, 4230, 0, 2050], "hinge": "x2", "opens": "+y"},
   {"kind": "door", "label": "920/2050", "b": [9010, 9250, 4880, 5800, 0, 2050], "hinge": "y1", "opens": "+x"},
   {
    "kind": "door",
    "label": "900/2050",
    "b": [7760, 8660, 6150, 6270, 0, 2050],
    "hinge": "x2",
    "opens": "-y",
    "product": "porta-hide-wc-80",
    "extras": ["porta-wc-handle-rosette"]
   },
   {"kind": "door", "label": "920/2050", "b": [10640, 11560, 6150, 6270, 0, 2050], "hinge": "x2", "opens": "-y"},
   {
    "kind": "window",
    "label": "6000/3460",
    "b": [0, 440, 1550, 7550, 3060, 6520],
    "outer": "-x",
    "cols": 4,
    "below": [{"h": 6520, "y": 4550, "pitch": 1}, {"h": 6520, "y": 4550, "pitch": -1}]
   },
   {
    "kind": "window",
    "label": "2200/2850",
    "b": [12760, 13200, 1680, 3880, 3060, 5910],
    "outer": "+x",
    "cols": 2,
    "transoms": [3900],
    "below": [{"h": 5910, "y": 3880, "pitch": 1}]
   },
   {
    "kind": "window",
    "label": "2200/2850",
    "b": [12760, 13200, 5220, 7420, 3060, 5910],
    "outer": "+x",
    "cols": 2,
    "transoms": [3900],
    "below": [{"h": 5910, "y": 5220, "pitch": -1}]
   },
   {"kind": "door", "label": "890/2050", "b": [5350, 5470, 4590, 5480, 3060, 5110], "hinge": "y1", "opens": "-x"},
   {
    "kind": "door",
    "label": "900/2050",
    "b": [6300, 7200, 5530, 5650, 3060, 5110],
    "hinge": "x2",
    "opens": "-y",
    "product": "porta-hide-wc-80",
    "extras": ["porta-wc-handle-rosette"]
   },
   {"kind": "door", "label": "700/2050", "b": [3885, 4585, 3790, 3910, 3060, 5110], "hinge": "x1", "opens": "-y"},
   {"kind": "door", "label": "700/2050", "b": [3860, 4560, 5530, 5650, 3060, 5110], "hinge": "x1", "opens": "+y"},
   {"kind": "door", "label": "820/2050", "b": [9010, 9130, 1780, 2600, 3060, 5110], "hinge": "y1", "opens": "+x"},
   {"kind": "door", "label": "940/2050", "b": [9010, 9130, 3470, 4410, 3060, 5110], "hinge": "y2", "opens": "+x"},
   {"kind": "door", "label": "900/2050", "b": [9010, 9130, 4570, 5470, 3060, 5110], "hinge": "y1", "opens": "+x"}
  ],
  "frames": {
   "width": 70,
   "depth": 80,
   "bar": 60,
   "glassDepth": 10,
   "material": "frame",
   "glass": "glass",
   "layers": ["openings"],
   "doors": {
    "inner": {
     "frame": 50,
     "head": 30,
     "gap": 3,
     "bottom": 10,
     "depth": 40,
     "angle": 90,
     "material": "doorWhite",
     "frameMaterial": "doorFrame",
     "handle": {"height": 1000, "inset": 60, "rosette": 50, "rosetteDepth": 8, "offset": 8, "lever": 130, "width": 18, "material": "steel"}
    }
   },
   "leaves": {
    "gate": {"material": "graphite", "depth": [20, 60], "grooves": 4, "groove": "groove", "grooveDepth": [16, 20], "grooveHeight": 16},
    "entrance": {
     "material": "graphite",
     "depth": [10, 70],
     "grooves": 4,
     "groove": "groove",
     "grooveDepth": [6, 10],
     "grooveHeight": 12,
     "handle": {"length": 1200, "width": 30, "depth": [-40, 10], "inset": 140, "centre": 1150, "material": "steel"}
    }
   }
  },
  "finishes": [
   {"h": [-9990, 0], "material": "plinth"},
   {"side": "-x", "y": [640, 8460], "h": [0, 9990], "material": "graphite"},
   {"side": "-x", "y": [1550, 7550], "h": [2400, 3060], "material": "woodHorizontal"},
   {"side": "+x", "y": [640, 8460], "h": [0, 9990], "material": "graphite"},
   {"side": "+x", "x": [13000, 13200], "y": [640, 8460], "h": [2250, 3060], "material": "plasterWhite"},
   {
    "side": "+x",
    "x": [13000, 13200],
    "y": [3880, 5220],
    "h": [3060, 9990],
    "material": "woodVertical",
    "below": [{"h": 5910, "y": 3880, "pitch": 1}, {"h": 5910, "y": 5220, "pitch": -1}]
   },
   {"side": "+x", "x": [12100, 12300], "y": [6150, 6610], "h": [0, 2720], "material": "woodVertical"},
   {"side": "+x", "x": [12100, 12300], "y": [7410, 8460], "h": [0, 2720], "material": "woodVertical"},
   {"side": "+y", "x": [12300, 13000], "y": [4350, 4550], "h": [0, 2720], "material": "graphite"},
   {"side": "-y", "x": [12100, 13200], "y": [8460, 8660], "h": [0, 2720], "material": "graphite"},
   {"side": "-h", "x": [12100, 13000], "material": "graphite"},
   {"side": "+y", "x": [3330, 9030], "h": [0, 2400], "material": "graphite"},
   {"side": "-y", "x": [1270, 9640], "h": [0, 2400], "material": "graphite"},
   {"elements": ["chimney"], "h": [7000, 9990], "material": "graphite"}
  ],
  "stair": {
   "risers": 17,
   "tread": 50,
   "material": "tread",
   "layers": ["stair"],
   "walkable": true,
   "flights": [
    {"x": [5470, 6420], "y": [4350, 1435], "first": 1, "count": 11},
    {"x": [5470, 7370], "y": [440, 1435], "first": 12, "count": 1},
    {"x": [6420, 7370], "y": [1435, 2730], "first": 13, "count": 4}
   ]
  },
  "site": {
   "lawn": {"rect": [-15000, 29000, -15000, 24000], "h": -320, "depth": 200, "material": "lawn", "aroundBuilding": true},
   "surfaces": [
    {"name": "garden terrace", "rect": [-2500, -1000, 300, 8800], "h": -20, "material": "woodHorizontal"},
    {"name": "terrace under the portal", "rect": [-1000, 0, 640, 8460], "h": -20, "material": "woodHorizontal"},
    {"name": "entrance", "rect": [12300, 14200, 4550, 8460], "h": -20, "material": "paving"},
    {"name": "driveway", "rect": [13200, 17200, 640, 4500], "h": -120, "material": "paving"},
    {"name": "path", "rect": [14200, 17200, 4780, 5980], "h": -120, "material": "paving"}
   ],
   "layers": ["site"],
   "walkable": true
  },
  "part": {
   "kinds": ["groundSlab", "foundation", "chimneyFoundation", "block240", "block120", "chimney", "slab", "ringBeam", "ceiling"],
   "fixtures": true,
   "roof": true
  }
 },
 "children": [
  {
   "id": "ground",
   "name": "Ground floor",
   "type": "floor",
   "offset": [0, 0, 0],
   "size": [13200, 9100, 2720],
   "settings": {
    "view": {
     "cameras": [
      {"name": "Plan", "eye": [6660, 4550, 23000], "target": [6600, 4550, 0]},
      {"name": "Perspective", "eye": [19000, -6500, 10500], "target": [6200, 4550, 600]},
      {"name": "Living room", "eye": [900, 8300, 1600], "target": [5200, 3000, 900]},
      {"name": "Entrance", "eye": [11500, 5400, 1600], "target": [6500, 5200, 1000]}
     ],
     "plan": 1500
    }
   },
   "inside": [[440, 12760, 440, 4110], [440, 11860, 4110, 8660]],
   "other": [{"name": "Stairs", "area": [[5470, 6420, 2970, 4350]]}],
   "children": [
    {
     "id": "vestibule_1",
     "name": "Vestibule",
     "type": "vestibule",
     "number": 1,
     "offset": [9250, 4230, 0],
     "size": [2610, 1920, 2720],
     "area": [[0, 2610, 0, 1920]],
     "archonArea": 4.84
    },
    {
     "id": "garage_2",
     "name": "Garage",
     "type": "garage",
     "number": 2,
     "offset": [5470, 440, 0],
     "size": [7290, 3670, 2720],
     "area": [[0, 950, 0, 2530], [950, 1070, 0, 2760], [1070, 7290, 0, 3670]],
     "archonArea": 25.91
    },
    {
     "id": "hall_3",
     "name": "Hall",
     "type": "hall",
     "number": 3,
     "offset": [5470, 4350, 0],
     "size": [3540, 1800, 2720],
     "area": [[0, 1870, 0, 1450], [1870, 3540, 0, 1800]],
     "archonArea": 5.46,
     "note": "Open to the living room and the kitchen: the hall is the way from the vestibule to the stair and the bathroom, ending where the kitchen and the living room begin."
    },
    {
     "id": "living_5",
     "name": "Living room",
     "type": "living",
     "number": 5,
     "offset": [440, 440, 0],
     "size": [5030, 8220, 2720],
     "area": [[0, 4790, 0, 3150], [0, 4270, 3150, 3910], [0, 5030, 3910, 5360], [0, 390, 5360, 8220]],
     "archonArea": 35.42,
     "note": "The garden side with the exit to the garden; open to the kitchen and the hall."
    },
    {
     "id": "kitchen_6",
     "name": "Kitchen",
     "type": "kitchen",
     "number": 6,
     "offset": [830, 5800, 0],
     "size": [6390, 2860, 2720],
     "area": [[0, 6390, 0, 2860]],
     "archonArea": 9.67,
     "note": "The kitchen with the dining area: the island, the table by it and the fixed window by the hob; open to the living room and the hall."
    },
    {
     "id": "bathroom_7",
     "name": "Bathroom",
     "type": "bathroom",
     "number": 7,
     "offset": [7340, 6270, 0],
     "size": [2510, 2390, 2720],
     "area": [[0, 1670, 0, 2390], [1670, 2510, 1390, 2390]],
     "archonArea": 4.95
    },
    {
     "id": "boiler_8",
     "name": "Boiler room with laundry",
     "type": "boiler",
     "number": 8,
     "offset": [9250, 6270, 0],
     "size": [2610, 2390, 2720],
     "area": [[0, 2610, 0, 1270], [720, 2610, 1270, 2390]],
     "archonArea": 4.97
    }
   ]
  },
  {
   "id": "attic",
   "name": "Attic",
   "type": "floor",
   "offset": [0, 0, 3060],
   "size": [13200, 9100, 5940],
   "settings": {
    "view": {
     "cameras": [
      {"name": "Plan", "eye": [6660, 4550, 23000], "target": [6600, 4550, 0]},
      {"name": "Perspective", "eye": [19000, -6500, 10500], "target": [6200, 4550, 600]},
      {"name": "Bedroom", "eye": [3300, 8200, 1600], "target": [800, 2000, 600]},
      {"name": "Hall", "eye": [8800, 5200, 1600], "target": [5600, 4700, 600]},
      {"name": "Rooms", "eye": [12400, 4500, 1600], "target": [9300, 7000, 600]}
     ],
     "plan": 800,
     "cut": 1500
    }
   },
   "inside": [[440, 12760, 440, 8660]],
   "other": [],
   "children": [
    {
     "id": "hall_1",
     "name": "Hall",
     "type": "hall",
     "number": 1,
     "offset": [5470, 2730, 0],
     "size": [3540, 2800, 5940],
     "area": [[950, 1900, 0, 680], [950, 3540, 680, 2800], [0, 950, 1620, 2800]],
     "archonArea": 7.32
    },
    {
     "id": "bedroom_2",
     "name": "Bedroom",
     "type": "bedroom",
     "number": 2,
     "offset": [440, 440, 0],
     "size": [4910, 8220, 5940],
     "area": [[0, 3200, 0, 8220], [3200, 3320, 3470, 5090], [3320, 4270, 3470, 5090], [4270, 4910, 3910, 5090]],
     "archonArea": 28.16
    },
    {
     "id": "wardrobe_3",
     "name": "Wardrobe",
     "type": "wardrobe",
     "number": 3,
     "offset": [3760, 440, 0],
     "size": [1590, 3350, 5940],
     "area": [[0, 950, 0, 3350], [950, 1590, 0, 3150]],
     "archonArea": 5.13
    },
    {
     "id": "wardrobe_4",
     "name": "Wardrobe",
     "type": "wardrobe",
     "number": 4,
     "offset": [3760, 5650, 0],
     "size": [1590, 3010, 5940],
     "area": [[0, 1590, 0, 3010]],
     "archonArea": 4.6
    },
    {
     "id": "bathroom_5",
     "name": "Bathroom",
     "type": "bathroom",
     "number": 5,
     "offset": [5470, 5650, 0],
     "size": [2730, 3010, 5940],
     "area": [[0, 2730, 0, 3010]],
     "archonArea": 7.99
    },
    {
     "id": "bedroom_6",
     "name": "Bedroom",
     "type": "bedroom",
     "number": 6,
     "offset": [8320, 4530, 0],
     "size": [4440, 4130, 5940],
     "area": [[810, 4440, 0, 4130], [0, 810, 1120, 4130]],
     "archonArea": 16.53
    },
    {
     "id": "bedroom_7",
     "name": "Bedroom",
     "type": "bedroom",
     "number": 7,
     "offset": [9130, 440, 0],
     "size": [3630, 3970, 5940],
     "area": [[0, 3630, 0, 3970]],
     "archonArea": 14.11
    },
    {
     "id": "wardrobe_8",
     "name": "Wardrobe",
     "type": "wardrobe",
     "number": 8,
     "offset": [7490, 440, 0],
     "size": [1520, 2850, 5940],
     "area": [[0, 1520, 0, 2850]],
     "archonArea": 4.16
    }
   ]
  }
 ]
});
