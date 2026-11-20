# Cabinets: how they are made

Rules for the builder, in words, for every room (kitchen, vanities, wardrobes). No numbers: sizes, gaps, clearances and tables (shelves, hinges, holes) are in the room's `.cabinets.js` settings and its Documents (cut list, assembly cards); a room's own decisions in its Notes. Code: room/cabinets.js.

## 1. The layout

- **A group** is a run of cabinets along one wall, or an island. It has columns, each of a width in millimetres.
- **A component** lies in a group, starts in a column and may span several. Components are stacked from the floor in the order of the list: a component stands on the highest one in its columns, or fills the gap under a wider one added before it.
- **A place** is the group and the columns: G1[4] is group 1, column 4; G1[1-11] columns 1 to 11.

## 2. Types and tags

Every component has exactly one **type**, which decides what is made. **Tags** add features to a type; each tag fits only the types it names.

| Type | What is made |
|---|---|
| space | nothing: an empty place; at the end of a carcass (a hidden L corner): an inset panel; a carcass of spaces only (a support under a carcass on the worktop): an inset panel over its whole width |
| plasterboard | a casing of plasterboard |
| plinth | a plinth |
| worktop | a worktop; its thickness is the component's height |
| end panel (`endPanel`) | an upright board under the end of the worktop, down to the floor; its thickness is the component's width |
| wall panel (`wallPanel`) | a board on the wall |
| front panel (`frontPanel`) | a board laid flat |
| front strip (`strip`) | on edge, in the plane of the fronts, between carcasses |
| cabinet | a place in a carcass with a door |
| drawer | a place in a carcass with a drawer |
| oven, microwave | an appliance built into a carcass, without a front |

