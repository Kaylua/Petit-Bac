# Chantier — Petit Bac

## Vue d'ensemble du projet

Jeu de "Petit Bac" multijoueur en temps réel dans le navigateur. Pas de compte requis : pseudo → jouer.
Anciennement hébergé sur `bac.morel.games`. Auteur original : Amaury Carrade.

---

## Architecture

```
ProjetPetitBac/
├── pitit-bac/
│   ├── back/        — Serveur Node.js WebSocket (gère la logique de jeu)
│   ├── front/       — Front Vue 2 + Buefy + Vuex
│   ├── commons/     — Code partagé back/front (vérification réponses, calcul votes)
│   ├── munin/       — Monitoring optionnel (métriques parties)
│   └── production/  — Config nginx + systemd pour déploiement
└── morel-games-core-master/
    — Framework maison réutilisable pour jeux multijoueurs WebSocket
    — Fournit : MorelClient, MorelStore, MorelI18n, composants Vue (lobby, joueurs, pseudo)
    — Définit le protocole WebSocket de base (morel-base-protocol.md)
```

### Stack d'origine (avant chantier)

| Couche | Techno | Version | État |
|--------|--------|---------|------|
| Front framework | Vue | 2.6 | Fin de vie fin 2023 |
| UI components | Buefy | 0.8 | Abandonné |
| State management | Vuex | 3 | Remplacé par Pinia pour Vue 3 |
| Build tool | @vue/cli | 4.2 | Très outdated |
| i18n | vue-i18n | 8.17 | Vue 2 only |
| Icons | @fortawesome/vue-fontawesome | 0.1.x | Vue 2 only |
| Back runtime | Node.js | 16 (cible) / 22 (dispo) | OK |
| Back transport | websocket (npm) | 1.0.31 | OK |

### Stack après Phase 1

| Couche | Techno | Version | État |
|--------|--------|---------|------|
| Front framework | Vue | **2.7.16** | ✅ Dernière version 2.x, Composition API incluse |
| UI components | Buefy | 0.8.13 | ⚠️ Abandonné — sera remplacé en Phase 2 |
| State management | Vuex | **3.6.2** | ⚠️ Sera remplacé par Pinia en Phase 2 |
| Build tool | **Vite** | **5.4.x** | ✅ Remplace @vue/cli |
| i18n | vue-i18n | **8.28.2** | ⚠️ v9 requiert Vue 3, sera upgradé en Phase 2 |
| Icons | @fortawesome/vue-fontawesome | **2.0.10** | ⚠️ v3 requiert Vue 3, sera upgradé en Phase 2 |
| Back runtime | Node.js | 22 (dispo) | ✅ OK |
| Back transport | websocket (npm) | 1.0.31 | ✅ OK |

### Stack après Phase 2 (état actuel)

| Couche | Techno | Version | État |
|--------|--------|---------|------|
| Front framework | Vue | **3.5.x** | ✅ Options API + Composition API |
| UI components | **Oruga + Bulma theme** | **0.13.x / 0.9.x** | ✅ Successeur de Buefy, même base Bulma |
| State management | **Pinia** | **2.2.x** | ✅ Remplace Vuex |
| Build tool | Vite | 5.4.x | ✅ |
| i18n | vue-i18n | **9.14.x** | ✅ `legacy: true` pour Options API |
| Icons | @fortawesome/vue-fontawesome | **3.0.x** + FA6 | ✅ |
| morel-games-core | ESM, Pinia, vue-i18n v9 | **2.0.0** | ✅ Réécriture complète |
| Back runtime | Node.js | 22 (dispo) | ✅ OK |
| Back transport | websocket (npm) | 1.0.31 | ✅ OK |

### Dépendances notables

- `morel-games-core` : dépendance Git (`git://github.com/MorelGames/morel-games-core.git`) — fragile, pas versionnée. Le repo est maintenant dans le projet directement.
- `ptitbac-commons` : dépendance locale (`file:../commons`)
- `munin-http` : dépendance locale (`file:../munin`)

---

## Protocole WebSocket

### Base (morel-games-core)
Client → Serveur : `join-game`, `update-config`, `lock-game`, `switch-master`, `kick-player`
Serveur → Client : `set-uuid`, `set-slug`, `set-master`, `player-join`, `player-left`, `config-updated`, `game-locked`, `player-ready`, `kick`, `set-server-runtime-identifier`

