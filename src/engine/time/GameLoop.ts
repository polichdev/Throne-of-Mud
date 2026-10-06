import { GridMap } from '../grid/GridMap';
import { useGameStore } from '../../store/useGameStore';
import { MovementSystem } from '../ecs/systems/MovementSystem';
import { NeedsSystem } from '../ecs/systems/NeedsSystem';
import { JobSystem } from '../ecs/systems/JobSystem';
import { ProductionSystem } from '../ecs/systems/ProductionSystem';
import { EconomySystem } from '../ecs/systems/EconomySystem';
import { ImmigrationSystem } from '../ecs/systems/ImmigrationSystem';
import { BotAISystem } from '../ecs/systems/BotAISystem';
import { BanditAISystem } from '../ecs/systems/BanditAISystem';
import { TradeSystem } from '../ecs/systems/TradeSystem';

export class GameLoop {
  private grid: GridMap;
  private isRunning = false;
  private lastTime = 0;
  private accumulator = 0;
  private readonly TICK_RATE = 10;
  private readonly TICK_TIME = 1.0 / this.TICK_RATE;
  private animFrameId: number | null = null;

  constructor(grid: GridMap) {
    this.grid = grid;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public step(frameDeltaSeconds: number): void {
    const startedAt = performance.now();
    const { time, advanceTick, gameMode } = useGameStore.getState();
    if (gameMode !== 'playing' || time.isPaused || time.speedMultiplier <= 0) {
      this.reportSimulationTime(startedAt);
      return;
    }

    const clampedDelta = Math.min(frameDeltaSeconds, 0.1);
    this.accumulator += clampedDelta * time.speedMultiplier;

    const maxTicksPerFrame = Math.max(1, Math.min(2, Math.round(time.speedMultiplier)));
    let ticksRan = 0;

    while (this.accumulator >= this.TICK_TIME && ticksRan < maxTicksPerFrame) {
      ticksRan++;
      advanceTick();
      const currentTick = useGameStore.getState().time.tick;

      try {
        JobSystem.update(this.grid, currentTick);

        const isFast = time.speedMultiplier >= 2;

        if (!isFast || currentTick % 2 === 0) {
          NeedsSystem.update(currentTick);
          ProductionSystem.update();
        }

        if (!isFast || currentTick % 3 === 0) {
          BotAISystem.update(this.grid, currentTick);
        }

        if (!isFast || currentTick % 3 === 1) {
          BanditAISystem.update(this.grid, currentTick);
        }

        if (!isFast || currentTick % 4 === 0) {
          EconomySystem.update(currentTick);
          TradeSystem.update(this.grid, currentTick);
        }

        if (currentTick % 10 === 0) {
          ImmigrationSystem.update(this.grid, currentTick);
        }
      } catch (err) {
        console.error('Simulation tick error:', err);
      }

      this.accumulator -= this.TICK_TIME;
    }

    if (this.accumulator >= this.TICK_TIME) {
      this.accumulator = 0;
    }

    try {
      MovementSystem.update(clampedDelta * time.speedMultiplier, this.grid);
    } catch (err) {
      console.error('MovementSystem error:', err);
    }
    this.reportSimulationTime(startedAt);
  }

  private reportSimulationTime(startedAt: number): void {
    const elapsed = performance.now() - startedAt;
    (window as any).__simulationMs = elapsed;
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const frameDeltaSeconds = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    try {
      this.step(frameDeltaSeconds);
    } catch (err) {
      console.error('GameLoop step error:', err);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };
}
