import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      const candidate = fileURLToPath(new URL(specifier, context.parentURL));
      for (const ext of ['', '.ts', '/index.ts']) {
        if (fs.existsSync(candidate + ext) && fs.statSync(candidate + ext).isFile()) {
          return { url: pathToFileURL(candidate + ext).href, shortCircuit: true };
        }
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('/src/store/useGameStore.ts')) {
      return { format: 'module', shortCircuit: true, source: 'export const useGameStore = { getState: () => globalThis.__botHousingTestStore };' };
    }
    if (url.endsWith('.ts')) {
      return {
        format: 'module', shortCircuit: true,
        source: ts.transpileModule(fs.readFileSync(new URL(url), 'utf8'), {
          compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
        }).outputText,
      };
    }
    return next(url, context);
  },
});

const { BotAISystem } = await import('../src/engine/ecs/systems/BotAISystem.ts');
const { GridMap } = await import('../src/engine/grid/GridMap.ts');
const { world } = await import('../src/engine/ecs/world.ts');
const { ConstructionJobHandler } = await import('../src/engine/ecs/systems/jobs/ConstructionJobHandler.ts');

BotAISystem.reset();
GridMap.isCoordInRegion = () => true;
const region = {
  id: 1, owner: 'bot', lordName: 'Тестовий лорд', center: [8, 8], campPosition: [8, 8], buildingsCount: 3, wealth: 50,
  bounds: { minX: 0, maxX: 20, minZ: 0, maxZ: 20 },
};
globalThis.__botHousingTestStore = {
  time: { hour: 12 }, regions: [region], resourceDeposits: [],
  incrementTerrainVersion() {}, incrementBuildingVersion() {}, incrementFoliageVersion() {},
  updateRegionStats() {},
};
const house = {
  id: 'bot-test-house', isBuilding: true, buildingType: 'peasant_house', isCompleted: true,
  factionId: 'bot-1', regionId: 1, gridPosition: [4, 4], position: [4.5, 0, 4.5],
  buildingWidth: 3, buildingHeight: 2, maxBuildingHealth: 200, buildingHealth: 200,
};
const forager = { id: 'bot-test-forager', isBuilding: true, buildingType: 'foragers_hut', isCompleted: true, factionId: 'bot-1', regionId: 1, gridPosition: [9, 4], position: [9.5, 0, 4.5] };
const hunter = { id: 'bot-test-hunter', isBuilding: true, buildingType: 'hunters_hut', isCompleted: true, factionId: 'bot-1', regionId: 1, gridPosition: [14, 4], position: [14.5, 0, 4.5] };
for (const building of [house, forager, hunter]) world.add(building);
const memory = {
  wood: 100, stone: 100, gold: 100, food: 100, iron: 100,
  buildStage: 0, lastActionTick: 10000, lastWorkerAssignTick: 10000, lastImmigrationTick: 10000,
  hasPavedHighwayRoad: true, hasOpenedCampApproaches: true,
};
BotAISystem.botMemories.set('bot-1', memory);
for (const building of [house, forager, hunter]) BotAISystem.failedRoadConnections.set(building.id, 10000);
const grid = { getTile: () => ({ terrain: 'grass', isPassable: true }) };

for (let tick = 197; tick <= 707; tick += 10) BotAISystem.update(grid, tick);
assert.equal(house.backyardExtension, 'vegetable_garden', 'bot completes its first backyard garden');
assert.equal(house.houseTier, 2, 'bot upgrades an existing house after developing the yard');
assert.equal(house.isCompleted, true);
assert.ok((house.localInventory?.vegetables || 0) > 0, 'bot backyard produces for the bot settlement');
assert.equal(memory.gold, 75, 'garden and house upgrade spend bot gold');
assert.equal(house.pendingHouseTier, undefined);
assert.equal(house.pendingBackyardExtension, undefined);

const secondHouse = {
  id: 'bot-test-house-2', isBuilding: true, buildingType: 'peasant_house', isCompleted: false,
  factionId: 'bot-1', regionId: 1, gridPosition: [7, 8], position: [7.5, 0, 8.5],
  maxBuildingHealth: 200, pendingHouseTier: 2,
};
world.add(secondHouse);
let updatedStats;
ConstructionJobHandler.completeBuilding(
  { id: 'bot-house-upgrade', type: 'build_structure', targetBuildingId: secondHouse.id, progress: 100, totalWork: 100 },
  { id: 'bot-builder' }, 710, false, [region], (_regionId, stats) => { updatedStats = stats; }
);
assert.equal(secondHouse.houseTier, 2, 'worker completion applies the house tier');
assert.equal(updatedStats.buildingsCount, 3, 'upgrading does not increase the region building count');
assert.equal(world.entities.filter((entity) => entity.isCharacter).length, 0, 'upgrading does not spawn a new peasant');

const secondRegion = { ...region, id: 2, buildingsCount: 4 };
globalThis.__botHousingTestStore.regions = [secondRegion];
const yards = [
  { id: 'yard-garden', houseTier: 2, backyardExtension: 'vegetable_garden' },
  { id: 'yard-artisan', houseTier: 2 },
  { id: 'yard-chicken', houseTier: 1 },
  { id: 'yard-goat', houseTier: 1 },
].map((entry, index) => ({
  ...entry, isBuilding: true, buildingType: 'peasant_house', isCompleted: true,
  factionId: 'bot-2', regionId: 2, gridPosition: [2 + index * 4, 8], position: [2.5 + index * 4, 0, 8.5],
  maxBuildingHealth: 200, buildingHealth: 200,
}));
for (const yard of yards) {
  world.add(yard);
  BotAISystem.failedRoadConnections.set(yard.id, 10000);
}
const secondMemory = {
  wood: 100, stone: 100, gold: 500, food: 100, iron: 100,
  buildStage: 0, lastActionTick: 10000, lastWorkerAssignTick: 10000, lastImmigrationTick: 10000,
  hasPavedHighwayRoad: true, hasOpenedCampApproaches: true,
};
BotAISystem.botMemories.set('bot-2', secondMemory);
for (let tick = 194; tick <= 1214; tick += 10) BotAISystem.update(grid, tick);
assert.equal(yards[1].backyardExtension, 'artisan_bowyer', 'tier-two bot houses can open artisan yards');
assert.ok(yards.some((yard) => yard.backyardExtension === 'chicken_coop'), 'bot houses diversify into chicken coops');
assert.ok(yards.some((yard) => yard.backyardExtension === 'goat_shed'), 'bot houses diversify into goat sheds');
assert.ok(secondMemory.gold < 475, 'different backyard projects charge the bot settlement');
console.log('Bot housing checks passed: gardens, animal and artisan yards, production, tier upgrades and costs.');
