# Project Documentation: Views, Layers, and House Design

## 1. Project Structure – Views and Layers

### View and Context Management

* View menu located at the top of the screen.
* Right contextual settings panel automatically adjusts to the currently selected view.

### Layer System

* Every element in the geometry tree is assigned to one or multiple layers.
* An element is rendered/drawn only when all layers associated with it are active.

### Object Hierarchy

* **Data Source & Execution:** The object hierarchy is stored in a **JavaScript JSON file**, which is loaded first before being rendered.
* **Geometrical Tree Logic:** Geometry follows a strict tree structure. Leaf nodes in this tree must always calculate and maintain their geometry **contextually relative to their parent node**.
* **Tree Structure Examples:**
  * **Example A:**
    $$ \text{Building} \rightarrow \text{Floors} \rightarrow \text{Rooms} \rightarrow \text{Groups} \rightarrow \text{Carcasses} $$
  * **Example B:**
    $$ \text{Buildings} \rightarrow \text{Floors} \rightarrow \text{Rooms} \rightarrow \text{Tiles} $$

* An independent material hierarchy is assigned to individual structural elements.

### Functionality and Visibility

* Ability to independently toggle the visibility of individual elements (e.g., cabinet carcasses, fronts, countertops, shelves, legs).

## 2. House Design

### Interface

* Peripheral settings panel tailored to the context of the current main view (accessible via the top menu).

### Object Structure (Tree)

* The building is divided into floors, and floors are divided into individual rooms.
* Complex rooms (e.g., kitchen, bathroom) contain HTML links to external files located in the same directory.

### Products and Geometry

* Fixed and inseparable assignment of textures to specific products (e.g., porcelain tiles).
* No possibility of separating or mixing materials with their geometry.

## 3. Future Integrations & Roadmap

* **Sub-Projects:** There are two standalone projects, `kitchen` and `bath`.
* **Integration Strategy:** These projects will eventually be imported/merged into the primary `house 3D` project. While integration is deferred for a later phase, the architecture of `house 3D` must be prepared now to accept and accommodate them smoothly.