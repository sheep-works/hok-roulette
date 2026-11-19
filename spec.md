```
# Honor of Kings (HoK) Random Lane & Hero Roulette - Architecture & Specification

## 1. Project Overview
A lightweight, frontend-only Single Page Application (SPA) built with **Vue 3 (Composition API) + Vite**, designed to be hosted on **GitHub Pages (GHP)**.
The app helps Honor of Kings teams practice and improve team synergy by randomly assigning lanes and heroes with customizable exclusions, Tier filters, and a slot-based sequential drafting workflow.

- **UI Language:** English for all UI labels, buttons, and controls.
- **Hero Display:** Bilingual display (`English Name / 日本語名`, e.g., `Yuhuan / 楊貴妃`) so players using either client language can immediately recognize heroes.
- **Deployment Target:** GitHub Pages (`vite.config.js` must configure `base` appropriately for GHP, or relative `./`).

CSS Framework: Use Bulma (bulma/css/bulma.min.css) for UI styling (card, box, buttons, tags, tag, checkbox, notification). Keep custom <style> blocks minimal.

---

## 2. Directory Structure

```text
├── heroes.csv                  # Master hero data maintained manually
├── scripts/
│   └── csv-to-json.js          # Node.js build script converting heroes.csv -> src/data/heroes.json
├── src/
│   ├── data/
│   │   └── heroes.json         # Generated hero data consumed by the Vue app
│   ├── stores/
│   │   └── rouletteStore.js    # Central reactive state & getters for slots and global bans
│   ├── components/
│   │   └── PlayerRouletteSlot.vue  # Reusable single-player roulette & filter component
│   ├── App.vue                 # Main layout, slot list management (+ Add Player), and global controls
│   └── main.js
├── package.json
└── vite.config.js

```

## 3. Data Pipeline (`heroes.csv` -> `src/data/heroes.json`)

### 3.1 CSV Format (`heroes.csv`)
- Each row represents one unique hero.
- Multi-lane heroes use `|` (or `/`) as delimiters in `lanes` and `tiers`.
- If `tiers` has fewer entries than `lanes` (e.g., 1 tier for 2 lanes), fallback to the first tier (`tierList[0]`).
コード スニペット

```
id,name_ja,name_en,lanes,tiers
angela,アンジェラ,Angela,mid,A
kaizer,カイザー,Kaizer,clash|jungle,A|B
dun,夏侯惇,Dun,clash|roam,S
yuhuan,楊貴妃,Yuhuan,mid|jungle|roam,A|S|B

```

### 3.2 Generated JSON Format (`src/data/heroes.json`)
The conversion script (`node scripts/csv-to-json.js`) transforms `lanes` and `tiers` into a key-value map (`{ [laneId]: tier }`) so lane-specific tiers are O(1) accessible.

JSON

```
[
  {
    "id": "kaizer",
    "nameJa": "カイザー",
    "nameEn": "Kaizer",
    "lanes": {
      "clash": "A",
      "jungle": "B"
    }
  }
]

```

### 3.3 Build Integration (`package.json`)
Hook the conversion script into `dev` and `build`:

JSON

```
"scripts": {
  "convert": "node scripts/csv-to-json.js",
  "dev": "npm run convert && vite",
  "build": "npm run convert && vite build"
}

