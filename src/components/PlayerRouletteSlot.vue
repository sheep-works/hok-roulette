<template>
  <div class="card mb-4 shadow-sm slot-card">
    <!-- Slot Header -->
    <header class="card-header" style="cursor: pointer;" @click.self="toggleCollapse">
      <div class="card-header-title is-flex is-align-items-center" style="gap: 0.75rem;" @click.self="toggleCollapse">
        <span class="tag is-dark is-medium">#{{ slotIndex + 1 }}</span>
        
        <!-- Editable Player Name -->
        <input
          v-model="slot.name"
          class="input is-small is-rounded"
          type="text"
          placeholder="Player Name"
          style="max-width: 150px; font-weight: bold;"
          @click.stop
        />

        <!-- Summary Badge when selected or collapsed -->
        <div class="tags has-addons mb-0" v-if="slot.selectedLane">
          <span class="tag" :class="currentLaneObj?.tagClass || 'is-info'">
            <i class="fa-solid" :class="currentLaneObj?.icon || 'fa-circle'"></i>
            <span class="ml-1">{{ currentLaneObj?.name }}</span>
          </span>
          <span class="tag is-success" v-if="slot.selectedHero">
            {{ slot.selectedHero.nameEn }} / {{ slot.selectedHero.nameJa }}
            <span class="has-text-weight-bold ml-1">[{{ currentHeroTier }}]</span>
          </span>
          <span class="tag is-light" v-else>
            (No Hero)
          </span>
        </div>
      </div>

      <!-- Controls on right -->
      <div class="card-header-icon" @click.stop>
        <!-- Skip Animation Toggle per slot -->
        <label class="checkbox mr-3 is-size-7" title="Skip animation for instant roll">
          <input type="checkbox" v-model="slot.skipAnimation" />
          <span class="ml-1">Instant</span>
        </label>

        <!-- Collapse Toggle -->
        <button class="button is-small is-ghost" @click="toggleCollapse" :title="slot.isCollapsed ? 'Expand' : 'Collapse'">
          <span class="icon">
            <i class="fa-solid" :class="slot.isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
          </span>
        </button>

        <!-- Remove Slot Button (if more than 1 slot) -->
        <button
          v-if="store.slots.length > 1"
          class="button is-small is-danger is-light ml-1"
          title="Remove Player Slot"
          @click="store.removeSlot(slot.id)"
        >
          <span class="icon is-small">
            <i class="fa-solid fa-trash-can"></i>
          </span>
        </button>
      </div>
    </header>

    <!-- Slot Body -->
    <div class="card-content" v-show="!slot.isCollapsed">
      <!-- ================= STEP 1: LANE SELECTION ================= -->
      <div class="mb-4">
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
          <label class="label is-small mb-0">
            <span class="tag is-info is-light mr-1">Step 1</span>
            Select or Roll Lane
          </label>
          <span class="is-size-7 has-text-grey">
            Click available lane to toggle exclude. Locked lanes already picked by upper players.
          </span>
        </div>

        <!-- Lane Buttons -->
        <div class="buttons are-small mb-2">
          <button
            v-for="lane in LANES"
            :key="lane.id"
            class="button"
            :class="getLaneButtonClass(lane.id)"
            :disabled="isLaneAutoLocked(lane.id)"
            @click="handleLaneClick(lane.id)"
          >
            <span class="icon is-small">
              <i
                class="fa-solid"
                :class="
                  isLaneAutoLocked(lane.id)
                    ? 'fa-lock'
                    : isLaneManuallyExcluded(lane.id)
                    ? 'fa-ban'
                    : lane.icon
                "
              ></i>
            </span>
            <span>{{ lane.name }}</span>
            <span v-if="slot.selectedLane === lane.id" class="icon is-small ml-1 has-text-warning">
              <i class="fa-solid fa-check"></i>
            </span>
          </button>
        </div>

        <!-- Lane Roll Buttons -->
        <div class="field is-grouped">
          <p class="control">
            <button
              class="button is-info is-small"
              :class="{ 'is-loading': isRollingLane }"
              :disabled="availableLanes.length === 0"
              @click="rollLaneAction"
            >
              <span class="icon is-small"><i class="fa-solid fa-shuffle"></i></span>
              <span>Roll Lane</span>
            </button>
          </p>
          <p class="control">
            <button
              class="button is-primary is-small"
              :class="{ 'is-loading': isRollingLane || isRollingHero }"
              :disabled="availableLanes.length === 0"
              @click="rollBothAction"
            >
              <span class="icon is-small"><i class="fa-solid fa-bolt"></i></span>
              <span>Roll Both (Lane + Hero)</span>
            </button>
          </p>
          <p class="control" v-if="slot.manualExcludedLanes.length > 0">
            <button class="button is-ghost is-small has-text-grey" @click="slot.manualExcludedLanes = []">
              Clear Excluded Lanes
            </button>
          </p>
        </div>

        <!-- Animated Lane Display during roll -->
        <div
          v-if="isRollingLane"
          class="notification is-info is-light py-2 px-3 mt-2 is-flex is-align-items-center is-justify-content-space-between"
          style="cursor: pointer;"
          @click="skipLaneAnimation"
          title="Click to stop shuffle immediately"
        >
          <div>
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            Rolling Lane: <strong class="is-size-6">{{ displayLaneName }}</strong>
          </div>
          <span class="tag is-white is-size-7">Click to Skip</span>
        </div>
      </div>

      <hr class="my-3" />

      <!-- ================= STEP 2: TIER FILTER & HERO ROLL ================= -->
      <div>
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
          <label class="label is-small mb-0">
            <span class="tag is-success is-light mr-1">Step 2</span>
            Tier Filter & Hero Roll
          </label>
          <span class="is-size-7 has-text-grey" v-if="!slot.selectedLane">
            Please assign or roll a lane in Step 1 first.
          </span>
          <span class="is-size-7 has-text-grey" v-else>
            {{ eligibleHeroes.length }} eligible / {{ lanePoolHeroes.length }} pool
          </span>
        </div>

        <!-- Tier Checkboxes & Helpers -->
        <div class="is-flex is-align-items-center is-flex-wrap-wrap mb-3" style="gap: 0.75rem;" v-if="slot.selectedLane">
          <span class="is-size-7 has-text-weight-bold">Tiers:</span>
          <label
            v-for="tier in ALL_TIERS"
            :key="tier"
            class="checkbox is-size-7"
            :class="{ 'has-text-weight-bold': slot.selectedTiers.includes(tier) }"
          >
            <input
              type="checkbox"
              :value="tier"
              v-model="slot.selectedTiers"
            />
            <span class="ml-1">{{ tier }}</span>
          </label>
          <div class="buttons are-small mb-0 ml-2">
            <button class="button is-ghost is-small py-0 px-1 is-size-7" @click="selectAllTiers">All</button>
            <span class="has-text-grey-light">|</span>
            <button class="button is-ghost is-small py-0 px-1 is-size-7" @click="selectNoTiers">None</button>
          </div>
        </div>

        <!-- Selected Hero Display / Shuffle Display Card -->
        <div
          v-if="slot.selectedHero || isRollingHero"
          class="box p-3 mb-3 hero-result-box"
          :class="{ 'is-shuffling': isRollingHero }"
          @click="isRollingHero ? skipHeroAnimation() : null"
          :title="isRollingHero ? 'Click to stop immediately' : ''"
        >
          <div class="is-flex is-align-items-center is-justify-content-space-between">
            <div class="is-flex is-align-items-center" style="gap: 0.75rem;">
              <span class="icon is-medium has-text-primary">
                <i class="fa-solid fa-crown fa-lg" v-if="!isRollingHero"></i>
                <i class="fa-solid fa-spinner fa-spin fa-lg" v-else></i>
              </span>
              <div>
                <div class="is-size-5 has-text-weight-bold">
                  {{ displayHeroObj?.nameEn || '---' }} / {{ displayHeroObj?.nameJa || '---' }}
                </div>
                <div class="is-size-7 has-text-grey">
                  <span>Role: {{ displayHeroObj?.role || 'Fighter' }}</span>
                  <span class="mx-1">•</span>
                  <span>Lane Tier: <span class="tag is-warning is-light is-rounded has-text-weight-bold">{{ displayHeroTier }}</span></span>
                </div>
              </div>
            </div>

            <div>
              <span v-if="isRollingHero" class="tag is-info is-light is-size-7">Click to Skip</span>
              <span v-else class="tag is-success is-light is-rounded">Assigned</span>
            </div>
          </div>
        </div>

        <!-- Hero Roll Controls -->
        <div class="field is-grouped mb-3" v-if="slot.selectedLane">
          <p class="control">
            <button
              class="button is-success is-small"
              :class="{ 'is-loading': isRollingHero }"
              :disabled="eligibleHeroes.length === 0"
              @click="rollHeroAction"
            >
              <span class="icon is-small"><i class="fa-solid fa-dice"></i></span>
              <span>{{ slot.selectedHero ? 'Reroll Hero' : 'Roll Hero' }}</span>
            </button>
          </p>
          <p class="control" v-if="slot.selectedHero">
            <button class="button is-ghost is-small has-text-grey" @click="slot.selectedHero = null">
              Clear Hero
            </button>
          </p>
        </div>

        <div v-if="slot.selectedLane && eligibleHeroes.length === 0" class="notification is-warning is-light py-2 px-3 is-size-7 mb-3">
          <i class="fa-solid fa-triangle-exclamation mr-1"></i>
          No eligible heroes available! Adjust tier filters or unban heroes below.
        </div>

        <!-- Filtered Hero Pool Chips (Click to Ban/Unban) -->
        <div v-if="slot.selectedLane && lanePoolHeroes.length > 0" class="hero-pool-container">
          <div class="is-size-7 has-text-grey mb-1 is-flex is-justify-content-space-between is-align-items-center">
            <span>Hero Pool (Click any hero chip to BAN / UNBAN globally):</span>
            <button
              v-if="store.globalBannedHeroIds.length > 0"
              class="button is-ghost is-small p-0 is-size-7 has-text-danger"
              @click="store.clearGlobalBans()"
            >
              Clear Global BANs ({{ store.globalBannedHeroIds.length }})
            </button>
          </div>
          <div class="tags are-small">
            <span
              v-for="hero in lanePoolHeroes"
              :key="hero.id"
              class="tag hero-chip"
              :class="getHeroChipClass(hero)"
              @click="handleHeroChipClick(hero)"
              :title="getHeroChipTitle(hero)"
            >
              <span v-if="isHeroAutoLocked(hero.id)" class="icon is-small mr-1">
                <i class="fa-solid fa-lock"></i>
              </span>
              <span v-else-if="store.globalBannedHeroIds.includes(hero.id)" class="icon is-small mr-1 has-text-danger">
                <i class="fa-solid fa-ban"></i>
              </span>
              <span>{{ hero.nameEn }} / {{ hero.nameJa }}</span>
              <span class="has-text-weight-bold ml-1">[{{ hero.lanes[slot.selectedLane] }}]</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { store, LANES, ALL_TIERS } from '../stores/rouletteStore.js';

