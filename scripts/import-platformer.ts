// Run with: npx tsx scripts/import-platformer.ts
// Or use the admin panel to add levels manually

const levelsToAdd = [
  // Format: [name, levelId, hkgdRank]
  ["Heavenly Echo", "125698552", 30],
  ["Chaos Ball Theory", "119638144", 34],
  ["Void World", "107052022", 42],
  ["The Abyss", "98163412", 83],
  ["Life and Beauty", "99608524", 85],
  ["Terminal Heaven", "99335322", 105],
  ["FRUSTRATION", "103647687", 108],
  ["The Sun", "108338683", 128],
  ["Robot King", "99927952", 144],
  ["The SMR Collection", "114333632", 150],
  ["Qimu", "115945148", 164],
  ["Creepy Needle", "115691111", 165],
  ["Nextphase", "107420706", 166],
  ["Dungeon Treasures", "102010719", 168],
  ["Chief Needler", "102557379", 174],
];

// These levels already exist in some form
const existingLevels = [
  "Intervallum", "104049200", 44],
  ["depth", "105549257", 55],
  ["Free Solo", "103998262", 58],
  ["HYPER GRAVITRON", "98745817", 91],
  ["Hexagonestestestest", "112346959", 106],
  ["radio tower", "102805772", 132],
  ["Beatpulse", "103346085", 140],
  ["FURY OF 500", "105382136", 155],
  ["Storm Front", "100486532", 159],
  ["Throat of the World", "109365157", 177],
  ["DETERNARY", "119022899", 179],
  ["Tower of Infinity", "97713011", 178],
  ["SUMMER", "122287167", 127],
];

console.log("Levels to add:", levelsToAdd.length);
console.log("Existing levels:", existingLevels.length);

// Instructions:
// 1. Log into admin panel
// 2. Go to Platformer Levels tab
// 3. Search each level ID and add to list
// 4. Set the HKGD rank manually

console.log("\nUse the admin panel to add these levels with their HKGD ranks:");