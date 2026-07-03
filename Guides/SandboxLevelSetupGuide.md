# Unity Rope Swing: Sandbox Level Editor & Global Config Guide

This guide details how to create new levels in the Sandbox Editor, export them, play them in the Gameplay scene, and tune game characteristics globally.

---

## 1. Setup the Game Prefabs (One-Time Setup)

The dynamic level loader needs templates (Prefabs) in order to spawn the player, anchors, and ropes.

### A. Player Prefab
1. In the Unity Hierarchy, right-click and select **2D Object > Sprites > Circle**. Name it `PlayerPrefab`.
2. Select `PlayerPrefab` and modify the Inspector:
   * **Scale**: Set to `(1.2, 1.2, 1)`.
   * **Sprite Color**: Set to Cyan (or your preferred color).
   * **Add Components**:
     * **Rigidbody 2D**: Set *Mass* to `2` and *Collision Detection* to `Continuous`.
     * **Circle Collider 2D** (default settings).
     * **Player Controller** (script).
3. Drag the `PlayerPrefab` from the Hierarchy into a folder in your Project window (e.g., `Assets/Prefabs/`).
4. Delete it from the Hierarchy.

### B. Anchor Prefab
1. Right-click in the Hierarchy and select **2D Object > Sprites > Circle**. Name it `AnchorPrefab`.
2. Select `AnchorPrefab` and modify the Inspector:
   * **Scale**: Set to `(0.5, 0.5, 1)`.
   * **Sprite Color**: Set to Red.
   * **Add Component**:
     * **Rigidbody 2D**: Set *Body Type* to `Kinematic`.
3. Drag `AnchorPrefab` from the Hierarchy into your Project's `Prefabs/` folder.
4. Delete it from the Hierarchy.

### C. Rope Prefab
1. Right-click in the Hierarchy and select **Create Empty**. Name it `RopePrefab`.
2. Select `RopePrefab` and modify the Inspector:
   * **Add Component**: **Line Renderer** and **Rope Builder**.
   * On the **Line Renderer**:
     * Set *Start Width* and *End Width* to `0.2`.
     * Set *Color* to White.
     * Ensure *Use World Space* is checked.
   * On the **Rope Builder**:
     * Set default values: *Segment Count* = `30`, *Segment Mass* = `0.5`, *Spring Frequency* = `25`, *Damping Ratio* = `0.7`, *Linear/Angular Drag* = `1.5`.
3. Drag `RopePrefab` from the Hierarchy into your Project's `Prefabs/` folder.
4. Delete it from the Hierarchy.

---

## 2. Design and Export a Sandbox Level

1. Open the [SandboxLevelEditor.unity](file:///c:/workspace/ropeSwing-unity-fresh/Assets/Scenes/SandboxLevelEditor.unity) scene.
2. Arrange the level elements:
   * Position the **Sandbox_Ball** to set the player's spawn point.
   * Move the **Sandbox_AnchorLeft** and **Sandbox_AnchorRight** to adjust the starting configuration of the rope.
   * Duplicate (**Ctrl + D**) and reposition **Sandbox_Obstacle (Duplicate Me!)** to place walls and hazards.
3. Export the level:
   * From the top Unity menu, click **Tools > Export Sandbox Level**.
   * Save the asset (e.g. `Level1.asset`) in your project assets folder.

---

## 3. Set Up the Playback Scene (GameplayScene)

1. Open your gameplay scene (e.g. `GameplayScene.unity`).
2. Configure the **Main Camera**:
   * **Position**: Set to `(0, 0, -15)`.
   * **Projection**: Set to `Orthographic` with a **Size** of `10`.
   * **Add Component**: **Rope Interactor**.
   * On the `Rope Interactor`, configure the **Rope Layer** mask to target the `Rope` physics layer.
3. Create the **LevelLoader** controller:
   * Right-click in the Hierarchy and select **Create Empty**. Name it `LevelLoader`.
   * **Add Component**: **Level Loader** (script).
   * Drag your prefabs from the Project folder into the respective slots:
     * `PlayerPrefab` → **Player Prefab**
     * `AnchorPrefab` → **Anchor Prefab**
     * `RopePrefab` → **Rope Builder Prefab**
4. Load the level:
   * Drag your exported level asset (e.g., `Level1.asset`) into the **Level To Load** slot on the `LevelLoader`.
5. Press **Play** to run and play the level!

---

## 4. Tuning the Game Globally (GameSettings Config)

Instead of editing individual prefabs or scenes, you can manage settings game-wide using a single config asset.

1. **Create the settings file**:
   * Right-click in the Project window and select **Create > RopeSwing > Game Settings**.
   * Name it `GlobalGameSettings`.
2. **Assign the file**:
   * In your `GameplayScene`, select the `LevelLoader` and drag `GlobalGameSettings` into the **Game Settings** slot.
   * Select the `Main Camera` and drag `GlobalGameSettings` into the **Settings** slot of the `Rope Interactor`.
3. **Tune globally**:
   * Select `GlobalGameSettings` in your Project window.
   * Changing values like **Global Gravity**, **Fixed Delta Time** (200Hz = 0.005, 100Hz = 0.01), or **Max Pull Distance** in this inspector will instantly update the behavior across all levels at runtime.
