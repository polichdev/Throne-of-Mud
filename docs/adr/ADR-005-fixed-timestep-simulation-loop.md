# ADR-005: Fixed Timestep Simulation Loop with Variable Render Interpolation

## Status
**Accepted**

## Context
Video games that couple game physics and AI logic directly to the variable frame delta (`deltaTime = currentTime - lastTime`) suffer from severe determinism and stability issues:
- On high-refresh displays ($144\text{ Hz}$ or $240\text{ Hz}$), small delta times can cause rounding errors and excessive AI evaluation calls.
- On lower-end machines or during sudden frame drops ($20\text{ FPS}$), large delta times cause collision tunneling, workers passing through walls, and erratic economic resource consumption.
- Replaying or verifying simulation state across different hardware becomes impossible.

## Decision
We implemented a **Fixed-Timestep Simulation Loop** (`src/engine/time/GameLoop.ts`) coupled with continuous frame delta movement interpolation:

1. Discrete simulation systems (`JobSystem`, `NeedsSystem`, `ProductionSystem`, `EconomySystem`, `BotAISystem`) execute at a fixed deterministic tick rate ($\Delta t = \text{TICK\_TIME} = \frac{1}{\text{TICK\_RATE}}$).
2. Incoming elapsed frame time is clamped and added to an accumulator. The simulation loop steps forward in exact `TICK_TIME` slices.
3. If an extreme frame drop occurs (e.g. background tab switching), `maxFrameDeltaSeconds` ($0.1\text{ s}$) clamps the delta, and any runaway accumulator remainder is flushed to prevent a "spiral of death".
4. `MovementSystem` updates unit spatial coordinates along their A* paths continuously per frame, ensuring smooth visual motion without discrete stutter.

## Consequences

### Positive:
- **Deterministic Simulation:** Colony economics, hunger degradation, building construction, and AI behaviors progress identically on all hardware.
- **Spiral-of-Death Immunity:** Frame drops cannot trigger cascading simulation lag spikes.
- **Buttery Smooth Visuals:** Movement is evaluated smoothly at display refresh rate while discrete logic remains locked to the simulation tick.

### Negative:
- Accumulator logic requires careful handling of game speed multipliers ($1\times$, $2\times$, $5\times$) and pause states.
