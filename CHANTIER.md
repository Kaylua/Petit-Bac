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

### 2026-07-09 — Auto-réparation du hook dans CLAUDE.md

`CLAUDE.md` : ajout d'une section "Bootstrap" — au démarrage de chaque session, Claude vérifie que le hook PostToolUse est présent dans `.claude/settings.local.json` et l'ajoute si absent. Garantit que INDEX.md et CHANTIER.md sont toujours alimentés même avec un `.claude` vide.
