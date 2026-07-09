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

### Stack actuelle (avant chantier)

| Couche | Techno | Version | État |
|--------|--------|---------|------|
| Front framework | Vue | 2.6 | Fin de vie fin 2023 |
| UI components | Buefy | 0.8 | Abandonné |
| State management | Vuex | 3 | Remplacé par Pinia pour Vue 3 |
| Build tool | @vue/cli | 4.2 | Très outdated |
| i18n | vue-i18n | 8 | Vue 2 only |
| Icons | @fortawesome/vue-fontawesome | 0.1.x | Vue 2 only |
| Back runtime | Node.js | 16 (cible) / 22 (dispo) | OK |
| Back transport | websocket (npm) | 1.0.31 | OK |

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
- [ ] Vue 2 → Vue 3
- [ ] Buefy → Oruga (successeur naturel, même base Bulma)
- [ ] Vuex 3 → Pinia
- [ ] Mise à jour de `morel-games-core` en conséquence

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
