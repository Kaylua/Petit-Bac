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