const props = defineProps({
  slot: {
    type: Object,
    required: true,
  },
  slotIndex: {
    type: Number,
    required: true,
  },
});

// Animation state
const isRollingLane = ref(false);
const isRollingHero = ref(false);
const displayLaneId = ref(null);
const displayHero = ref(null);

let laneTimer = null;
let heroTimer = null;
let targetLaneId = null;
let targetHeroObj = null;

// Computed Properties
const currentLaneObj = computed(() => {
  return LANES.find(l => l.id === props.slot.selectedLane);
});

const currentHeroTier = computed(() => {
  if (!props.slot.selectedHero || !props.slot.selectedLane) return '';
  return props.slot.selectedHero.lanes[props.slot.selectedLane] || props.slot.selectedHero.defaultTier;
});

const displayLaneName = computed(() => {
  const lane = LANES.find(l => l.id === displayLaneId.value);
  return lane ? lane.name : '';
});

const displayHeroObj = computed(() => {
  return isRollingHero.value ? displayHero.value : props.slot.selectedHero;
});

const displayHeroTier = computed(() => {
  const h = displayHeroObj.value;
  if (!h || !props.slot.selectedLane) return '-';
  return h.lanes[props.slot.selectedLane] || h.defaultTier || '-';
});

const disabledLanes = computed(() => {
  return store.getDisabledLanes(props.slotIndex);
});

