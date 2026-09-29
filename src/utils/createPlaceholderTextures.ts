import Phaser from "phaser";
import type { CharacterAppearance } from "../state/storage";

export const APPEARANCE_OPTIONS = {
  skin: ["Porzellan", "Pfirsich", "Honig", "Karamell", "Mahagoni"],
  hair: ["Wuschelig", "Kurz", "Lockig", "Bob", "Zöpfe", "Irokesig"],
  hairColor: ["Kakao", "Sonnig", "Nachthimmel", "Kupfer", "Rosa", "Minze"],
  top: ["Koralle", "Türkis", "Sonnengelb", "Flieder", "Waldgrün", "Nachtblau", "Bonbonrosa"],
  bottom: ["Jeans", "Shorts", "Rock", "Latzhose", "Lila Hose"],
  accessory: ["Ohne", "Rote Kappe", "Runde Brille", "Blumenkranz", "Kopfhörer", "Halstuch", "Katzenohren"],
} as const;

const SKIN_COLORS = [0xf8d9c2, 0xf1bd91, 0xd99a61, 0xaa6847, 0x68402f];
const HAIR_COLORS = [0x4a2a20, 0xe9b949, 0x27314d, 0xc5653d, 0xd85f8c, 0x5fae91];
const TOP_COLORS = [0xee6a5b, 0x39b7a4, 0xf0c43c, 0x9b78cf, 0x4b9b67, 0x445c91, 0xe875a1];
const BOTTOM_COLORS = [0x4e6f91, 0xd98b58, 0x8d5bb3, 0x5d8a71, 0x51446f];

function createTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (graphics: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) {
    return;
  }
  const graphics = scene.add.graphics();
  draw(graphics);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

export function drawPlayer(
  graphics: Phaser.GameObjects.Graphics,
  appearance: CharacterAppearance,
): void {
  const skin = SKIN_COLORS[appearance.skin % SKIN_COLORS.length] ?? 0xf1bd91;
  const hair = HAIR_COLORS[appearance.hairColor % HAIR_COLORS.length] ?? 0x4a2a20;
  const top = TOP_COLORS[appearance.top % TOP_COLORS.length] ?? 0xee6a5b;
  const bottom = BOTTOM_COLORS[appearance.bottom % BOTTOM_COLORS.length] ?? 0x4e6f91;

  graphics.fillStyle(0x2e2940, 0.2);
  graphics.fillEllipse(18, 44, 24, 7);

  graphics.fillStyle(0x332d45, 1);
  graphics.fillRect(8, 38, 8, 5);
  graphics.fillRect(21, 38, 8, 5);
  graphics.fillStyle(bottom, 1);
  if (appearance.bottom === 2) {
    graphics.fillTriangle(8, 29, 29, 29, 32, 39);
    graphics.fillRect(12, 38, 5, 3);
    graphics.fillRect(22, 38, 5, 3);
  } else {
    graphics.fillRect(9, 30, 8, 10);
    graphics.fillRect(20, 30, 8, 10);
    if (appearance.bottom === 1) {
      graphics.fillStyle(skin, 1);
      graphics.fillRect(10, 35, 6, 5);
      graphics.fillRect(21, 35, 6, 5);
    }
  }

  graphics.fillStyle(top, 1);
  graphics.fillRoundedRect(7, 20, 22, 14, 3);
  graphics.fillRect(4, 22, 5, 10);
  graphics.fillRect(28, 22, 5, 10);
  if (appearance.bottom === 3) {
    graphics.fillStyle(bottom, 1);
    graphics.fillRect(11, 20, 4, 14);
    graphics.fillRect(22, 20, 4, 14);
    graphics.fillRect(12, 27, 14, 4);
  }

  graphics.fillStyle(skin, 1);
  graphics.fillRect(5, 30, 4, 4);
  graphics.fillRect(28, 30, 4, 4);
  graphics.fillRoundedRect(8, 6, 21, 17, 5);
  graphics.fillRect(6, 12, 3, 6);
  graphics.fillRect(29, 12, 3, 6);

  graphics.fillStyle(hair, 1);
  graphics.fillRect(7, 4, 23, 7);
  graphics.fillRect(7, 9, 4, 8);
  if (appearance.hair === 0) {
    graphics.fillRect(5, 5, 5, 5);
    graphics.fillRect(12, 2, 6, 5);
    graphics.fillRect(25, 1, 5, 6);
  } else if (appearance.hair === 1) {
    graphics.fillRect(9, 2, 19, 4);
  } else if (appearance.hair === 2) {
    graphics.fillCircle(8, 7, 5);
    graphics.fillCircle(17, 4, 5);
    graphics.fillCircle(27, 7, 5);
  } else if (appearance.hair === 3) {
    graphics.fillRect(27, 8, 4, 14);
    graphics.fillRect(7, 8, 4, 14);
  } else if (appearance.hair === 4) {
    graphics.fillRect(4, 14, 5, 12);
    graphics.fillRect(29, 14, 5, 12);
    graphics.fillRect(3, 23, 7, 4);
    graphics.fillRect(28, 23, 7, 4);
  } else if (appearance.hair === 5) {
    graphics.fillRect(15, 0, 7, 7);
    graphics.fillRect(12, 2, 13, 4);
  }

  graphics.fillStyle(0x2f2b3a, 1);
  graphics.fillRect(12, 13, 2, 3);
  graphics.fillRect(23, 13, 2, 3);
  graphics.fillRect(17, 19, 4, 1);
  graphics.fillStyle(0xe88988, 0.7);
  graphics.fillRect(9, 17, 3, 2);
  graphics.fillRect(26, 17, 3, 2);

  if (appearance.accessory === 1) {
    graphics.fillStyle(0xd33f49, 1);
    graphics.fillRect(6, 2, 25, 6);
    graphics.fillRect(27, 7, 8, 3);
  } else if (appearance.accessory === 2) {
    graphics.lineStyle(2, 0x3a3153, 1);
    graphics.strokeCircle(13, 15, 4);
    graphics.strokeCircle(24, 15, 4);
    graphics.lineBetween(17, 15, 20, 15);
  } else if (appearance.accessory === 3) {
    [9, 14, 19, 24, 29].forEach((x, index) => {
      graphics.fillStyle(index % 2 === 0 ? 0xf27b83 : 0xffd75e, 1);
      graphics.fillCircle(x, 5, 3);
      graphics.fillStyle(0xfff4c5, 1);
      graphics.fillCircle(x, 5, 1);
    });
  } else if (appearance.accessory === 4) {
    graphics.fillStyle(0x41385c, 1);
    graphics.fillRect(5, 10, 4, 10);
    graphics.fillRect(29, 10, 4, 10);
    graphics.lineStyle(3, 0x41385c, 1);
    graphics.beginPath();
    graphics.arc(19, 12, 13, Math.PI, Math.PI * 2);
    graphics.strokePath();
  } else if (appearance.accessory === 5) {
    graphics.fillStyle(0xf8d45d, 1);
    graphics.fillTriangle(12, 21, 25, 21, 19, 29);
  } else if (appearance.accessory === 6) {
    graphics.fillStyle(hair, 1);
    graphics.fillTriangle(7, 5, 11, 0, 16, 6);
    graphics.fillTriangle(23, 6, 29, 0, 32, 6);
    graphics.fillStyle(0xf4a8b8, 1);
    graphics.fillTriangle(9, 5, 11, 2, 14, 6);
    graphics.fillTriangle(25, 6, 29, 2, 30, 6);
  }
}

