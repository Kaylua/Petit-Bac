# Index & référence rapide — Petit Bac

> **Statut :** Phase 2 terminée ✅ — Vue 3 / Oruga / Pinia / ESM. App fonctionnelle.
> Lire ce fichier EN PREMIER. Si bug : section "Pièges" avant tout.

## Fichiers racine notables

| Fichier | Rôle |
|---------|------|
| `CLAUDE.md` | Instructions Claude Code (ordre de lecture, règles, hook bootstrap) |
| `INDEX.md` | Ce fichier — carte du projet + pièges |
| `CHANTIER.md` | Stack, architecture, décisions, journal |
| `project-setup-template.md` | Template one-shot pour répliquer ce système sur d'autres projets |

---

## Carte du projet

### Front (`pitit-bac/front/`)

Les chemins `src/...` sont relatifs à `pitit-bac/front/`.

| Quoi | Fichier |
|------|---------|
| Bootstrap app (Vue, Pinia, Oruga, i18n, WS) | `src/main.js` |
| Routing de phase (PSEUDONYM/CONFIG/ROUND/VOTE/END) | `src/App.vue` |
| Store jeu (scores, rounds, votes, config) | `src/store.js` |
| Client WebSocket jeu | `src/game.js` |
| Config partie (catégories, durée, alphabet…) | `src/components/GameConfiguration.vue` |
| Saisie des réponses | `src/components/Game.vue` |
| Vote sur les réponses | `src/components/GameVote.vue` |
| Scores finaux | `src/components/GameEnd.vue` |
| Timer circulaire CSS-driven (props: `value` 0–100, `label`) | `src/components/CircularProgress.vue` |
| Motifs décoratifs SVG "summer vibes" (palmier, cocktail, soleil, confettis) — variants `hero`/`corner`, purement cosmétique | `src/components/SummerDecor.vue` |
| Contrôle numérique +/- mobile-friendly (remplace les sliders Oruga pour Rounds/Time per category) | `src/components/NumberStepper.vue` |
| Variables Bulma (couleurs, primary=#E64A19 orange été) | `src/assets/variables.scss` |
| Overrides globaux composants UI (boutons, cartes, inputs, tags, panel, mobile) — partial Sass, importé par App.vue | `src/assets/design-system.sass` |
| Config Vite (`preserveSymlinks` pour `file:`, `loadPaths` SCSS → node_modules) | `vite.config.js` |
| Entrypoint HTML Vite | `index.html` |
| Variables d'env dev (`VITE_WS_URL=ws://{hostname}:62868`, `VITE_URL`) | `.env` |
| Variables d'env prod (même clés, URLs de prod) | `.env.production` |
| Traductions UI FR (vue-i18n) | `locales/fr.json` |
| Catégories suggérées FR / EN (autocomplétion dans la config) | `locales/categories/fr.json` + `en.json` |

### morel-games-core (`morel-games-core-master/src/`)

| Quoi | Fichier |
|------|---------|
| Point d'entrée package (re-exporte tout) | `index.js` |
| Barrel exports du dossier game (useMorelStore, MorelClient, MorelI18n) | `game/index.js` |
| Store Pinia connexion WS, pseudo, phase | `game/store.js` → `useMorelStore` |
| Client WS base (protocole morel) | `game/game.js` → `MorelClient` |
| i18n wrapper vue-i18n v9 | `game/i18n.js` → `MorelI18n` |
| Enregistrement composants morel-* | `components/index.js` |
| Page pseudo/join | `components/AskPseudonym.vue` |
| Liste joueurs + kick | `components/Players.vue` |
| Icône action joueur avec tooltip Oruga (utilisée dans Players.vue) | `components/PlayerAction.vue` |
| Partage lien / verrou | `components/ShareGame.vue` |
| Sélecteur langue | `components/LocaleSwitcher.vue` |
| Traductions FR du core (chaînes morel-* communes) | `../locales/fr.json` |

### Back (`pitit-bac/back/`)

| Quoi | Fichier |
|------|---------|
| Point d'entrée Node — crée le serveur HTTP, écoute port `PITIT_BAC_WS_PORT` (défaut 62868) | `src/index.js` |
| `GameServer` : WebSocket, auth UUID/secret, routing des actions, intégration Munin, stats JSON | `src/server.js` |
| Logique de jeu (rounds, votes, scores, états) | `src/game.js` |
| Utilitaires log (`log_info`, `log_err`, `log_debug` — `log_debug` silencieux en prod) | `src/logging.js` |
| Shim d'entrée — juste `import './src/index.js'` | `index.js` |

### Commons (`pitit-bac/commons/`)

Code partagé back + front. Référencé en `file:../commons` dans `back/package.json`.

| Quoi | Fichier |
|------|---------|
| `is_answer_valid(letter, answer)` — vérifie la 1re lettre, accent-tolerant via slugify | `index.js` |
| `is_answer_accepted(votes)` — accepte si >50 % votes positifs | `index.js` |
| `compare_answers(a, b)` — égalité insensible à la casse, aux espaces | `index.js` |
| Tests Mocha des trois fonctions (lancé avec `npm test` dans `commons/`) | `tests.js` |

### Munin (`pitit-bac/munin/`)

Package npm local `munin-http`. Utilisé par `back/src/server.js` pour exposer des métriques au démon Munin (running_games, clients, all_games).

| Quoi | Fichier |
|------|---------|
| Classe `Munin` — se branche sur un `http.Server`, expose `/munin/{source}` en texte | `index.js` |
| Plugin Python pour le démon Munin (collecte les métriques HTTP) | `plugin/node_http.py` |

### Production (`pitit-bac/production/`)

Fichiers de déploiement — ne pas modifier sans raison.

| Quoi | Fichier |
|------|---------|
| Config nginx (reverse proxy WS + servir `front/dist-build`) | `nginx.conf` |
| Unit systemd pour le back (`pitit-bac.service`) | `pitit-bac.service` |
| Script de démarrage back en mode production | `start-back.sh` |

### Fichiers data

| Quoi | Chemin |
|------|--------|
| Alphabets présets (FR, EN, etc.) — utilisé par GameConfiguration.vue | `pitit-bac/front/data/alphabets.json` |
| Stats runtime (parties jouées, etc.) — **gitignored, doit exister** | `pitit-bac/back/data/statistics.json` |

### Racine `pitit-bac/`

| Quoi | Fichier |
|------|---------|
| Commandes utilitaires : `install`, `start`, `build-front`, `start-back-production`, etc. | `Makefile` |
| Version Node cible (utilisée par nvm) | `.nvmrc` |
| **Documentation complète du protocole WebSocket client↔serveur** (toutes les actions) | `protocol.md` |

---

## Démarrage rapide

```bash
# Installer toutes les dépendances (commons + back + front)
cd pitit-bac && make install

# Lancer front + back en parallèle (dev)
cd pitit-bac && make start
# équivalent : make -j2 start-back watch-front

# Séparément :
cd pitit-bac/back && node index.js        # Back  → ws://localhost:62868
cd pitit-bac/front && npm run serve       # Front → http://localhost:5173
```

---

## Pièges connus

### Diagnostic n°1 : ouvrir la console navigateur (F12)
Les `[Vue warn]: Failed to resolve component: xxx` donnent la cause racine immédiatement.

### ⚠️ Oruga — `createOruga()` n'enregistre PAS les composants
```js
// ❌ o-field, o-input etc. rendus comme HTML inconnu → rien ne s'affiche
app.use(createOruga({ ...bulmaConfig }))

// ✅
import { createOruga, OrugaComponentPlugins } from '@oruga-ui/oruga-next'
app.use(createOruga({ ...bulmaConfig }, OrugaComponentPlugins))
```

### Oruga — remapping icônes FA (automatique dans Oruga 0.13)
`chevron-*` → `angle-*` en interne. Enregistrer `faAngleRight`, pas `faChevronRight`.

### Oruga — props sans préfixe `is-`
```js
// ❌  size="is-large"   variant="is-primary"
// ✅  size="large"      variant="primary"
```

### ⚠️ Oruga `o-input icon="..."` — icône mal positionnée
La config Oruga globale dans `main.js` (`input: { rootClass: 'control', inputClass: 'input' }`) écrase la logique du thème Bulma qui ajoute `has-icons-left`/`has-icons-right` sur `.control` quand un icon est présent. Sans cette classe, `.icon.is-left` reste en flux normal au lieu d'être positionné en absolu sur l'input. Repositionner à la main en CSS (`.control { position: relative } .icon.is-left { position: absolute; left: ... }`) plutôt que de compter sur cette classe. Aussi : passer `class="x"` directement sur `<o-input>` atterrit sur le `<input>` natif, pas sur un wrapper — utiliser un `<div>` englobant si un style doit cibler le champ dans son ensemble (ex: `position: sticky`).

### ⚠️ Cache Vite stale après modification de morel-games-core
Vite pre-bundle `morel-games-core` dans `node_modules/.vite/deps/` au premier démarrage. Modifier un fichier dans `morel-games-core-master/` APRÈS ce démarrage → le bundle servi est stale → erreurs runtime inexplicables (`X is not a function`).  
**Remède :** tuer tous les serveurs Vite, supprimer `pitit-bac/front/node_modules/.vite/`, relancer.

### morel-games-core — éditer les sources, pas node_modules
Dépendance locale `file:../../morel-games-core-master`. Modifier directement les fichiers dans `morel-games-core-master/src/`.

### CSS — Bulma 1.x vs 0.9.4 coexistent
`@oruga-ui/theme-bulma/style.css` embarque Bulma 1.0.4. `App.vue` importe Bulma 0.9.4 via SCSS. Pas de conflit bloquant (0.9.4 gagne pour les classes communes), mais peut causer des glitches de style.

### ⚠️ `require()` dans le front → page blanche silencieuse
Tout `require(...)` dans le code front est un survivant webpack. Dans Vite/ESM, `require` n'existe pas côté navigateur → erreur JS au montage du composant → page blanche sans warning Vue. Remplacer par un import statique ESM en haut du fichier. Voir CHANTIER.md pour le fix appliqué à `GameConfiguration.vue`.

### ⚠️ `back/data/statistics.json` — fichier gitignored à créer manuellement
Le back écrit ses stats dans `pitit-bac/back/data/statistics.json`. Ce fichier est gitignored et le dossier `data/` n'existe pas dans un clone frais → erreur `ENOENT` au lancement (non bloquante, la partie tourne quand même). Créer manuellement : `mkdir pitit-bac/back/data && echo {} > pitit-bac/back/data/statistics.json`.

### Port WS — variable d'env `PITIT_BAC_WS_PORT`
Le back écoute sur le port défini par `PITIT_BAC_WS_PORT` (défaut : 62868). Le front lit `VITE_WS_URL` dans `.env` / `.env.production`. Les deux doivent être cohérents.

### `commons/tests.js` — CJS uniquement
Les tests commons utilisent `require()` (CJS/Mocha legacy). Ne pas les convertir en ESM sans adapter le test runner.

### ⚠️ vue-i18n `legacy: true` — `i18n.global.locale` est une string, pas un ref
Avec `createI18n({ legacy: true })` (utilisé ici), `i18n.global.locale` est une chaîne simple. `i18n.global.locale.value = x` est un no-op silencieux (assignation sur un primitif, aucune erreur). Toujours écrire `i18n.global.locale = x` directement. Piège qui a rendu le sélecteur de langue totalement inopérant pendant longtemps sans qu'aucune erreur ne le signale — voir `morel-games-core-master/src/game/i18n.js`.
