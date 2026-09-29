import Phaser from "phaser";

export const PARK_GROUND_KEY = "park-day-ground";
export const PARK_WORLD_WIDTH = 1280;
export const PARK_WORLD_HEIGHT = 720;
const TILE_SIZE = 32;

/** Park grass is static, so assemble its tile variation only once. */
export function prepareParkGround(scene: Phaser.Scene): void {
  if (scene.textures.exists(PARK_GROUND_KEY)) return;
  const ground = scene.textures.addDynamicTexture(PARK_GROUND_KEY, PARK_WORLD_WIDTH, PARK_WORLD_HEIGHT);
  if (!ground) throw new Error("Could not create the park ground texture.");

  for (let x = 0; x < PARK_WORLD_WIDTH; x += TILE_SIZE) {
    for (let y = 0; y < PARK_WORLD_HEIGHT; y += TILE_SIZE) {
      const variation = ((x / TILE_SIZE) * 17 + (y / TILE_SIZE) * 23) % 29;
      const texture = variation === 0 || variation === 13
        ? "tile-grass-flowers"
        : variation === 6 || variation === 24
          ? "tile-grass-clover"
          : variation % 3 === 0
            ? "tile-grass-soft"
            : "tile-grass";
      ground.stamp(texture, undefined, x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    }
  }
  ground.render();
}
