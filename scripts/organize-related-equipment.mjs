import { readFile, writeFile } from "node:fs/promises";

const equipmentPath = new URL("../equipment.json", import.meta.url);
const weaponsPath = new URL("../weapons.json", import.meta.url);

const equipmentPayload = JSON.parse(await readFile(equipmentPath, "utf8"));
const weaponPayload = JSON.parse(await readFile(weaponsPath, "utf8"));

const equipment = equipmentPayload.equipment || {};
const weaponSupport = { ...(weaponPayload.weapon_support || {}) };
const enhancements = { ...(equipmentPayload.enhancements || {}) };

const supportProfiles = {
  "Airburst Link": "grenade-launcher",
  Bipod: "long-gun",
  "Concealable Holster": "pistol",
  "Gas-Vent System": "conventional-firearm",
  "Gyro Mount": "firearm-or-heavy",
  "Hidden Arm Slide": "small-pistol",
  "Imaging Scope (Firearm Accessory)": "firearm-or-heavy",
  "Laser Sight": "firearm-or-heavy",
  "Periscope (Firearm Accessory)": "firearm-or-heavy",
  "Quick-Draw Holster": "pistol",
  "Shock Pad": "shoulder-fired",
  "Silencer/Suppressor": "conventional-firearm",
  "Smart Firing Platform": "firearm-or-heavy",
  "Smartgun System (Internal)": "firearm-or-heavy",
  "Smartgun System (External)": "firearm-or-heavy",
  "Spare Clip": "detachable-clip",
  "Speed Loader": "cylinder",
  Tripod: "heavy-or-long-gun",
  Arrow: "bow",
  "Injection Arrow": "bow",
  Bolt: "crossbow",
  "Injection Bolt": "crossbow",
  "Assault Cannon Ammunition": "assault-cannon",
  "Injection Darts": "dart-weapon",
  "Taser Dart": "taser",
  Flare: "shotgun"
};

const projectileArrowheads = new Set([
  "Barbed Head",
  "Explosive Head",
  "Hammerhead Arrowhead",
  "Incendiary Head",
  "Screamer Head",
  "Stick 'n' Shock Arrowhead",
  "Static Shaft"
]);

for (const [name, item] of Object.entries(equipment)) {
  if (item.category !== "Weapon Support") continue;
  let compatibilityProfile = supportProfiles[name];
  if (!compatibilityProfile && projectileArrowheads.has(name)) compatibilityProfile = "bow";
  if (!compatibilityProfile && item.subcategory === "Firearm Ammunition") compatibilityProfile = "ballistic-firearm";
  if (!compatibilityProfile && item.subcategory === "Projectile Ammunition") compatibilityProfile = "projectile-weapon";
  weaponSupport[name] = {
    ...item,
    compatibility_profile: compatibilityProfile || "firearm-or-heavy"
  };
  delete equipment[name];
}

const clothingEnhancements = new Set([
  "Electrochromic Clothing Modification",
  "Feedback Clothing",
  "Synthleather"
]);
const fittedArmorEnhancements = new Map([
  ["Full Helmet (Full Body Armor Add-On)", ["Full Body Armor"]],
  ["Chemical Seal (Full Body Armor Add-On)", ["Full Body Armor"]],
  ["Environment Adaptation (Full Body Armor Add-On)", ["Full Body Armor"]],
  ["Urban Explorer Helmet", ["Urban Explorer Jumpsuit"]]
]);
const explicitEnhancementSubcategories = new Set([
  "Vision Enhancements",
  "Audio Enhancements",
  "Sensor Functions",
  "Cyberlimb Enhancements",
  "Armor Modifications"
]);

