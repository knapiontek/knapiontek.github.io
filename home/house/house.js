HOME.data({
 "format": "house",
 "version": 3,
 "id": "site",
 "name": "Site",
 "type": "site",
 "offset": [0, 0, 0],
 "size": [44000, 39000, 9520],
 "lawn": {"rect": [0, 44000, 0, 39000], "h": 200, "depth": 200, "material": "lawn", "aroundBuilding": true},
 "surfaces": [
  {"name": "garden terrace", "rect": [12500, 14000, 15300, 23800], "h": 500, "material": "woodHorizontal"},
  {"name": "terrace under the portal", "rect": [14000, 15000, 15640, 23460], "h": 500, "material": "woodHorizontal"},
  {"name": "entrance", "rect": [27300, 29200, 19550, 23460], "h": 500, "material": "paving"},
  {"name": "driveway", "rect": [28200, 32200, 15640, 19500], "h": 400, "material": "paving"},
  {"name": "path", "rect": [29200, 32200, 19780, 20980], "h": 400, "material": "paving"}
 ],
 "layers": ["site"],
 "walkable": true,
 "children": [
  {
   "id": "house",
   "name": "Dom w papawerach 5 (G)",
   "type": "house",
   "offset": [14000, 15000, -800],
   "size": [15200, 9100, 10320],
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
      "windows": {"name": "Windows"},
      "doors": {"name": "Doors"},
      "stair": {"name": "Stair"},
      "site": {"name": "Site"},
      "furniture": {"name": "Furniture"},
      "edges": {"name": "Edges"}
     },
     "floors": ["ground", "attic", "roof"],
     "elements": ["foundation", "walls", "slabs", "insulation", "windows", "doors", "stair", "site", "furniture", "edges"],
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
      {"name": "Front", "eye": [28500, -6500, 5520], "target": [7600, 4550, 4620]},
      {"name": "Garden", "eye": [-12500, 13500, 5120], "target": [6000, 4550, 4620]},
      {"name": "Above", "eye": [24000, -11500, 18820], "target": [7600, 4550, 3820]}
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
      "start": {"x": 12200, "y": 5200, "heading": 180}
     },
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
    "split": 4040,
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
     "slab": {
      "name": "slab with ring beam",
      "material": "plasterInside",
      "cap": "concrete",
      "thickness": 340,
      "layers": ["slabs"],
      "walkable": true
     },
     "ceiling": {
      "name": "ceiling with insulation",
      "material": "plasterInside",
      "cap": "insulation",
      "thickness": 390,
      "layers": ["slabs"],
      "floor": "roof"
     }
    },
    "openingKinds": {
     "window": {"glazed": {"sill": true}, "layer": "windows"},
     "glassDoor": {"glazed": {"sill": false}, "passage": true, "layer": "doors"},
     "gate": {"leaf": "gate", "layer": "doors"},
     "entrance": {"leaf": "entrance", "glazed": {"sill": false}, "passage": true, "layer": "doors"},
     "door": {"passage": true, "door": "inner", "layer": "doors"}
    },
    "frames": {
     "width": 70,
     "depth": 80,
     "bar": 60,
     "glassDepth": 10,
     "material": "frame",
     "glass": "glass",
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
     {"h": [null, 1320], "material": "plinth"},
     {"side": "x0", "y": [640, 8460], "h": [1320, null], "material": "graphite"},
     {"side": "x0", "y": [1550, 7550], "h": [3720, 4380], "material": "woodHorizontal"},
     {"side": "x1", "y": [640, 8460], "h": [1320, null], "material": "graphite"},
     {"side": "x1", "x": [14000, 14200], "y": [640, 8460], "h": [3570, 4380], "material": "plasterWhite"},
     {
      "side": "x1",
      "x": [14000, 14200],
      "y": [3880, 5220],
      "h": [4380, null],
      "material": "woodVertical",
      "below": [{"h": 7230, "y": 3880, "pitch": 1}, {"h": 7230, "y": 5220, "pitch": -1}]
     },
     {"side": "x1", "x": [13100, 13300], "y": [6150, 6610], "h": [1320, 4040], "material": "woodVertical"},
     {"side": "x1", "x": [13100, 13300], "y": [7410, 8460], "h": [1320, 4040], "material": "woodVertical"},
     {"side": "y1", "x": [13300, 14000], "y": [4350, 4550], "h": [1320, 4040], "material": "graphite"},
     {"side": "y0", "x": [13100, 14200], "y": [8460, 8660], "h": [1320, 4040], "material": "graphite"},
     {"side": "h0", "x": [13100, 14000], "material": "graphite"},
     {"side": "y1", "x": [4330, 10030], "h": [1320, 3720], "material": "graphite"},
     {"side": "y0", "x": [2270, 10640], "h": [1320, 3720], "material": "graphite"},
     {"elements": ["chimney"], "h": [8320, null], "material": "graphite"}
    ],
    "part": {
     "kinds": ["groundSlab", "foundation", "chimneyFoundation", "block240", "block120", "chimney", "slab", "ringBeam", "ceiling"],
     "fixtures": true,
     "roof": true
    },
    "body": [1000, 14200]
   },
   "children": [
    {
     "id": "foundation",
     "name": "Foundation",
     "type": "assembly",
     "offset": [0, 0, 0],
     "size": [15200, 9100, 10320],
     "children": [
      {"id": "footingLeft", "name": "footing", "type": "footing", "offset": [0, 20, 0], "size": [15200, 600, 400], "children": []},
      {"id": "footingRight", "name": "footing", "type": "footing", "offset": [0, 8480, 0], "size": [15200, 600, 400], "children": []},
      {"id": "footingGarden", "name": "footing", "type": "footing", "offset": [1020, 620, 0], "size": [600, 7860, 400], "children": []},
      {"id": "footingFront", "name": "footing", "type": "footing", "offset": [13580, 620, 0], "size": [600, 3910, 400], "children": []},
      {"id": "footingRecess", "name": "footing", "type": "footing", "offset": [12680, 3930, 0], "size": [900, 600, 400], "children": []},
      {"id": "footingEntrance", "name": "footing", "type": "footing", "offset": [12680, 4530, 0], "size": [600, 3950, 400], "children": []},
      {"id": "footingWall4", "name": "footing", "type": "footing", "offset": [7240, 3930, 0], "size": [3190, 600, 400], "children": []},
      {"id": "footingWall7", "name": "footing", "type": "footing", "offset": [9830, 4530, 0], "size": [600, 3430, 400], "children": []},
      {"id": "footingWall2", "name": "footing", "type": "footing", "offset": [6050, 620, 0], "size": [600, 2790, 400], "children": []},
      {"id": "footingChimney", "name": "footing", "type": "footing", "offset": [5530, 3410, 0], "size": [1120, 1120, 400], "children": []},
      {
       "id": "foundationLeft",
       "name": "foundation wall",
       "type": "foundation",
       "offset": [200, 200, 400],
       "size": [14800, 240, 920],
       "children": []
      },
      {
       "id": "foundationRight",
       "name": "foundation wall",
       "type": "foundation",
       "offset": [200, 8660, 400],
       "size": [14800, 240, 920],
       "children": []
      },
      {
       "id": "foundationGarden",
       "name": "foundation wall",
       "type": "foundation",
       "offset": [1200, 440, 400],
       "size": [240, 8220, 920],
       "children": []
      },
      {
       "id": "foundationFront",
       "name": "foundation wall",
       "type": "foundation",
       "offset": [13760, 440, 400],
       "size": [240, 3910, 920],
       "children": []
      },
      {
       "id": "foundationRecess",
       "name": "foundation wall",
       "type": "foundation",
       "offset": [12860, 4110, 400],
       "size": [900, 240, 920],
       "children": []
      },
      {
       "id": "foundationEntrance",
       "name": "foundation wall",
       "type": "foundation",
       "offset": [12860, 4350, 400],
       "size": [240, 4310, 920],
       "children": []
      },
      {
       "id": "foundationWall4",
       "name": "foundation wall",
       "type": "foundation",
       "offset": [7540, 4110, 400],
       "size": [2710, 240, 920],
       "children": []
      },
      {
       "id": "foundationWall7",
       "name": "foundation wall",
       "type": "foundation",
       "offset": [10010, 4350, 400],
       "size": [240, 3310, 920],
       "children": []
      },
      {
       "id": "foundationWall2",
       "name": "foundation wall",
       "type": "foundation",
       "offset": [6230, 440, 400],
       "size": [240, 3150, 920],
       "children": []
      },
      {
       "id": "foundationChimney",
       "name": "chimney foundation",
       "type": "chimneyFoundation",
       "offset": [5710, 3590, 400],
       "size": [760, 760, 920],
       "children": []
      },
      {
       "id": "groundSlabGarage",
       "name": "ground slab",
       "type": "groundSlab",
       "offset": [1440, 440, 960],
       "size": [12320, 3670, 360],
       "cuts": ["foundationWall2", "foundationWall4", "foundationChimney"],
       "children": []
      },
      {
       "id": "groundSlabHouse",
       "name": "ground slab",
       "type": "groundSlab",
       "offset": [1440, 4110, 960],
       "size": [11420, 4550, 360],
       "cuts": ["foundationWall4", "foundationWall7", "foundationChimney"],
       "children": []
      }
     ]
    },
    {
     "id": "ground",
     "name": "Ground floor",
     "type": "floor",
     "offset": [0, 0, 1320],
     "size": [15200, 9100, 2720],
     "settings": {
      "view": {
       "cameras": [
        {"name": "Plan", "eye": [7660, 4550, 23000], "target": [7600, 4550, 0]},
        {"name": "Perspective", "eye": [20000, -6500, 10500], "target": [7200, 4550, 600]},
        {"name": "Living room", "eye": [1900, 8300, 1600], "target": [6200, 3000, 900]},
        {"name": "Entrance", "eye": [12500, 5400, 1600], "target": [7500, 5200, 1000]}
       ],
       "plan": 1500
      }
     },
     "inside": [[1440, 13760, 440, 4110], [1440, 12860, 4110, 8660]],
     "other": [{"name": "Stairs", "area": [[6470, 7420, 2970, 4350]]}],
     "children": [
      {
       "id": "blockLeft",
       "name": "block 240 mm",
       "type": "block240",
       "offset": [200, 200, 0],
       "size": [14800, 240, 2720],
       "children": [
        {
         "id": "window_garage_2",
         "name": "Window 2000/1000",
         "type": "window",
         "offset": [8420, -200, 1100],
         "size": [2000, 440, 1000],
         "label": "2000/1000",
         "outer": "y0"
        }
       ]
      },
      {
       "id": "blockRight",
       "name": "block 240 mm",
       "type": "block240",
       "offset": [200, 8660, 0],
       "size": [14800, 240, 2720],
       "children": [
        {
         "id": "window_kitchen_6_fixed",
         "name": "Window 2500/2400",
         "type": "window",
         "offset": [1630, 0, 0],
         "size": [2500, 440, 2400],
         "label": "2500/2400",
         "outer": "y1"
        },
        {
         "id": "window_kitchen_6",
         "name": "Window 1900/1300",
         "type": "window",
         "offset": [5520, 0, 1100],
         "size": [1900, 440, 1300],
         "label": "1900/1300",
         "outer": "y1",
         "cols": 2
        },
        {
         "id": "window_bathroom_7",
         "name": "Window 1000/1300",
         "type": "window",
         "offset": [8830, 0, 1100],
         "size": [1000, 440, 1300],
         "label": "1000/1300",
         "outer": "y1"
        }
       ]
      },
      {
       "id": "blockGarden",
       "name": "block 240 mm",
       "type": "block240",
       "offset": [1200, 440, 0],
       "size": [240, 8220, 2720],
       "children": [
        {
         "id": "window_living_5",
         "name": "Window 6000/2400",
         "type": "window",
         "offset": [-200, 1110, 0],
         "size": [440, 6000, 2400],
         "label": "6000/2400",
         "outer": "x0",
         "cols": 4
        }
       ]
      },
      {
       "id": "blockGarageFront",
       "name": "block 240 mm",
       "type": "block240",
       "offset": [13760, 440, 0],
       "size": [240, 3910, 2720],
       "children": [
        {
         "id": "gate_garage_2",
         "name": "Gate 2750/2250",
         "type": "gate",
         "offset": [0, 710, 0],
         "size": [440, 2750, 2250],
         "label": "2750/2250",
         "outer": "x1"
        }
       ]
      },
      {
       "id": "blockRecess",
       "name": "block 240 mm",
       "type": "block240",
       "offset": [12860, 4110, 0],
       "size": [900, 240, 2720],
       "children": []
      },
      {
       "id": "blockEntrance",
       "name": "block 240 mm",
       "type": "block240",
       "offset": [12860, 4350, 0],
       "size": [240, 4310, 2720],
       "children": [
        {
         "id": "entrance_vestibule_1",
         "name": "Entrance door 1600/2100",
         "type": "entrance",
         "offset": [0, 200, 0],
         "size": [440, 1600, 2100],
         "label": "1600/2100",
         "outer": "x1",
         "leaf": 1000
        },
        {
         "id": "glassdoor_boiler_8",
         "name": "Glass door 800/2100",
         "type": "glassDoor",
         "offset": [0, 2260, 0],
         "size": [440, 800, 2100],
         "label": "800/2100",
         "outer": "x1"
        }
       ]
      },
      {"id": "chimney", "name": "chimney", "type": "chimney", "offset": [5710, 3590, 0], "size": [760, 760, 9000], "children": []},
      {"id": "wall2", "name": "block 240 mm", "type": "block240", "offset": [6230, 440, 0], "size": [240, 3150, 2720], "children": []},
      {"id": "wall3", "name": "block 120 mm", "type": "block120", "offset": [7420, 3200, 0], "size": [120, 1150, 2720], "children": []},
      {"id": "wall4", "name": "block 240 mm", "type": "block240", "offset": [7540, 4110, 0], "size": [2710, 240, 2720], "children": []},
      {"id": "wall5", "name": "block 120 mm", "type": "block120", "offset": [8220, 5800, 0], "size": [120, 2860, 2720], "children": []},
      {
       "id": "wall6a",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [8340, 6150, 0],
       "size": [1670, 120, 2720],
       "children": [
        {
         "id": "door_hall_3_bathroom_7",
         "name": "Door 900/2050",
         "type": "door",
         "offset": [420, 0, 0],
         "size": [900, 120, 2050],
         "label": "900/2050",
         "hinge": "x1",
         "opens": "y0",
         "product": "porta-hide-wc-80",
         "extras": ["porta-wc-handle-rosette"]
        }
       ]
      },
      {
       "id": "wall6b",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [10250, 6150, 0],
       "size": [2610, 120, 2720],
       "children": [
        {
         "id": "door_vestibule_1_boiler_8",
         "name": "Door 920/2050",
         "type": "door",
         "offset": [1390, 0, 0],
         "size": [920, 120, 2050],
         "label": "920/2050",
         "hinge": "x1",
         "opens": "y0"
        }
       ]
      },
      {
       "id": "wall7",
       "name": "block 240 mm",
       "type": "block240",
       "offset": [10010, 4350, 0],
       "size": [240, 3310, 2720],
       "children": [
        {
         "id": "door_vestibule_1_hall_3",
         "name": "Door 920/2050",
         "type": "door",
         "offset": [0, 530, 0],
         "size": [240, 920, 2050],
         "label": "920/2050",
         "hinge": "y0",
         "opens": "x1"
        }
       ]
      },
      {"id": "wall8", "name": "block 120 mm", "type": "block120", "offset": [10250, 7540, 0], "size": [600, 120, 2720], "children": []},
      {
       "id": "wall9",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [10250, 4110, 0],
       "size": [2610, 120, 2720],
       "children": [
        {
         "id": "door_vestibule_1_garage_2",
         "name": "Door 870/2050",
         "type": "door",
         "offset": [1390, 0, 0],
         "size": [870, 120, 2050],
         "label": "870/2050",
         "hinge": "x1",
         "opens": "y1"
        }
       ]
      },
      {"id": "wall10", "name": "block 120 mm", "type": "block120", "offset": [10850, 7540, 0], "size": [120, 1120, 2720], "children": []},
      {
       "id": "slab",
       "name": "slab with ring beam",
       "type": "slab",
       "offset": [1200, 200, 2720],
       "size": [12800, 8700, 340],
       "cuts": ["stairVoid", "chimney"],
       "children": []
      },
      {
       "id": "beamWingGardenLeft",
       "name": "ring beam over the portal wing",
       "type": "ringBeam",
       "offset": [200, 200, 2720],
       "size": [1000, 240, 340],
       "children": []
      },
      {
       "id": "beamWingGardenRight",
       "name": "ring beam over the portal wing",
       "type": "ringBeam",
       "offset": [200, 8660, 2720],
       "size": [1000, 240, 340],
       "children": []
      },
      {
       "id": "beamWingFrontLeft",
       "name": "ring beam over the portal wing",
       "type": "ringBeam",
       "offset": [14000, 200, 2720],
       "size": [1000, 240, 340],
       "children": []
      },
      {
       "id": "beamWingFrontRight",
       "name": "ring beam over the portal wing",
       "type": "ringBeam",
       "offset": [14000, 8660, 2720],
       "size": [1000, 240, 340],
       "children": []
      },
      {
       "id": "vestibule_1",
       "name": "Vestibule",
       "type": "vestibule",
       "number": 1,
       "offset": [10250, 4230, 0],
       "size": [2610, 1920, 2720],
       "area": [[0, 2610, 0, 1920]],
       "archonArea": 4.84
      },
      {
       "id": "garage_2",
       "name": "Garage",
       "type": "garage",
       "number": 2,
       "offset": [6470, 440, 0],
       "size": [7290, 3670, 2720],
       "area": [[0, 950, 0, 2530], [950, 1070, 0, 2760], [1070, 7290, 0, 3670]],
       "archonArea": 25.91
      },
      {
       "id": "hall_3",
       "name": "Hall",
       "type": "hall",
       "number": 3,
       "offset": [6470, 4350, 0],
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
       "offset": [1440, 440, 0],
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
       "offset": [1830, 5800, 0],
       "size": [6390, 2860, 2720],
       "area": [[0, 6390, 0, 2860]],
       "archonArea": 9.67,
       "files": ["cabinets", "scene"],
       "note": "The kitchen with the dining area: the island, the table by it and the fixed window by the hob; open to the living room and the hall."
      },
      {
       "id": "bathroom_7",
       "name": "Bathroom",
       "type": "bathroom",
       "number": 7,
       "offset": [8340, 6270, 0],
       "size": [2510, 2390, 2720],
       "area": [[0, 1670, 0, 2390], [1670, 2510, 1390, 2390]],
       "archonArea": 4.95
      },
      {
       "id": "boiler_8",
       "name": "Boiler room with laundry",
       "type": "boiler",
       "number": 8,
       "offset": [10250, 6270, 0],
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
     "offset": [0, 0, 4380],
     "size": [15200, 9100, 5940],
     "settings": {
      "view": {
       "cameras": [
        {"name": "Plan", "eye": [7660, 4550, 23000], "target": [7600, 4550, 0]},
        {"name": "Perspective", "eye": [20000, -6500, 10500], "target": [7200, 4550, 600]},
        {"name": "Bedroom", "eye": [4300, 8200, 1600], "target": [1800, 2000, 600]},
        {"name": "Hall", "eye": [9800, 5200, 1600], "target": [6600, 4700, 600]},
        {"name": "Rooms", "eye": [13400, 4500, 1600], "target": [10300, 7000, 600]}
       ],
       "plan": 800
      }
     },
     "inside": [[1440, 13760, 440, 8660]],
     "other": [],
     "children": [
      {
       "id": "kneeLeft",
       "name": "block 240 mm",
       "type": "block240",
       "offset": [200, 200, 0],
       "size": [14800, 240, 5940],
       "top": "roof",
       "children": []
      },
      {
       "id": "kneeRight",
       "name": "block 240 mm",
       "type": "block240",
       "offset": [200, 8660, 0],
       "size": [14800, 240, 5940],
       "top": "roof",
       "children": []
      },
      {
       "id": "gableGarden",
       "name": "block 240 mm",
       "type": "block240",
       "offset": [1200, 440, 0],
       "size": [240, 8220, 5940],
       "top": "roof",
       "children": [
        {
         "id": "window_bedroom_2",
         "name": "Window 6000/3460",
         "type": "window",
         "offset": [-200, 1110, 0],
         "size": [440, 6000, 3460],
         "label": "6000/3460",
         "outer": "x0",
         "cols": 4,
         "below": [{"h": 3460, "y": 3000, "pitch": 1}, {"h": 3460, "y": 3000, "pitch": -1}]
        }
       ]
      },
      {
       "id": "gableFront",
       "name": "block 240 mm",
       "type": "block240",
       "offset": [13760, 440, 0],
       "size": [240, 8220, 5940],
       "top": "roof",
       "children": [
        {
         "id": "window_bedroom_7",
         "name": "Window 2200/2850",
         "type": "window",
         "offset": [0, 1240, 0],
         "size": [440, 2200, 2850],
         "label": "2200/2850",
         "outer": "x1",
         "cols": 2,
         "transoms": [840],
         "below": [{"h": 2850, "y": 2200, "pitch": 1}]
        },
        {
         "id": "window_bedroom_6",
         "name": "Window 2200/2850",
         "type": "window",
         "offset": [0, 4780, 0],
         "size": [440, 2200, 2850],
         "label": "2200/2850",
         "outer": "x1",
         "cols": 2,
         "transoms": [840],
         "below": [{"h": 2850, "y": 0, "pitch": -1}]
        }
       ]
      },
      {
       "id": "attic1",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [4640, 440, 0],
       "size": [120, 3470, 2850],
       "top": "roof",
       "children": []
      },
      {
       "id": "attic2",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [4640, 5530, 0],
       "size": [120, 3130, 2850],
       "top": "roof",
       "children": []
      },
      {
       "id": "attic3a",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [4760, 5530, 0],
       "size": [1590, 120, 2850],
       "top": "roof",
       "children": [
        {
         "id": "door_bedroom_2_wardrobe_4",
         "name": "Door 700/2050",
         "type": "door",
         "offset": [100, 0, 0],
         "size": [700, 120, 2050],
         "label": "700/2050",
         "hinge": "x0",
         "opens": "y1"
        }
       ]
      },
      {
       "id": "attic3b",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [6470, 5530, 0],
       "size": [3540, 120, 2850],
       "top": "roof",
       "children": [
        {
         "id": "door_hall_1_bathroom_5",
         "name": "Door 900/2050",
         "type": "door",
         "offset": [830, 0, 0],
         "size": [900, 120, 2050],
         "label": "900/2050",
         "hinge": "x1",
         "opens": "y0",
         "product": "porta-hide-wc-80",
         "extras": ["porta-wc-handle-rosette"]
        }
       ]
      },
      {
       "id": "attic4",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [4760, 3790, 0],
       "size": [950, 120, 2850],
       "top": "roof",
       "children": [
        {
         "id": "door_bedroom_2_wardrobe_3",
         "name": "Door 700/2050",
         "type": "door",
         "offset": [125, 0, 0],
         "size": [700, 120, 2050],
         "label": "700/2050",
         "hinge": "x0",
         "opens": "y0"
        }
       ]
      },
      {
       "id": "attic5",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [6350, 440, 0],
       "size": [120, 3150, 2850],
       "top": "roof",
       "children": []
      },
      {
       "id": "attic6",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [6350, 4350, 0],
       "size": [120, 4310, 2850],
       "top": "roof",
       "children": [
        {
         "id": "door_hall_1_bedroom_2",
         "name": "Door 890/2050",
         "type": "door",
         "offset": [0, 240, 0],
         "size": [120, 890, 2050],
         "label": "890/2050",
         "hinge": "y0",
         "opens": "x0"
        }
       ]
      },
      {
       "id": "attic7",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [8370, 440, 0],
       "size": [120, 2970, 2850],
       "top": "roof",
       "children": []
      },
      {
       "id": "attic8",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [8490, 3290, 0],
       "size": [1520, 120, 2850],
       "top": "roof",
       "children": []
      },
      {
       "id": "attic9",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [9200, 5650, 0],
       "size": [120, 3010, 2850],
       "top": "roof",
       "children": []
      },
      {
       "id": "attic12",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [10010, 440, 0],
       "size": [120, 5210, 2850],
       "top": "roof",
       "children": [
        {
         "id": "door_bedroom_7_wardrobe_8",
         "name": "Door 820/2050",
         "type": "door",
         "offset": [0, 1340, 0],
         "size": [120, 820, 2050],
         "label": "820/2050",
         "hinge": "y0",
         "opens": "x1"
        },
        {
         "id": "door_hall_1_bedroom_7",
         "name": "Door 940/2050",
         "type": "door",
         "offset": [0, 3030, 0],
         "size": [120, 940, 2050],
         "label": "940/2050",
         "hinge": "y1",
         "opens": "x1"
        },
        {
         "id": "door_hall_1_bedroom_6",
         "name": "Door 900/2050",
         "type": "door",
         "offset": [0, 4130, 0],
         "size": [120, 900, 2050],
         "label": "900/2050",
         "hinge": "y0",
         "opens": "x1"
        }
       ]
      },
      {
       "id": "attic13",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [10130, 4410, 0],
       "size": [3630, 120, 2850],
       "top": "roof",
       "children": []
      },
      {
       "id": "balustradeHall",
       "name": "stair balustrade (plain, assumed: not in the drawings)",
       "type": "balustrade",
       "offset": [6470, 4350, 0],
       "size": [990, 40, 1000],
       "children": []
      },
      {
       "id": "balustradeStair",
       "name": "stair balustrade (plain, assumed: not in the drawings)",
       "type": "balustrade",
       "offset": [7420, 2730, 0],
       "size": [40, 1620, 1000],
       "children": []
      },
      {
       "id": "hall_1",
       "name": "Hall",
       "type": "hall",
       "number": 1,
       "offset": [6470, 2730, 0],
       "size": [3540, 2800, 5940],
       "area": [[950, 1900, 0, 680], [950, 3540, 680, 2800], [0, 950, 1620, 2800]],
       "archonArea": 7.32
      },
      {
       "id": "bedroom_2",
       "name": "Bedroom",
       "type": "bedroom",
       "number": 2,
       "offset": [1440, 440, 0],
       "size": [4910, 8220, 5940],
       "area": [[0, 3200, 0, 8220], [3200, 3320, 3470, 5090], [3320, 4270, 3470, 5090], [4270, 4910, 3910, 5090]],
       "archonArea": 28.16
      },
      {
       "id": "wardrobe_3",
       "name": "Wardrobe",
       "type": "wardrobe",
       "number": 3,
       "offset": [4760, 440, 0],
       "size": [1590, 3350, 5940],
       "area": [[0, 950, 0, 3350], [950, 1590, 0, 3150]],
       "archonArea": 5.13
      },
      {
       "id": "wardrobe_4",
       "name": "Wardrobe",
       "type": "wardrobe",
       "number": 4,
       "offset": [4760, 5650, 0],
       "size": [1590, 3010, 5940],
       "area": [[0, 1590, 0, 3010]],
       "archonArea": 4.6
      },
      {
       "id": "bathroom_5",
       "name": "Bathroom",
       "type": "bathroom",
       "number": 5,
       "offset": [6470, 5650, 0],
       "size": [2730, 3010, 5940],
       "area": [[0, 2730, 0, 3010]],
       "archonArea": 7.99
      },
      {
       "id": "bedroom_6",
       "name": "Bedroom",
       "type": "bedroom",
       "number": 6,
       "offset": [9320, 4530, 0],
       "size": [4440, 4130, 5940],
       "area": [[810, 4440, 0, 4130], [0, 810, 1120, 4130]],
       "archonArea": 16.53
      },
      {
       "id": "bedroom_7",
       "name": "Bedroom",
       "type": "bedroom",
       "number": 7,
       "offset": [10130, 440, 0],
       "size": [3630, 3970, 5940],
       "area": [[0, 3630, 0, 3970]],
       "archonArea": 14.11
      },
      {
       "id": "wardrobe_8",
       "name": "Wardrobe",
       "type": "wardrobe",
       "number": 8,
       "offset": [8490, 440, 0],
       "size": [1520, 2850, 5940],
       "area": [[0, 1520, 0, 2850]],
       "archonArea": 4.16
      }
     ]
    },
    {
     "id": "facade",
     "name": "Facade insulation",
     "type": "assembly",
     "offset": [0, 0, 0],
     "size": [15200, 9100, 10320],
     "children": [
      {
       "id": "epsLeft",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [0, 0, 400],
       "size": [15200, 200, 9920],
       "top": "roof",
       "outer": "y0",
       "children": []
      },
      {
       "id": "epsRight",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [0, 8900, 400],
       "size": [15200, 200, 9920],
       "top": "roof",
       "outer": "y1",
       "children": []
      },
      {
       "id": "epsGarden",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [1000, 440, 400],
       "size": [200, 8220, 9920],
       "top": "roof",
       "outer": "x0",
       "children": []
      },
      {
       "id": "epsGarageFront",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [14000, 440, 400],
       "size": [200, 4110, 3640],
       "outer": "x1",
       "children": []
      },
      {
       "id": "epsRecessLeft",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [13300, 4350, 400],
       "size": [700, 200, 3640],
       "outer": "y1",
       "children": []
      },
      {
       "id": "epsEntrance",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [13100, 4350, 400],
       "size": [200, 4110, 3640],
       "outer": "x1",
       "children": []
      },
      {
       "id": "epsRecessRight",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [13100, 8460, 400],
       "size": [1100, 200, 3640],
       "outer": "y0",
       "children": []
      },
      {
       "id": "epsSoffit",
       "name": "EPS of the recess soffit 470 mm",
       "type": "epsSoffit",
       "offset": [13300, 4550, 3570],
       "size": [900, 3910, 470],
       "outer": "h0",
       "children": []
      },
      {
       "id": "epsFrontGable",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [14000, 440, 4040],
       "size": [200, 8220, 6280],
       "top": "roof",
       "outer": "x1",
       "children": []
      },
      {
       "id": "epsWingGardenLeft",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [200, 440, 400],
       "size": [800, 200, 9920],
       "top": "roof",
       "outer": "y1",
       "children": []
      },
      {
       "id": "epsWingGardenRight",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [200, 8460, 400],
       "size": [800, 200, 9920],
       "top": "roof",
       "outer": "y0",
       "children": []
      },
      {
       "id": "epsWingFrontLeft",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [14200, 440, 400],
       "size": [800, 200, 9920],
       "top": "roof",
       "outer": "y1",
       "children": []
      },
      {
       "id": "epsWingFrontRight",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [14200, 8460, 400],
       "size": [800, 200, 9920],
       "top": "roof",
       "outer": "y0",
       "children": []
      },
      {
       "id": "epsHeadGardenLeft",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [0, 200, 400],
       "size": [200, 440, 9920],
       "top": "roof",
       "outer": "x0",
       "children": []
      },
      {
       "id": "epsHeadGardenRight",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [0, 8460, 400],
       "size": [200, 440, 9920],
       "top": "roof",
       "outer": "x0",
       "children": []
      },
      {
       "id": "epsHeadFrontLeft",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [15000, 200, 400],
       "size": [200, 440, 9920],
       "top": "roof",
       "outer": "x1",
       "children": []
      },
      {
       "id": "epsHeadFrontRight",
       "name": "EPS 200 mm",
       "type": "eps",
       "offset": [15000, 8460, 400],
       "size": [200, 440, 9920],
       "top": "roof",
       "outer": "x1",
       "children": []
      }
     ]
    },
    {
     "id": "roof",
     "name": "Roof",
     "type": "assembly",
     "offset": [0, 0, 0],
     "size": [15200, 9100, 10320],
     "pitch": 42,
     "eave": 5184,
     "width": 9100,
     "thickness": 640,
     "x": [0, 15200],
     "faces": {"top": "roofGraphite", "bottom": "plasterWhite", "ends": "plasterWhite", "eaves": "graphite", "reveals": "plasterWhite"},
     "cap": "timber",
     "cuts": ["chimney"],
     "layers": ["roof"],
     "windowFrame": {"width": 70, "frame": [-100, 40], "glass": [5, 15], "material": "frame", "glazing": "glass", "layer": "windows"},
     "clearHeights": [1400, 2200],
     "children": [
      {
       "id": "ceiling",
       "name": "ceiling with insulation",
       "type": "ceiling",
       "offset": [4760, 440, 7230],
       "size": [9000, 8220, 390],
       "top": "roof",
       "cuts": ["chimney"],
       "children": []
      },
      {
       "id": "loftWall",
       "name": "block 120 mm",
       "type": "block120",
       "offset": [4640, 440, 7230],
       "size": [120, 8220, 3090],
       "top": "roof",
       "floor": "roof",
       "children": []
      },
      {
       "id": "roofWindow_bedroom_2",
       "name": "Roof window Bedroom",
       "type": "roofWindow",
       "place": "Bedroom",
       "label": "940/1400",
       "offset": [2550, 7820, 5400.096970631482],
       "size": [940, 1040, 1797.6251530178342],
       "children": []
      },
      {
       "id": "roofWindow_hall_1",
       "name": "Roof window Stairs",
       "type": "roofWindow",
       "place": "Stairs",
       "label": "940/1400",
       "offset": [7390, 240, 5400.096970631482],
       "size": [940, 1040, 1797.6251530178342],
       "children": []
      },
      {
       "id": "roofWindow_bathroom_5",
       "name": "Roof window Bathroom",
       "type": "roofWindow",
       "place": "Bathroom",
       "label": "940/1400",
       "offset": [7390, 7820, 5400.096970631482],
       "size": [940, 1040, 1797.6251530178342],
       "children": []
      }
     ]
    },
    {
     "id": "stair",
     "name": "Stair",
     "type": "assembly",
     "offset": [0, 0, 0],
     "size": [15200, 9100, 10320],
     "risers": 17,
     "tread": 50,
     "material": "tread",
     "layers": ["stair"],
     "walkable": true,
     "flights": [
      {"x": [6470, 7420], "y": [4350, 1435], "first": 1, "count": 11},
      {"x": [6470, 8370], "y": [440, 1435], "first": 12, "count": 1},
      {"x": [7420, 8370], "y": [1435, 2730], "first": 13, "count": 4}
     ],
     "children": [
      {
       "id": "stairVoid",
       "name": "stair void",
       "type": "void",
       "offset": [6470, 440, 4040],
       "size": [1900, 3910, 340],
       "children": [
        {"id": "stairVoid_1", "name": "stair void 1", "type": "voidBox", "offset": [0, 0, 0], "size": [950, 3910, 340], "children": []},
        {"id": "stairVoid_2", "name": "stair void 2", "type": "voidBox", "offset": [950, 0, 0], "size": [950, 2290, 340], "children": []}
       ]
      }
     ]
    }
   ]
  }
 ]
});