### Spécifique Petit Bac
Client → Serveur : `start-game`, `send-answers`, `send-vote`, `vote-ready`, `restart`, `change-categories-by-everyone`
Serveur → Client : `categories-by-everyone`, `catch-up-game-state`, `round-starts-soon`, `round-started`, `round-ended`, `vote-started`, `vote-changed`, `game-ended`, `game-restarted`

---

## Décisions & Réflexions

### 2026-07-09 — Analyse initiale

- Le projet date d'environ 2020-2022, derniers commits = bumps de sécurité Dependabot
- Qualité correcte pour un projet perso : architecture propre, protocole documenté, fichiers prod fournis
- Bug probable dans `morel-games-core/src/game/store.js` ligne ~376 : `store.dispatch(...)` au lieu de `context.dispatch(...)` dans le catch du connect — `store` n'est pas défini dans ce scope

### 2026-07-09 — Choix d'hébergement

- Objectif : hébergement gratuit et fiable
- Meilleure option identifiée : **Cloudflare Pages** (front) + **Cloudflare Workers + Durable Objects** (back)
- Durable Objects = parfaits pour le pattern "une room par partie avec WebSockets persistants"
- Free tier suffisant pour un jeu perso à faible trafic (100k req/jour, 5 GB storage)
- Migration back vers Workers = gros chantier (réécriture Node.js → environnement Workers), mis de côté pour l'instant

### 2026-07-09 — Choix de structure repo

- Les deux projets (`pitit-bac` + `morel-games-core-master`) sont dans un seul repo GitHub public
- Repo : https://github.com/Kaylua/Petit-Bac
- La séparation `morel-games-core` reste pertinente si d'autres jeux doivent le réutiliser
- Le `.git` interne de `pitit-bac` (cloné depuis MorelGames) a été supprimé pour éviter le sous-module imbriqué

### 2026-07-09 — Plan de modernisation

Buefy ne supporte pas Vue 3 → Vue 3 et remplacement Buefy sont indissociables.

**Phase 1 — Quick wins (sans casser la compatibilité) :**
- [x] `@vue/cli` → Vite 5 (`@vitejs/plugin-vue2`) + Vue 2.6 → 2.7
- [x] `vue-i18n` v8.17 → v8.28 (v9 requiert Vue 3, reporté en Phase 2)
- [x] `@fortawesome/vue-fontawesome` v0.1.x → v2.x (v3 requiert Vue 3, reporté en Phase 2)

**Phase 2 — Gros bloc (obligatoirement ensemble) :**
- [x] Vue 2 → Vue 3
- [x] Buefy → Oruga (successeur naturel, même base Bulma)
- [x] Vuex 3 → Pinia
- [x] vue-i18n v8 → v9
- [x] @fortawesome/vue-fontawesome v2 → v3
- [x] Mise à jour de `morel-games-core` en conséquence (actuellement couplé Vue 2/Vuex 3/vue-i18n 8)

---

## État actuel & points d'attention pour Phase 2

### Ce qui fonctionne après Phase 1

