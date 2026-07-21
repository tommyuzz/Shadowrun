import { describe, expect, it } from "vitest";
import { loadData } from "./data";
import { equipmentEnhancementsFor, weaponsForSupport } from "./relations";

describe("relationship behavior contract", () => {
  it("keeps every generated weapon-support and equipment-enhancement relationship unchanged", async () => {
    const weaponData = await loadData("weapons");
    const equipmentData = await loadData("equipment");

    const weaponSupport = Object.fromEntries(
      weaponData.records
        .filter((record) => record.category === "Weapon Support")
        .map((support) => [support.id, weaponsForSupport(support, weaponData).map((weapon) => weapon.id)])
    );
    const equipmentEnhancements = Object.fromEntries(
      equipmentData.records.map((equipment) => [equipment.id, equipmentEnhancementsFor(equipment, equipmentData).map((enhancement) => enhancement.id)])
    );

    expect({ weaponSupport, equipmentEnhancements }).toMatchSnapshot();
  });
});
