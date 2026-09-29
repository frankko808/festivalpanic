import Phaser from "phaser";

export const TOWN_GROUND_KEY = "town-day-ground";
export const TOWN_TILE_SIZE = 32;
export const TOWN_COLUMNS = 50;
export const TOWN_ROWS = 30;
export const TOWN_WORLD_WIDTH = TOWN_COLUMNS * TOWN_TILE_SIZE;
export const TOWN_WORLD_HEIGHT = TOWN_ROWS * TOWN_TILE_SIZE;

/** Build the unchanged town floor once while the loading screen is visible. */
export function prepareTownGround(scene: Phaser.Scene): void {
  if (scene.textures.exists(TOWN_GROUND_KEY)) return;

  const ground = scene.textures.addDynamicTexture(TOWN_GROUND_KEY, TOWN_WORLD_WIDTH, TOWN_WORLD_HEIGHT);
  if (!ground) throw new Error("Could not create the town ground texture.");

  for (let row = 0; row < TOWN_ROWS; row += 1) {
    for (let column = 0; column < TOWN_COLUMNS; column += 1) {
      const inPlaza = column >= 5 && column <= 44 && row >= 5 && row <= 24;
      const onRoad = (column >= 13 && column <= 16) || (row >= 10 && row <= 12);
      const paved = inPlaza || onRoad;
      const variation = (row * 17 + column * 29) % 31;
      const texture = paved
        ? variation === 0 || variation === 19
          ? "tile-plaza-aged"
          : variation === 7 || variation === 23
            ? "tile-plaza-mosaic"
            : variation % 4 === 0
              ? "tile-plaza-alt"
              : "tile-plaza"
        : variation === 2
          ? "tile-grass-flowers"
          : variation === 9 || variation === 27
            ? "tile-grass-clover"
            : variation % 3 === 0
              ? "tile-grass-soft"
              : "tile-grass";
      ground.stamp(texture, undefined, column * TOWN_TILE_SIZE + TOWN_TILE_SIZE / 2, row * TOWN_TILE_SIZE + TOWN_TILE_SIZE / 2);
    }
  }
  ground.render();
}
