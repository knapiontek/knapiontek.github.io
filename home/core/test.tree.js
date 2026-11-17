HOME.data({"format": "tree", "version": 1,
 "id": "test", "name": "Core test", "type": "room", "offset": [0, 0, 0], "size": [4000, 3000, 2600],
 "settings": {
  "material": "block",
  "front": "y0",
  "open": {"door": 100, "drawer": 400},
  "view": {
   "layers": {"floor": {"name": "Floor"}, "box": {"name": "Boxes"}, "door": {"name": "Doors"}, "drawer": {"name": "Drawers"}, "edges": {"name": "Edges"}},
   "edges": {"color": "#7d807b", "opacity": 0.45, "layers": ["edges"]},
   "light": {
    "exposure": 0.85,
    "sun": {"azimuth": 330, "elevation": 38, "intensity": 1.35, "color": "#fff1dc", "reach": 8},
    "sky": {"intensity": 0.6, "color": "#cfe0ff", "groundColor": "#a9a596",
     "gradient": [[0, "#5f8fc4"], [0.32, "#9dbfe0"], [0.49, "#e4ecef"], [0.51, "#b7bfae"], [1, "#6f7a5e"]]},
    "fog": {"color": "#dfe7ea", "near": 60000, "far": 160000},
    "clouds": {"value": 0.7, "sun": 0.2, "sky": 2.2, "blur": 8}
   },
   "cameras": [
    {"name": "Front", "eye": [6500, -4500, 3200], "target": [2000, 1500, 800]},
    {"name": "Above", "eye": [2000, 1500, 9000], "target": [2000, 1501, 0]}
   ],
   "walk": {"eye": 1600, "radius": 220, "step": 360, "headroom": 100, "speed": 1400, "turn": 90, "look": 50, "run": 2.2, "start": {"x": 2000, "y": 700, "heading": 90}},
   "cut": {"from": 100, "step": 50},
   "plan": 800
  }
 },
 "children": [
  {"id": "floor", "name": "Floor", "type": "floor", "offset": [0, 0, 0], "size": [4000, 3000, 100], "settings": {"material": "concrete"}},
  {"id": "wall", "name": "Wall", "type": "box", "offset": [0, 2800, 100], "size": [4000, 200, 2500]},
  {"id": "cabinet", "name": "Cabinet", "type": "group", "offset": [500, 2182, 100], "size": [1200, 618, 900],
   "settings": {"material": "melamineWhite"},
   "children": [
    {"id": "side_left", "name": "Left side", "type": "box", "offset": [0, 18, 0], "size": [18, 600, 900]},
    {"id": "side_right", "name": "Right side", "type": "box", "offset": [1182, 18, 0], "size": [18, 600, 900]},
    {"id": "bottom", "name": "Bottom", "type": "box", "offset": [18, 18, 0], "size": [1164, 600, 18]},
    {"id": "top", "name": "Top", "type": "box", "offset": [18, 18, 882], "size": [1164, 600, 18]},
    {"id": "door", "name": "Door", "type": "door", "offset": [0, 0, 0], "size": [597, 18, 900], "settings": {"material": "oakFront", "hinge": "x0"}},
    {"id": "drawer", "name": "Drawer front", "type": "drawer", "offset": [603, 0, 600], "size": [597, 18, 300], "settings": {"material": "oakFront"}},
    {"id": "a3f9c2", "name": "Drawer front", "type": "drawer", "offset": [603, 0, 0], "size": [597, 18, 597], "settings": {"material": "oakFront"}, "refs": ["cabinet/bottom"]}
   ]},
  {"id": "outside", "name": "Out of its parent", "type": "box", "offset": [3800, 100, 100], "size": [400, 400, 400]}
 ]
});
