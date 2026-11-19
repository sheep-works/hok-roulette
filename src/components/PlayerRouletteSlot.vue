<template>
  <div
    class="card mb-0 shadow-sm slot-card"
    :class="{ 'is-even-slot': slotIndex % 2 === 1, 'is-odd-slot': slotIndex % 2 === 0 }"
  >
    <!-- Slot Header -->
    <header class="card-header" style="cursor: pointer;" @click.self="toggleCollapse">
      <div class="card-header-title is-flex is-align-items-center" style="gap: 0.75rem;" @click.self="toggleCollapse">
        <span class="tag is-medium" :class="slotIndex % 2 === 1 ? 'is-link' : 'is-dark'">
          #{{ slotIndex + 1 }}
        </span>
        
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

    <!-- Slot Body: 2-Column Layout (Step 1 on Left, Step 2 on Right) -->
    <div class="card-content" v-show="!slot.isCollapsed">
      <div class="columns is-variable is-4 mb-0">
        <!-- ================= LEFT COLUMN: STEP 1 (LANE) ================= -->
        <div class="column is-12-mobile is-6-tablet">
          <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
            <label class="label is-small mb-0">
              <span class="tag is-info is-light mr-1">Step 1</span>
              Lane Selection
            </label>
            <span class="is-size-7 has-text-grey" v-if="slot.selectedLane">
              Selected: <strong class="has-text-info">{{ currentLaneObj?.name }}</strong>
            </span>
          </div>

          <p class="is-size-7 has-text-grey mb-2">
            Click lane to toggle exclude. Locked lanes already taken above.
          </p>

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

          <!-- Lane Display Box (Always visible: Assigned, Shuffling, or NOT SELECTED mock) -->
          <div
            class="box p-3 mb-2 lane-result-box"
            :class="{
              'is-shuffling': isRollingLane,
              'is-empty-mock': !slot.selectedLane && !isRollingLane
            }"
            :style="laneBoxBorderColor ? { borderLeftColor: laneBoxBorderColor } : {}"
            @click="isRollingLane ? skipLaneAnimation() : null"
            :title="isRollingLane ? 'Click to stop immediately' : ''"
          >
            <div class="is-flex is-align-items-center is-justify-content-space-between" style="min-height: 44px; width: 100%;">
              <div class="is-flex is-align-items-center" style="gap: 0.6rem; overflow: hidden;">
                <!-- Icon -->
                <span class="icon is-medium" :class="laneBoxIconClass">
                  <i class="fa-solid fa-lg" :class="laneBoxIcon"></i>
                </span>

                <!-- Text Content -->
                <div style="overflow: hidden;">
                  <div
                    class="is-size-6 line-clamp-1"
                    :class="slot.selectedLane || isRollingLane ? 'has-text-weight-bold' : 'has-text-grey has-text-weight-semibold is-italic'"
                  >
                    {{ laneBoxTitle }}
                  </div>
                  <div class="is-size-7 has-text-grey line-clamp-1">
                    {{ laneBoxSubtitle }}
                  </div>
                </div>
              </div>

              <!-- Right badge / action -->
              <div class="is-flex is-align-items-center ml-2" style="flex-shrink: 0; gap: 0.4rem;">
                <span v-if="isRollingLane" class="tag is-info is-light is-size-7">Skip</span>
                <template v-else-if="slot.selectedLane">
                  <span class="tag is-rounded is-small" :class="currentLaneObj?.tagClass || 'is-info'">
                    Assigned
                  </span>
                  <button
                    class="button is-ghost is-small p-0 has-text-grey"
                    title="Clear assigned lane"
                    @click.stop="store.setSlotLane(slotIndex, null)"
                  >
                    <span class="icon is-small"><i class="fa-solid fa-xmark"></i></span>
                  </button>
                </template>
                <span v-else class="tag is-light is-rounded is-small has-text-grey">
                  NOT SELECTED
                </span>
              </div>
            </div>
          </div>

          <!-- Reset Excluded Lanes link if any -->
          <div v-if="slot.manualExcludedLanes.length > 0" class="mb-1">
            <button class="button is-ghost is-small has-text-grey p-0 is-size-7" @click="slot.manualExcludedLanes = []">
              <i class="fa-solid fa-rotate-left mr-1"></i>Reset Excluded Lanes ({{ slot.manualExcludedLanes.length }})
            </button>
          </div>
        </div>

        <!-- ================= RIGHT COLUMN: STEP 2 (HERO) ================= -->
        <div class="column is-12-mobile is-6-tablet right-column-divider">
          <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
            <label class="label is-small mb-0">
              <span class="tag is-success is-light mr-1">Step 2</span>
              Hero Roll & Pool
            </label>
            <span class="is-size-7 has-text-grey" v-if="slot.selectedLane">
              {{ eligibleHeroes.length }} eligible
            </span>
            <span class="is-size-7 has-text-grey-light" v-else>
              Waiting for lane
            </span>
          </div>

          <!-- Tier Checkboxes & Helpers (Always visible) -->
          <div class="is-flex is-align-items-center is-flex-wrap-wrap mb-2" style="gap: 0.5rem;">
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
            <div class="buttons are-small mb-0 ml-1">
              <button class="button is-ghost is-small py-0 px-1 is-size-7" @click="selectAllTiers">All</button>
              <span class="has-text-grey-light">|</span>
              <button class="button is-ghost is-small py-0 px-1 is-size-7" @click="selectNoTiers">None</button>
            </div>
          </div>

          <!-- Hero Display Box (Always visible: Assigned, Shuffling, or NOT SELECTED mock) -->
          <div
            class="box p-3 mb-2 hero-result-box"
            :class="{
              'is-shuffling': isRollingHero,
              'is-empty-mock': !slot.selectedHero && !isRollingHero
            }"
            @click="isRollingHero ? skipHeroAnimation() : null"
            :title="isRollingHero ? 'Click to stop immediately' : ''"
          >
            <div class="is-flex is-align-items-center is-justify-content-space-between" style="min-height: 44px; width: 100%;">
              <div class="is-flex is-align-items-center" style="gap: 0.6rem; overflow: hidden;">
                <!-- Icon -->
                <span class="icon is-medium" :class="heroBoxIconClass">
                  <i class="fa-solid fa-lg" :class="heroBoxIcon"></i>
                </span>

                <!-- Text Content -->
                <div style="overflow: hidden;">
                  <div
                    class="is-size-6 line-clamp-1"
                    :class="slot.selectedHero || isRollingHero ? 'has-text-weight-bold' : 'has-text-grey has-text-weight-semibold is-italic'"
                  >
                    {{ heroBoxTitle }}
                  </div>
                  <div class="is-size-7 has-text-grey line-clamp-1">
                    {{ heroBoxSubtitle }}
                  </div>
                </div>
              </div>

              <!-- Right badge / action -->
              <div class="is-flex is-align-items-center ml-2" style="flex-shrink: 0; gap: 0.4rem;">
                <span v-if="isRollingHero" class="tag is-info is-light is-size-7">Skip</span>
                <template v-else-if="slot.selectedHero">
                  <span class="tag is-success is-light is-rounded is-small">Assigned</span>
                  <button
                    class="button is-ghost is-small p-0 has-text-grey"
                    title="Clear assigned hero"
                    @click.stop="slot.selectedHero = null"
                  >
                    <span class="icon is-small"><i class="fa-solid fa-xmark"></i></span>
                  </button>
                </template>
                <span v-else class="tag is-light is-rounded is-small has-text-grey">
                  NOT SELECTED
                </span>
              </div>
            </div>
          </div>

          <!-- Warning if no eligible heroes -->
          <div v-if="slot.selectedLane && eligibleHeroes.length === 0" class="notification is-warning is-light py-1 px-2 is-size-7 mb-2">
            <i class="fa-solid fa-triangle-exclamation mr-1"></i>
            No eligible heroes! Adjust tiers or unban heroes below.
          </div>

          <!-- Collapsible Hero Pool Section (Collapsed by Default) -->
            <div v-if="lanePoolHeroes.length > 0" class="hero-pool-collapsible mt-2">
              <button
                class="button is-ghost is-small p-0 is-size-7 has-text-grey is-flex is-align-items-center"
                @click="isHeroPoolExpanded = !isHeroPoolExpanded"
              >
                <span class="icon is-small mr-1">
                  <i class="fa-solid" :class="isHeroPoolExpanded ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                </span>
                <span>
                  {{ isHeroPoolExpanded ? 'Hide Hero Pool' : 'Hero Pool & BANs' }}
                  ({{ lanePoolHeroes.length }} heroes)
                </span>
              </button>

              <!-- Collapsed Content -->
              <div v-show="isHeroPoolExpanded" class="hero-pool-container mt-2 p-2">
                <div class="is-size-7 mb-1 is-flex is-justify-content-space-between is-align-items-center">
                  <span class="has-text-grey">Click chip to BAN / UNBAN:</span>
                  <button
                    v-if="store.globalBannedHeroIds.length > 0"
                    class="button is-ghost is-small p-0 is-size-7 has-text-danger"
                    @click="store.clearGlobalBans()"
                  >
                    Clear All BANs ({{ store.globalBannedHeroIds.length }})
                  </button>
                </div>
                <div class="tags are-small mb-0">
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

      <!-- ================= CARD FOOTER ACTIONS ================= -->
      <div class="pt-3 mt-3 slot-action-footer">
        <div class="columns is-mobile is-variable is-2 mb-0">
          <!-- Action 1: Roll Lane -->
          <div class="column is-4">
            <button
              class="button is-info is-small is-fullwidth"
              :class="{ 'is-loading': isRollingLane }"
              :disabled="availableLanes.length === 0"
              @click="rollLaneAction"
              title="Randomly pick an available lane"
            >
              <span class="icon is-small"><i class="fa-solid fa-shuffle"></i></span>
              <span>Roll Lane</span>
            </button>
          </div>

          <!-- Action 2: Roll Hero -->
          <div class="column is-4">
            <button
              class="button is-success is-small is-fullwidth"
              :class="{ 'is-loading': isRollingHero }"
              :disabled="!slot.selectedLane || eligibleHeroes.length === 0"
              @click="rollHeroAction"
              :title="slot.selectedLane ? 'Randomly pick an eligible hero' : 'Assign a lane first'"
            >
              <span class="icon is-small"><i class="fa-solid fa-dice"></i></span>
              <span>{{ slot.selectedHero ? 'Reroll Hero' : 'Roll Hero' }}</span>
            </button>
          </div>

          <!-- Action 3: Roll Both -->
          <div class="column is-4">
            <button
              class="button is-primary is-small is-fullwidth has-text-weight-bold"
              :class="{ 'is-loading': isRollingLane || isRollingHero }"
              :disabled="availableLanes.length === 0"
              @click="rollBothAction"
              title="Roll Lane then Hero automatically"
            >
              <span class="icon is-small"><i class="fa-solid fa-bolt"></i></span>
              <span>Roll Both</span>
            </button>
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

