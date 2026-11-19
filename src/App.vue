<template>
  <div class="app-container" style="min-height: 100vh;">
    <!-- Navbar -->
    <nav class="navbar has-shadow mb-4" role="navigation" aria-label="main navigation">
      <div class="container">
        <div class="navbar-brand">
          <div class="navbar-item is-flex is-align-items-center" style="gap: 0.5rem;">
            <span class="is-size-4">👑</span>
            <span class="has-text-weight-bold is-size-5">HoK Random Roulette</span>
            <span class="tag is-primary is-rounded is-light ml-1">v{{ appVersion }}</span>
          </div>
        </div>

        <div class="navbar-end">
          <div class="navbar-item">
            <div class="field is-grouped is-align-items-center">
              <!-- Theme Toggle Button -->
              <div class="control mr-2">
                <button
                  class="button is-small is-rounded is-light"
                  @click="toggleTheme"
                  :title="`Current: ${currentTheme.toUpperCase()} mode. Click to switch.`"
                >
                  <span class="icon is-small has-text-warning" v-if="currentTheme === 'dark'">
                    <i class="fa-solid fa-moon"></i>
                  </span>
                  <span class="icon is-small has-text-warning-dark" v-else>
                    <i class="fa-solid fa-sun"></i>
                  </span>
                  <span class="is-size-7 ml-1 has-text-weight-semibold">
                    {{ currentTheme === 'dark' ? 'Dark' : 'Light' }}
                  </span>
                </button>
              </div>

              <!-- Global Instant / Skip Animation -->
              <div class="control mr-3">
                <label class="checkbox is-size-7 is-flex is-align-items-center">
                  <input type="checkbox" v-model="store.globalSkipAnimation" />
                  <span class="ml-1">Instant Roll</span>
                </label>
              </div>

              <!-- Switch to Share View if applicable -->
              <div class="control" v-if="hasAssignedHeroes">
                <button class="button is-small is-link is-light" @click="isPartyShareView = !isPartyShareView">
                  <span class="icon is-small">
                    <i class="fa-solid" :class="isPartyShareView ? 'fa-pen-to-square' : 'fa-users-viewfinder'"></i>
                  </span>
                  <span>{{ isPartyShareView ? 'Open Roulette' : 'Party Summary' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Container -->
    <div class="container px-3 pb-6" style="max-width: 960px;">
      <!-- Toast Notification -->
      <div v-if="toastMessage" class="notification is-success is-light toast-notification shadow">
        <span class="icon mr-1"><i class="fa-solid fa-check"></i></span>
        <span>{{ toastMessage }}</span>
      </div>

      <!-- ================= PARTY SHARE SUMMARY VIEW ================= -->
      <div v-if="isPartyShareView" class="party-share-view">
        <div class="card shadow mb-5">
          <header class="card-header has-background-primary-dark">
            <p class="card-header-title has-text-white is-size-5 is-justify-content-space-between">
              <span><i class="fa-solid fa-users mr-2"></i>Honor of Kings Party Lineup</span>
              <span class="tag is-white is-rounded has-text-weight-bold">Shared Lineup</span>
            </p>
          </header>
          <div class="card-content">
            <p class="subtitle is-6 has-text-grey mb-4">
              Assigned lanes and heroes for the current team match:
            </p>

            <div class="columns is-multiline">
              <div v-for="lane in LANES" :key="lane.id" class="column is-12-mobile is-half-tablet">
                <div class="box p-3 is-flex is-align-items-center" style="gap: 1rem; border-left: 5px solid;" :style="{ borderLeftColor: getLaneColor(lane.id) }">
                  <span class="icon is-medium" :class="`has-text-${lane.tagClass.replace('is-', '')}`">
                    <i class="fa-solid fa-2x" :class="lane.icon"></i>
                  </span>
                  <div style="flex-grow: 1;">
                    <div class="is-flex is-justify-content-space-between is-align-items-center">
                      <span class="tag" :class="lane.tagClass">{{ lane.name }}</span>
                      <span class="is-size-7 has-text-grey has-text-weight-bold">
                        {{ getAssignedSlot(lane.id)?.name || 'Unassigned' }}
                      </span>
                    </div>
                    <div class="mt-2" v-if="getAssignedHero(lane.id)">
                      <div class="is-size-6 has-text-weight-bold">
                        {{ getAssignedHero(lane.id).nameEn }} / {{ getAssignedHero(lane.id).nameJa }}
                      </div>
                      <div class="is-size-7 has-text-grey">
                        <span>Tier: <strong class="tag is-warning is-light is-small">{{ getAssignedHero(lane.id).lanes[lane.id] || getAssignedHero(lane.id).defaultTier }}</strong></span>
                        <span class="mx-1">•</span>
                        <span>{{ getAssignedHero(lane.id).role }}</span>
                      </div>
                    </div>
                    <div class="mt-2 has-text-grey-light is-italic is-size-7" v-else>
                      (No Hero Assigned)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Share View Actions -->
            <div class="buttons is-centered mt-5">
              <button class="button is-primary" @click="isPartyShareView = false">
                <span class="icon"><i class="fa-solid fa-pen-to-square"></i></span>
                <span>Edit / Open in Roulette</span>
              </button>
              <button class="button is-info is-light" @click="copyShareUrl">
                <span class="icon"><i class="fa-solid fa-link"></i></span>
                <span>Copy Share URL</span>
              </button>
              <button class="button is-dark is-light" @click="copyDiscordResults">
                <span class="icon"><i class="fa-brands fa-discord"></i></span>
                <span>Copy Discord Lineup</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= MAIN ROULETTE VIEW ================= -->
      <div v-else>
        <!-- Global Action Toolbar -->
        <div class="level mb-4 is-mobile is-flex-wrap-wrap" style="gap: 0.5rem;">
          <div class="level-left">
            <div class="level-item buttons are-small mb-0">
              <!-- Add Player (Header) -->
              <button
                class="button is-primary"
                :disabled="store.slots.length >= 5"
                @click="store.addSlot()"
              >
                <span class="icon is-small"><i class="fa-solid fa-user-plus"></i></span>
                <span>Add Player ({{ store.slots.length }}/5)</span>
              </button>

              <!-- Reset All -->
              <button class="button is-danger is-light" @click="confirmReset">
                <span class="icon is-small"><i class="fa-solid fa-rotate-left"></i></span>
                <span>Reset All</span>
              </button>
            </div>
          </div>

          <div class="level-right">
            <div class="level-item buttons are-small mb-0">
              <!-- Copy Discord -->
              <button class="button is-info is-light" @click="copyDiscordResults">
                <span class="icon is-small"><i class="fa-brands fa-discord"></i></span>
                <span>Copy Results</span>
              </button>

              <!-- Copy Share URL -->
              <button class="button is-link is-light" @click="copyShareUrl">
                <span class="icon is-small"><i class="fa-solid fa-share-nodes"></i></span>
                <span>Copy Share URL</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Global Banned Heroes Alert (if any) -->
        <div v-if="store.globalBannedHeroIds.length > 0" class="notification is-danger is-light py-2 px-3 mb-4 is-size-7 is-flex is-justify-content-space-between is-align-items-center">
          <div>
            <i class="fa-solid fa-ban mr-1"></i>
            <strong>{{ store.globalBannedHeroIds.length }}</strong> heroes globally banned across all slots.
          </div>
          <button class="button is-ghost is-small p-0 is-size-7 has-text-danger" @click="store.clearGlobalBans()">
            Clear All BANs
          </button>
        </div>

        <!-- Slot List -->
        <div class="slots-container">
          <template v-for="(slot, index) in store.slots" :key="slot.id">
            <PlayerRouletteSlot
              :slot="slot"
              :slotIndex="index"
            />
            <!-- Divider & Margin between cards -->
            <hr v-if="index < store.slots.length - 1" class="my-5 slot-divider" />
          </template>
        </div>

        <!-- Add Player Button at Bottom of Slot List -->
        <div class="mt-4 mb-4" v-if="store.slots.length < 5">
          <button
            class="button is-primary is-outlined is-fullwidth py-4 has-text-weight-bold"
            @click="store.addSlot()"
            style="border-style: dashed; border-width: 2px;"
          >
            <span class="icon"><i class="fa-solid fa-user-plus"></i></span>
            <span>+ Add Player {{ store.slots.length + 1 }} ({{ store.slots.length }}/5)</span>
          </button>
        </div>
        <div v-else class="notification is-light py-2 px-3 has-text-centered is-size-7 has-text-grey mt-3 mb-4">
          <i class="fa-solid fa-users mr-1"></i>
          Party is full with 5 players.
        </div>

        <!-- Quick Tips Footer -->
        <div class="content is-size-7 has-text-grey mt-5 has-text-centered">
          <p>
            💡 <strong>Draft Tips:</strong> Roll slots sequentially from Player 1 to 5. Lanes and heroes locked in upper slots are automatically excluded below.
            Click any hero chip to BAN heroes dynamically!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { store, LANES } from './stores/rouletteStore.js';
import PlayerRouletteSlot from './components/PlayerRouletteSlot.vue';

const appVersion = __APP_VERSION__;

const isPartyShareView = ref(false);
const toastMessage = ref('');
const currentTheme = ref('light');

let toastTimer = null;
const showToast = (msg) => {
  if (toastTimer) clearTimeout(toastTimer);
  toastMessage.value = msg;
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
    toastTimer = null;
  }, 2500);
};

