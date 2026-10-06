import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { GridMap } from '../../engine/grid/GridMap';
import { world } from '../../engine/ecs/world';
import type { GameEntity } from '../../engine/ecs/world';
import { MovementSystem } from '../../engine/ecs/systems/MovementSystem';
import { useGameStore } from '../../store/useGameStore';

interface Props {
  grid: GridMap;
}

interface WalkerConfig {
  id: string;
  name: string;
  characterClass: 'peasant' | 'lady' | 'warrior' | 'lord';
  avatarColor: string;
  moveSpeed: number;
  type: 'NS' | 'WE';
  minCoord: number;
  maxCoord: number;
  currentDirection: 1 | -1;
  pauseTimer: number;
}

function generateHighwayPath(type: 'NS' | 'WE', start: number, end: number): [number, number][] {
  const path: [number, number][] = [];
  const step = start < end ? 1 : -1;
  if (type === 'NS') {
    for (let z = start; step > 0 ? z <= end : z >= end; z += step) {
      const x = Math.round(GridMap.getHighwayX(z));
      path.push([x, z]);
    }
  } else {
    for (let x = start; step > 0 ? x <= end : x >= end; x += step) {
      const z = Math.round(GridMap.getHighwayZ(x));
      path.push([x, z]);
    }
  }
  return path;
}

export function MenuAmbientWalkers({ grid }: Props) {
  const gameMode = useGameStore((s) => s.gameMode);

  const walkersRef = useRef<WalkerConfig[]>([
    {
      id: 'menu-ambient-peasant-1',
      name: 'Мандрівний селянин',
      characterClass: 'peasant',
      avatarColor: '#854d0e',
      moveSpeed: 1.25,
      type: 'NS',
      minCoord: 164,
      maxCoord: 206,
      currentDirection: 1,
      pauseTimer: 0,
    },
    {
      id: 'menu-ambient-lady',
      name: 'Поселянка',
      characterClass: 'lady',
      avatarColor: '#047857',
      moveSpeed: 1.15,
      type: 'WE',
      minCoord: 160,
      maxCoord: 230,
      currentDirection: -1,
      pauseTimer: 0,
    },
    {
      id: 'menu-ambient-guard',
      name: 'Вартовий тракту',
      characterClass: 'warrior',
      avatarColor: '#475569',
      moveSpeed: 1.35,
      type: 'NS',
      minCoord: 168,
      maxCoord: 200,
      currentDirection: -1,
      pauseTimer: 2.0,
    },
  ]);

  const spawnWalker = (w: WalkerConfig) => {
    let ent = world.entities.find((e) => e.id === w.id);
    if (!ent) {
      let initialX = 128;
      let initialZ = 128;
      if (w.type === 'NS') {
        initialZ = w.currentDirection === 1 ? w.minCoord + 6 : w.maxCoord - 6;
        initialX = Math.round(GridMap.getHighwayX(initialZ));
      } else {
        initialX = w.currentDirection === 1 ? w.minCoord + 6 : w.maxCoord - 6;
        initialZ = Math.round(GridMap.getHighwayZ(initialX));
      }

      const tileH = grid.getTile(initialX, initialZ)?.height || 0.1;
      const initialPath = w.type === 'NS'
        ? generateHighwayPath('NS', initialZ, w.currentDirection === 1 ? w.maxCoord : w.minCoord)
        : generateHighwayPath('WE', initialX, w.currentDirection === 1 ? w.maxCoord : w.minCoord);

      const newEnt: GameEntity = {
        id: w.id,
        name: w.name,
        isCharacter: true,
        characterClass: w.characterClass,
        avatarColor: w.avatarColor,
        gridPosition: [initialX, initialZ],
        position: [initialX + 0.5, tileH + 0.2, initialZ + 0.5],
        path: initialPath,
        moveSpeed: w.moveSpeed,
        needs: { hunger: 100, energy: 100, mood: 100, ale: 100, hygiene: 100 },
        currentJob: { id: `walk-${w.id}`, type: 'idle', progress: 0, totalWork: 0 },
      };
      world.add(newEnt);
    }
  };

  useEffect(() => {
    if (gameMode !== 'menu') {
      for (const w of walkersRef.current) {
        const ent = world.entities.find((e) => e.id === w.id);
        if (ent) world.remove(ent);
      }
      return;
    }

    for (const w of walkersRef.current) {
      spawnWalker(w);
    }

    return () => {
      for (const w of walkersRef.current) {
        const ent = world.entities.find((e) => e.id === w.id);
        if (ent) world.remove(ent);
      }
    };
  }, [gameMode, grid]);

  useFrame((_, delta) => {
    if (gameMode !== 'menu') return;

    for (const w of walkersRef.current) {
      if (!world.entities.some((e) => e.id === w.id)) {
        spawnWalker(w);
      }
    }

    const clampedDelta = Math.min(delta, 0.1);

    MovementSystem.update(clampedDelta, grid);

    for (const w of walkersRef.current) {
      const ent = world.entities.find((e) => e.id === w.id);
      if (!ent) continue;

      if (!ent.path || ent.path.length === 0) {
        if (w.pauseTimer > 0) {
          w.pauseTimer -= clampedDelta;
        } else {
          w.currentDirection = w.currentDirection === 1 ? -1 : 1;
          w.pauseTimer = 3.0 + Math.random() * 4.0;

          const [currGx, currGz] = ent.gridPosition || [128, 128];
          if (w.type === 'NS') {
            const destZ = w.currentDirection === 1 ? w.maxCoord : w.minCoord;
            ent.path = generateHighwayPath('NS', currGz, destZ);
          } else {
            const destX = w.currentDirection === 1 ? w.maxCoord : w.minCoord;
            ent.path = generateHighwayPath('WE', currGx, destX);
          }
        }
      }
    }
  });

  return null;
}
