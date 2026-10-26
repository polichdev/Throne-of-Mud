# ADR-001: Miniplex ECS Selection for Game Simulation

## Status
**Accepted**

## Context
A medieval colony simulator involves dozens of autonomous citizens, hundreds of buildings, working pack mules, roving bandits, and multi-tier production chains. In early prototypes, game entities were modeled using object-oriented classes (`class Settler extends Pawn`). 

This quickly created classic OOP game architecture pitfalls:
- The "God Object" problem (e.g. `Settler` class accumulating hundreds of methods for movement, needs, pathfinding, combat, and inventory).
- Fragile base class hierarchy when introducing non-human agents (e.g. pack mules or horse carts sharing movement and hauling logic with humans, but having no hunger or mood needs).
- Poor cache locality and high memory overhead from polymorphic allocations.
- Severe coupling between UI state, 3D rendering references, and simulation state.

## Decision
We adopted **Miniplex v2** as the core Entity Component System (ECS) framework for Throne of Mud.

In Miniplex:
1. Entities are pure, lightweight JavaScript objects (`GameEntity`).
2. Components are plain, serializable properties added or removed from entity objects.
3. Archetype views (`world.with(...)`) maintain reactive, cached sets that automatically update as components are attached or deleted.
4. Systems are stateless update loops that iterate over matching entity sets.

## Consequences

### Positive:
- **Maximal Flexibility:** A mule is simply an entity with `position`, `moveSpeed`, and `hasMule`, without needing to inherit from a human `Character` class.
- **Fast Iteration & Queries:** Systems query only the entities they care about (`world.with('position', 'path')`), eliminating defensive `if (!entity.hasPath) continue` checks across thousands of entities.
- **Trivial Serialization:** Because entities are plain objects without cyclic class methods, serialization into JSON/IndexedDB is straightforward.
- **Headless Execution:** Miniplex has zero DOM/WebGL dependencies, enabling headless Node.js testing and benchmarking.

### Negative:
- Developers must exercise discipline to avoid putting methods on entities.
- Miniplex uses object references rather than packed contiguous typed array structs (like BitECS). However, for our entity budget ($\approx 500$ concurrent active dynamic entities), Miniplex delivers sub-millisecond query performance while preserving full TypeScript developer ergonomics.
