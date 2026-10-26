# Subsystem: Feudal Economy, Jobs & Trade Logistics

This document specifies the resource supply chains, worker job lifecycle, pack mule logistics, and Royal Highway market trade mechanics in `src/engine/`.

---

## 1. Multi-Tier Production Chains

Throne of Mud models authentic medieval supply chains, transforming raw natural resources into finished goods, foodstuffs, and armaments across **33 building blueprints**:

```mermaid
flowchart TD
    subgraph RawExtraction ["Raw Extraction (Tier 1)"]
        Tree[Forest: Logs] --> Lumberjack[Lumberjack Hut]
        StoneNode[Stone Deposit: Rough Stone] --> Quarry[Stone Quarry]
        ClayNode[Clay Deposit: Raw Clay] --> ClayPit[Clay Pit]
        IronNode[Iron Deposit: Iron Ore] --> IronMine[Iron Mine]
        SaltNode[Salt Springs: Brine] --> SaltWorks[Salt Works]
        WheatField[Farm Field: Raw Wheat] --> WheatFarm[Wheat Farm]
    end

    subgraph Processing ["Refining & Processing (Tier 2)"]
        Lumberjack -->|Timber Logs| Sawmill[Sawmill: Planks]
        Lumberjack -->|Firewood| Charcoal[Charcoal Kiln: Charcoal]
        StoneNode -->|Rough Stone| Stonecutter[Stonecutter: Dressed Stone]
        ClayPit -->|Clay + Charcoal| Brickworks[Brickworks: Fired Bricks]
        IronMine -->|Iron Ore + Charcoal| Smelter[Iron Smelter: Iron Ingots]
        WheatFarm -->|Raw Wheat| Windmill[Windmill: Flour]
        WheatFarm -->|Barley/Hops| Brewery[Brewery: Ale]
    end

    subgraph Manufacturing ["Finished Goods & Food (Tier 3)"]
        Windmill -->|Flour + Firewood| Bakery[Bakery: Bread]
        Smelter -->|Iron Ingots + Planks| Weaponsmith[Blacksmith: Spears, Swords, Pikes]
        Smelter -->|Iron Ingots| Tools[Toolmaker: Metal Tools]
        Brewery -->|Casks of Ale| Tavern[Tavern: Settler Happiness]
    end

    subgraph CivicConsumables ["Civic Settlement & Trade (Tier 4)"]
        Bakery --> Market[Marketplace Food Stalls]
        Tavern --> Houses[Peasant House Residents]
        Weaponsmith --> Barracks[Barracks & Militia Armory]
        Sawmill & Brickworks --> Upgrades[Tier 2 & 3 Peasant House Upgrades]
    end
```

---

## 2. Worker Job Lifecycle & Handlers

Settlers receive tasks through `JobSystem.update`, which delegates to specialized modular handlers:

```mermaid
stateDiagram-v2
    [*] --> Idle: No Active Assignment
    Idle --> FindTask: Check Priority Queue & Workplace
    FindTask --> Traveling: A* Path to Destination
    Traveling --> InProgress: Arrived at Workstation / Deposit

    state InProgress {
        [*] --> ExecutingAction
        ExecutingAction --> DeductToolDurability
        DeductToolDurability --> CollectYield
    }

    InProgress --> Hauling: Carrying Harvested Goods
    Hauling --> DepositGoods: Arrived at Stockpile / Scaffold
    DepositGoods --> CheckFatigue: Finished Task
    CheckFatigue --> Rest: Energy < 20% (Sleep at Home/Campfire)
    CheckFatigue --> FindTask: Energy OK
    Rest --> Idle: Woke Up Replenished
```

### Key Job Handlers:
- **`ConstructionJobHandler`**: Validates materials delivered to building footprints. Once all timber and stone are present, workers assemble the scaffold and construct the building.
- **`HaulingJobHandler`**: Directs workers to transfer goods from production sites to central stockpiles. When dealing with heavy logs, workers prioritize utilizing available working mules.
- **`WoodcuttingJobHandler` & `GatheringJobHandler`**: Handles terrain clearing, felling timber, and gathering wild berries or game meat.
- **`WorkstationJobHandler`**: Manages crafting recipes at mills, bakeries, smelters, and artisan backyard workshops.

---

## 3. Working Beasts & Mule Logistics

To solve the logistics bottleneck of transporting heavy logs across large distances:
1. **Hitching Posts (`hitching_post`)**: Houses up to 3 working pack mules.
2. **Log Towing Mechanics**:
   - A worker assigned to haul timber navigates to the nearest hitching post.
   - The worker hitches a mule (`worker.hasMule = true`), proceeds to the felled tree, hitches the heavy log behind the mule, and hauls it to the sawmill or construction site.
   - Upon delivery, the worker returns the mule to the hitching post, ensuring beasts of burden remain available for other town tasks.

---

## 4. Royal Highway Caravans & Foreign Trade

The Royal Highway (*Königsweg*) cuts across the realm, connecting the player's colony with distant fiefdoms and autonomous AI lords:

- **Trading Posts (`trading_post`)**:
  - The player sets trade policies for each good: *Import*, *Export*, or *No Trade*.
  - A desired local stockpile reserve is configured (e.g. "Export timber only when reserve $> 50$").
- **Merchant Wagons**:
  - Autonomous horse-drawn merchant wagons travel along the Royal Highway.
  - Upon reaching a colony's trading post, transactions execute against the player's gold treasury according to current supply/demand market pricing.
