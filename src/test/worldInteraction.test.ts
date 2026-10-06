import { describe, expect, it, vi } from "vitest";
import { InteractionSystem } from "../systems/InteractionSystem";
import { FestivalEndConfirmation } from "../ui/FestivalEndConfirmation";

vi.mock("phaser", () => ({ default: {
  Math: { Distance: { Between: (x: number, y: number, a: number, b: number) => Math.hypot(x - a, y - b) } },
  Input: { Keyboard: { KeyCodes: { ONE: 49, TWO: 50, ESC: 27, E: 69, ENTER: 13, SPACE: 32 },
    JustDown: (key: { pressed: boolean }) => { const down = key.pressed; key.pressed = false; return down; } } },
} }));

function uiScene() {
  const objects: Array<Record<string, any>> = [];
  const keys = new Map<number, { isUp: boolean; pressed: boolean }>();
  const create = () => {
    const object: Record<string, any> = { visible: true };
    for (const name of ["setOrigin", "setDepth", "setScrollFactor", "setStrokeStyle", "setInteractive"]) object[name] = () => object;
    object.setVisible = (visible: boolean) => { object.visible = visible; return object; };
    object.setPosition = (x: number, y: number) => { object.x = x; object.y = y; return object; };
    object.on = vi.fn(() => object);
    objects.push(object);
    return object;
  };
  return { objects, keys, scene: {
    add: { text: create, rectangle: create, container: create },
    input: { keyboard: { addKey: (code: number) => {
      if (!keys.has(code)) keys.set(code, { isUp: true, pressed: false });
      return keys.get(code);
    } } },
  } };
}

describe("visible interaction target", () => {
  it("marks the target that E will use, respecting priority, and removes stale targets", () => {
    const { scene, objects } = uiScene();
    const system = new InteractionSystem(scene as never);
    const speak = vi.fn();
    let enabled = true;
    system.register({ id: "npc", displayName: "NPC", object: { x: 20, y: 0, visible: true } as never, range: 80, enabled: () => true, interact: speak });
    system.register({ id: "door", displayName: "Tür", object: { x: 50, y: 0, visible: true } as never, range: 80, priority: 5, enabled: () => enabled, interact: speak });
    system.update({ x: 0, y: 0 } as never);
    expect(system.selected?.id).toBe("door");
    expect(objects[0]).toMatchObject({ visible: true, x: 50 });
    enabled = false;
    expect(system.interact()).toBe(false);
    expect(speak).not.toHaveBeenCalled();
    expect(objects[0]?.visible).toBe(false);
    system.update({ x: 0, y: 0 } as never);
    expect(system.interact()).toBe(true);
    expect(speak).toHaveBeenCalledOnce();
    expect(system.selected).toBeUndefined();
    system.update({ x: 300, y: 300 } as never);
    expect(objects[0]?.visible).toBe(false);
  });
});

describe("festival ending confirmation", () => {
  it("requires a fresh explicit confirmation and lets the player cancel without ending", () => {
    const { scene, keys } = uiScene();
    const modal = new FestivalEndConfirmation(scene as never);
    const finish = vi.fn();
    keys.get(50)!.isUp = false;
    keys.get(50)!.pressed = true;
    modal.show(finish);
    modal.update();
    expect(modal.isOpen).toBe(true);
    expect(finish).not.toHaveBeenCalled();
    for (const key of keys.values()) { key.isUp = true; key.pressed = false; }
    modal.update();
    keys.get(27)!.isUp = false;
    keys.get(27)!.pressed = true;
    modal.update();
    expect(modal.isOpen).toBe(false);
    expect(finish).not.toHaveBeenCalled();
    for (const key of keys.values()) { key.isUp = true; key.pressed = false; }
    modal.show(finish);
    modal.update();
    keys.get(69)!.pressed = true;
    modal.update();
    expect(modal.isOpen).toBe(true);
    keys.get(50)!.isUp = false;
    keys.get(50)!.pressed = true;
    modal.update();
    modal.update();
    expect(modal.isOpen).toBe(false);
    expect(finish).toHaveBeenCalledOnce();
  });
});
