import { reactive } from 'vue';
import heroesData from '../data/heroes.json' with { type: 'json' };

export const LANES = [
  { id: 'clash', name: 'Clash', queryKey: 'cl', short: 'CL', icon: 'fa-shield-halved', tagClass: 'is-danger' },
  { id: 'jungle', name: 'Jungle', queryKey: 'jg', short: 'JG', icon: 'fa-paw', tagClass: 'is-warning' },
  { id: 'mid', name: 'Mid', queryKey: 'md', short: 'MD', icon: 'fa-wand-magic-sparkles', tagClass: 'is-info' },
  { id: 'farm', name: 'Farm', queryKey: 'fm', short: 'FM', icon: 'fa-crosshairs', tagClass: 'is-primary' },
  { id: 'roam', name: 'Roam', queryKey: 'rm', short: 'RM', icon: 'fa-heart', tagClass: 'is-success' },
];

export const ALL_TIERS = ['S+', 'S', 'A', 'B', 'C'];

const createDefaultSlot = (id, playerNumber) => ({
  id,
  name: `Player ${playerNumber}`,
  manualExcludedLanes: [],
  selectedLane: null,
  selectedHero: null,
  isCollapsed: false,
  skipAnimation: false,
  selectedTiers: [...ALL_TIERS],
});

export const store = reactive({
  heroes: heroesData,
  globalBannedHeroIds: [],
  globalSkipAnimation: false,
  slots: [createDefaultSlot(1, 1)],
  nextSlotId: 2,

  // Getters
  getAutoExcludedLanes(index) {
    const lanes = [];
    for (let i = 0; i < index; i++) {
      const lane = this.slots[i].selectedLane;
      if (lane && !lanes.includes(lane)) {
        lanes.push(lane);
      }
    }
    return lanes;
  },

  getAutoExcludedHeroIds(index) {
    const heroIds = [];
    for (let i = 0; i < index; i++) {
      const hero = this.slots[i].selectedHero;
      if (hero && hero.id && !heroIds.includes(hero.id)) {
        heroIds.push(hero.id);
      }
    }
    return heroIds;
  },

  getDisabledLanes(index) {
    const auto = this.getAutoExcludedLanes(index);
    const manual = this.slots[index]?.manualExcludedLanes || [];
    return Array.from(new Set([...auto, ...manual]));
  },

  getDisabledHeroIds(index) {
    const auto = this.getAutoExcludedHeroIds(index);
    return Array.from(new Set([...this.globalBannedHeroIds, ...auto]));
  },

  // Eligible pool for a specific slot
  getEligibleHeroes(index) {
    const slot = this.slots[index];
    if (!slot || !slot.selectedLane) return [];

    const lane = slot.selectedLane;
    const checkedTiers = slot.selectedTiers || ALL_TIERS;
    const disabledIds = this.getDisabledHeroIds(index);

    return this.heroes.filter(hero => {
      // Must have lane assigned
      const tier = hero.lanes[lane];
      if (!tier) return false;
      // Must match selected tier
      if (!checkedTiers.includes(tier)) return false;
      // Must not be disabled (banned globally or picked by upper slot)
      if (disabledIds.includes(hero.id)) return false;
      return true;
    });
  },

  // Heroes belonging to the selected lane with matching tiers (including banned ones, for display chip list)
  getLaneHeroPool(index) {
    const slot = this.slots[index];
    if (!slot || !slot.selectedLane) return [];

    const lane = slot.selectedLane;
    const checkedTiers = slot.selectedTiers || ALL_TIERS;

    return this.heroes.filter(hero => {
      const tier = hero.lanes[lane];
      return tier && checkedTiers.includes(tier);
    });
  },

  // Actions
  addSlot() {
    if (this.slots.length >= 5) return;
    const playerNumber = this.slots.length + 1;
    this.slots.push(createDefaultSlot(this.nextSlotId++, playerNumber));
  },

  removeSlot(slotId) {
    if (this.slots.length <= 1) return;
    const idx = this.slots.findIndex(s => s.id === slotId);
    if (idx !== -1) {
      this.slots.splice(idx, 1);
    }
  },

  resetAll() {
    this.slots = [createDefaultSlot(1, 1)];
    this.nextSlotId = 2;
    this.globalBannedHeroIds = [];
  },

  toggleGlobalBan(heroId) {
    const idx = this.globalBannedHeroIds.indexOf(heroId);
    if (idx === -1) {
      this.globalBannedHeroIds.push(heroId);
    } else {
      this.globalBannedHeroIds.splice(idx, 1);
    }
  },

  clearGlobalBans() {
    this.globalBannedHeroIds = [];
  },

  toggleManualLane(slotIndex, laneId) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    const idx = slot.manualExcludedLanes.indexOf(laneId);
    if (idx === -1) {
      slot.manualExcludedLanes.push(laneId);
    } else {
      slot.manualExcludedLanes.splice(idx, 1);
    }
  },

  setSlotLane(slotIndex, laneId) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    if (slot.selectedLane !== laneId) {
      slot.selectedLane = laneId;
      slot.selectedHero = null;
    }
  },

  setSlotHero(slotIndex, hero) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    slot.selectedHero = hero;
  },

  // Export results formatted for Discord
  formatDiscordResults() {
    const lines = this.slots.map(s => {
      const laneObj = LANES.find(l => l.id === s.selectedLane);
      const laneName = laneObj ? laneObj.name : 'No Lane';
      if (s.selectedHero) {
        const tier = s.selectedHero.lanes[s.selectedLane] || s.selectedHero.defaultTier || '?';
        return `${s.name}: ${laneName} - ${s.selectedHero.nameEn} / ${s.selectedHero.nameJa} [${tier}]`;
      }
      return `${s.name}: ${laneName} - (No Hero)`;
    });
    return lines.join('\n');
  },

  // Generate Party Share URL
  generateShareUrl() {
    const params = new URLSearchParams();
    LANES.forEach(l => {
      const slot = this.slots.find(s => s.selectedLane === l.id && s.selectedHero);
      if (slot && slot.selectedHero) {
        const val = slot.name ? `${slot.selectedHero.no}:${encodeURIComponent(slot.name)}` : `${slot.selectedHero.no}`;
        params.set(l.queryKey, val);
      }
    });
    const url = new URL(window.location.href);
    url.search = params.toString();
    return url.toString();
  },

  // Import from Query String
  importFromUrlParams(searchParams) {
    const laneConfigs = [];
    LANES.forEach(l => {
      const raw = searchParams.get(l.queryKey);
      if (raw) {
        const [heroNoStr, encodedName] = raw.split(':');
        const heroNo = parseInt(heroNoStr, 10);
        const hero = this.heroes.find(h => h.no === heroNo);
        const playerName = encodedName ? decodeURIComponent(encodedName) : null;
        if (hero) {
          laneConfigs.push({
            laneId: l.id,
            hero,
            playerName
          });
        }
      }
    });

    if (laneConfigs.length > 0) {
      this.slots = laneConfigs.map((cfg, idx) => {
        const slot = createDefaultSlot(idx + 1, idx + 1);
        slot.selectedLane = cfg.laneId;
        slot.selectedHero = cfg.hero;
        if (cfg.playerName) {
          slot.name = cfg.playerName;
        }
        return slot;
      });
      this.nextSlotId = this.slots.length + 1;
      return true;
    }
    return false;
  }
});