Le front tourne avec `npm run serve` depuis `pitit-bac/front/` → [http://localhost:5173/](http://localhost:5173/)

Warnings non-bloquants à l'exécution (à ignorer) :
- `DEPRECATION WARNING: Using / for division` — dans le SCSS de bulma 0.7.5 (tiers, ne pas corriger, bulma sera remplacé en Phase 2)
- `The CJS build of Vite's Node API is deprecated` — cosmétique, sans impact

### Pièges identifiés pour Phase 2

- **`morel-games-core`** est référencé en `file:../../morel-games-core-master` (symlink local). Toute modif sur ses composants nécessite d'éditer les sources dans `morel-games-core-master/src/`, pas dans `node_modules/`.
- **`morel-games-core`** utilise encore Vue 2 / Vuex 3 / vue-i18n 8 en interne — il devra être mis à jour en même temps que le front, pas avant ni après.
- **Bug connu** dans `morel-games-core/src/game/store.js` ligne ~376 : `store.dispatch(...)` au lieu de `context.dispatch(...)` dans le `catch` du connect — `store` n'est pas dans le scope. À corriger lors de la mise à jour de morel-games-core.
- **Bulma 0.7.5** installé (vieille version, peer dep de Buefy 0.8). En Phase 2, Oruga n'a pas besoin de Bulma ou permet d'en choisir la version.
- **Double import CSS** dans l'état actuel : `buefy/dist/buefy.css` importé en JS (`main.js`) ET les sources SCSS buefy importées dans `App.vue`. C'est redondant mais fonctionnel ; nettoyer en Phase 2 lors du remplacement Buefy → Oruga.

---

## Journal des modifications

### 2026-07-09
- Création du repo GitHub `Kaylua/Petit-Bac` avec les deux projets côte à côte
- Suppression des `.gitignore` redondants dans les sous-projets
- Création d'un `.gitignore` racine unifié couvrant les deux projets
- Suppression du `.git` interne de `pitit-bac/` (était un clone du repo MorelGames)
- Création de `CHANTIER.md` (ce fichier) pour tracer toutes les décisions et modifications
- Configuration d'un hook PostToolUse dans `.claude/settings.local.json` : rappel automatique de mettre à jour CHANTIER.md après chaque Edit/Write
- Création de `CLAUDE.md` à la racine : instruction commitée dans le repo, garantit que tout collaborateur utilisant Claude Code recevra la même consigne de logger dans CHANTIER.md

**Phase 1 — Migration Vite + dépendances front (2026-07-09)**
- `pitit-bac/front/package.json` : suppression de `@vue/cli-*`, `babel-eslint`, `sass-loader`, `vue-template-compiler`, `core-js` ; ajout de `vite@^5.4.8`, `@vitejs/plugin-vue2@^2.3.1` ; montée de `vue` 2.6→2.7, `vuex` 3.1→3.6, `vue-i18n` 8.17→8.28, `@fortawesome/vue-fontawesome` 0.1→2.0 ; `morel-games-core` basculé du git URL vers `file:../../morel-games-core-master` ; scripts mis à jour (`vite` / `vite build`) ; parser `babel-eslint` retiré de l'eslintConfig
- `pitit-bac/front/vite.config.js` : créé (plugin `@vitejs/plugin-vue2`, `resolve.preserveSymlinks: true`)
- `pitit-bac/front/index.html` : créé à la racine du projet front (Vite l'exige hors de `public/`) avec `<script type="module" src="/src/main.js">` et remplacement des `<%= BASE_URL %>` par `/` et `<%= VUE_APP_URL %>` par `%VITE_URL%`
- `pitit-bac/front/public/index.html` : supprimé (remplacé par l'index.html racine ci-dessus)
- `pitit-bac/front/babel.config.js` : supprimé (Vite utilise esbuild, pas Babel)
- `pitit-bac/front/vue.config.js` : supprimé (remplacé par `vite.config.js`)
- `pitit-bac/front/.env` : renommage `VUE_APP_WS_URL` → `VITE_WS_URL`, `VUE_APP_URL` → `VITE_URL` ; port dev mis à jour (8080 → 5173)
- `pitit-bac/front/.env.production` : mêmes renommages
- `pitit-bac/front/src/main.js` : `process.env.VUE_APP_WS_URL` → `import.meta.env.VITE_WS_URL` ; retrait du commentaire `/* webpackChunkName */` dans le dynamic import des locales ; ajout de `/* @vite-ignore */` pour supprimer le warning d'analyse statique sur l'import dynamique à chemin variable
- `pitit-bac/front/vite.config.js` : ajout de `css.preprocessorOptions.scss.loadPaths: [resolve('node_modules')]` — permet à sass de résoudre `@import "bulma/..."` et `@import "buefy/..."` sans préfixe `~`
- `pitit-bac/front/src/App.vue`, `src/assets/variables.scss`, `src/components/Game.vue`, `src/components/GameEnd.vue`, `src/components/GameVote.vue` : suppression du préfixe `~` dans tous les `@import` SCSS (`~bulma/`, `~buefy/` → sans `~`) — le `~` était une convention webpack/sass-loader non supportée par Vite
- `morel-games-core-master/src/components/AskPseudonym.vue`, `LocaleSwitcher.vue`, `PlayerAction.vue`, `Players.vue`, `ShareGame.vue` : même correction du préfixe `~`
- `.claude/settings.local.json` : permissions élargies — ajout de `Read`, `Write`, `Edit`, `Glob`, `Grep` (tous les outils fichiers) et des patterns bash courants (`npm *`, `node *`, `grep *`, `find *`, `sed *`, `git status/diff/log`) pour ne plus demander d'autorisation à chaque opération dans le workspace
- `pitit-bac/front/src/components/GameConfiguration.vue` : retrait du `/* webpackChunkName */` et ajout de `/* @vite-ignore */` sur l'import dynamique des catégories de suggestions
- `pitit-bac/front/src/App.vue` : `@import "bulma"` → `@import "bulma/bulma"` — le nom de paquet seul déclenchait le résolveur JS de Vite qui rejetait `main: "bulma.sass"` comme entrée invalide ; le chemin explicite évite cette résolution et laisse sass le gérer via loadPaths
- `CHANTIER.md` : mise à jour pour passation Phase 2 — table de stack mise à jour (versions après Phase 1), ajout section "État actuel & points d'attention pour Phase 2" (pièges morel-games-core, bug store.js, double import CSS, warnings non-bloquants)

**Phase 2 — Migration Vue 3 + Oruga + Pinia + vue-i18n v9 + FA v3 (2026-07-09)**

Toutes les modifications ci-dessous constituent un bloc atomique : aucune ne fonctionne sans les autres.

_morel-games-core-master/_
- `package.json` : `"type": "module"` ajouté (conversion CJS → ESM) ; `peerDependencies` mis à jour (vue 3, pinia, oruga-next, vue-i18n 9) ; version → 2.0.0
- `src/game/store.js` : réécriture complète en Pinia (`defineStore('morel', ...)`). Remplace la factory Vuex `MorelStore(client, i18n)`. Exports : `useMorelStore` + `initMorelStore(client, morel_i18n)`. Système de notifications `notifications[]` (remplace Buefy Snackbar) : `add_notification(msg, variant)` auto-retire après 4 s via `setTimeout`. Toutes les mutations Vuex deviennent des actions Pinia qui mutent `state` directement.
- `src/game/game.js` : réécriture ESM. `set_store(morelStore)` reçoit l'instance Pinia directement. Tous `this.store.commit('morel/xxx')` → `this.store.xxx()` ; tous `this.store.state.morel.xxx` → `this.store.xxx`.
- `src/game/i18n.js` : réécriture pour vue-i18n v9. `createI18n({ legacy: true, ... })`. Setter locale : `this.i18n.global.locale.value = locale`. `setLocaleMessage` pour charger les traductions dynamiques.
- `src/game/index.js` : conversion ESM, ré-export de `useMorelStore`, `initMorelStore`, `MorelClient`, `MorelI18n`.
- `src/index.js` : conversion ESM, ré-export de tout + `MorelVue`.
- `src/components/index.js` : plugin Vue 3 (`install(app) { app.component(...) }`).
- `src/components/AskPseudonym.vue` : `b-*` → `o-*` ; `<i18n path>` → `<i18n-t keypath>` avec `#create_new_game` slot ; `mapState('morel', ...)` → `mapState(useMorelStore, ...)` ; `this.$store.dispatch(...)` → `useMorelStore().xxx()` ; `@keyup.native.enter` → `@keyup.enter` ; `b-message` → div `.message.is-danger` Bulma natif.
- `src/components/PlayerAction.vue` : `b-tooltip`/`b-icon` → `o-tooltip`/`o-icon` ; `position="is-bottom"` → `position="bottom"` ; `type` → `variant` ; suppression `v-on="$listeners"` (héritage auto Vue 3).
- `src/components/Players.vue` : `b-icon` → `o-icon` ; icône `user-alt-slash` → `user-slash` (FA6) ; `$buefy.dialog.confirm()` → `window.confirm()` ; `mapState` + `mapGetters` Vuex → `mapState(useMorelStore, ...)` Pinia.
- `src/components/ShareGame.vue` : `b-tooltip`/`b-button`/`b-field`/`b-input` → Oruga ; `slot="lock"` → `#lock` template ; `type="is-light"` → `variant="light"` ; SCSS `.b-tooltip` → `.o-tooltip` ; `multilined` → `multiline`.
- `src/components/LocaleSwitcher.vue` : `b-dropdown`/`b-dropdown-item`/`b-button` → Oruga ; `position="is-top-right"` → `position="top-right"` ; `mapState('morel', [...])` → `mapState(useMorelStore, [...])` ; dispatch → `useMorelStore().set_locale(locale)`.

_pitit-bac/front/_
- `package.json` : suppression `buefy`, `vuex`, `@vitejs/plugin-vue2`, `@fortawesome/vue-fontawesome@2` ; ajout `vue@^3.5.13`, `pinia@^2.2.6`, `@oruga-ui/oruga-next@^0.13.6`, `@oruga-ui/theme-bulma@^0.9.1`, `bulma@^0.9.4`, `vue-i18n@^9.14.2`, `@fortawesome/vue-fontawesome@^3.0.8`, `@fortawesome/fontawesome-svg-core@^6.7.2`, `@fortawesome/free-solid-svg-icons@^6.7.2`, `@vitejs/plugin-vue@^5.2.1` (remplace plugin-vue2). Note versionnement Oruga : `theme-bulma` ne suit pas `oruga-next` — paire compatible = `oruga-next@^0.13.x` + `theme-bulma@^0.9.1`.
- `vite.config.js` : `@vitejs/plugin-vue2` → `@vitejs/plugin-vue`.
- `src/main.js` : réécriture complète — `createApp` + `createPinia` + `createOruga({ ...bulmaConfig, iconPack: 'fas', iconComponent: 'font-awesome-icon' })` + `createI18n` via `MorelI18n` ; `initMorelStore(client, morelI18n)` + `initGameStore(client)` ; import CSS `@oruga-ui/theme-bulma/style.css` (pas `/dist/theme.css` — non exporté dans le package exports map) ; icônes FA6 renommées : `faXmark` (était `faTimes`), `faUserSlash` (était `faUserAltSlash`).
- `src/store.js` : nouveau fichier — store Pinia de jeu (`useGameStore` + `initGameStore(client)`). Contient tout l'état round/votes/scores/config-jeu. Accès cross-store via `useMorelStore()` dans les actions.
- `src/game.js` : `GameClient extends MorelClient` — ajout `set_game_store(gameStore)` ; tous les handlers de messages appellent `this.game_store.xxx()` (Pinia) au lieu de `this.store.dispatch(...)`.
- `src/App.vue` : réécriture — overlay de chargement custom (div `.loading-overlay.is-full-page`) remplace `<b-loading>` ; file de notifications `o-notification` (rendu depuis `morelStore.notifications[]`) ; `<i18n path>` → `<i18n-t keypath>` ; `@import "buefy/..."` supprimé ; `mapState` depuis `useMorelStore` + `useGameStore`.
- `src/components/GameConfiguration.vue` : réécriture complète — `b-message` → div `.message > .message-header + .message-body` (Bulma natif, Oruga n'a pas d'équivalent) ; `b-taginput` → `o-taginput` avec `:confirm-keys="['Enter', 'Tab']"` ; `b-switch :value @input` → `o-switch :model-value @update:modelValue` ; `b-slider`/`b-slider-tick` → `o-slider`/`o-slider-tick` ; `b-modal :active :on-cancel` → `o-modal v-model:active` ; `slot="label"` → `#label` template ; SCSS `.b-slider` → `.o-slide`, `.b-tooltip` → `.o-tooltip`.
- `src/components/Game.vue` : réécriture complète — `b-notification`/`b-field`/`b-input`/`b-button`/`b-tooltip` → Oruga ; `mapState` depuis `useMorelStore` + `useGameStore` ; `beforeDestroy` → `beforeUnmount`.
- `src/components/GameVote.vue` : réécriture complète — `b-*` → `o-*` ; `<i18n path slot="">` → `<i18n-t keypath #slot>` ; `b-checkbox :value @input` → `o-checkbox :model-value @update:modelValue` ; icône `times` → `xmark` (FA6) ; `$store.dispatch("send_vote_update")` → `useGameStore().send_vote_update(...)` ; `$store.commit("set_sticky_players_list")` → `useGameStore().set_sticky_players_list(...)` ; `beforeDestroy` → `beforeUnmount` ; méthode `search_label()` pour éviter les `\"` dans les attributs HTML double-quotés.
- `src/components/GameEnd.vue` : réécriture complète — `b-icon`/`b-notification`/`b-button` → Oruga ; `<i18n path slot="">` → `<i18n-t keypath #slot>` pour les suffixes ordinaux (1st, 2nd...) ; `mapState` Vuex → Pinia ; `$store.dispatch("ask_restart_game")` → `useGameStore().ask_restart_game()`.