const availableLanes = computed(() => {
  return LANES.filter(l => !disabledLanes.value.includes(l.id));
});

const eligibleHeroes = computed(() => {
  return store.getEligibleHeroes(props.slotIndex);
});

const lanePoolHeroes = computed(() => {
  return store.getLaneHeroPool(props.slotIndex);
});

// Helpers
const toggleCollapse = () => {
  props.slot.isCollapsed = !props.slot.isCollapsed;
};

const isLaneAutoLocked = (laneId) => {
  return store.getAutoExcludedLanes(props.slotIndex).includes(laneId);
};

const isLaneManuallyExcluded = (laneId) => {
  return props.slot.manualExcludedLanes.includes(laneId);
};

const isHeroAutoLocked = (heroId) => {
  return store.getAutoExcludedHeroIds(props.slotIndex).includes(heroId);
};

const getLaneButtonClass = (laneId) => {
  if (isLaneAutoLocked(laneId)) {
    return 'is-static is-light has-text-grey';
  }
  if (isLaneManuallyExcluded(laneId)) {
    return 'is-light has-text-grey is-outlined';
  }
  if (props.slot.selectedLane === laneId) {
    const laneObj = LANES.find(l => l.id === laneId);
    return `${laneObj?.tagClass || 'is-primary'} is-light has-text-weight-bold`;
  }
  return 'is-light';
};

const handleLaneClick = (laneId) => {
  if (isLaneAutoLocked(laneId)) return;
  store.toggleManualLane(props.slotIndex, laneId);
  if (props.slot.selectedLane === laneId && props.slot.manualExcludedLanes.includes(laneId)) {
    store.setSlotLane(props.slotIndex, null);
  }
};

const selectAllTiers = () => {
  props.slot.selectedTiers = [...ALL_TIERS];
};