const setTheme = (theme) => {
  currentTheme.value = theme;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('hok_theme', theme);
  }
};

const toggleTheme = () => {
  setTheme(currentTheme.value === 'dark' ? 'light' : 'dark');
};

const hasAssignedHeroes = computed(() => {
  return store.slots.some(s => s.selectedHero != null);
});

const getLaneColor = (laneId) => {
  switch (laneId) {
    case 'clash': return '#f14668';
    case 'jungle': return '#ffe08a';
    case 'mid': return '#485fc7';
    case 'farm': return '#00d1b2';
    case 'roam': return '#48c78e';
    default: return '#ccc';
  }
};

const getAssignedSlot = (laneId) => {
  return store.slots.find(s => s.selectedLane === laneId);
};

const getAssignedHero = (laneId) => {
  const slot = getAssignedSlot(laneId);
  return slot ? slot.selectedHero : null;
};

const confirmReset = () => {
  if (confirm('Reset all player slots, lane assignments, and bans?')) {
    store.resetAll();
    showToast('All slots and bans reset!');
  }
};

const copyDiscordResults = async () => {
  const text = store.formatDiscordResults();
  try {
    await navigator.clipboard.writeText(text);
    showToast('Discord results copied to clipboard!');
  } catch (err) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('Discord results copied to clipboard!');
  }
};

const copyShareUrl = async () => {
  const url = store.generateShareUrl();
  try {
    await navigator.clipboard.writeText(url);
    showToast('Share URL copied to clipboard!');
  } catch (err) {
    const el = document.createElement('textarea');
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('Share URL copied to clipboard!');
  }
};

onMounted(() => {
  // Initialize theme from storage or default to light
  const savedTheme = localStorage.getItem('hok_theme') || 'light';
  setTheme(savedTheme);

  // Check if URL has query params for party share
  if (typeof window !== 'undefined' && window.location.search) {
    const searchParams = new URLSearchParams(window.location.search);
    const hasAnyLaneKey = LANES.some(l => searchParams.has(l.queryKey));
    if (hasAnyLaneKey) {
      const imported = store.importFromUrlParams(searchParams);
      if (imported) {
        isPartyShareView.value = true;
      }
    }
  }
});
</script>

<style>
.toast-notification {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  min-width: 250px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.party-share-view .box {
  transition: transform 0.15s ease-in-out;
}
.party-share-view .box:hover {
  transform: translateY(-2px);
}

.slot-divider {
  background-color: var(--bulma-border-weak, rgba(0, 0, 0, 0.12));
  height: 1px;
  border: none;
  opacity: 0.6;
}
</style>