// UI State
const isHeroPoolExpanded = ref(false); // Collapsed by default

// Animation state
const isRollingLane = ref(false);
const isRollingHero = ref(false);
const displayLaneId = ref(null);
const displayHero = ref(null);

let laneTimer = null;
let heroTimer = null;
let targetLaneId = null;
let targetHeroObj = null;

const LANE_JA_MAP = {
  clash: 'クラッシュ',
  jungle: 'ジャングル',
  mid: 'ミドル',
  farm: 'ファーム',
  roam: 'ローム'
};

// Computed Properties
const currentLaneObj = computed(() => {
  return LANES.find(l => l.id === props.slot.selectedLane);
});

const laneBoxTitle = computed(() => {
  if (isRollingLane.value) {
    const lane = LANES.find(l => l.id === displayLaneId.value);
    return lane ? `${lane.name} / ${LANE_JA_MAP[lane.id]}` : 'Rolling...';
  }
  if (props.slot.selectedLane) {
    const lane = currentLaneObj.value;
    return lane ? `${lane.name} / ${LANE_JA_MAP[lane.id]}` : props.slot.selectedLane;
  }
  return 'NOT SELECTED';
});

const laneBoxSubtitle = computed(() => {
  if (isRollingLane.value) {
    return 'Rolling lane... Click to stop';
  }
  if (props.slot.selectedLane) {
    return 'Assigned Lane • Click lane above to change';
  }
  return 'Pick a lane above or click Roll Lane below';
});

