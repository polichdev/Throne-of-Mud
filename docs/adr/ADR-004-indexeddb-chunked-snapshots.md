# ADR-004: IndexedDB for Save Game Persistence

## Status
**Accepted**

## Context
A full save game in Throne of Mud contains:
- 384×384 tile elevation and road maps ($147,456$ grid cells).
- Hundreds of active Miniplex ECS entities (citizens, buildings, resource deposits, stockpiles).
- Geopolitical boundaries, regional claims, and rival lord relationship matrices.
- Chronicle event history and player customization profiles.

In standard browser storage, `window.localStorage` imposes a strict $5\text{ MB}$ quota, executes synchronously on the main thread (blocking rendering for hundreds of milliseconds), and only supports strings. Serializing our world snapshot as a JSON string into `localStorage` frequently caused quota exceptions and noticeable stutter.

## Decision
We adopted **IndexedDB** (`src/services/storage/saveManager.ts`) as the primary storage engine for all world saves, using `localStorage` solely for lightweight user settings (master audio volume, language preference).

1. Saves are committed to an asynchronous, transactional object store (`throne-of-mud-saves`).
2. Entities are sanitized before saving (stripping ephemeral entities like traveling merchants and Three.js scene graph references).
3. Writes occur in background tasks without stalling the active RAF game loop.
4. Schema versioning allows incremental data migrations upon game updates.

## Consequences

### Positive:
- **Virtually Unlimited Storage:** IndexedDB easily accommodates detailed world states and multiple save slots without hitting quota walls.
- **Non-Blocking I/O:** Saving occurs asynchronously in background IndexedDB transactions; the player experiences zero dropped frames during auto-saves.
- **Transactional Rollbacks:** If an error occurs midway through writing, the IndexedDB transaction automatically aborts, leaving previous valid save data intact.

### Negative:
- Asynchronous save/load operations require Promise-based state coordination during game startup and scene transitions.
