import type { StateCreator } from 'zustand';
import type { GameState, UISlice } from '../types';

export type { UISlice };

export const createUISlice: StateCreator<GameState, [], [], UISlice> = (set, get) => ({
  selectedEntityId: null,
  setSelectedEntityId: (id) => set((state) => ({
    selectedEntityId: id,
    houseFloorView: state.selectedEntityId === id ? state.houseFloorView : 1,
  })),
  houseFloorView: 1,
  setHouseFloorView: (floor) => set({ houseFloorView: floor }),

  activeBuildType: null,
  setActiveBuildType: (type) => set({ activeBuildType: type, activeTool: type ? 'build' : 'select' }),

  activeTool: 'select',
  setActiveTool: (tool) => {
    const update: Record<string, unknown> = {
      activeTool: tool,
      activeBuildType: tool === 'build' ? get().activeBuildType : null,
    };
    if (tool !== 'road') update.roadEraseMode = false;
    set(update as any);
  },

  roadEraseMode: false,
  setRoadEraseMode: (v) => set({ roadEraseMode: v }),

  hoveredTile: null,
  setHoveredTile: (tile) => {
    const prev = get().hoveredTile;
    if (!tile && !prev) return;
    if (tile && prev && tile[0] === prev[0] && tile[1] === prev[1]) return;
    set({ hoveredTile: tile });
  },

  buildRotation: 0,
  setBuildRotation: (val) => set({ buildRotation: typeof val === 'function' ? val(get().buildRotation) : val }),
  rotateBuilding: (direction = 'cw', step = Math.PI / 12) =>
    set((s) => {
      const delta = direction === 'ccw' ? -step : step;
      return {
        buildRotation: ((s.buildRotation + delta) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2),
      };
    }),

  previewAnimation: null,
  triggerAnimation: (entityId, anim, durationMs = 3500) => {
    set({
      previewAnimation: {
        entityId,
        anim,
        expiresAt: Date.now() + durationMs,
      },
    });
  },

  cameraFocusTarget: null,
  setCameraFocusTarget: (pos) => set({ cameraFocusTarget: pos }),
  cameraZoomTarget: null,
  setCameraZoomTarget: (zoom) => set({ cameraZoomTarget: zoom }),
  cameraAngleTarget: null,
  setCameraAngleTarget: (angle) => set({ cameraAngleTarget: angle }),
  isStrategicView: false,
  setIsStrategicView: (val) => set({ isStrategicView: val }),

  activeMenuTab: null,
  setActiveMenuTab: (tab) => {
    set({ activeMenuTab: tab });
    if (tab === 'buildings') {
      get().setActiveTool('build');
      if (!get().activeBuildType) {
        get().setActiveBuildType('peasant_house');
      }
    } else if (tab === null) {
      if (get().activeTool === 'build') {
        get().setActiveTool('select');
      }
    }
  },

  isStrategicMapOpen: false,
  setIsStrategicMapOpen: (open) => set({ isStrategicMapOpen: open }),
  focusOnRegion: (regionId) => {
    const region = get().regions.find((r) => r.id === regionId);
    if (region) {
      const target = region.campPosition || region.center;
      set({
        cameraFocusTarget: [target[0], target[1]],
        isStrategicMapOpen: false,
      });
    }
  },

  isLordsBarOpen: false,
  toggleLordsBar: () => set((state) => ({ isLordsBarOpen: !state.isLordsBarOpen })),

  gameMode: 'menu',
  setGameMode: (mode) => set({ gameMode: mode }),
  saveNotification: null,
  setSaveNotification: (msg) => {
    set({ saveNotification: msg });
    if (msg) {
      setTimeout(() => {
        if (get().saveNotification === msg) {
          set({ saveNotification: null });
        }
      }, 3500);
    }
  },
});