function enhancementRelationship(name, item) {
  const subcategory = item.subcategory;
  if (subcategory === "Vision Enhancements") return {
    enhancement_group: "Vision enhancements",
    compatible_subcategories: ["Optical & Imaging Devices", "Sensor Housings"],
    compatibility_note: "Sensor housings require an installed Camera Sensor Function. Capacity and device-rating limits still apply."
  };
  if (subcategory === "Audio Enhancements") return {
    enhancement_group: "Audio enhancements",
    compatible_subcategories: ["Audio Devices", "Sensor Housings"],
    compatibility_note: "Sensor housings require an installed microphone sensor function. Capacity and device-rating limits still apply."
  };
  if (subcategory === "Sensor Functions") return {
    enhancement_group: "Sensor functions",
    compatible_subcategories: ["Sensor Housings"],
    compatibility_note: "A Single Sensor holds one function. A Sensor Array holds up to eight functions, each operating at the array's Rating."
  };
  if (subcategory === "Cyberlimb Enhancements") return {
    enhancement_group: "Cyberlimb enhancements",
    compatible_subcategories: ["Cyberlimbs"],
    compatibility_note: "Installed Rating and available cyberlimb Capacity limit this enhancement."
  };
  if (subcategory === "Armor Modifications") {
    const compatibleItems = name === "Gorepak" ? ["Murder Armor"] : undefined;
    return {
      enhancement_group: "Armor modifications",
      ...(compatibleItems ? { compatible_items: compatibleItems } : { compatible_subcategories: ["Armor", "Clothing", "Helmets & Shields"] }),
      compatibility_note: name === "Responsive Interface Gear (RIG)"
        ? "Requires compatible armor and its helmet; the listed Capacity is split between both pieces."
        : "Use only with a compatible armor or clothing item and observe its available Capacity."
    };
  }
  if (subcategory === "Eyeware") return {
    enhancement_group: "Cybereye enhancements",
    compatible_items: ["Cybereyes Basic System"],
    compatibility_note: "Uses Capacity from the selected Cybereyes Basic System Rating."
  };
  if (subcategory === "Earware") return {
    enhancement_group: "Cyberear enhancements",
    compatible_items: ["Cyberears Basic System"],
    compatibility_note: "Uses Capacity from the selected Cyberears Basic System Rating."
  };
  if (clothingEnhancements.has(name)) return {
    enhancement_group: "Clothing modifications",
    compatible_subcategories: ["Clothing"],
    compatibility_note: "Add this option to a compatible clothing purchase."
  };
  if (fittedArmorEnhancements.has(name)) return {
    enhancement_group: "Fitted add-ons",
    compatible_items: fittedArmorEnhancements.get(name),
    compatibility_note: "This add-on is made for the named base item."
  };
  if (name === "Cyberlimb Customization") return {
    enhancement_group: "Cyberlimb enhancements",
    compatible_subcategories: ["Cyberlimbs"],
    compatibility_note: "Customization is purchased for a cyberlimb before separate enhancements are installed."
  };
  return null;
}

for (const [name, item] of Object.entries(equipment)) {
  const relationship = enhancementRelationship(name, item);
  const isCybereyeEnhancement = item.subcategory === "Eyeware" && name !== "Cybereyes Basic System";
  const isCyberearEnhancement = item.subcategory === "Earware" && name !== "Cyberears Basic System";
  const shouldMove = explicitEnhancementSubcategories.has(item.subcategory)
    || isCybereyeEnhancement
    || isCyberearEnhancement
    || clothingEnhancements.has(name)
    || fittedArmorEnhancements.has(name)
    || name === "Cyberlimb Customization";
  if (!shouldMove || !relationship) continue;
  enhancements[name] = { ...item, ...relationship };
  delete equipment[name];
}

weaponPayload.weapon_support = weaponSupport;
weaponPayload.category = {
  ...(weaponPayload.category || {}),
  "Weapon Support": "<strong>Weapon Support</strong><br>Ammunition and accessories are stored with the weapon archive. Open any support record to see generally applicable weapons; open a weapon to review compatible support with effect and cost. Mounts, existing factory features and individual exceptions still apply."
};

equipmentPayload.equipment = equipment;
equipmentPayload.enhancements = enhancements;
if (equipmentPayload.category) delete equipmentPayload.category["Weapon Support"];

await Promise.all([
  writeFile(equipmentPath, `${JSON.stringify(equipmentPayload, null, 2)}\n`, "utf8"),
  writeFile(weaponsPath, `${JSON.stringify(weaponPayload, null, 2)}\n`, "utf8")
]);

console.log(`Organized ${Object.keys(weaponSupport).length} weapon-support records and ${Object.keys(enhancements).length} equipment enhancements.`);