| Tag | For | What it changes |
|---|---|---|
| dummy | drawer | a fixed front, no drawer |
| sink | cabinet, drawer | rails on edge, no loose shelves, a cut-out in the worktop |
| hob | cabinet, drawer | a low front rail on edge, a back rail on edge, a partition under the hob |
| bins | drawer | waste bins in the drawer |
| inner drawer (`innerDrawer`) | drawer | a low drawer over the drawer, behind the same front |
| coffee machine (`coffee`) | cabinet | a pull-out shelf at the bottom (a spacer board on the hinge side), loose shelves over it |
| board drawers (`doorDrawers`) | cabinet | boxes of board on ball-bearing runners behind the door, no loose shelves; a spacer board on the hinge side, so the drawers pass the hinges and the open door |
| fridge, freezer | cabinet | the front on the appliance's door: no hinges, no loose shelves, no back |
| dishwasher | cabinet | the front on the appliance's door, no carcass |
| island | worktop | a worktop of the island's material, the island's back panel; the island stands free (no wall) |
| open | cabinet, drawer | no front: open shelves (no door, no hinges), or a drawer whose box is seen; the back runs behind it |
| basin | cabinet, drawer | a basin stands on the top over it: the top has its tap's and its waste's round holes |
| banded | worktop | a top banded all round (a vanity's top of board in a wet room) |

A component has at most one of fridge, freezer, dishwasher. These exclude each other too: dummy with bins, dummy with an inner drawer, a coffee machine with board drawers, open with dummy, open with an appliance, a coffee machine or board drawers, and in one carcass a sink with a hob.

## 3. The carcass

- **A carcass** is every component of one group with the same carcass name. All carcasses of a group have one depth. The gap between the carcasses' backs and the wall is set for each group (an island: to the back edge of the worktop).
- **Kinds of carcass:**
  - base: a worktop over it; on the plinth, or hung (a vanity on hidden hangers, a pair each, nothing under it);
  - tall: on the plinth, no worktop;
  - wall: off the floor, no worktop (on another carcass, or hung).

  A carcass on the plinth stands on legs (a vanity sets none).
- **Fixing:** the back strip is fixed to the wall with an angle bracket, except the highest in a stack. The front strip and the back strips are screwed to the first carcass with an ordinary screw, the second carcass to them with a screw from inside.
- **A grille in the plinth** (an air inlet) is under a carcass on the plinth with an oven, a fridge or a freezer: the maker asks for the air.
- **The top of a carcass:** a base has two flat rails; the other kinds have a top board.
- **The back** is only behind the doors of cabinets, one piece for a run of doors. There is none behind drawers or appliances.
- **A fixed shelf** lies in the middle of the joint between two components and has the full depth. There is none in a base cabinet's carcass.
  - over an oven: shallower at the back (hot air); under an oven: lower, out of its front's way;
  - in a fridge's carcass: only one, on top of the appliance, which is screwed to it; shallower at the back (the air outlet).
- **Loose shelves** are only behind the doors of cabinets:
  - their number follows the front's height;
  - a shelf is shallower than the carcass, with play on both sides;
  - it is one board across the whole carcass.
- **Hinges** are on doors only:
  - their number follows the front's height;
  - the hinges' side is never the handle's side;
  - opposite every hinge is a bumper.
- **A hinge post** stands on the hinges' side when the door does not reach the carcass's side.
- **A drawer** is high (D) when its front is over the set height, otherwise low (M).

## 4. Fronts, strips, front panels, the worktop

- **A front** is the module less its four gaps (left, right, top, bottom). It stands off the carcass by the gap the hinges ask for. A shaker front has a frame of one width.
- **A front strip** stands on edge in the plane of the fronts and is one piece.
- **Back strips**: of chipboard, behind the front strip, at the carcasses' backs, cut as the carcasses next to them.
- **A front panel** lies flat. In a carcass it is screwed to the carcass, with no gap; out of a carcass it stands in the plane of the fronts and is screwed to the panel next to it.
- **The worktop:**
  - its material gives the depth of the board that is bought; an island has a material of its own;
  - it overhangs the fronts;
  - it reaches the wall (an island: the group's gap); what is left of the board is cut off at the back.
- **An end panel** stands under the end of the worktop, from the floor to the worktop's underside, and the worktop lies on it:
  - of a material of its own, two-sided, because both its faces show; an island has a material of its own;
  - the worktop overhangs it: at the side (a space), at the front, in an island at the back too.
- **An island** (a worktop with the tag island) has a back panel between its end panels, from the floor to the top of the carcasses.
- **The plinth** is set back behind the fronts.
- **A vanity's top** (tag banded): a board of the carcass's decor and thickness, banded all round; the basin on it (room/products.md).

## 5. Holes and cut-outs

The holes' diameters, depths and distances, and the cut-outs' sizes, are in the data.

- **A hinge cup:** in the back of the door, at every hinge, at a set distance from the hinges' edge.
- **A bumper:** in the front edge of the side opposite the hinge, at its height.
- **A hinge's mounting plate:** two holes on the inside of the side or of the hinge post, at a set distance from the front, symmetric about the hinge's height.
- **Shelf supports:** under every loose shelf, in both sides, at the front and at the back.
- **Drawer runners and a pull-out shelf's runners:** in both sides (by a spacer board: in it), at a set distance under the drawer's bottom (an inner drawer's too) and under the pull-out shelf, at the positions from the front given in the data.
- **Board drawers' ball-bearing runners:** in the spacer board and in the side opposite it, at a set distance over the box's bottom, at the positions from the runner's front given in the data.
- **A hinge at a shelf** moves above it.
- Holes that overlap on one part, or hit a horizontal board, are reported.
- **Cut-outs in the worktop:** for the sink and the hob, over a carcass with the tag sink or hob, in the middle of the carcass, at a set distance from the worktop's back edge; a cut-out fits in one worktop and inside the carcass. Over a carcass with the tag basin, the top has the tap's and the waste's round holes at set distances from its back edge.
- The 3D view shows the holes in colours (the layer Holes): hinges and bumpers orange, shelves green, runners blue.

## 6. Edges

- **Edge banding** (its technique by the material): fronts on every edge, front strips on the front edge, front panels on the edge at the front. A lacquered material on both faces. In a wet room the banding is glued with PUR.
- **On the carcass's boards** the banding is only on the edges that show:
  - sides, top and bottom boards, shelves, horizontal rails, a hinge post and a spacer board on the front edge;
  - a vertical rail on the bottom edge;
  - a spacer board in a cabinet with a coffee machine ends just over the pull-out shelf, so its top is banded too; with board drawers it reaches the board over it and its top is hidden.
- **Board drawers:** banding on the edges that show when pulled out.
- **No banding:** back rails, back strips, backs, inset panels, the partition and the parts of system drawers.
- **The worktop and an end panel** are banded on the edges that show:
  - the worktop: the side edge over an end panel, in an island the back edge too;
  - an end panel: the front edge, in an island the back edge too;
  - an edge finished in the factory (the worktop's front edge) gets no banding;
  - the cut-outs for the sink and the hob stay unbanded.

## 7. Wardrobes (open shelving)

- Along each longer wall stands a run of carcasses; between the runs a passage stays free. The run on the entrance side is shallow, the one opposite deep.
- A carcass has one width; a run that does not fit ends with one shorter carcass, or two, at the low wall. Nothing stands before a passage or by a door.
- **The carcass** is a box: two sides the whole height, a bottom and a top board between them, a back of hardboard nailed on. Under the roof's slope each carcass is lower (the run steps down): its top stands a set distance under the lowest point of the ceiling over it. It stands on adjustable legs, levelled, with a waterproof plinth set back at the front, and is fixed to the wall with brackets under its top board.
- **Inside:** two drawers at the bottom, in two rows of one height: boxes of board on full-extension ball-bearing runners, as long as the carcass's depth allows, opened by pressing. Over them a fixed shelf, and over that shelves on one grid of heights, the same in every carcass of the room, so the shelves of carcasses side by side are in one line and the carcass's top falls on a line of the grid. Fixed shelves stiffen the carcass; the others are loose on supports, shallower than the carcass, with play on both sides.
- In the walk-in wardrobes there are no fronts: the shelves are open. A niche with fronts (bedroom 6): fronts of the decor's board, laid on the carcass, drawers' fronts and doors over them, on hinges, opened by pressing.
- **Edges:** only those that show: the front edges of sides, top and bottom boards and shelves, the top edges of the drawers' walls; fronts all round, in their decor. No banding on backs and drawer bottoms.

## 8. The cut list and the estimate

- Every size of part has a label, the same in the assembly cards.
- By each dimension, the number of finished edges along it (0, 1 or 2), as on the wholesaler's form; the assembly cards say where each banded edge is.
- The worktop's cut-outs have the codes of the list's legend; the holes are in the assembly cards.
- The estimate counts the sheets from the parts' area with a reserve for waste, the hardware from the number of parts. Waste, the banding's allowance, the reserve, the sheets' sizes and the prices are the estimate's settings; every price links to its shop.

## 9. Checks

- Faults in the data are reported: a missing type, gaps or hinges' side, a tag on the wrong type, a worktop's material too shallow.
- A component without one type, without a height in whole millimetres, without columns in its group, running out of its columns or over another component gets a remark and is not drawn.
- Test shows collisions, small gaps at front strips, back strips and panels, parts that stick out, and fronts slightly out of line. A large gap or a large difference is meant and is not reported.
