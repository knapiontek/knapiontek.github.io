/* library/materials.js: how a material looks, for every application (core draws it); knows no project.
   colour, roughness, metalness, opacity (glass), reflect = strength of the sky reflection;
   one generated surface at most: texture = plaster grain (strength 0..1, grain = speck size in px of a 256 px tile
   covering "tile" mm), grass, slabs (paving of "size" mm with a joint colour), wood = a decor photo of
   library/textures (decor = its key) cut into boards "board" mm wide;
   plan = the fill of a section in the 2D plan (a colour, or hatch [ground, line]); without it the colour.
   A material is also the colour of a section cap (block, insulation, concrete, timber). */
window.LIBRARY_MATERIALS = {
 "plasterWhite": {"color": "#f4f3ef", "roughness": 0.94, "texture": {"strength": 0.55, "grain": 2, "tile": 1100}},
 "plasterInside": {"color": "#f2eee6", "roughness": 0.95, "texture": {"strength": 0.35, "grain": 2, "tile": 1100}},
 "graphite": {"color": "#45494d", "roughness": 0.9, "texture": {"strength": 0.5, "grain": 2, "tile": 1100}},
 "roofGraphite": {"color": "#3a3d40", "roughness": 0.78, "texture": {"strength": 0.35, "grain": 2, "tile": 600}},
 "frame": {"color": "#3b3e42", "roughness": 0.5, "metalness": 0.25},
 "groove": {"color": "#2e3134", "roughness": 0.8},
 "steel": {"color": "#c9cccf", "roughness": 0.3, "metalness": 0.8},
 "glass": {"color": "#9fb5bf", "roughness": 0.02, "metalness": 0.1, "opacity": 0.3, "reflect": 1.6, "plan": "#9fc3d6"},
 "plinth": {"color": "#6d6e6c", "roughness": 0.9, "texture": {"strength": 0.5, "grain": 3, "tile": 600}},
 "tread": {"color": "#a57b4f", "roughness": 0.6},
 "insulation": {"color": "#dcc35e", "roughness": 0.95, "plan": {"hatch": ["#f3e6b0", "#b39a3c"]}},
 "block": {"color": "#d6d2c8", "roughness": 0.95, "plan": "#2d2f31"},
 "concrete": {"color": "#9e9c96", "roughness": 0.95, "texture": {"strength": 0.45, "grain": 3, "tile": 800}, "plan": "#7d7b76"},
 "timber": {"color": "#b89466", "roughness": 0.8},
 "lawn": {"color": "#6f8a52", "roughness": 1, "grass": {"tile": 1200}},
 "paving": {"color": "#b9b6ae", "roughness": 0.9, "slabs": {"size": 600, "joint": "#6a675f"}},
 "woodVertical": {"wood": {"decor": "egger-h1180-board", "board": 120, "vertical": true}, "roughness": 0.7},
 "woodHorizontal": {"wood": {"decor": "egger-h1180-board", "board": 120, "vertical": false}, "roughness": 0.7}
};
