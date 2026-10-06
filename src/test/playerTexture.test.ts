import Phaser from "phaser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Player } from "../characters/Player";
import { gameState } from "../state/GameState";

vi.mock("phaser", () => ({
  default: {
    Physics: { Arcade: { Sprite: class {
      constructor(scene: Phaser.Scene, _x: number, _y: number, key: string) {
        if (!scene.textures.exists(key)) throw new Error(`Missing sprite texture: ${key}`);
      }
      setCollideWorldBounds() { return this; }
      setDepth() { return this; }
      setOrigin() { return this; }
    } } },
    Math: { Vector2: class { constructor(public x: number, public y: number) {} } },
    Input: { Keyboard: { KeyCodes: { W: 87, A: 65, S: 83, D: 68, Q: 81 } } },
  },
}));

function sceneWithTextures(textures = new Set<string>()) {
  const fillStyle = vi.fn();
  const graphics = new Proxy({
    fillStyle,
    generateTexture: vi.fn((key: string) => textures.add(key)),
    destroy: vi.fn(),
  }, { get: (target, property) => Reflect.get(target, property) ?? vi.fn() });
  const scene = {
    textures: { exists: (key: string) => textures.has(key), remove: (key: string) => textures.delete(key) },
    add: { graphics: () => graphics, existing: vi.fn() },
    physics: { add: { existing: vi.fn() } },
    input: { keyboard: { createCursorKeys: () => ({}), addKeys: () => ({}), addKey: () => ({}) } },
  } as unknown as Phaser.Scene;
  return { scene, textures, graphics, fillStyle };
}

describe("player texture on direct map entry", () => {
  beforeEach(() => gameState.resetRun());

  it("creates the selected look before constructing a sprite without a previous TownScene", () => {
    gameState.setAppearance({ skin: 4, hair: 3, hairColor: 4, top: 1, bottom: 2, accessory: 0 });
    const { scene, textures, graphics, fillStyle } = sceneWithTextures();
    expect(() => new Player(scene, 930, 540, "player")).not.toThrow();
    expect(textures.has("player")).toBe(true);
    expect(graphics.generateTexture).toHaveBeenCalledWith("player", 36, 48);
    expect(fillStyle).toHaveBeenCalledWith(0x68402f, 1);
    expect(fillStyle).toHaveBeenCalledWith(0x39b7a4, 1);
    expect(fillStyle).toHaveBeenCalledWith(0x8d5bb3, 1);
    expect(graphics.destroy).toHaveBeenCalledOnce();
  });

  it("replaces an existing texture when another run uses a different look", () => {
    const textures = new Set(["player"]);
    const { scene, fillStyle } = sceneWithTextures(textures);
    gameState.setAppearance({ skin: 0, hair: 0, hairColor: 0, top: 0, bottom: 4, accessory: 0 });
    new Player(scene, 480, 468, "player");
    expect(fillStyle).toHaveBeenCalledWith(0x51446f, 1);
    expect(textures.has("player")).toBe(true);
  });
});