export function createPlayerTexture(
  scene: Phaser.Scene,
  appearance: CharacterAppearance,
  key = "player",
): void {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  const graphics = scene.add.graphics();
  drawPlayer(graphics, appearance);
  graphics.generateTexture(key, 36, 48);
  graphics.destroy();
}

function drawTownNpc(
  graphics: Phaser.GameObjects.Graphics,
  skin: number,
  hair: number,
  outfit: number,
  accent: number,
  accessory: "none" | "hat" | "apron" | "headphones" | "uniform" = "none",
): void {
  graphics.fillStyle(0x2d2b3c, 0.2);
  graphics.fillEllipse(18, 43, 27, 7);
  graphics.fillStyle(0x343047, 1);
  graphics.fillRect(8, 37, 8, 6);
  graphics.fillRect(21, 37, 8, 6);
  graphics.fillStyle(outfit, 1);
  graphics.fillRoundedRect(6, 20, 25, 18, 4);
  graphics.fillRect(3, 23, 5, 11);
  graphics.fillRect(29, 23, 5, 11);
  graphics.fillStyle(skin, 1);
  graphics.fillRect(4, 32, 4, 4);
  graphics.fillRect(29, 32, 4, 4);
  graphics.fillRoundedRect(8, 6, 20, 17, 5);
  graphics.fillStyle(hair, 1);
  graphics.fillRect(7, 4, 22, 7);
  graphics.fillRect(7, 9, 4, 8);
  graphics.fillStyle(0x2f2b3a, 1);
  graphics.fillRect(12, 13, 2, 3);
  graphics.fillRect(22, 13, 2, 3);
  graphics.fillRect(16, 19, 5, 1);
  graphics.fillStyle(accent, 1);
  graphics.fillRect(10, 25, 16, 4);
  if (accessory === "hat") {
    graphics.fillStyle(accent, 1);
    graphics.fillRect(5, 3, 27, 5);
    graphics.fillRect(24, 8, 10, 3);
  } else if (accessory === "apron") {
    graphics.fillStyle(0xfff1ca, 1);
    graphics.fillRect(11, 22, 14, 15);
    graphics.fillStyle(accent, 1);
    graphics.fillRect(14, 29, 8, 5);
  } else if (accessory === "headphones") {
    graphics.lineStyle(3, accent, 1);
    graphics.beginPath();
    graphics.arc(18, 13, 13, Math.PI, Math.PI * 2);
    graphics.strokePath();
    graphics.fillStyle(accent, 1);
    graphics.fillRect(5, 12, 4, 9);
    graphics.fillRect(27, 12, 4, 9);
  } else if (accessory === "uniform") {
    graphics.fillStyle(0xf0d069, 1);
    graphics.fillRect(24, 24, 4, 4);
    graphics.fillStyle(accent, 1);
    graphics.fillRect(8, 2, 20, 6);
    graphics.fillRect(5, 7, 26, 3);
  }
}