const laneBoxIcon = computed(() => {
  if (isRollingLane.value) return 'fa-spinner fa-spin';
  if (props.slot.selectedLane && currentLaneObj.value) return currentLaneObj.value.icon;
  return 'fa-shield-halved';
});

const laneBoxIconClass = computed(() => {
  if (isRollingLane.value) return 'has-text-info';
  if (props.slot.selectedLane && currentLaneObj.value) {
    return `has-text-${currentLaneObj.value.tagClass.replace('is-', '')}`;
  }
  return 'has-text-grey-light';
});

const laneBoxBorderColor = computed(() => {
  if (isRollingLane.value) return '#3e8ed0';
  if (props.slot.selectedLane) {
    switch (props.slot.selectedLane) {
      case 'clash': return '#f14668';
      case 'jungle': return '#ffe08a';
      case 'mid': return '#485fc7';
      case 'farm': return '#00d1b2';
      case 'roam': return '#48c78e';
      default: return '#3e8ed0';
    }
  }
  return '';
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

// Mock / Result Box Display Computed Properties
const heroBoxTitle = computed(() => {
  if (isRollingHero.value) {
    return `${displayHero.value?.nameEn || '---'} / ${displayHero.value?.nameJa || '---'}`;
  }
  if (props.slot.selectedHero) {
    return `${props.slot.selectedHero.nameEn} / ${props.slot.selectedHero.nameJa}`;
  }
  return 'NOT SELECTED';
});

const heroBoxSubtitle = computed(() => {
  if (isRollingHero.value) {
    const tier = displayHero.value?.lanes?.[props.slot.selectedLane] || '-';
    return `Tier: [${tier}] • Rolling hero...`;
  }
  if (props.slot.selectedHero) {
    const tier = currentHeroTier.value || '-';
    const role = props.slot.selectedHero.role || 'Hero';
    return `Tier: [${tier}] • ${role}`;
  }
  if (props.slot.selectedLane) {
    return "Click 'Roll Hero' or 'Roll Both' below";
  }
  return "Select or roll a lane in Step 1 first";
});

const heroBoxIcon = computed(() => {
  if (isRollingHero.value) return 'fa-spinner fa-spin';
  if (props.slot.selectedHero) return 'fa-crown';
  return 'fa-dice';
});

const heroBoxIconClass = computed(() => {
  if (isRollingHero.value) return 'has-text-info';
  if (props.slot.selectedHero) return 'has-text-primary';
  return 'has-text-grey-light';
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
  transition: box-shadow 0.2s, background-color 0.2s;
  border: 1px solid var(--bulma-border-weak, rgba(0, 0, 0, 0.08));
}
.slot-card.is-odd-slot {
  border-left: 5px solid var(--bulma-primary, #00d1b2);
}
.slot-card.is-even-slot {
  border-left: 5px solid var(--bulma-link, #485fc7);
  background-color: var(--bulma-scheme-main-bis, rgba(0, 0, 0, 0.025));
}
.slot-card.is-even-slot .card-header {
  background-color: var(--bulma-scheme-main-ter, rgba(0, 0, 0, 0.04));
}
.slot-card .card-header {
  background-color: var(--bulma-scheme-main-bis, rgba(0, 0, 0, 0.03));
  border-bottom: 1px solid var(--bulma-border-weak, rgba(0, 0, 0, 0.05));
}
.slot-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.slot-action-footer {
  border-top: 1px solid var(--bulma-border-weak, rgba(0, 0, 0, 0.08));
}
@media (min-width: 769px) {
  .right-column-divider {
    border-left: 1px solid var(--bulma-border-weak, rgba(0, 0, 0, 0.08));
  }
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
.hero-result-box,
.lane-result-box {
  border-left: 4px solid #48c78e;
  border-radius: 6px;
  min-height: 68px;
  display: flex;
  align-items: center;
  transition: border-color 0.2s, background-color 0.2s;
}
.lane-result-box {
  border-left-color: #3e8ed0;
}
.hero-result-box.is-empty-mock,
.lane-result-box.is-empty-mock {
  border-left: 4px dashed var(--bulma-border-weak, rgba(0, 0, 0, 0.2));
  background-color: var(--bulma-scheme-main-bis, rgba(0, 0, 0, 0.02));
}
.hero-result-box.is-shuffling,
.lane-result-box.is-shuffling {
  border-left-color: #3e8ed0;
  border-left-style: solid;
  animation: pulse 0.5s infinite alternate;
  cursor: pointer;
}
.hero-pool-container {
  background: var(--bulma-scheme-main-bis, rgba(0, 0, 0, 0.03));
  border-radius: 6px;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--bulma-border-weak, rgba(0, 0, 0, 0.06));
}
.line-clamp-1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
