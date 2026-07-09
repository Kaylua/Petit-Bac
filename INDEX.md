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

### Front (`pitit-bac/front/src/`)
| Quoi | Fichier |
|------|---------|
| Bootstrap app (Vue, Pinia, Oruga, i18n, WS) | `main.js` |
| Routing de phase (PSEUDONYM/CONFIG/ROUND/VOTE/END) | `App.vue` |
| Store jeu (scores, rounds, votes, config) | `store.js` |
| Client WebSocket jeu | `game.js` |
| Config partie (catégories, durée, alphabet…) | `components/GameConfiguration.vue` |
| Saisie des réponses | `components/Game.vue` |
| Vote sur les réponses | `components/GameVote.vue` |
| Scores finaux | `components/GameEnd.vue` |
| Variables Bulma (couleurs, primary=#3f9718 vert) | `src/assets/variables.scss` |

### morel-games-core (`morel-games-core-master/src/`)
| Quoi | Fichier |
|------|---------|
| Store Pinia connexion WS, pseudo, phase | `game/store.js` → `useMorelStore` |
| Client WS base (protocole morel) | `game/game.js` → `MorelClient` |
| i18n wrapper vue-i18n v9 | `game/i18n.js` → `MorelI18n` |
| Enregistrement composants morel-* | `components/index.js` |
| Page pseudo/join | `components/AskPseudonym.vue` |
| Liste joueurs + kick | `components/Players.vue` |
| Partage lien / verrou | `components/ShareGame.vue` |
| Sélecteur langue | `components/LocaleSwitcher.vue` |

### Back (`pitit-bac/back/src/`)
| Quoi | Fichier |
|------|---------|
| Point d'entrée + serveur WS | `index.js` → `server.js` |
| Logique de jeu | `game.js` |

### Fichiers data
| Quoi | Chemin |
|------|--------|
| Alphabets présets (FR, EN, etc.) — utilisé par GameConfiguration.vue | `pitit-bac/front/data/alphabets.json` |
| Stats runtime (parties jouées, etc.) — **gitignored, doit exister** | `pitit-bac/back/data/statistics.json` |

---

## Démarrage rapide

```bash
# Front seul
cd pitit-bac/front && npm run serve   # → http://localhost:5173

# Back
cd pitit-bac/back && node index.js
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

### morel-games-core — éditer les sources, pas node_modules
Dépendance locale `file:../../morel-games-core-master`. Modifier directement les fichiers dans `morel-games-core-master/src/`.

### CSS — Bulma 1.x vs 0.9.4 coexistent
`@oruga-ui/theme-bulma/style.css` embarque Bulma 1.0.4. `App.vue` importe Bulma 0.9.4 via SCSS. Pas de conflit bloquant (0.9.4 gagne pour les classes communes), mais peut causer des glitches de style.

### ⚠️ `require()` dans le front → page blanche silencieuse
Tout `require(...)` dans le code front est un survivant webpack. Dans Vite/ESM, `require` n'existe pas côté navigateur → erreur JS au montage du composant → page blanche sans warning Vue. Remplacer par un import statique ESM en haut du fichier. Voir CHANTIER.md pour le fix appliqué à `GameConfiguration.vue`.

### ⚠️ `back/data/statistics.json` — fichier gitignored à créer manuellement
Le back écrit ses stats dans `pitit-bac/back/data/statistics.json`. Ce fichier est gitignored et le dossier `data/` n'existe pas dans un clone frais → erreur `ENOENT` au lancement (non bloquante, la partie tourne quand même). Créer manuellement : `mkdir pitit-bac/back/data && echo {} > pitit-bac/back/data/statistics.json`.