export function createPlaceholderTextures(scene: Phaser.Scene): void {
  createTexture(scene, "tile-grass", 32, 32, (graphics) => {
    graphics.fillStyle(0x8fd37a, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x83c76e, 1);
    graphics.fillRect(0, 0, 16, 16);
    graphics.fillRect(16, 16, 16, 16);
    graphics.fillStyle(0x6caf63, 0.8);
    graphics.fillRect(5, 8, 2, 5);
    graphics.fillRect(7, 10, 2, 3);
    graphics.fillRect(25, 22, 2, 4);
    graphics.fillRect(12, 27, 2, 3);
  });
  createTexture(scene, "tile-grass-flowers", 32, 32, (graphics) => {
    graphics.fillStyle(0x8fd37a, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x76bd69, 1);
    graphics.fillRect(0, 16, 16, 16);
    graphics.fillRect(16, 0, 16, 16);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(6, 8, 2, 2);
    graphics.fillRect(10, 8, 2, 2);
    graphics.fillRect(8, 6, 2, 2);
    graphics.fillRect(8, 10, 2, 2);
    graphics.fillStyle(0xf5c84f, 1);
    graphics.fillRect(8, 8, 2, 2);
    graphics.fillStyle(0xee7d98, 1);
    graphics.fillRect(23, 23, 3, 3);
  });
  createTexture(scene, "tile-grass-soft", 32, 32, (graphics) => {
    graphics.fillStyle(0x88cf76, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x91d67e, 1);
    graphics.fillRect(0, 0, 16, 16);
    graphics.fillRect(16, 16, 16, 16);
    graphics.fillStyle(0x6fb765, 0.9);
    ([[4, 23], [13, 8], [24, 13], [28, 27]] as const).forEach(([x, y]) => {
      graphics.fillRect(x, y, 2, 5);
      graphics.fillRect(x + 2, y + 2, 2, 3);
    });
    graphics.fillStyle(0xb8e79b, 0.85);
    graphics.fillRect(7, 5, 3, 2);
    graphics.fillRect(19, 25, 4, 2);
  });
  createTexture(scene, "tile-grass-clover", 32, 32, (graphics) => {
    graphics.fillStyle(0x83c971, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x79bd69, 0.85);
    graphics.fillRect(16, 0, 16, 16);
    graphics.fillRect(0, 16, 16, 16);
    ([[8, 9], [24, 23]] as const).forEach(([x, y]) => {
      graphics.fillStyle(0x5fae61, 1);
      graphics.fillRect(x, y + 3, 2, 6);
      graphics.fillCircle(x - 2, y + 2, 3);
      graphics.fillCircle(x + 3, y + 2, 3);
      graphics.fillCircle(x, y - 1, 3);
      graphics.fillStyle(0xa7dc88, 1);
      graphics.fillRect(x, y + 1, 1, 2);
    });
  });
  createTexture(scene, "tile-plaza", 32, 32, (graphics) => {
    graphics.fillStyle(0xead8a4, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.lineStyle(1, 0xcbb681, 1);
    graphics.strokeRect(0, 0, 32, 32);
    graphics.lineBetween(0, 16, 32, 16);
    graphics.lineBetween(16, 0, 16, 16);
    graphics.fillStyle(0xf3e5bd, 0.75);
    graphics.fillRect(3, 3, 10, 2);
    graphics.fillRect(19, 19, 8, 2);
  });
  createTexture(scene, "tile-plaza-alt", 32, 32, (graphics) => {
    graphics.fillStyle(0xe3ce95, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.lineStyle(1, 0xc3aa72, 1);
    graphics.strokeRect(0, 0, 32, 32);
    graphics.lineBetween(0, 16, 32, 16);
    graphics.lineBetween(8, 0, 8, 16);
    graphics.lineBetween(24, 16, 24, 32);
  });
  createTexture(scene, "tile-plaza-aged", 32, 32, (graphics) => {
    graphics.fillStyle(0xe8d59f, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0xf2e4ba, 1);
    graphics.fillRect(2, 2, 28, 12);
    graphics.fillRect(2, 18, 28, 12);
    graphics.lineStyle(1, 0xc9b17a, 0.9);
    graphics.strokeRect(0, 0, 32, 16);
    graphics.strokeRect(0, 16, 32, 16);
    graphics.lineStyle(1, 0xbda66f, 0.65);
    graphics.lineBetween(6, 16, 12, 11);
    graphics.lineBetween(12, 11, 17, 13);
    graphics.fillStyle(0xd7c28f, 0.75);
    graphics.fillRect(24, 4, 4, 2);
    graphics.fillRect(5, 23, 7, 2);
  });
  createTexture(scene, "tile-plaza-mosaic", 32, 32, (graphics) => {
    graphics.fillStyle(0xddca94, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0xeadcab, 1);
    graphics.fillRect(2, 2, 13, 13);
    graphics.fillRect(17, 17, 13, 13);
    graphics.fillStyle(0xd4bc83, 1);
    graphics.fillRect(17, 2, 13, 13);
    graphics.fillRect(2, 17, 13, 13);
    graphics.lineStyle(1, 0xbca36e, 0.9);
    graphics.strokeRect(0, 0, 32, 32);
    graphics.lineBetween(16, 0, 16, 32);
    graphics.lineBetween(0, 16, 32, 16);
    graphics.fillStyle(0xf5e8bd, 0.8);
    graphics.fillRect(4, 4, 7, 2);
    graphics.fillRect(20, 20, 7, 2);
  });
  createTexture(scene, "tile-plaza-inlay", 32, 32, (graphics) => {
    graphics.fillStyle(0xd6bf86, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0xa9b9a0, 1);
    graphics.fillRect(0, 13, 32, 6);
    graphics.fillRect(13, 0, 6, 32);
    graphics.fillStyle(0x6f9a8c, 1);
    graphics.fillRect(14, 14, 4, 4);
    graphics.lineStyle(1, 0xb39a69, 1);
    graphics.strokeRect(0, 0, 32, 32);
    graphics.fillStyle(0xead9a5, 1);
    graphics.fillRect(3, 3, 8, 2);
    graphics.fillRect(21, 27, 8, 2);
  });
  createTexture(scene, "tree", 44, 58, (graphics) => {
    graphics.fillStyle(0x31463d, 0.22);
    graphics.fillEllipse(22, 53, 30, 8);
    graphics.fillStyle(0x5a3f2d, 1);
    graphics.fillRect(18, 31, 9, 22);
    graphics.fillStyle(0x8b6241, 1);
    graphics.fillRect(20, 32, 3, 19);
    graphics.fillStyle(0x257654, 1);
    graphics.fillCircle(22, 21, 20);
    graphics.fillCircle(11, 24, 10);
    graphics.fillCircle(34, 24, 10);
    graphics.fillStyle(0x45a765, 1);
    graphics.fillCircle(14, 14, 10);
    graphics.fillCircle(28, 12, 11);
    graphics.fillStyle(0x73c878, 1);
    graphics.fillCircle(10, 11, 5);
    graphics.fillCircle(25, 7, 5);
    graphics.fillStyle(0xf1c653, 1);
    graphics.fillCircle(14, 25, 2);
    graphics.fillCircle(31, 20, 2);
  });
  createTexture(scene, "tree-birch", 44, 60, (graphics) => {
    graphics.fillStyle(0x31463d, 0.2);
    graphics.fillEllipse(22, 55, 31, 8);
    graphics.fillStyle(0xe9e2cf, 1);
    graphics.fillRect(18, 28, 9, 27);
    graphics.fillStyle(0x74675d, 1);
    graphics.fillRect(19, 34, 5, 2);
    graphics.fillRect(22, 44, 5, 2);
    graphics.fillRect(18, 51, 4, 2);
    graphics.fillStyle(0x3a8c59, 1);
    graphics.fillCircle(22, 19, 18);
    graphics.fillCircle(10, 24, 10);
    graphics.fillCircle(34, 24, 10);
    graphics.fillStyle(0x63b96b, 1);
    graphics.fillCircle(14, 13, 9);
    graphics.fillCircle(29, 11, 10);
    graphics.fillCircle(34, 19, 8);
    graphics.fillStyle(0x9bd882, 1);
    graphics.fillCircle(11, 10, 4);
    graphics.fillCircle(26, 7, 5);
    graphics.fillRect(32, 13, 4, 3);
  });
  createTexture(scene, "tree-flowering", 48, 59, (graphics) => {
    graphics.fillStyle(0x31463d, 0.2);
    graphics.fillEllipse(24, 54, 34, 8);
    graphics.fillStyle(0x72513c, 1);
    graphics.fillRect(20, 31, 8, 23);
    graphics.lineStyle(3, 0x72513c, 1);
    graphics.lineBetween(23, 38, 13, 27);
    graphics.lineBetween(26, 37, 36, 25);
    graphics.fillStyle(0x2f8054, 1);
    graphics.fillCircle(23, 21, 19);
    graphics.fillCircle(10, 25, 11);
    graphics.fillCircle(38, 24, 10);
    graphics.fillStyle(0x54a964, 1);
    graphics.fillCircle(15, 14, 10);
    graphics.fillCircle(31, 13, 11);
    graphics.fillStyle(0xf28ba6, 1);
    ([[9, 20], [17, 9], [25, 20], [34, 10], [39, 24]] as const).forEach(([x, y]) => {
      graphics.fillCircle(x, y, 3);
      graphics.fillStyle(0xffefb3, 1);
      graphics.fillCircle(x, y, 1);
      graphics.fillStyle(0xf28ba6, 1);
    });
  });
  createTexture(scene, "rudi", 42, 40, (graphics) => {
    graphics.fillStyle(0x2d2b3c, 0.22);
    graphics.fillEllipse(20, 36, 31, 7);
    graphics.fillStyle(0x68707c, 1);
    graphics.fillCircle(19, 20, 15);
    graphics.fillStyle(0x343b48, 1);
    graphics.fillTriangle(7, 10, 11, 0, 17, 10);
    graphics.fillTriangle(22, 10, 28, 0, 32, 11);
    graphics.fillStyle(0xe3d8c6, 1);
    graphics.fillRoundedRect(7, 14, 24, 11, 5);
    graphics.fillStyle(0x252936, 1);
    graphics.fillRoundedRect(8, 13, 9, 8, 3);
    graphics.fillRoundedRect(22, 13, 9, 8, 3);
    graphics.fillRect(17, 23, 5, 4);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(12, 15, 3, 3);
    graphics.fillRect(25, 15, 3, 3);
    graphics.fillStyle(0x252936, 1);
    graphics.fillRect(13, 16, 1, 2);
    graphics.fillRect(26, 16, 1, 2);
    graphics.fillStyle(0x68707c, 1);
    graphics.fillRoundedRect(29, 24, 12, 7, 3);
    graphics.fillStyle(0x343b48, 1);
    graphics.fillRect(32, 24, 3, 7);
    graphics.fillRect(38, 25, 3, 5);
    graphics.fillStyle(0xe88988, 0.75);
    graphics.fillRect(7, 22, 4, 2);
    graphics.fillRect(28, 22, 4, 2);
  });
  createTexture(scene, "mayor", 32, 44, (graphics) => {
    graphics.fillStyle(0x2d2b3c, 0.2);
    graphics.fillEllipse(16, 41, 24, 6);
    graphics.fillStyle(0x2f315f, 1);
    graphics.fillRect(8, 35, 6, 7);
    graphics.fillRect(19, 35, 6, 7);
    graphics.fillStyle(0x834bb3, 1);
    graphics.fillRect(6, 19, 21, 18);
    graphics.fillStyle(0xf2c7a1, 1);
    graphics.fillRect(8, 6, 17, 15);
    graphics.fillStyle(0xbfd0d7, 1);
    graphics.fillRect(6, 3, 21, 7);
    graphics.fillRect(5, 8, 5, 12);
    graphics.fillStyle(0x2f2b3a, 1);
    graphics.fillRect(11, 12, 2, 2);
    graphics.fillRect(20, 12, 2, 2);
    graphics.fillStyle(0xffd76f, 1);
    graphics.fillRect(15, 24, 3, 3);
    graphics.fillRect(15, 30, 3, 3);
    graphics.fillStyle(0xf3f0da, 1);
    graphics.fillTriangle(12, 19, 21, 19, 16, 25);
  });
  createTexture(scene, "mia", 32, 42, (graphics) => {
    graphics.fillStyle(0x2d2b3c, 0.2);
    graphics.fillEllipse(16, 40, 24, 6);
    graphics.fillStyle(0x3b3152, 1);
    graphics.fillRect(7, 34, 7, 7);
    graphics.fillRect(19, 34, 7, 7);
    graphics.fillStyle(0xdb4e78, 1);
    graphics.fillRect(6, 19, 21, 17);
    graphics.fillStyle(0xf2bf9b, 1);
    graphics.fillRect(8, 7, 17, 14);
    graphics.fillStyle(0x7541a6, 1);
    graphics.fillRect(6, 3, 21, 8);
    graphics.fillRect(5, 9, 5, 13);
    graphics.fillStyle(0x29263a, 1);
    graphics.fillRect(11, 13, 2, 2);
    graphics.fillRect(20, 13, 2, 2);
    graphics.fillStyle(0xffdf62, 1);
    graphics.fillRect(14, 24, 5, 5);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(15, 25, 3, 1);
    graphics.fillStyle(0xe6818f, 0.75);
    graphics.fillRect(8, 17, 3, 2);
    graphics.fillRect(23, 17, 3, 2);
  });
  createTexture(scene, "broemmel", 34, 44, (graphics) => {
    graphics.fillStyle(0x2d2b3c, 0.2);
    graphics.fillEllipse(17, 42, 26, 6);
    graphics.fillStyle(0x45405a, 1);
    graphics.fillRect(8, 36, 7, 7);
    graphics.fillRect(20, 36, 7, 7);
    graphics.fillStyle(0x77a6bd, 1);
    graphics.fillRect(5, 18, 25, 20);
    graphics.fillStyle(0xf0c5a4, 1);
    graphics.fillRect(9, 6, 17, 15);
    graphics.fillStyle(0xb5b5bc, 1);
    graphics.fillRect(8, 3, 19, 6);
    graphics.fillStyle(0x34303f, 1);
    graphics.fillRect(12, 12, 2, 2);
    graphics.fillRect(21, 12, 2, 2);
    graphics.fillRect(14, 18, 8, 2);
    graphics.fillStyle(0xf1efe2, 1);
    graphics.fillRect(15, 19, 6, 3);
    graphics.fillStyle(0x40556a, 1);
    graphics.fillRect(9, 26, 16, 2);
  });
  createTexture(scene, "nora", 32, 42, (graphics) => {
    graphics.fillStyle(0x2d2b3c, 0.2);
    graphics.fillEllipse(16, 40, 24, 6);
    graphics.fillStyle(0x38493c, 1);
    graphics.fillRect(7, 34, 7, 7);
    graphics.fillRect(19, 34, 7, 7);
    graphics.fillStyle(0x3ca36a, 1);
    graphics.fillRect(6, 19, 21, 17);
    graphics.fillStyle(0xe9b98e, 1);
    graphics.fillRect(8, 7, 17, 14);
    graphics.fillStyle(0x553b2d, 1);
    graphics.fillRect(6, 3, 21, 8);
    graphics.fillRect(22, 8, 6, 17);
    graphics.fillStyle(0x29263a, 1);
    graphics.fillRect(11, 13, 2, 2);
    graphics.fillRect(20, 13, 2, 2);
    graphics.fillStyle(0xf1c94f, 1);
    graphics.fillCircle(9, 6, 2);
    graphics.fillCircle(15, 5, 2);
    graphics.fillCircle(21, 6, 2);
    graphics.fillStyle(0xd8f1c2, 1);
    graphics.fillRect(14, 24, 5, 6);
    graphics.fillStyle(0x3ca36a, 1);
    graphics.fillRect(16, 23, 1, 8);
  });
  createTexture(scene, "centner", 32, 42, (graphics) => {
    graphics.fillStyle(0x2d2b3c, 0.2);
    graphics.fillEllipse(16, 40, 24, 6);
    graphics.fillStyle(0x32344e, 1);
    graphics.fillRect(7, 34, 7, 7);
    graphics.fillRect(19, 34, 7, 7);
    graphics.fillStyle(0x6d7d94, 1);
    graphics.fillRect(6, 19, 21, 17);
    graphics.fillStyle(0xeee0ca, 1);
    graphics.fillRect(8, 7, 17, 14);
    graphics.fillStyle(0x8d8b91, 1);
    graphics.fillRect(7, 3, 19, 6);
    graphics.fillStyle(0x29263a, 1);
    graphics.fillRect(11, 13, 2, 2);
    graphics.fillRect(20, 13, 2, 2);
    graphics.lineStyle(1, 0x29263a, 1);
    graphics.strokeRect(9, 11, 6, 5);
    graphics.strokeRect(18, 11, 6, 5);
    graphics.fillStyle(0xf1efe2, 1);
    graphics.fillRect(14, 19, 5, 8);
    graphics.fillStyle(0x8d4660, 1);
    graphics.fillTriangle(14, 20, 19, 20, 17, 27);
    graphics.fillStyle(0xf4d15d, 1);
    graphics.fillRect(24, 25, 3, 3);
  });
  createTexture(scene, "npc-gardener", 36, 46, (graphics) =>
    drawTownNpc(graphics, 0xe2ad82, 0x9b866f, 0x5d8d6c, 0xf2c85b, "hat"),
  );
  createTexture(scene, "npc-jogger", 36, 46, (graphics) =>
    drawTownNpc(graphics, 0xd89a68, 0x382f36, 0xe86c6c, 0xffdd68),
  );
  createTexture(scene, "npc-technician", 36, 46, (graphics) =>
    drawTownNpc(graphics, 0xefbf96, 0x49352f, 0x477293, 0xf4c95d, "uniform"),
  );
  createTexture(scene, "npc-musician", 36, 46, (graphics) =>
    drawTownNpc(graphics, 0xf0ba91, 0xd85f8c, 0x7554a3, 0x5bd1bb, "headphones"),
  );
  createTexture(scene, "npc-clerk", 36, 46, (graphics) =>
    drawTownNpc(graphics, 0xe7b88e, 0x5a3d2e, 0x6c8299, 0xbadce1),
  );
  createTexture(scene, "npc-guard", 36, 46, (graphics) =>
    drawTownNpc(graphics, 0xd7a17c, 0x3b302e, 0x3f557d, 0x293650, "uniform"),
  );
  createTexture(scene, "npc-purple", 36, 46, (graphics) =>
    drawTownNpc(graphics, 0xdfaa83, 0xd8d0c7, 0x8b65b5, 0xf3c95d),
  );
  createTexture(scene, "npc-green", 36, 46, (graphics) =>
    drawTownNpc(graphics, 0x8f5b42, 0x263143, 0x4f9369, 0xf4d36a),
  );
  createTexture(scene, "npc-red", 36, 46, (graphics) =>
    drawTownNpc(graphics, 0xf0c09a, 0x6a3f31, 0xc95366, 0x74cbb3, "apron"),
  );
  for (let index = 0; index < 12; index += 1) {
    createTexture(scene, `festival-guest-${index}`, 36, 48, (graphics) =>
      drawPlayer(graphics, {
        skin: index % 5,
        hair: (index * 5 + 1) % 6,
        hairColor: (index * 3 + 2) % 6,
        top: (index * 4 + 1) % 7,
        bottom: (index * 3 + 2) % 5,
        accessory: index % 4 === 0 ? 3 : index % 4 === 1 ? 4 : index % 6 === 2 ? 2 : 0,
      }),
    );
  }
  createTexture(scene, "quest-coin", 20, 20, (graphics) => {
    graphics.fillStyle(0x6b4c39, 0.2); graphics.fillEllipse(10, 17, 17, 4);
    graphics.fillStyle(0xb97535, 1); graphics.fillCircle(10, 9, 9);
    graphics.fillStyle(0xffd45d, 1); graphics.fillCircle(10, 8, 7);
    graphics.lineStyle(2, 0xffef9a, 1); graphics.strokeCircle(10, 8, 4);
    graphics.fillStyle(0xc98b32, 1); graphics.fillRect(9, 4, 2, 8);
  });
  createTexture(scene, "quest-receipt", 22, 28, (graphics) => {
    graphics.fillStyle(0x49364c, 0.18); graphics.fillEllipse(11, 25, 18, 4);
    graphics.fillStyle(0xfff7dc, 1); graphics.fillRect(2, 1, 18, 23);
    graphics.fillStyle(0xd85f8c, 1); graphics.fillRect(2, 1, 18, 5);
    graphics.fillStyle(0x708695, 1);
    graphics.fillRect(5, 9, 12, 2); graphics.fillRect(5, 13, 9, 2); graphics.fillRect(5, 17, 12, 2);
    graphics.fillStyle(0xf2c85b, 1); graphics.fillRect(14, 20, 3, 2);
  });
  createTexture(scene, "trash-bin", 34, 42, (graphics) => {
    graphics.fillStyle(0x3f7e65, 1);
    graphics.fillRect(4, 8, 26, 32);
    graphics.fillStyle(0x2b5748, 1);
    graphics.fillRect(1, 5, 32, 7);
    graphics.fillStyle(0xd5e7bf, 1);
    graphics.fillRect(12, 18, 10, 11);
  });
  createTexture(scene, "plastic-cup", 18, 20, (graphics) => {
    graphics.fillStyle(0xf4f0dc, 1);
    graphics.fillRect(4, 4, 10, 14);
    graphics.fillStyle(0xd75656, 1);
    graphics.fillRect(3, 2, 12, 4);
    graphics.fillRect(5, 10, 8, 3);
  });
  createTexture(scene, "pizza-box", 30, 20, (graphics) => {
    graphics.fillStyle(0xc98d53, 1);
    graphics.fillRect(1, 3, 28, 15);
    graphics.lineStyle(2, 0x75472f, 1);
    graphics.strokeRect(1, 3, 28, 15);
    graphics.lineBetween(2, 4, 28, 17);
  });
  createTexture(scene, "flower-patch", 30, 18, (graphics) => {
    graphics.fillStyle(0x4d9b5d, 1);
    graphics.fillRect(4, 9, 2, 8);
    graphics.fillRect(14, 6, 2, 11);
    graphics.fillRect(24, 9, 2, 8);
    const colors = [0xff7994, 0xffd45d, 0xb886db];
    [5, 15, 25].forEach((x, index) => {
      graphics.fillStyle(colors[index] ?? 0xff7994, 1);
      graphics.fillCircle(x, index === 1 ? 6 : 9, 4);
      graphics.fillStyle(0xfff5c2, 1);
      graphics.fillCircle(x, index === 1 ? 6 : 9, 1.5);
    });
  });
  createTexture(scene, "flower-patch-blue", 32, 19, (graphics) => {
    graphics.fillStyle(0x438d58, 1);
    [5, 12, 20, 27].forEach((x, index) => {
      graphics.fillRect(x, 8 + (index % 2) * 2, 2, 9 - (index % 2) * 2);
      graphics.fillStyle(index % 2 === 0 ? 0x7a9ce3 : 0xf2a2c0, 1);
      graphics.fillCircle(x + 1, 7 + (index % 2) * 2, 3);
      graphics.fillStyle(0xffe8a0, 1);
      graphics.fillCircle(x + 1, 7 + (index % 2) * 2, 1);
      graphics.fillStyle(0x438d58, 1);
    });
  });
  createTexture(scene, "bush", 42, 28, (graphics) => {
    graphics.fillStyle(0x2f744f, 1);
    graphics.fillCircle(11, 17, 10);
    graphics.fillCircle(22, 12, 13);
    graphics.fillCircle(34, 17, 9);
    graphics.fillStyle(0x55a960, 1);
    graphics.fillCircle(16, 11, 7);
    graphics.fillCircle(30, 11, 6);
    graphics.fillStyle(0xe96f8f, 1);
    graphics.fillCircle(10, 15, 2);
    graphics.fillCircle(32, 14, 2);
    graphics.fillStyle(0xffd75e, 1);
    graphics.fillCircle(22, 7, 2);
  });
  createTexture(scene, "bench", 52, 32, (graphics) => {
    graphics.fillStyle(0x3c3243, 0.2);
    graphics.fillEllipse(26, 29, 46, 6);
    graphics.fillStyle(0x76513c, 1);
    graphics.fillRect(6, 7, 40, 6);
    graphics.fillRect(6, 16, 40, 7);
    graphics.fillStyle(0x4b3740, 1);
    graphics.fillRect(10, 23, 5, 7);
    graphics.fillRect(37, 23, 5, 7);
    graphics.fillStyle(0xb97a50, 1);
    graphics.fillRect(8, 8, 36, 2);
    graphics.fillRect(8, 17, 36, 2);
  });
  createTexture(scene, "lamp", 22, 56, (graphics) => {
    graphics.fillStyle(0x2f3146, 0.18);
    graphics.fillEllipse(11, 53, 20, 5);
    graphics.fillStyle(0x4b4056, 1);
    graphics.fillRect(9, 16, 4, 36);
    graphics.fillRect(5, 49, 12, 4);
    graphics.fillStyle(0x4b4056, 1);
    graphics.fillRect(3, 7, 16, 11);
    graphics.fillStyle(0xffe78a, 1);
    graphics.fillRect(6, 9, 10, 7);
    graphics.fillStyle(0xfff4bd, 0.7);
    graphics.fillRect(8, 10, 4, 5);
    graphics.fillStyle(0x4b4056, 1);
    graphics.fillTriangle(2, 8, 11, 1, 20, 8);
  });
  createTexture(scene, "balloons", 34, 54, (graphics) => {
    graphics.lineStyle(1, 0x756047, 1);
    graphics.lineBetween(10, 19, 18, 52);
    graphics.lineBetween(24, 17, 18, 52);
    graphics.lineBetween(17, 25, 18, 52);
    graphics.fillStyle(0xf06c68, 1);
    graphics.fillEllipse(9, 11, 14, 19);
    graphics.fillStyle(0x6cc6a4, 1);
    graphics.fillEllipse(25, 10, 14, 19);
    graphics.fillStyle(0xf4ca57, 1);
    graphics.fillEllipse(17, 18, 14, 19);
    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillCircle(6, 7, 2);
    graphics.fillCircle(22, 6, 2);
    graphics.fillCircle(14, 14, 2);
  });
  createTexture(scene, "crate", 28, 26, (graphics) => {
    graphics.fillStyle(0x503c35, 0.2);
    graphics.fillEllipse(14, 24, 26, 5);
    graphics.fillStyle(0xb87948, 1);
    graphics.fillRect(2, 3, 24, 21);
    graphics.lineStyle(2, 0x76472f, 1);
    graphics.strokeRect(2, 3, 24, 21);
    graphics.lineBetween(4, 5, 24, 22);
    graphics.lineBetween(24, 5, 4, 22);
    graphics.fillStyle(0xe0a469, 1);
    graphics.fillRect(5, 6, 16, 2);
  });
  createTexture(scene, "barrel", 24, 31, (graphics) => {
    graphics.fillStyle(0x4a3640, 0.2);
    graphics.fillEllipse(12, 28, 22, 5);
    graphics.fillStyle(0x9b6542, 1);
    graphics.fillRoundedRect(3, 3, 18, 25, 6);
    graphics.fillStyle(0xcf8d54, 1);
    graphics.fillRect(6, 5, 5, 21);
    graphics.fillStyle(0x4f4151, 1);
    graphics.fillRect(2, 8, 20, 3);
    graphics.fillRect(2, 21, 20, 3);
  });
  createTexture(scene, "mailbox", 22, 38, (graphics) => {
    graphics.fillStyle(0x3a3448, 0.2);
    graphics.fillEllipse(11, 36, 20, 5);
    graphics.fillStyle(0x426d9b, 1);
    graphics.fillRoundedRect(2, 2, 18, 23, 5);
    graphics.fillStyle(0xb9dbeb, 1);
    graphics.fillRect(5, 7, 12, 3);
    graphics.fillStyle(0xf2c956, 1);
    graphics.fillRect(7, 14, 8, 6);
    graphics.fillStyle(0x51435d, 1);
    graphics.fillRect(9, 24, 4, 12);
  });
  createTexture(scene, "bike", 46, 28, (graphics) => {
    graphics.lineStyle(3, 0x39405a, 1);
    graphics.strokeCircle(10, 19, 8);
    graphics.strokeCircle(36, 19, 8);
    graphics.lineStyle(2, 0xd95f68, 1);
    graphics.lineBetween(10, 19, 21, 7);
    graphics.lineBetween(21, 7, 28, 19);
    graphics.lineBetween(28, 19, 10, 19);
    graphics.lineBetween(21, 7, 36, 19);
    graphics.lineBetween(18, 7, 24, 7);
    graphics.lineStyle(2, 0x39405a, 1);
    graphics.lineBetween(30, 6, 36, 19);
    graphics.lineBetween(28, 6, 34, 5);
  });
  createTexture(scene, "cat", 30, 24, (graphics) => {
    graphics.fillStyle(0x313243, 0.2);
    graphics.fillEllipse(15, 22, 26, 4);
    graphics.fillStyle(0xe59a4d, 1);
    graphics.fillRoundedRect(7, 9, 17, 12, 5);
    graphics.fillCircle(8, 9, 7);
    graphics.fillTriangle(2, 6, 5, 0, 9, 6);
    graphics.fillTriangle(8, 6, 12, 0, 14, 7);
    graphics.fillRoundedRect(22, 5, 7, 5, 2);
    graphics.fillStyle(0x34303f, 1);
    graphics.fillRect(5, 8, 2, 2);
    graphics.fillRect(10, 8, 2, 2);
    graphics.fillStyle(0xffe8a0, 1);
    graphics.fillRect(7, 12, 3, 1);
  });
  createTexture(scene, "park-dog", 34, 26, (graphics) => {
    graphics.fillStyle(0x31463d, 0.2);
    graphics.fillEllipse(17, 23, 29, 5);
    graphics.fillStyle(0xb87849, 1);
    graphics.fillRoundedRect(9, 10, 20, 12, 5);
    graphics.fillCircle(8, 12, 7);
    graphics.fillTriangle(3, 8, 4, 1, 10, 7);
    graphics.fillStyle(0xf0c17f, 1);
    graphics.fillRect(11, 13, 9, 4);
    graphics.fillRect(12, 19, 4, 5);
    graphics.fillRect(24, 19, 4, 5);
    graphics.fillStyle(0x3b3040, 1);
    graphics.fillRect(5, 10, 2, 2);
    graphics.fillRect(2, 14, 3, 2);
    graphics.lineStyle(3, 0xb87849, 1);
    graphics.beginPath();
    graphics.arc(29, 12, 7, -1.2, 0.5);
    graphics.strokePath();
    graphics.fillStyle(0x55b8a8, 1);
    graphics.fillRect(8, 16, 5, 2);
  });
  createTexture(scene, "dog-ball", 12, 12, (graphics) => {
    graphics.fillStyle(0x31463d, 0.2);
    graphics.fillEllipse(6, 10, 11, 3);
    graphics.fillStyle(0xf06f6b, 1);
    graphics.fillCircle(6, 6, 5);
    graphics.fillStyle(0xffd45d, 1);
    graphics.fillRect(4, 2, 3, 8);
  });
  createTexture(scene, "park-duck", 25, 19, (graphics) => {
    graphics.fillStyle(0x356f78, 0.22);
    graphics.fillEllipse(13, 17, 23, 4);
    graphics.fillStyle(0xf4d45f, 1);
    graphics.fillEllipse(13, 11, 19, 11);
    graphics.fillCircle(7, 6, 6);
    graphics.fillStyle(0xf08a4b, 1);
    graphics.fillTriangle(1, 7, 6, 5, 6, 9);
    graphics.fillStyle(0x2f2b3a, 1);
    graphics.fillRect(6, 4, 2, 2);
    graphics.fillStyle(0xffef9a, 1);
    graphics.fillEllipse(15, 9, 7, 4);
  });
  createTexture(scene, "picnic-blanket", 58, 40, (graphics) => {
    graphics.fillStyle(0x31463d, 0.16);
    graphics.fillEllipse(29, 36, 56, 7);
    graphics.fillStyle(0xf7e4bd, 1);
    graphics.fillRect(2, 2, 54, 32);
    graphics.fillStyle(0xe87482, 1);
    for (let y = 2; y < 34; y += 16) for (let x = 2; x < 56; x += 18) graphics.fillRect(x, y, 9, 8);
    for (let y = 10; y < 34; y += 16) for (let x = 11; x < 56; x += 18) graphics.fillRect(x, y, 9, 8);
    graphics.lineStyle(2, 0xc75b69, 1);
    graphics.strokeRect(2, 2, 54, 32);
  });
  createTexture(scene, "signpost", 34, 42, (graphics) => {
    graphics.fillStyle(0x493943, 0.18);
    graphics.fillEllipse(17, 40, 27, 5);
    graphics.fillStyle(0x76513c, 1);
    graphics.fillRect(15, 13, 5, 28);
    graphics.fillStyle(0xd69b59, 1);
    graphics.fillRoundedRect(1, 3, 31, 14, 3);
    graphics.fillStyle(0xffedb1, 1);
    graphics.fillTriangle(27, 7, 34, 10, 27, 14);
    graphics.fillStyle(0x614452, 1);
    graphics.fillRect(6, 8, 19, 3);
  });
  createTexture(scene, "cafe-table", 40, 34, (graphics) => {
    graphics.fillStyle(0x403848, 0.18);
    graphics.fillEllipse(20, 31, 38, 6);
    graphics.fillStyle(0xf7e7b5, 1);
    graphics.fillEllipse(20, 12, 30, 15);
    graphics.lineStyle(2, 0x7a5a4a, 1);
    graphics.strokeEllipse(20, 12, 30, 15);
    graphics.fillStyle(0x6b4b42, 1);
    graphics.fillRect(18, 18, 4, 13);
    graphics.fillRect(11, 29, 18, 3);
    graphics.fillStyle(0x6cc6a4, 1);
    graphics.fillRect(17, 7, 6, 6);
  });
}