const selectNoTiers = () => {
  props.slot.selectedTiers = [];
};

// ================= ROULETTE ANIMATION LOGIC =================
const rollLaneAction = (callback) => {
  if (availableLanes.value.length === 0) return;

  const randomIndex = Math.floor(Math.random() * availableLanes.value.length);
  targetLaneId = availableLanes.value[randomIndex].id;

  const shouldSkip = props.slot.skipAnimation || store.globalSkipAnimation;
  if (shouldSkip) {
    store.setSlotLane(props.slotIndex, targetLaneId);
    if (typeof callback === 'function') callback();
    return;
  }

  isRollingLane.value = true;
  let delay = 40;

  const step = () => {
    const randomPick = availableLanes.value[Math.floor(Math.random() * availableLanes.value.length)];
    displayLaneId.value = randomPick.id;

    delay = Math.round(delay * 1.22);
    if (delay > 220) {
      skipLaneAnimation();
      if (typeof callback === 'function') callback();
    } else {
      laneTimer = setTimeout(step, delay);
    }
  };

  step();
};

const skipLaneAnimation = () => {
  if (laneTimer) {
    clearTimeout(laneTimer);
    laneTimer = null;
  }
  isRollingLane.value = false;
  if (targetLaneId) {
    store.setSlotLane(props.slotIndex, targetLaneId);
    displayLaneId.value = targetLaneId;
  }
};

const rollHeroAction = () => {
  if (!props.slot.selectedLane || eligibleHeroes.value.length === 0) return;

  const randomIndex = Math.floor(Math.random() * eligibleHeroes.value.length);
  targetHeroObj = eligibleHeroes.value[randomIndex];

  const shouldSkip = props.slot.skipAnimation || store.globalSkipAnimation;
  if (shouldSkip) {
    store.setSlotHero(props.slotIndex, targetHeroObj);
    return;
  }

  isRollingHero.value = true;
  let delay = 40;

  const step = () => {
    const randomPick = eligibleHeroes.value[Math.floor(Math.random() * eligibleHeroes.value.length)];
    displayHero.value = randomPick;

    delay = Math.round(delay * 1.22);
    if (delay > 220) {
      skipHeroAnimation();
    } else {
      heroTimer = setTimeout(step, delay);
    }
  };

  step();
};

const skipHeroAnimation = () => {
  if (heroTimer) {
    clearTimeout(heroTimer);
    heroTimer = null;
  }
  isRollingHero.value = false;
  if (targetHeroObj) {
    store.setSlotHero(props.slotIndex, targetHeroObj);
    displayHero.value = targetHeroObj;
  }
};

const rollBothAction = () => {
  rollLaneAction(() => {
    setTimeout(() => {
      rollHeroAction();
    }, 150);
  });
};

// Hero pool chip interactions
const handleHeroChipClick = (hero) => {
  if (isHeroAutoLocked(hero.id)) return;
  store.toggleGlobalBan(hero.id);
  if (props.slot.selectedHero && props.slot.selectedHero.id === hero.id) {
    store.setSlotHero(props.slotIndex, null);
  }
};

const getHeroChipClass = (hero) => {
  if (isHeroAutoLocked(hero.id)) {
    return 'is-light has-text-grey-light is-static';
  }
  if (store.globalBannedHeroIds.includes(hero.id)) {
    return 'is-danger is-light is-strikethrough';
  }
  if (props.slot.selectedHero && props.slot.selectedHero.id === hero.id) {
    return 'is-success has-text-weight-bold';
  }
  return 'is-light is-clickable';
};

const getHeroChipTitle = (hero) => {
  if (isHeroAutoLocked(hero.id)) return 'Locked: Selected by an upper player';
  if (store.globalBannedHeroIds.includes(hero.id)) return 'Banned: Click to unban';
  return 'Available: Click to ban';
};
</script>

<style scoped>
.slot-card {
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.slot-card .card-header {
  background-color: var(--bulma-scheme-main-bis, rgba(0, 0, 0, 0.03));
  border-bottom: 1px solid var(--bulma-border-weak, rgba(0, 0, 0, 0.05));
}
.slot-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.is-strikethrough {
  text-decoration: line-through;
  opacity: 0.6;
}
.is-clickable {
  cursor: pointer;
}
.hero-chip {
  cursor: pointer;
  transition: transform 0.1s;
}
.hero-chip:not(.is-static):hover {
  transform: scale(1.04);
}
.hero-result-box {
  border-left: 4px solid #48c78e;
  border-radius: 6px;
}
.hero-result-box.is-shuffling {
  border-left-color: #3e8ed0;
  animation: pulse 0.5s infinite alternate;
  cursor: pointer;
}
@keyframes pulse {
  from {
    opacity: 0.85;
    transform: scale(0.995);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