```

## 4. State Management (`src/stores/rouletteStore.js`)
Use Vue's `reactive()` store pattern (no external state library required) to manage a dynamic list of player slots (1 to 5 players).

### 4.1 Core State
- `globalBannedHeroIds`: `string[]` — Heroes banned across all slots (e.g., draft bans).
- `slots`: `Array` — Starts with 1 slot by default (Solo mode); users can add up to 5 slots (`+ Add Player`).JavaScript
  ```
  {
    id: number,
    name: string,                  // Editable player label (default: "Player 1", "Player 2", ...)
    manualExcludedLanes: string[], // Lanes excluded manually by this player
    selectedLane: string | null,   // Assigned/selected lane ('clash' | 'jungle' | 'mid' | 'farm' | 'roam')
    selectedHero: Hero | null      // Assigned hero object
  }

  ```

### 4.2 Store Getters (Cascading Auto-Exclusion)
<p>Slots are evaluated top-to-bottom (`index = 0` to `slots.length - 1`). Any lane or hero locked in by an upper slot (`0 .. index - 1`) is **automatically disabled/grayed out** in lower slots (`index`), while keeping upper slots independent.

- `getAutoExcludedLanes(index)`: Returns `selectedLane` values from `slots.slice(0, index)`.
- `getAutoExcludedHeroIds(index)`: Returns `selectedHero.id` values from `slots.slice(0, index)`.
- `getDisabledLanes(index)`: Union of `getAutoExcludedLanes(index)` and `slots[index].manualExcludedLanes`.
- `getDisabledHeroIds(index)`: Union of `globalBannedHeroIds` and `getAutoExcludedHeroIds(index)`.

## 5. Component & UX Specification (`PlayerRouletteSlot.vue`)
Each slot is an autonomous unit supporting a **Two-Step Roulette Workflow** (Step 1: Lane -> Step 2: Hero).

### 5.1 Step 1: Lane Selection & Exclusion
- **Lanes:** `Clash` (`clash`), `Jungle` (`jungle`), `Mid` (`mid`), `Farm` (`farm`), `Roam` (`roam`).
- **Visual States for Lane Buttons:**
  1. **Auto-Locked (Upper Slot):** Grayed out with a lock indicator; non-interactive (cannot be toggled here because an upper player already took this lane).
  2. **Manually Excluded:** Dimmed/strikethrough; clicking toggles `manualExcludedLanes`.
  3. **Available:** Normal state; clicking toggles exclusion, or user can roll randomly.
  4. **Selected/Assigned:** Highlighted active state.
- **Actions:**
  - `Roll Lane`: Randomly picks one lane from available (non-disabled) lanes. Clears `selectedHero` if the lane changes.
  - `Roll Both`: Executes `Roll Lane` immediately followed by `Roll Hero`.

### 5.2 Step 2: Tier Filter & Hero Pool (Ban/Grayout)
- **Tier Checkboxes:** `['S+', 'S', 'A', 'B', 'C']` (all checked by default).
  - Evaluates the hero's tier **for the currently **`selectedLane` (`hero.lanes[selectedLane]`).
  - Include quick `All` / `None` toggle helpers so users can easily set fun constraints (e.g., `S+` and `C` only).
- **Filtered Hero Pool List:**
  - Displays all heroes matching `selectedLane` and checked `selectedTiers`.
  - Format: `Angela / アンジェラ [A]`.
  - Clicking a hero chip toggles it in `globalBannedHeroIds` (visually grayed out / strikethrough) so users can ban/exclude heroes on the fly during draft.
  - Heroes already picked in upper slots (`getAutoExcludedHeroIds(index)`) are also visibly locked/grayed out.
- **Actions:**
  - `Roll Hero` (also acts as Reroll): Randomly picks one hero from eligible (filtered & non-banned) candidates.

### 5.3 Roulette Animation & Skip UX
- **Decelerating Shuffle Animation:**
  - When rolling a lane or hero, cycle through random valid candidates using recursive `setTimeout` with increasing intervals (e.g., starting at `40ms`, multiplying delay by `~1.22x` until `> 220ms`, total duration ~0.8–1.2s) before landing on the pre-determined result.
- **Draft-Friendly Skip Controls:**
  1. Global or per-slot `Skip Animation` checkbox for instant 0ms results during time-pressured drafts.
  2. Clicking the roll button (or result card) while an animation is actively spinning immediately cancels the timer and snaps to the final result.

### 5.4 Multi-Player Layout & Discord Export (`App.vue`)
- **Slot Management:**
  - Header controls: `+ Add Player` (up to 5), `Reset All`, and `Copy Results` (formats all assigned `PlayerName: Lane - Hero (Tier)` lines to clipboard for pasting into Discord).
  - Individual slots can be removed (minimum 1 slot) or collapsed/expanded once confirmed so multi-player screens remain compact on mobile devices.
## 6. Party Share View (Query String State) - **Immutable Numeric ID (`no`):** Add a numeric `no` column to `heroes.csv` (1, 2, 3...) so query parameters stay permanently valid even if rows are reordered or new heroes are added later. - **URL Format:** Encode assigned lanes and hero `no` (and optional player names) into compact query strings: - Example: `?cl=3&jg=15&md=1&fm=8&rm=21` (or `?cl=3:Alice&jg=15:Bob` if custom player names are set). - Lane keys: `cl` (Clash), `jg` (Jungle), `md` (Mid), `fm` (Farm), `rm` (Roam). - **Dynamic View Switching (No Vue Router needed):** - On app mount, inspect `window.location.search`. If any lane query key exists, render a clean, read-only **Party Summary Card** view displaying the 5 roles, assigned heroes (English / Japanese), Tier tags, and player names. - Include a `"Edit / Open in Roulette"` button on the Share View that imports the shared state into `rouletteStore` and switches back to the interactive roulette mode. - Add a `"Copy Share URL"` button in the main view to generate and copy the parameterized URL to the clipboard.