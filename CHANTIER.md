# Chantier — Petit Bac

## Statut

Phase 2 terminée ✅. Front Vue 3 / Oruga / Pinia / vue-i18n v9 / FA v3 tourne (`npm run serve` → http://localhost:5173). Back Node 22 ESM natif tourne (`node index.js`). Prochaine étape : à définir.

---

## Architecture

```
ProjetPetitBac/
├── pitit-bac/
│   ├── back/        — Serveur Node.js WebSocket (logique de jeu)
│   ├── front/       — Front Vue 3 + Oruga + Pinia
│   ├── commons/     — Code partagé back/front (vérification réponses, calcul votes)
│   ├── munin/       — Monitoring optionnel (métriques parties)
│   └── production/  — Config nginx + systemd pour déploiement
└── morel-games-core-master/
    — Framework maison réutilisable pour jeux multijoueurs WebSocket
    — Fournit : MorelClient (game.js), useMorelStore/initMorelStore (store.js), MorelI18n (i18n.js), composants Vue (lobby, joueurs, pseudo)
    — Dépendance locale : file:../../morel-games-core-master (éditer les sources, jamais node_modules)
```

---

## Stack actuelle

| Couche | Techno | Version |
|--------|--------|---------|
| Front framework | Vue | 3.5.x |
| UI components | Oruga + Bulma theme | 0.13.x / 0.9.x |
| State management | Pinia | 2.2.x |
| Build tool | Vite | 5.4.x |
| i18n | vue-i18n | 9.14.x (`legacy: true` pour Options API) |
| Icons | @fortawesome/vue-fontawesome + FA6 | 3.0.x |
| morel-games-core | ESM natif, Pinia, vue-i18n v9 | 2.0.0 |
| Back runtime | Node.js | 22 |
| Back transport | websocket (npm) | 1.0.31 |

**Dépendances locales :** `morel-games-core` (`file:../../morel-games-core-master`), `ptitbac-commons` (`file:../commons`), `munin-http` (`file:../munin`).

---

## Protocole WebSocket

### Base (morel-games-core)
Client → Serveur : `join-game`, `update-config`, `lock-game`, `switch-master`, `kick-player`
Serveur → Client : `set-uuid`, `set-slug`, `set-master`, `player-join`, `player-left`, `config-updated`, `game-locked`, `player-ready`, `kick`, `set-server-runtime-identifier`

### Spécifique Petit Bac
Client → Serveur : `start-game`, `send-answers`, `send-vote`, `vote-ready`, `restart`, `change-categories-by-everyone`
Serveur → Client : `categories-by-everyone`, `catch-up-game-state`, `round-starts-soon`, `round-started`, `round-ended`, `vote-started`, `vote-changed`, `game-ended`, `game-restarted`

---

## Décisions actives

**Hébergement cible :** Cloudflare Pages (front) + Workers + Durable Objects (back). Durable Objects sont parfaits pour le pattern "une room par partie avec WebSockets persistants". Free tier suffisant (100k req/jour). Migration back = gros chantier (réécriture Node.js → environnement Workers), mis de côté.

**Structure repo :** Monorepo avec `pitit-bac/` + `morel-games-core-master/` côte à côte dans le même repo GitHub public (`Kaylua/Petit-Bac`). La séparation reste pertinente si d'autres jeux réutilisent morel-games-core. Le `.git` interne de `pitit-bac` (clone MorelGames) a été supprimé pour éviter les sous-modules imbriqués.

**morel-games-core :** Toujours éditer les sources dans `morel-games-core-master/src/`, jamais dans `node_modules/`. Le lien `file:` est résolu via symlink à l'install.

---

## Historique des phases

### Phase 1 — Migration Vite (2026-07-09) ✅

**Pourquoi :** `@vue/cli` 4.2 était très outdated, Node 22 incompatible avec certains loaders webpack. Objectif : sortir de vue-cli sans casser la compatibilité Vue 2.

**Ce qui a été fait :** Vite 5 + `@vitejs/plugin-vue2`, Vue 2.6→2.7, bump des dépendances front compatibles Vue 2.

**Piège rencontré :** Les imports SCSS `~bulma/` / `~buefy/` (convention webpack/sass-loader) ne fonctionnent pas sous Vite. Solution : supprimer le préfixe `~` partout + `css.preprocessorOptions.scss.loadPaths: [resolve('node_modules')]` dans `vite.config.js`.

---

### Phase 2 — Migration Vue 3 / Oruga / Pinia (2026-07-09) ✅

**Pourquoi :** Buefy ne supporte pas Vue 3, Vuex recommande Pinia pour Vue 3. La migration est un bloc atomique indivisible (toutes ces dépendances sont couplées).

**Ce qui a été fait :** Vue 2→3, Buefy→Oruga (successeur naturel, même base Bulma), Vuex→Pinia, vue-i18n v8→v9, FA v2→v3, réécriture complète de morel-games-core en ESM + Pinia + vue-i18n v9.

**Pièges majeurs :**
- `createOruga(config)` seul **ne enregistre pas** les composants Vue (`o-input`, `o-field`, etc. sont traités comme des balises HTML custom → rien ne s'affiche). Il faut impérativement `createOruga(config, OrugaComponentPlugins)`.
- Props Oruga **sans préfixe `is-`** : `size="is-large"` → `size="large"`, `variant="is-primary"` → `variant="primary"`.
- Icônes FA6 renommées : `faTimes` → `faXmark`, `faUserAltSlash` → `faUserSlash`.
- Oruga 0.13 remapping icônes FA : `chevron-right` → `angle-right` en interne → enregistrer `faAngleRight` (pas `faChevronRight`).
- `<i18n path="">` → `<i18n-t keypath="">` en vue-i18n v9, avec slots nommés (`#slot` au lieu de `slot=""`).
- `beforeDestroy` → `beforeUnmount`, `v-on="$listeners"` supprimé (héritage auto Vue 3).

---

### Back — Migration ESM natif Node 22 (2026-07-09) ✅

**Pourquoi :** `esm@3` crashait au démarrage sur Node 22 (assertion native dans `node::fs::InternalModuleStat`). Le code utilisait déjà la syntaxe `import/export` — il suffisait de passer en ESM natif.

**Ce qui a été fait :** `"type": "module"` dans les 3 packages (`back`, `commons`, `munin`), suppression du shim `esm`, recalcul de `__dirname` via `fileURLToPath(import.meta.url)`, correction des imports locaux (extension `.js` obligatoire en ESM), correction de l'import `uuid` (v14 ESM natif).

---

## Journal des modifications récentes

### 2026-07-09 — Piège : `require()` dans un composant Vue 3 / Vite → page blanche

`GameConfiguration.vue` utilisait `require('../../data/alphabets.json')` dans `data()` — héritage Vue 2/webpack. Dans un contexte ESM/Vite, `require` n'est pas défini côté navigateur → erreur JS silencieuse au montage → page blanche sans message d'erreur console évident.

**Fix :** import statique ESM en haut du script : `import alphabetsData from '../../data/alphabets.json'`, puis `alphabets: alphabetsData` dans `data()`. Vite sait importer les JSON nativement.

**À retenir :** Tout `require()` dans le code front est un survivant webpack à éliminer.

> Les modifications détaillées fichier-par-fichier sont dans git (`git log`). Ce journal ne conserve que les décisions et événements notables entre sessions.

### 2026-07-09 — Optimisation du système de contexte Claude Code

**Décision :** Refonte de CHANTIER.md, INDEX.md et CLAUDE.md pour réduire la consommation de tokens par session.

- `CHANTIER.md` : restructuré — suppression du journal fichier-par-fichier (260 → ~100 lignes), remplacement par un "Historique des phases" condensé qui préserve les WHY et les pièges, sans dupliquer git.
- `INDEX.md` : ajout d'une ligne de statut en tête.
- `CLAUDE.md` : lecture de CHANTIER.md rendue conditionnelle (seulement pour tâches architecture/décisions/bugs complexes) ; règle du journal clarifiée (décisions notables uniquement, pas fichier-par-fichier).

**Pourquoi :** Le journal fichier-par-fichier grandissait sans borne (~180 lignes après 1 journée) et dupliquait git sans apporter de valeur aux sessions. Le gain estimé : ~700 tokens/session au lieu de ~2500.

### 2026-07-09 — Permissions carte blanche dans settings.local.json

`Bash(*)`, `PowerShell(*)`, `Skill(*)`, `WebFetch` ajoutés — plus aucune approbation manuelle requise dans ce workspace. Les entrées spécifiques (`Bash(npm *)`, etc.) remplacées par le wildcard. Décision assumée : le repo git sert de filet de sécurité si besoin de revenir en arrière.

### 2026-07-09 — Création du template bootstrap `project-setup-template.md`

Fichier one-shot à donner à une instance Claude Code pour mettre en place le système de contexte (CLAUDE.md + INDEX.md + CHANTIER.md + hook) sur n'importe quel nouveau projet. Contient les 4 étapes : exploration, création des 3 fichiers .md avec leurs structures, setup de settings.local.json. INDEX.md mis à jour pour référencer les fichiers racine notables.

### 2026-07-09 — Clarification des règles INDEX.md / CHANTIER.md + hook

`CLAUDE.md` : règle CHANTIER.md reformulée ("après chaque décision notable" au lieu de "après chaque modification de fichier") ; règle INDEX.md élargie aux changements structurels (renommage, suppression), pas seulement ajout.

`settings.local.json` : message du hook PostToolUse mis à jour pour rappeler les deux obligations (CHANTIER.md si décision notable, INDEX.md si structure change).

### 2026-07-09 — Complétion exhaustive de INDEX.md

Audit complet du projet vs INDEX.md : lecture de tous les fichiers source non encore indexés. Ajouts :

- **Front :** `CircularProgress.vue`, `vite.config.js`, `index.html`, `.env` / `.env.production`, `locales/fr.json`, `locales/categories/`
- **Back :** `src/index.js` (bootstrap HTTP, port 62868 via `PITIT_BAC_WS_PORT`), `src/server.js` (classe GameServer), `src/logging.js`
- **morel-games-core :** `src/index.js` (barrel), `src/game/index.js` (barrel), `components/PlayerAction.vue`, `locales/fr.json`
- **Nouvelles sections :** Commons (index.js + tests.js), Munin, Production, racine `pitit-bac/` (Makefile, .nvmrc, protocol.md)
- **Démarrage rapide :** commandes Makefile ajoutées
- **Nouveau piège :** cohérence port WS entre `PITIT_BAC_WS_PORT` (back) et `VITE_WS_URL` (front .env)
- **Nouveau piège :** `commons/tests.js` — CJS uniquement (require), ne pas convertir en ESM sans adapter Mocha

### 2026-07-09 — Auto-réparation du hook dans CLAUDE.md

`CLAUDE.md` : ajout d'une section "Bootstrap" — au démarrage de chaque session, Claude vérifie que le hook PostToolUse est présent dans `.claude/settings.local.json` et l'ajoute si absent. Garantit que INDEX.md et CHANTIER.md sont toujours alimentés même avec un `.claude` vide.

### 2026-07-09 — Refonte responsive mobile-first + thème été "soirée buvette"

**Contexte :** Le jeu est utilisé à 99% sur mobile. La demande était : responsive mobile nickel, thème visuel été/buvette, CSS centralisé (pas de répétitions), tester tous les cas cassants avant livraison.

**Décisions architecture CSS :**

- **Centralisation** : toutes les règles globales (fond, border-radius mobiles, font-size iOS, notifications toast) sont dans `App.vue <style>` (non scopé = global). Les composants ne gardent que leur CSS propre.
- **Border-radius sur mobile** : la règle `+mobile { main .notification, main .message .message-header, main .box, main .hero { border-radius: 0 } }` dans App.vue remplace les `border-radius: 0` éparpillés dans chaque composant — 6 règles dupliquées supprimées.
- **Anti-zoom iOS Safari** : `input[type="text"], ... { font-size: max(16px, 1em) }` en global mobile (iOS zoome si l'input a font-size < 16px — silencieux et dérangeant sur mobile).

**Palette thème été "soirée buvette" :**
- Primary : `#E64A19` (orange coucher de soleil, Deep Orange 600) — contraste blanc 3.87:1, OK WCAG AA grand texte (boutons bold)
- Link : `#00838F` (teal tropical, style piscine/plage)
- Dark : `#1A0A00` (brun chaud profond au lieu du vert nuit précédent)
- Background : gradient `#fff9f0 → #ffe6c8` sur `<html>` (peach chaud, non attaché en fixed — meilleure perf iOS)
- Radius : `8px` (standard), `16px` (large) — formes plus rondes/friendly
- Box shadow : ombre chaude `rgba(180, 60, 0, 0.10)` au lieu de gris froid

**Piège nouveau — `background-attachment: fixed` sur iOS :**  
`background-attachment: fixed` sur `body` crée des problèmes de compositing sur iOS Safari (fond ne se repeint pas lors du scroll). Solution : mettre le gradient sur `<html>` avec `background-attachment` par défaut (scroll). L'élément `<html>` couvre toute la hauteur du document même sur les longues pages.

**Fix UX mobile Game.vue — ordre des colonnes :**  
Sur mobile, le timer + bouton "J'ai fini" apparaissait EN BAS du formulaire (après le défilement de toutes les catégories). Fix : `+mobile { order: -1 }` sur `.time-and-button-column` + disposition CSS Grid sur `.inner-time-and-button` (progress à gauche, label + bouton à droite) + `font-size: 5em` au lieu de `8em` pour la jauge circulaire.

**Zones tactiles :** Ajout de `min-height: 44px` sur les boutons critiques dans GameVote et ShareGame (recommandation WCAG 2.5.5).

**index.html :** `<meta name="theme-color" content="#E64A19">` — colore la barre d'adresse Chrome Android en orange été.

### 2026-07-09 — Extraction design-system.sass depuis App.vue

**Décision :** Création de `pitit-bac/front/src/assets/design-system.sass`. Tout le CSS des overrides composants UI (`:root` tokens, `.button`, `.message`, `.box`, `.notification`, `.tag`, `.input`, `.panel`, `.o-switch`, ajustements mobile globaux) a été extrait de `App.vue <style>` vers ce partial Sass.

**App.vue garde** uniquement le CSS structurel de l'app shell : html/body (fond gradient), `#app`, overlay de chargement, container notifications, logo, layout colonnes, top-bar mobile, sticky players, footer, keyframes.

**Règle d'import :** `design-system.sass` est un partial sans `@import` propres — il s'attend à être inclus *après* `bulma/sass/utilities/_all` + `assets/variables` + `bulma/bulma` dans App.vue. Les variables `$primary`, `+mobile` etc. viennent du contexte parent.

**Pourquoi :** App.vue faisait 683 lignes (517 de CSS mixte), ce qui obligeait à le lire entièrement pour n'importe quel changement UI. Désormais : changement composant → lire uniquement le composant ; changement design system → lire `design-system.sass` (~160 lignes) ; changement layout/shell → lire App.vue (~350 lignes). Gain estimé : ~300 lignes de contexte évitées par session sur les tâches front simples.

### 2026-07-09 — Refonte graphique summer vibes v2 : design system complet

**Contexte :** L'UI précédente était fonctionnelle mais visuellement plate. Objectif : look moderne "soirée été entre amis", avec animations légères et direction artistique cohérente. Mobile-first, pas d'impact perf.

**Décisions architecture :**

- **Design tokens CSS** : variables CSS (`--card-bg`, `--card-border`, `--card-shadow`, `--card-shadow-lift`, `--transition`) déclarées dans `:root` dans `App.vue`. Permettent aux composants d'utiliser `var(--card-bg)` sans importer les variables SASS.
- **Overrides Oruga/Bulma 1.x** : le thème Oruga (Bulma 1.0.4) est injecté dynamiquement via JS après notre SCSS statique, donc il gagne la cascade pour certains éléments (notamment `.message.is-primary .message-body` qui apparaissait en teal au lieu d'orange). Solution : règles ciblées avec `#app .message.is-primary .message-body { ... !important }` pour garantir la spécificité.
- **Centralisation renforcée** : tout le design system (cartes, boutons, tags, inputs, panels, notifications) dans `App.vue <style>`. Les composants gardent leur CSS fonctionnel, ne définissent plus les couleurs de fond ou ombres.

**Changements visuels :**

- **Background** : gradient plus profond `#FFF9F0 → #FFE9C8 → #FFD298 → #FFBA70` (coucher de soleil estival).
- **Cartes** : `.message`, `.box`, `.notification`, `.panel` — fond semi-transparent chaud, bordure ambrée, ombre chaude. `border-radius: 20px` sur les cartes principales, `16px` sur les secondaires.
- **Boutons `.is-primary`** : gradient linéaire `$primary → $primary-dark`, ombre colorée, hover `translateY(-2px)` + ombre amplifiée (wrappé dans `prefers-reduced-motion: no-preference`).
- **Tags/catégories** : `border-radius: 20px` (pilule), gradient sur `.is-primary`.
- **Timer circulaire** : fond transparent chaud, animation `timerGlow` (pulsation orangée) quand valeur > 70% (temps file).
- **Box timer** (`Game.vue`) : la boîte fixe du timer devient une véritable carte avec `var(--card-bg)` et `var(--card-shadow)`.
- **Écran victoire** (`GameEnd.vue`) : hero gradient `$primary → $primary-dark → darken(...)` avec halos décoratifs CSS (`::before` / `::after`). Animations `bounceIn` pour le 1er, `fadeInUp` pour 2e/3e. Rang en `$primary`, scores en `$primary-dark`.
- **Votes** (`GameVote.vue`) : header sticky avec `backdrop-filter: blur(12px)`, catégories avec `h3` en `$primary-dark` + séparateur orangé, pseudo en `$primary-dark`.
- **Liste joueurs** (`Players.vue`) : hover `rgba(255, 230, 185, 0.18)`, offline players à `opacity: 0.55`.
- **Logo** : `drop-shadow` chaud + micro-rotation au hover (`rotate(-0.4deg)`).
- **Animations d'entrée** : `fadeInUp 0.4s` sur `.game-configuration`, `.game-answers`, `.end-screen` + `ask-pseudonym` (wrappées dans `prefers-reduced-motion`).

**Piège : `rgba($sass-var, alpha)` dans des CSS custom properties** : impossible d'interpoler une variable Sass dans un `var()` CSS. Solution : utiliser `rgba($primary, 0.38)` directement dans le SASS (compilé à build time), ou stocker la valeur dans un token Sass plutôt que CSS.

### 2026-07-09 — Bug fix : leave_game() + cache Vite sur file: dependencies

**Bug 1 — `configuration = {}` dans `leave_game()` → crash au rejoin**  
Après leave, la config était vidée à `{}`. Au rejoin, `GameConfiguration.vue` s'affichait avant que le serveur n'envoie `config-updated`, tentait d'accéder à `configuration.scores.valid` → crash silencieux.  
**Fix :** supprimer `this.configuration = {}` de `leave_game()`. Le serveur envoie `config-updated` dès le join — la valeur précédente est un fallback propre pendant ces 50ms.

**Bug 2 (piège dev) — cache Vite pre-bundlé sur dépendances `file:`**  
Vite pre-bundle `morel-games-core` au premier démarrage dans `node_modules/.vite/deps/`. Si le code source change APRÈS ce premier démarrage (ou si plusieurs instances Vite coexistent), les modules servis sont stale → `leave_game is not a function` en runtime même si le fichier est correct.  
**Fix systémique :** après avoir modifié un fichier dans `morel-games-core-master/`, tuer TOUS les serveurs Vite et purger `pitit-bac/front/node_modules/.vite/` avant de relancer.

### 2026-07-09 — Fix cohérence visuelle : Bulma 1.x CSS vars vs. palette summer

**Problème découvert :** `@oruga-ui/theme-bulma/dist/theme.css` (Bulma 1.0.4) définit `--bulma-primary-h: 171deg` (turquoise) dans `:root`. Tous les composants Oruga utilisant `var(--bulma-primary)` ignoraient notre `$primary: #E64A19` SCSS (compilé statiquement) et restaient turquoise.

**Composants affectés :**
- **Slider** : rendu en `.slider .slider-fill` (pas `.o-slide__fill`), couleur = `var(--bulma-primary)` → turquoise
- **Switch** : rendu en `.switch.control .check` (pas `.o-switch .o-switch__check`), checked = `var(--bulma-primary)` → turquoise
- **CSS GameConfiguration.vue** : ciblait `.o-slide`, `.o-slide__track`, `.o-slide--disabled`, `.o-slide__thumb-wrapper` → aucun de ces sélecteurs n'existait dans le DOM

**Fix :**
1. `design-system.sass (:root)` : override des CSS vars Bulma 1.x — `--bulma-primary-h: 14deg`, `--bulma-primary-s: 80%`, `--bulma-primary-l: 50%`, + overrides directs `--bulma-switch-active-background-color` et `--bulma-slider-color` à `#E64A19`.
2. Correction sélecteurs `GameConfiguration.vue` : `.o-slide*` → `.slider*`, `.o-slide--disabled` → `.is-disabled`, `.o-switch[disabled]` → `.switch.is-disabled`.
3. `design-system.sass` : tags taginput stylés avec des chips peach chauds (`--bulma-tag-h: 14deg`, bg 88%), taginput container fond warm cream.

**Pourquoi ces classes diffèrent :** `bulmaConfig` de `@oruga-ui/theme-bulma` mappe les classes internes Oruga vers des classes Bulma custom (`rootClass: "slider"`, `fillClass: "slider-fill"`, `rootClass: "switch control"`, `inputClass: "check"`). Le CSS Oruga générique (`.o-*`) n'est jamais rendu avec ce theme.

**Piège supplémentaire — bouton `.delete` des tags taginput :**
- Oruga injecte une icône FA (`fa-xmark`) à l'intérieur du `<button class="delete is-small">` Bulma → l'icône FA masque les pseudo-éléments `::before`/`::after` qui dessinent la croix blanche.
- Bulma 0.9.4 (compilé dans App.vue, donc injecté APRÈS `theme-bulma/style.css` dans la cascade) overwrite le `background-color` du `.delete` avec `rgba(white, 0.2)` → cercle invisible sur fond clair.
- Fix : `.taginput-container .tag .delete { background-color: rgba(90,46,0,.15) !important; &::before/after background-color: rgba(90,46,0,.65) !important; .icon { display: none } }`

### 2026-07-09 — Feature : bouton "Quitter le lobby"

**Contexte :** Sur mobile, une fois dans un lobby (phase CONFIG), il n'y avait aucun moyen de revenir à l'écran d'accueil (saisie du pseudo).

**Décision :** Ajouter `leave_game()` dans `useMorelStore` (morel-games-core). L'action : met `_client.kicked = true` (empêche la boucle de reconnexion automatique), ferme le WebSocket, purge les credentials sessionStorage, remet tout le store à zéro et redirige vers `/`.

**UI :**
- Mobile : barre `.mobile-top-bar` qui remplace l'ancien `.pititbac-logo.is-mobile` — logo centré + bouton `← Quitter` positionné en `absolute left: 1rem` pour ne pas décaler le logo.
- Desktop : bouton discret ghost en bas de la sidebar, caché sur mobile (`display: none`).
- Icône `angle-left` (déjà enregistrée dans `main.js` comme `faAngleLeft`).
- Traduction FR ajoutée dans `pitit-bac/front/locales/fr.json` : `"Leave": "Quitter"`.

**Piège reset store :** Pinia `$reset()` n'est pas disponible dans tous les contextes (Options API stores). Réinitialisation manuelle champ par champ dans `leave_game()`.

### 2026-07-09 — Refonte visuelle summer vibes v3 : logo custom, couleur coral, croix tags

**Contexte :** Logo SVG vert script hors-thème, orange trop foncé/industriel (`#E64A19`), bouton Suggestions ressemblait à un simple lien, croix des tags invisibles.

**Changements :**

1. **Logo → titre texte custom** : les 3 occurrences de `<img src="./assets/logo.svg">` remplacées par `<span class="game-title">Pitit Bac</span>`. Gradient coral en `background-clip: text`, Fira Sans 800. CSS adapté dans App.vue (`pititbac-logo`, `init-logo`, `mobile-top-logo`).

2. **Couleur primary : `#E64A19` → `#FF6B35`** (coral sunset plus lumineux, `$primary-dark` : `#BF360C` → `#E8581E`). CSS vars Bulma 1.x mis à jour : `--bulma-primary-h: 16deg`, `--bulma-primary-l: 60%`. Headers et gradients nettement plus "summer vibes".

3. **Bouton "Suggestions"** : transformé en pill button (`background: rgba($primary, 0.10)`, `border: 1.5px solid rgba($primary, 0.30)`, `border-radius: 20px`). Sélecteur dans `GameConfiguration.vue`.

4. **Croix × des tags — triple piège résolu :**
   - Tentative 1 (session précédente) : `.icon { display: none }` + `::before/::after background !important` → croix invisible (SVG FA couvrait les pseudo-éléments, puis fond transparent Bulma 0.9.4).
   - Tentative 2 : colorer le SVG via `color: currentColor` → SVG `fill=currentColor` ne se rend pas visuellement à 16px dans Chromium dans ce contexte.
   - Tentative 3 : `content: '×'` dans `::before` → SASS encode le caractère unicode littéral → caractère corrompu en UTF-8 à la compilation.
   - Tentative 4 : `content: '\D7'` (escape CSS) → SASS interprète l'escape et encode quand même mal.
   - **Fix final** : `background-image: url("data:image/svg+xml,...")` avec un SVG × dessiné en path ASCII (deux diagonales `stroke='%235A1600'`). Zéro dépendance d'encodage, zéro pseudo-élément, zéro FA. Croix clairement visible en brun chaud sur fond peach.

**Piège encodage SASS** : Les caractères unicode non-ASCII dans les strings SASS (y compris via `content: '\D7'`) peuvent être corrompus selon le chemin compilation Dart Sass → Vite → bundle. Ne jamais mettre de caractère non-ASCII dans `content` SASS. Préférer les SVG data URI (100% ASCII) pour tous les icônes CSS custom.

### 2026-07-09 — Diagnostic "l'UI ne change jamais" + refonte v4 "playful illustré"

**Contexte :** Après 3 itérations "summer vibes" (tokens couleur, ombres, radius), le rendu restait perçu comme "à peine différent". Diagnostic demandé avant de retenter une 4e itération à l'aveugle.

**Diagnostic (app lancée réellement + screenshots Playwright, front `npm run serve` + back `node index.js`) :**
- Le rendu CSS fonctionne correctement (vérifié via `getComputedStyle` : gradients, ombres, focus states tous corrects). Une première capture semblait montrer un écran "invisible" — c'était un artefact du screenshot pris pendant l'animation `fadeInUp` (0.53s), pas un bug réel.
- Le bouton "Start the game" pâle sur le screenshot de config = état `disabled` normal (`can_start` nécessite >1 joueur), pas un bug de contraste.
- **Vraie cause :** 3 itérations avaient changé uniquement les *tokens* (couleur primaire, radius, box-shadow) sur un squelette Bulma inchangé (colonne centrée, card blanche rectangulaire, formulaire). Repeindre une card blanche en orange ne la transforme pas en "soirée cocktail d'été" — ça reste un panneau de configuration SaaS avec un accent chaud. Confirmé par du code mort : le keyframe `confettiFall` existait dans App.vue depuis la v2 sans jamais être utilisé nulle part.

**Décision (validée avec l'utilisateur via question à choix) :** direction "playful illustré" — motifs SVG récurrents (palmier, cocktail, soleil, confettis), palette élargie (teal `#00BFA5` + jaune citron `#FFC93C` en plus du corail), texture de fond, ambiance affiche de festival plutôt que sobriété éditoriale.

**Ce qui a été fait :**
- `assets/variables.scss` : ajout `$accent-teal` / `$accent-yellow` — décoratifs uniquement, ne remplacent pas `$primary` dans les composants Bulma (boutons/tags restent corail).
- Nouveau composant `components/SummerDecor.vue` : motifs SVG inline (soleil animé en rotation, palmier, verre à cocktail, confettis flottants) en 2 variants (`hero` pour l'écran pseudo, `corner` pour le logo sidebar). Positionnement absolu, `aria-hidden`, `pointer-events: none`, animations dans `prefers-reduced-motion: no-preference`.
- `App.vue` : fond avec texture de points en plus du gradient (SVG data-uri) ; 3 blobs flous fixes (`.ambient-blobs`, z-index -1) en teal/jaune/corail pour la profondeur ; tagline sous le logo d'accueil (nouvelle clé i18n `"The word game for your summer nights"`).
- `GameEnd.vue` : confettis réels (26 pièces générées de façon déterministe, pas de `Math.random`, palette blanc/jaune/teal/pêche) qui tombent sur le hero des gagnants — nouveau keyframe `confettiRain` (le `confettiFall` mort dans App.vue reste inutilisé, pas supprimé — pourrait servir ailleurs).

**Décision architecture :** aucune décoration ajoutée dans `morel-games-core-master/` (Players.vue, AskPseudonym.vue) — le core reste un framework multi-jeux réutilisable, la couche "summer vibes" reste 100% côté `pitit-bac/front`.

**Vérification :** app lancée réellement (front + back), 0 erreur console (`page.on('console')` + `page.on('pageerror')` vides), screenshots desktop + mobile sur écran pseudo et config.

### 2026-07-09 — Refonte v5 : décoration étendue à tout le site (config/jeu/vote) + 2 pièges corrigés

**Contexte :** Retour utilisateur après la v4 — l'écran d'accueil était bien thématisé mais le reste (config, jeu, vote) beaucoup moins. Demande explicite : "plus de folie", plus de cocktails/palmiers partout, pas seulement sur l'accueil.

**Ce qui a été ajouté à `SummerDecor.vue` :**
- Nouveau variant `icon` (+ prop `motif`) : icône inline monochrome (`currentColor`, ~1.1em) pour les titres de header — différent des variants décoratifs multicolores existants. Motifs : cocktail, palm, pineapple, watermelon, sun.
- Nouveau variant `scatter` : calque ambiant plein écran (position fixed, `#app` direct child, ajouté une fois dans App.vue) avec des motifs dans les gouttières gauche/droite sur très grands écrans.
- `corner` enrichi d'un petit cocktail à côté du palmier existant.
- Icônes `icon` posées dans les headers : `GameConfiguration.vue` (cocktail dans "Configure the game"), `GameVote.vue` (palm dans le header de vote), `Game.vue` (sun dans la consigne de round), `GameEnd.vue` (pineapple dans la bannière "Another game?"), `App.vue` (cocktail dans la mobile-top-bar, visible sur tous les écrans mobile).

**Piège n°1 — sélecteur d'attribut `[class^="..."]` qui ne matche jamais :**
Le calque `scatter` cachait par défaut ses motifs via `[class^="decor-g-"] { display: none }`, réactivés ensuite par breakpoint. Sauf que l'attribut `class` réel d'un élément est `"decor decor-g-palm-l"` (la classe de base `decor` listée en premier) — `^=` teste que la chaîne *entière* commence par le préfixe, donc ne matche jamais un attribut qui commence par `"decor "`. Résultat : le `display:none` par défaut ne s'appliquait jamais, et les motifs `decor-g-*`/`decor-m-*` héritaient uniquement de `.decor { display: block }` sans aucune règle de taille/position en dehors de leur breakpoint → SVG absolu sans contrainte, étiré à la taille du viewport entier (palmier géant recouvrant tout l'écran de jeu, capturé en screenshot avant le fix). **Fix :** toujours lister les classes explicitement (`.decor-g-palm-l, .decor-g-cocktail-l, ...`), jamais de sélecteur d'attribut `^=` sur un élément qui a plusieurs classes dont une classe de base commune.

**Piège n°2 — gouttières "vides" qui ne le sont pas à 1440px :**
Le calque `scatter` desktop supposait un espace vide notable de chaque côté du contenu (`+widescreen`, dès 1216px). En réalité le container Bulma fullhd fait ~1344px de large ; à 1440px (résolution laptop très courante) il ne reste que ~48px de gouttière de chaque côté — la sidebar (liste joueurs, "Share game") occupe presque toute la largeur restante. Un cocktail de gouttière se retrouvait à chevaucher le texte "Invite other players…". **Fix :** seuil relevé à un `@media (min-width: 1700px)` custom (pas un mixin Bulma standard) + motifs repoussés plus près du bord réel (0.6–1.4vw au lieu de 1–3vw). Vérifié sans chevauchement à 1440px (motifs simplement absents) et propre à 1920px.

**Mobile — décision de ne PAS mettre le calque `scatter` en mobile :** une première tentative plaçait 2 motifs (ananas, pastèque) en `position: fixed; bottom: ...` sur mobile. Problème : `position:fixed` reste collé au viewport quel que soit le scroll, alors que le contenu mobile est plein-large sans marge (radius 0, edge-to-edge) — les motifs finissaient systématiquement à chevaucher des champs de formulaire au lieu de rester dans un espace vide. Supprimé. Le supplément mobile passe uniquement par des éléments en flux normal (icônes inline `variant="icon"` dans les headers + top-bar), jamais par un calque fixed superposé au contenu scrollable.

**Icône palm en petit format peu lisible :** la première version du SVG palm (variant `icon`) utilisait 4 triangles pleins en éventail — à ~20px (mobile-top-bar) ça ne se lit pas comme un palmier, juste une tache. Redessiné en 4 traits (stroke, pas fill) façon feuilles fines ; toujours pas parfait en dessous de ~24px, donc la mobile-top-bar utilise `cocktail` (qui se lit bien même petit) plutôt que `palm`.

**Vérification :** partie complète jouée avec 2 joueurs réels via Playwright (2 contextes navigateur, un slug de partie partagé), 0 erreur console sur les deux, écran de jeu (`Game.vue`) inspecté via `getComputedStyle`/`getBoundingClientRect` sur les éléments `.decor` pour confirmer le fix du piège n°1 avant/après.

### 2026-07-09 — GameConfiguration : rounds/temps déplacés en advanced settings + temps auto-calculé

**Demande utilisateur :** les sliders "Rounds" et "Time limit" encombraient l'écran principal de config. Déplacer dans "Advanced settings", avec des défauts sensés : 6 rounds fixes, et un temps par round calculé automatiquement (20s/catégorie), recalculé dynamiquement à l'ajout/suppression de catégories — sauf si le maître a modifié le slider de temps à la main, auquel cas il reste figé à sa valeur manuelle.

**Implémentation (`GameConfiguration.vue`) :**
- Nouveau flag `time_edited` (au même niveau que `categories_edited` existant, même logique de "dirty flag" jamais réinitialisé en cours de partie).
- `compute_auto_time(categories_count)` : `categories_count * 20`, arrondi au pas du slider (15s), clampé entre 15s et `infinite_duration`.
- `update_game_configuration()` (méthode partagée par presque tous les champs du formulaire) recalcule et écrase `config.time` à chaque appel tant que `!time_edited` — pas besoin de watcher dédié sur le nombre de catégories, cette méthode est déjà appelée à chaque changement de champ (categories, alphabet, scores, rounds…), donc le temps reste synchronisé "gratuitement".
- Nouvelle méthode `on_time_changed()` (bindée sur `@change` du slider de temps, à la place de `update_game_configuration` direct) : pose `time_edited = true` **avant** d'appeler `update_game_configuration()`, sinon le recalcul automatique à l'intérieur écraserait immédiatement la valeur que le joueur vient de choisir à la main.
- `load_suggestions(init)` : au même endroit où les catégories/alphabet par défaut sont posés pour une partie neuve, ajout de `config.turns = 6` (nouvelle constante `default_rounds`) et du calcul auto du temps initial.
- Template : les deux `<o-field>` (Rounds, Time) déplacés du formulaire principal vers la section advanced (nouvelle ligne `.columns` au-dessus de celle Alphabet/Scores). Le slider de temps garde `@change="on_time_changed"` (pas `update_game_configuration`). Un texte d'aide (`.config-defaults-hint`, `v-if="!time_edited"`) sous le slider explique le calcul auto ; un résumé similaire ("X rounds, Y par round par défaut — modifiable dans les paramètres avancés.") remplace les sliders dans la colonne de droite de l'écran principal, à côté du switch "Stop rounds...".

**Piège évité :** ne pas mettre le recalcul dans un `watch` sur `config` (qui ne se déclenche qu'au retour du serveur, avec un temps de latence) — le brancher directement dans `update_game_configuration()` le rend synchrone avec la saisie locale, cohérent avec le pattern déjà utilisé pour `categories_edited`.

**Vérification :** testé via Playwright — valeur auto affichée correctement au chargement (8 catégories EN × 20s → arrondi à 165s = "2 minutes and 45 seconds"), le hint disparaît après un drag manuel du slider (`time_edited` passe à `true`), et le temps reste bien figé à la valeur manuelle après ajout d'une catégorie supplémentaire. 0 erreur console.

### 2026-07-09 — Retour sur le slider de temps : passage à "temps par catégorie"

**Demande utilisateur (suite immédiate du point précédent) :** au lieu d'un slider de temps total par round avec verrouillage manuel, exposer directement un slider "temps par catégorie" ; le temps total par round devient une valeur **toujours dérivée** (catégories × temps/catégorie), affichée dynamiquement, sans notion de "verrouillage" — il n'y a plus qu'une seule source de vérité (le temps par catégorie), donc `time_edited` n'a plus lieu d'être.

**Décision architecture — dérivation côté serveur, pas côté client :** `back/src/game.js` (`update_configuration`) devient la seule source de vérité pour le calcul `time = secondsPerCategory × categories.length` (clampé 15s → `infinite_duration - 1`, avec `secondsPerCategory >= infinite_duration` comme sentinel "illimité", exactement comme l'ancien slider). Le champ `time` envoyé par le client est désormais ignoré et recalculé serveur ; ça évite tout désync si deux clients modifient la config en même temps (le maître qui bouge le slider pendant qu'un changement de catégories arrive d'ailleurs, etc.). `secondsPerCategory: 20` ajouté à la configuration par défaut du constructeur `Game`.

**Front (`GameConfiguration.vue`) :**
- Suppression complète de `time_edited`/`compute_auto_time`/`on_time_changed` (obsolètes avec ce modèle — il n'y a plus de "manuel vs auto", juste une seule valeur toujours dérivée).
- Nouveaux computed `seconds_per_category_or_default`, `round_time_is_infinite`, `round_time_seconds` : recalculent la même formule que le back, **localement et instantanément** (pas d'attente d'aller-retour serveur), pour un retour visuel immédiat pendant qu'on bouge le slider ou qu'on ajoute/enlève une catégorie.
- `actual_time`/`actual_time_mobile` branchés sur `round_time_seconds` (dérivé local) au lieu de `config.time` (valeur serveur, potentiellement en retard d'un aller-retour WS).
- Slider "Time per category" : `min=5, max=infinite_duration, step=5`, ticks 10-80s + `∞`, bindé sur `config.secondsPerCategory`, `@change="update_game_configuration"` (méthode générique, plus besoin de handler dédié).
- Nouveau texte dynamique sous le slider : `→ {categories_count} categories, {limit} per round`, toujours visible (recalculé à chaque frappe/ajout/suppression de catégorie).

**Piège de test (pas un bug produit) :** `page.locator(...).press('Enter')` sur le champ du taginput Oruga ne confirmait pas toujours l'ajout d'une catégorie pendant les tests Playwright (dropdown d'autocomplétion qui intercepte l'event différemment selon si le keydown est émis au niveau de l'élément ou de la page). `page.keyboard.type(...)` puis `page.keyboard.press('Enter')` au niveau page fonctionne de façon fiable. Aucun rapport avec `ptitbac-commons`/l'app elle-même — juste une leçon pour les futurs tests Playwright sur ce composant.

**Vérification :** partie complète jouée à 2 joueurs avec 3 catégories (Animal/Vegetal/Colour, suppression des 5 autres via Playwright) et le défaut 20s/catégorie → écran de config affiche bien "1 minute per round" avant lancement, partie démarrée sans erreur. Testé aussi le drag du slider (+4 crans de 5s) et l'ajout/suppression de catégories : le texte dynamique se met à jour instantanément et correctement dans tous les cas (8→9 catégories : "2 minutes and 40 seconds" → "3 minutes" à 20s/catégorie). Back redémarré pour appliquer le nouveau schéma de configuration (`secondsPerCategory`). 0 erreur console sur les deux joueurs.

### 2026-07-09 — Slider "Time per category" cassé sur mobile → remplacement par des steppers +/-

**Bug signalé (screenshot) :** les labels des ticks du slider "Time per category" (10s/20s/.../80s) se chevauchaient tous, illisibles. **Cause :** le slider gardait `max="infinite_duration"` (600) comme borne haute — hérité de l'ancien slider "temps total par round" où ça faisait sens (ticks 60-540 répartis sur toute la plage) — mais les ticks utiles du nouveau modèle "temps par catégorie" (10-80) ne représentent que ~13% de cette plage 5-600, donc tous les labels s'écrasaient au même endroit visuellement.

**Retour UX plus large de l'utilisateur :** les sliders sont peu adaptés au tactile (cible de précision difficile à toucher du doigt), à corriger "pour toute la page", dans un esprit mobile-first.

**Décision :** remplacement des sliders `Rounds` et `Time per category` par des **steppers +/-** (nouveau composant réutilisable `NumberStepper.vue`) — boutons de 48px (> 44px WCAG 2.5.5), pas de geste de glissé à précision fine requis, fonctionne aussi bien au clic qu'au tactile.

- `NumberStepper.vue` : props `modelValue`, `min`, `max`, `step`, `suffix`, `disabled` ; émet `update:modelValue` en continu et `change` (pour déclencher l'envoi au serveur, cohérent avec le `@change` déjà utilisé partout ailleurs dans ce fichier).
- Le tick "∞" du slider de temps (qui causait aussi le problème d'échelle) devient un **switch explicite "No time limit"**, plus lisible qu'un point caché en bout de course. Nouveau computed `no_time_limit` (getter/setter) dans `GameConfiguration.vue` : bascule `config.secondsPerCategory` vers/depuis `infinite_duration`, en gardant `last_manual_seconds_per_category` pour restaurer la dernière valeur choisie si le maître redécoche.
- Les clés i18n `"Rounds: {rounds}"` et `"Time per category: {seconds}"` (qui affichaient la valeur dans le label) deviennent `"Rounds"` / `"Time per category"` tout court — la valeur est maintenant affichée par le stepper lui-même, pas besoin de la dupliquer dans le label.

**Pas encore fait (hors scope de cette passe) :** la grille de scores (5 `o-input type="number"`) n'a pas été convertie en steppers — laissée telle quelle, ce sont des valeurs plus libres (peuvent être négatives, pas de bornes naturelles) où taper un nombre reste raisonnable au clavier tactile. À revisiter si retour utilisateur en ce sens.

**Vérification :** testé au clic (Playwright) sur mobile (390px) — Rounds 6→8 (+2), Time per category 20s→5s (-3, clampé correctement au minimum), hint dynamique "8 categories, 40 seconds per round" à jour instantanément, toggle "No time limit" masque le stepper et affiche "infinite per round", et restaure bien 5s (dernière valeur manuelle) au dé-toggle. 0 erreur console.

### 2026-07-09 — Langue française par défaut + piège majeur découvert : le sélecteur de langue n'a jamais fonctionné

**Demande utilisateur :** "Je veux que l'app soit en français par défaut, pas en anglais." L'app démarrait avec `morelI18n.load_locale_from_browser()`, qui retombe sur `navigator.language` en l'absence de préférence stockée — anglais pour n'importe quel navigateur non francophone.

**Fix demandé (`pitit-bac/front/src/main.js`) :** remplacé par `morelI18n.load_locale(localStorage.getItem('morel-locale') || 'fr')` — respecte un choix explicite déjà fait (sélecteur de langue), sinon force le français. Décision de ne PAS modifier `load_locale_from_browser()` dans `morel-games-core` (reste un comportement générique valide pour d'autres jeux basés sur ce framework) — le choix "français par défaut" est spécifique à Pitit Bac, donc géré côté `pitit-bac/front`.

**Piège majeur découvert en testant ce changement — `morel-games-core-master/src/game/i18n.js` :**

`_set_already_loaded_locale()` faisait `this.i18n.global.locale.value = locale`. Avec `createI18n({ legacy: true })` (utilisé ici), `i18n.global.locale` est une **chaîne simple**, pas un `ref` de la Composition API — `.value` dessus est `undefined`, et `quelque_chose.value = x` sur un primitif est un no-op silencieux (pas d'erreur, aucun effet). Confirmé en isolant le bug : `typeof i18n.global.locale === "string"`.

**Conséquence réelle, au-delà de la demande initiale :** le sélecteur de langue (dropdown FR/EN dans le footer) **n'a jamais changé la langue affichée**, depuis toujours — pas seulement pour ce changement de défaut. Le seul cas où l'app semblait "fonctionner" en anglais était le tout premier rendu avant tout appel à `load_locale` (état initial `locale: 'en'` du constructeur `MorelI18n`), ce qui masquait complètement le bug.

**Fix :** `this.i18n.global.locale = locale` (sans `.value`), même chose pour la comparaison `if (this.i18n.global.locale === locale ...)` dans `load_locale()`. Deux occurrences, un seul fichier.

**Piège de rebuild :** ce fichier est dans `morel-games-core-master/src/`, pré-bundlé par Vite dans `node_modules/.vite/deps/` au premier démarrage (piège déjà documenté dans INDEX.md). Le serveur Vite qui tournait déjà depuis le début de la session servait encore l'ancien code après l'édit. Remède appliqué : tuer le process Vite, supprimer `pitit-bac/front/node_modules/.vite/`, relancer.

**Vérification :**
- Visite fraîche avec navigateur `en-US` simulé (Playwright, localStorage vide) → app entièrement en français dès le premier rendu, `<html lang="fr">`, 0 erreur console.
- Bug isolé et confirmé avant fix : assignation directe `i18n.global.locale.value = 'fr'` → aucun effet visible. Après fix : `i18n.global.locale = 'fr'` → changement instantané et correct de toute l'UI.
- `useMorelStore().set_locale('en')` (l'action exacte appelée par le sélecteur de langue) appelée directement → bascule tout l'app vers l'anglais correctement, confirmant que le sélecteur fonctionne réellement maintenant (le clic simulé via Playwright sur le dropdown Oruga teleporté restait capricieux en headless — probablement une limite de l'automatisation sur ce composant, pas un bug produit ; testé et confirmé au niveau de l'action qu'il déclenche).
- Partie complète rejouée à 2 joueurs après le fix, 0 erreur console.

### 2026-07-09 — Refonte UX du sélecteur de catégories (champ + modal de suggestions)

**Demande utilisateur :** le sélecteur de catégories était "moche et vieux et pas pratique" sur mobile comme desktop.

**Diagnostic :** le champ principal (taginput) était déjà correctement stylé (chips coral, croix visibles — travail de sessions précédentes). Le vrai problème était la **modal de suggestions** : ~400 suggestions réparties en 30 groupes sans aucun moyen de chercher, et surtout les tags non sélectionnés étaient quasiment invisibles — `$background` (variables.scss, `#FFF8F3`) et le fond de la modal (`#fff9f3`) sont presque identiques, donc un tag Bulma par défaut (fond = `$background`) se fondait complètement dans l'arrière-plan. Zéro affordance "c'est cliquable".

**Ce qui a été fait (`GameConfiguration.vue`) :**
- **Recherche** dans la modal : nouveau champ (icône loupe — `faMagnifyingGlass` ajouté dans `main.js`), filtre en direct sur `filtered_suggestion_groups`, insensible aux accents (`normalize_for_search` : NFD + suppression des diacritiques combinants). Les groupes sans résultat sont masqués (pas de lignes vides). Champ **sticky** en haut du corps de la modal — reste accessible même après avoir scrollé loin dans la liste.
- **Tags redessinés** : chips toujours visibles (fond blanc translucide + bordure ambrée quand non sélectionné, gradient corail + coche `✓` quand sélectionné), tap targets plus généreux (`min-height: 2.3em`, padding augmenté) pour le tactile.
- **Compteur en direct** dans l'en-tête de la modal ("9 sélectionnées") et sur le label du champ principal ("Catégories à remplir 9").
- **Footer** : bouton "Fermer" neutre remplacé par un CTA primaire "Terminé" (pleine largeur).
- **État vide** : message dédié "Aucune catégorie ne correspond à votre recherche." si la recherche ne donne rien (distinct du message "aucune suggestion pour votre langue").
- Bouton "Suggestions" du champ principal : ajout d'une icône (ananas, `SummerDecor variant="icon"`) pour cohérence avec le reste du thème.

**Bug fixé au passage :** l'aide sous le champ catégories affichait littéralement `&nbsp;` (entité HTML non décodée) — `:message` d'`o-field` rend du texte brut, pas du HTML. Remplacé par un espace normal dans `fr.json`.

**Piège rencontré — icône cassée dans `<o-input icon="...">` :**
1. Passer `class="suggestions-search"` directement sur `<o-input>` atterrit sur le `<input>` natif lui-même, pas sur un wrapper — cassait le positionnement sticky combiné à l'icône. Fix : wrapper `<div class="suggestions-search">` autour de l'`o-input`.
2. Une fois wrappé, l'icône loupe restait quand même mal positionnée (rendue en flux normal au-dessus de l'input au lieu d'être superposée à gauche). Cause : la config Oruga globale dans `main.js` (`input: { rootClass: 'control', inputClass: 'input' }`) écrase la logique interne du thème Bulma qui ajoute normalement `has-icons-left` sur `.control` quand une icône est présente — sans cette classe, `.icon.is-left` n'est jamais positionné en absolu. Fix : positionnement de l'icône refait à la main en CSS (`.control { position: relative } .icon.is-left { position: absolute; left: 0.9rem }`) plutôt que de dépendre de cette classe manquante. À garder en tête pour tout futur usage de `icon=` sur `o-input` dans ce projet.

**Piège de tooling (pas un bug produit) :** tentative initiale d'utiliser `̀-ͯ` (plage des diacritiques combinants) comme échappement ASCII dans le regex de `normalize_for_search` — plusieurs passes d'édition ont fini par écrire les caractères Unicode combinants littéraux dans le fichier source au lieu de la séquence d'échappement textuelle (perte probable au passage à travers plusieurs couches d'échappement shell/JS). Contourné en construisant les bornes du regex via `String.fromCharCode(0x0300)` / `String.fromCharCode(0x036f)` — garantit un fichier source 100 % ASCII pour cette regex, indépendamment de tout souci d'encodage d'outillage.

**Vérification :** recherche testée sans accent ("celebrite" trouve "Célébrité⋅e"), sélection/désélection avec mise à jour immédiate du compteur, état "aucun résultat", scroll avec recherche sticky sur mobile (390px), partie complète rejouée à 2 joueurs. 0 erreur console partout.
