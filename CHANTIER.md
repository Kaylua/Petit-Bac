# Chantier : Petit Bac

## Statut

Phase 2 terminée ✅. Front Vue 3 / Oruga / Pinia / vue-i18n v9 / FA v3 tourne (`npm run serve` → http://localhost:5173). Back Node 22 ESM natif tourne (`node index.js`). Prochaine étape : à définir.

---

## Architecture

```
ProjetPetitBac/
├── pitit-bac/
│   ├── back/        : Serveur Node.js WebSocket (logique de jeu)
│   ├── front/       : Front Vue 3 + Oruga + Pinia
│   ├── commons/     : Code partagé back/front (vérification réponses, calcul votes)
│   ├── munin/       : Monitoring optionnel (métriques parties)
│   └── production/  : Config nginx + systemd pour déploiement
└── morel-games-core-master/
    - Framework maison réutilisable pour jeux multijoueurs WebSocket
    - Fournit : MorelClient (game.js), useMorelStore/initMorelStore (store.js), MorelI18n (i18n.js), composants Vue (lobby, joueurs, pseudo)
    - Dépendance locale : file:../../morel-games-core-master (éditer les sources, jamais node_modules)
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

### Phase 1 : Migration Vite (2026-07-09) ✅

**Pourquoi :** `@vue/cli` 4.2 était très outdated, Node 22 incompatible avec certains loaders webpack. Objectif : sortir de vue-cli sans casser la compatibilité Vue 2.

**Ce qui a été fait :** Vite 5 + `@vitejs/plugin-vue2`, Vue 2.6→2.7, bump des dépendances front compatibles Vue 2.

**Piège rencontré :** Les imports SCSS `~bulma/` / `~buefy/` (convention webpack/sass-loader) ne fonctionnent pas sous Vite. Solution : supprimer le préfixe `~` partout + `css.preprocessorOptions.scss.loadPaths: [resolve('node_modules')]` dans `vite.config.js`.

---

### Phase 2 : Migration Vue 3 / Oruga / Pinia (2026-07-09) ✅

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

### Back : Migration ESM natif Node 22 (2026-07-09) ✅

**Pourquoi :** `esm@3` crashait au démarrage sur Node 22 (assertion native dans `node::fs::InternalModuleStat`). Le code utilisait déjà la syntaxe `import/export`, il suffisait de passer en ESM natif.

**Ce qui a été fait :** `"type": "module"` dans les 3 packages (`back`, `commons`, `munin`), suppression du shim `esm`, recalcul de `__dirname` via `fileURLToPath(import.meta.url)`, correction des imports locaux (extension `.js` obligatoire en ESM), correction de l'import `uuid` (v14 ESM natif).

---

## Journal des modifications récentes

### 2026-07-09 : Piège avec `require()` dans un composant Vue 3 / Vite → page blanche

`GameConfiguration.vue` utilisait `require('../../data/alphabets.json')` dans `data()`, héritage Vue 2/webpack. Dans un contexte ESM/Vite, `require` n'est pas défini côté navigateur → erreur JS silencieuse au montage → page blanche sans message d'erreur console évident.

**Fix :** import statique ESM en haut du script : `import alphabetsData from '../../data/alphabets.json'`, puis `alphabets: alphabetsData` dans `data()`. Vite sait importer les JSON nativement.

**À retenir :** Tout `require()` dans le code front est un survivant webpack à éliminer.

### 2026-07-09 : modales mobiles cassées, piège `position: fixed` + `transform` persistant + dropdowns convertis en modales

**Symptôme signalé :** les popups "Suggestions", "Pré-sélections" (alphabet) et "Explications" (scores) s'affichaient mal coupées/décentrées sur mobile, avec un scroll qui ne se recalait pas au bon endroit.

**Piège racine (le vrai bug, découvert par diagnostic Playwright avec `getBoundingClientRect`) :** `.game-configuration` a une animation d'entrée `animation: fadeInUp 0.4s ease both` (`App.vue`). Le keyframe `to` fixe `transform: translateY(0)`, avec le fill-mode `both`, cette valeur reste appliquée **en permanence** après la fin de l'animation. Or tout `transform` non-`none` sur un ancêtre crée un nouveau *containing block* pour ses descendants en `position: fixed` (règle CSS peu connue) : au lieu d'être fixé à la fenêtre, l'élément se comporte comme du `position: absolute` relatif à cet ancêtre. `o-modal` d'Oruga a `teleport: false` par défaut (ne sort donc pas du DOM local) → toute modale ouverte depuis `GameConfiguration.vue` héritait de ce faux repère. Résultat invisible tant qu'on ouvrait la modale en haut de page (offset shift = 0px, coïncidence), mais dès qu'on scrollait (cas quasi systématique sur mobile pour atteindre "Paramètres avancés"), la modale apparaissait décalée vers le haut exactement du montant du scroll, potentiellement hors écran.

**Fix :** ajout de `teleport` (→ `true`) sur les 3 `<o-modal>` de `GameConfiguration.vue`. La modale est alors montée à la racine de `<body>`, hors de portée du `transform` de `.game-configuration`. Vérifié via Playwright : `getBoundingClientRect()` de la modale passe de `{x:-4, y:-960}` (après scroll de 960px) à `{x:-4, y:80}` (correctement ancrée au viewport).

**À retenir pour toute future modale/popup dans ce projet :** si un ancêtre a une `animation`/`transition` sur `transform` avec fill-mode `both`/`forwards`, systématiquement passer `teleport` à `true` sur `<o-modal>` (et vérifier l'équivalent pour tout composant Oruga avec position `fixed`/`absolute` hors-flux).

**Décision produit (même passage) :** les popovers "Pré-sélections" (alphabet) et "Explications" (scores) étaient des `<o-dropdown>`, sur mobile, Oruga les transforme en pseudo-modale via `.is-modal` (`position: fixed; top: 25%`, largeur clampée 25–75vw), un rendu non maîtrisé et visuellement cassé pour du contenu long. Convertis en vraies `<o-modal>` avec le même style que la modale "Suggestions" déjà refondue (header gradient, corps scrollable, CTA "Terminé" plein-largeur), cohérence visuelle des 3 popups, classes CSS partagées (`div.modal-card.suggestions-card, .presets-card, .scores-info-card`). Sélection d'un alphabet dans "Pré-sélections" ferme désormais la modale automatiquement (comportement équivalent à l'ancien clic sur `o-dropdown-item`).

**Modernisation ciblée (demande explicite "design vieillot") :** boutons pastille déclencheurs (`.suggestions-link-trigger`) avec cible tactile ≥44px sur mobile (`+mobile { min-height: 2.4em }`), état `:active` (scale 0.96) pour un retour tactile immédiat, ombre légère au repos/hover. Fond des modales flouté (`backdrop-filter: blur(6px)` sur `.modal-background`, ajouté dans `design-system.sass`, s'applique à toute future `o-modal` de l'app).

**Vérification :** app lancée réellement (Playwright, viewport mobile 390×780 + desktop 1440×900), scénario clé testé : scroll de la page AVANT ouverture de chaque modale (le cas qui révélait le bug), sélection d'un préset d'alphabet (ferme la modale, met à jour le champ), scroll interne du corps de la modale "Explications". 0 erreur console dans tous les cas.

### 2026-07-09 : bulles d'info (`o-tooltip`) débordantes/coupées sur mobile, même piège `teleport` + un second bug (bouton `expanded` non étiré)

**Symptôme signalé :** les tooltips "Démarrer la partie" (GameConfiguration), "Verrouiller la partie" et "Copier le lien" (ShareGame, sidebar) débordaient de l'écran (partie invisible) ou se faisaient couper par le cadre "Configurer la partie".

**Piège n°1 (même famille que les modales) :** `o-tooltip` a aussi `teleport: false` par défaut. Pire que pour `o-modal` : sans `teleport`, la fonction interne de positionnement d'Oruga fait un `return` immédiat (`if (!i.teleport) return`), la bulle n'a **aucun calcul dynamique de position**, juste du CSS statique (`position:absolute; left:50%; transform:translateX(-50%)` centré sur le déclencheur). Résultat : coupée par le premier ancêtre `overflow:hidden` (`.message` a `overflow:hidden` dans `design-system.sass`), et aucune détection de bord d'écran. **Fix :** `teleport` + `position="auto"` (au lieu de `"bottom"` figé) sur les 8 usages du repo (`GameConfiguration.vue` ×2, `Game.vue`, `GameVote.vue` ×2, `morel-games-core-master/ShareGame.vue` ×2, `PlayerAction.vue`). `position="auto"` laisse Oruga choisir la meilleure des 4 orientations (top/bottom/left/right) par recouvrement maximal avec le viewport, a résolu tout seul le cas du bouton verrou (bascule en `is-left`).

**Piège n°2 (découvert en creusant le résidu de débordement horizontal) :** même après le fix `teleport`, le tooltip "Démarrer la partie" débordait encore de ~16px, et "Copier le lien" de ~57px. Cause : le wrapper `<o-tooltip>` rend en `div.tooltip` (`display: inline-flex` dans le thème Bulma, *shrink-to-fit* par défaut). Le bouton à l'intérieur a beau avoir la prop `expanded` (censée le faire remplir toute la largeur), il ne remplit que la largeur du wrapper `.tooltip`, qui lui-même ne s'étire pas → le bouton "Démarrer la partie" faisait 216px au lieu des ~340px attendus, et "Copier le lien" avait la même largeur ratatinée (visible sur les screenshots : bouton visiblement pas pleine largeur). Ce décalage du centre du déclencheur (hors du centre réel du viewport) est ce qui causait le débordement résiduel du tooltip centré dessus.

**Cause racine du piège n°2, code mort par mauvais sélecteur (même famille que les autres pièges CSS de ce projet) :** un correctif pour ce problème existait déjà dans le code, mais ciblait `span.o-tooltip` / `.o-tooltip`, des classes qui n'ont jamais existé dans le DOM réel d'Oruga (le vrai wrapper est `div.tooltip`, sans préfixe `o-`). Le correctif n'a donc **jamais appliqué**, silencieusement, depuis sa création. Fix : sélecteurs corrigés vers `div.tooltip` dans `GameConfiguration.vue`, `Game.vue` (nouveau, jamais eu de fix), et `morel-games-core-master/ShareGame.vue` (2 occurrences : bouton verrou fantôme + bouton copier). Bonus visuel : le bouton verrou, qui rendait comme un bouton blanc encadré (moche), s'affiche maintenant comme prévu en icône fantôme minimaliste, ce fix corrige aussi un vrai bug visuel "vieillot" au passage.

**À retenir pour tout futur `o-tooltip`/`o-dropdown` enveloppant un bouton `expanded` :** vérifier que le wrapper (`.tooltip`/`.dropdown`, `display: inline-flex` par défaut dans ce thème) a bien un override `width: 100%`, sinon "expanded" ne fait rien d'utile. Et vérifier tout sélecteur CSS ciblant un composant Oruga contre le DOM réel (`data-oruga="..."` + classe **sans** préfixe `o-`) plutôt que de faire confiance aux noms de props Vue, ce projet a maintenant accumulé plusieurs occurrences de ce même piège (voir aussi INDEX.md : slider `.o-slide` vs `.slider`, switch `.o-switch` vs `.switch.control`).

**Vérification :** app relancée réellement (cache Vite `.vite/` purgé après chaque édit dans `morel-games-core-master/`), Playwright mobile (390×780) et desktop (1440×900), mesure `getBoundingClientRect()` avant/après sur chaque tooltip : "Démarrer la partie" (débordement 16px → 0, largeur bouton 216px → 340px), verrou (débordement 36px à droite → 0, bascule automatique en `is-left`), "Copier le lien" (débordement 57px → 0, largeur bouton également corrigée). Partie à 2 joueurs réels jusqu'à l'écran de jeu pour tester le tooltip "J'ai terminé !" de `Game.vue`. 0 erreur console dans tous les cas.

### 2026-07-09 : tooltip "Démarrer la partie" avec du texte gris sur fond noir (dark mode système qui fuite dans une UI 100% claire)

**Symptôme signalé :** la bulle d'info du bouton "Démarrer la partie" s'affichait avec du texte gris sur fond quasi noir, détonnant avec le reste de l'UI, toujours claire/chaude ("summer vibes", pas de mode sombre nulle part ailleurs dans l'app).

**Cause :** `o-tooltip` sans prop `variant` explicite (cas de "Démarrer la partie" dans `GameConfiguration.vue` et du tooltip pseudo de vote dans `GameVote.vue`) hérite de `--tooltip-bg`/`--tooltip-color` du thème Bulma, eux-mêmes dérivés de sous-variables H/S/L de scheme (`--bulma-scheme-main-bis-*`, `--bulma-text-*`). `theme.css` embarque un bloc `@media (prefers-color-scheme: dark)` qui réassigne ces sous-variables globalement dès que l'OS/navigateur du visiteur est en mode sombre, sans qu'aucune autre partie du site ne soit concernée puisque tous les autres composants (boutons, cartes, tags...) utilisent des couleurs en dur dans `design-system.sass`, jamais les CSS vars de scheme Bulma. Les tooltips *avec* un `variant` explicite (`dark`, `light`) ne sont pas touchés, seuls ceux sans variant le sont.

**Piège technique lors du fix :** une première tentative a réassigné directement le custom property `--tooltip-bg`/`--tooltip-color` sur `.tooltip-content`, sans effet visuel, alors que `getPropertyValue` confirmait bien la nouvelle valeur. Cause : le thème Bulma 1.x ne construit pas la couleur affichée à partir de cette variable "finale" mais à partir de sous-variables `-h`/`-s`/`-l` séparées calculées en interne (`css.register-vars`), écraser le nom de variable de haut niveau ne change rien à la chaîne de calcul réelle. **Fix retenu :** poser `background-color`/`color` en dur (avec `!important`) directement sur `.tooltip-content:not(.is-dark):not(.is-light):not(...)` (toutes les couleurs Bulma listées en exclusion), plutôt que de passer par les CSS custom properties du thème. Complété par un override des couleurs de bordure de la flèche (`::before`) sur les 4 directions possibles (top/bottom/left/right, puisque `position="auto"` peut choisir n'importe laquelle).

**À retenir :** toute future modification de couleur sur un composant Oruga/Bulma 1.x doit cibler les propriétés CSS finales (`background-color`, `color`, `border-color`...) en dur plutôt que les CSS custom properties du thème, sauf vérification préalable que la variable ciblée alimente directement (et pas via une sous-chaîne H/S/L) la propriété visée.

**Vérification :** Playwright avec `colorScheme: 'dark'` émulé (mobile 390×780), couleurs résolues (`getComputedStyle`) passées de `rgb(24,27,32)`/`rgb(74,74,74)` (cassé) à `rgb(255,251,245)`/`rgb(45,27,0)` (identique au mode clair) après fix. Tooltips à `variant` explicite (`light` sur "Copier le lien"/"Verrouiller la partie") vérifiés non affectés par la régression ni par le fix. Repositionnement (`teleport`+`auto`, cf. entrée précédente) revérifié intact après ce changement. 0 erreur console.

### 2026-07-10 : animations ouverture/fermeture modales + ajout/retrait catégories, aération du champ catégories

**Demande utilisateur :** animation fluide à l'ouverture/fermeture des modales et à l'ajout/retrait d'une catégorie ; le champ catégories manquait d'air (chips collées entre elles et contre le bord de l'encadré).

**Champ catégories (`design-system.sass`, `.taginput .taginput-container`) :** le thème pose `padding: 0` sur ce conteneur et `margin: 0 0.25em` sur chaque `.tag` (donc 0 espace vertical entre lignes qui wrappent). Fix : `padding: 0.65rem 0.75rem` + `gap: 0.5rem` sur le conteneur flex (gère espacement horizontal ET vertical d'un coup), `.tag { margin: 0 }` pour éviter le cumul avec `gap`.

**Animation d'apparition des chips, limite technique découverte :** Oruga ne garde aucune identité DOM stable par tag, vérifié en posant un marqueur `dataset` sur un tag NON concerné par une suppression ailleurs dans la liste : le marqueur disparaît quand même, preuve que tout le conteneur de chips est reconstruit à chaque ajout/retrait (pas de diffing par clé stable). Impossible donc d'animer proprement "juste le tag qui bouge" façon `TransitionGroup` sans forker le composant. **Solution retenue :** un keyframe `tagPopIn` (scale+fade) rejoué par CHAQUE chip à chaque changement de la liste, avec un décalage en cascade via `@for`/`nth-child` (~22ms entre chips), se lit comme "la liste se remet en place" plutôt qu'un vrai enter/leave par élément, mais donne un retour animé fluide sans dépendre d'un comportement que le composant n'expose pas. Wrappé dans `prefers-reduced-motion: no-preference`.

**Animation des modales, piège en deux temps, le second nettement plus retors :**

1. **Timing non détecté par Vue :** `o-modal` a `animation: "zoom-out"` par défaut, mais le thème Bulma ne définit qu'un fade de *sortie* (`.zoom-out-leave-active`) et rien à l'ouverture. Passage à un nom dédié `animation="modal-pop"` avec nos propres classes de transition Vue (`.modal-pop-enter-active`, etc.). Premier essai : `transition`/changement de valeur posés uniquement sur les descendants (`.modal-background`, `.modal-card`), comme la racine (`.modal`, l'élément qui porte réellement les classes de transition Vue et sur lequel Vue écoute `transitionend`) n'avait elle-même aucune propriété qui changeait de valeur, aucun `transitionend` n'était émis dessus et Vue considérait la transition terminée quasi instantanément. **Fix :** un vrai fondu d'opacité posé directement sur la racine `.modal.modal-pop-*-active`, qui pilote désormais le minutage détecté par Vue.

2. **Piège bien plus vicieux, découvert seulement après une mesure image-par-image (`requestAnimationFrame` + `getComputedStyle`, indispensable ici, un simple `getComputedStyle` ponctuel ne l'aurait jamais révélé) :** malgré le fix ci-dessus, `opacity` sautait instantanément de 1 à 0 (aucune valeur intermédiaire sur 24 frames échantillonnées), en headless **et** en mode non-headless (donc pas un artefact de test). Cause réelle : `.modal.is-active { display: flex }` est la SEULE règle qui sort la modale de son `display: none` de base (thème Bulma). Cette classe `is-active` est pilotée par le même booléen réactif que `v-show`, mais `<Transition>` ne retarde QUE `v-show` (son rôle exact), pas les classes CSS ordinaires liées à la même variable. Au clic, `is-active` disparaît donc instantanément, le `display: none` de base reprend la main immédiatement, et l'élément, invisible/non peint, ne peut plus rien transitionner visuellement, alors même que Vue attend correctement les ~220ms de la transition avant de finalement appliquer son propre `display: none` via `v-show` (la classe `modal-pop-leave-active` reste posée le temps voulu, seul le rendu visuel est coupé net). **Fix :** forcer `display: flex !important` tant qu'une classe `modal-pop-enter-active`/`modal-pop-leave-active` est présente, indépendamment de l'état de `is-active`, seul le `display: none` de `v-show` (appliqué en toute fin de transition, une fois les classes retirées) reprend alors la main.

**À retenir pour toute future animation sur un composant Oruga piloté par `v-show` :** si le composant a aussi une classe "active" (`is-active`, `o-modal--active`...) qui contrôle `display` via une règle CSS séparée du mécanisme `v-show`/`<Transition>`, cette classe n'est PAS soumise au délai de la transition, seul `v-show` l'est. Vérifier via `requestAnimationFrame` + `getComputedStyle` (pas un `getComputedStyle` ponctuel, insuffisant pour détecter un saut instantané) que la propriété animée interpole réellement image par image, pas seulement que les classes de transition restent posées la bonne durée (les deux peuvent diverger, comme ici).

**Vérification :** mesures `requestAnimationFrame`/`getComputedStyle` avant/après sur opacité (root) et transform (card), passées d'un saut instantané (aucune valeur intermédiaire sur 15+ frames) à une interpolation lisse complète (ex. opacity 1 → 0.94 → 0.81 → 0.64 → ... → 0.0001 sur ~220ms). Reproduit et confirmé en mode headless ET non-headless (`headless: false`) pour écarter un artefact de test. Screenshots mi-transition (mobile 390×780 et desktop 1440×900) montrant visuellement le fondu/scale en cours. Suite de régression complète rejouée (positionnement des tooltips, dark mode, ouverture des 3 modales) : aucune régression, 0 erreur console.

### 2026-07-10 : champ "Ajouter une catégorie…" toujours sur sa propre ligne

**Demande utilisateur :** le champ de saisie libre à la fin du taginput se contentait de la place restante sur la dernière ligne de chips (parfois quasi nulle une fois beaucoup de catégories ajoutées), toujours avoir de la place pour écrire.

**Fix (`design-system.sass`, `.taginput .taginput-container .autocomplete`) :** `flex-basis: 100%` sur le wrapper `.autocomplete` (`flex: 1` dans le thème par défaut, se contente donc de l'espace restant sur la ligne courante). Un item flex avec `flex-basis: 100%` ne peut jamais partager sa ligne avec d'autres items dans un conteneur `flex-wrap`, il passe systématiquement à la ligne suivante, quel que soit le nombre de chips déjà présentes. Vérifié avec 9 catégories et avec 1 seule : le champ reste plein-largeur sur sa propre ligne dans les deux cas.

> Les modifications détaillées fichier-par-fichier sont dans git (`git log`). Ce journal ne conserve que les décisions et événements notables entre sessions.

### 2026-07-09 : optimisation du système de contexte Claude Code

**Décision :** Refonte de CHANTIER.md, INDEX.md et CLAUDE.md pour réduire la consommation de tokens par session.

- `CHANTIER.md` : restructuré, suppression du journal fichier-par-fichier (260 → ~100 lignes), remplacement par un "Historique des phases" condensé qui préserve les WHY et les pièges, sans dupliquer git.
- `INDEX.md` : ajout d'une ligne de statut en tête.
- `CLAUDE.md` : lecture de CHANTIER.md rendue conditionnelle (seulement pour tâches architecture/décisions/bugs complexes) ; règle du journal clarifiée (décisions notables uniquement, pas fichier-par-fichier).

**Pourquoi :** Le journal fichier-par-fichier grandissait sans borne (~180 lignes après 1 journée) et dupliquait git sans apporter de valeur aux sessions. Le gain estimé : ~700 tokens/session au lieu de ~2500.

### 2026-07-09 : permissions carte blanche dans settings.local.json

`Bash(*)`, `PowerShell(*)`, `Skill(*)`, `WebFetch` ajoutés, plus aucune approbation manuelle requise dans ce workspace. Les entrées spécifiques (`Bash(npm *)`, etc.) remplacées par le wildcard. Décision assumée : le repo git sert de filet de sécurité si besoin de revenir en arrière.

### 2026-07-09 : création du template bootstrap `project-setup-template.md`

Fichier one-shot à donner à une instance Claude Code pour mettre en place le système de contexte (CLAUDE.md + INDEX.md + CHANTIER.md + hook) sur n'importe quel nouveau projet. Contient les 4 étapes : exploration, création des 3 fichiers .md avec leurs structures, setup de settings.local.json. INDEX.md mis à jour pour référencer les fichiers racine notables.

### 2026-07-09 : clarification des règles INDEX.md / CHANTIER.md + hook

`CLAUDE.md` : règle CHANTIER.md reformulée ("après chaque décision notable" au lieu de "après chaque modification de fichier") ; règle INDEX.md élargie aux changements structurels (renommage, suppression), pas seulement ajout.

`settings.local.json` : message du hook PostToolUse mis à jour pour rappeler les deux obligations (CHANTIER.md si décision notable, INDEX.md si structure change).

### 2026-07-09 : complétion exhaustive de INDEX.md

Audit complet du projet vs INDEX.md : lecture de tous les fichiers source non encore indexés. Ajouts :

- **Front :** `CircularProgress.vue`, `vite.config.js`, `index.html`, `.env` / `.env.production`, `locales/fr.json`, `locales/categories/`
- **Back :** `src/index.js` (bootstrap HTTP, port 62868 via `PITIT_BAC_WS_PORT`), `src/server.js` (classe GameServer), `src/logging.js`
- **morel-games-core :** `src/index.js` (barrel), `src/game/index.js` (barrel), `components/PlayerAction.vue`, `locales/fr.json`
- **Nouvelles sections :** Commons (index.js + tests.js), Munin, Production, racine `pitit-bac/` (Makefile, .nvmrc, protocol.md)
- **Démarrage rapide :** commandes Makefile ajoutées
- **Nouveau piège :** cohérence port WS entre `PITIT_BAC_WS_PORT` (back) et `VITE_WS_URL` (front .env)
- **Nouveau piège :** `commons/tests.js` : CJS uniquement (require), ne pas convertir en ESM sans adapter Mocha

### 2026-07-09 : auto-réparation du hook dans CLAUDE.md

`CLAUDE.md` : ajout d'une section "Bootstrap", au démarrage de chaque session, Claude vérifie que le hook PostToolUse est présent dans `.claude/settings.local.json` et l'ajoute si absent. Garantit que INDEX.md et CHANTIER.md sont toujours alimentés même avec un `.claude` vide.

### 2026-07-09 : refonte responsive mobile-first + thème été "soirée buvette"

**Contexte :** Le jeu est utilisé à 99% sur mobile. La demande était : responsive mobile nickel, thème visuel été/buvette, CSS centralisé (pas de répétitions), tester tous les cas cassants avant livraison.

**Décisions architecture CSS :**

- **Centralisation** : toutes les règles globales (fond, border-radius mobiles, font-size iOS, notifications toast) sont dans `App.vue <style>` (non scopé = global). Les composants ne gardent que leur CSS propre.
- **Border-radius sur mobile** : la règle `+mobile { main .notification, main .message .message-header, main .box, main .hero { border-radius: 0 } }` dans App.vue remplace les `border-radius: 0` éparpillés dans chaque composant, 6 règles dupliquées supprimées.
- **Anti-zoom iOS Safari** : `input[type="text"], ... { font-size: max(16px, 1em) }` en global mobile (iOS zoome si l'input a font-size < 16px, silencieux et dérangeant sur mobile).

**Palette thème été "soirée buvette" :**
- Primary : `#E64A19` (orange coucher de soleil, Deep Orange 600), contraste blanc 3.87:1, OK WCAG AA grand texte (boutons bold)
- Link : `#00838F` (teal tropical, style piscine/plage)
- Dark : `#1A0A00` (brun chaud profond au lieu du vert nuit précédent)
- Background : gradient `#fff9f0 → #ffe6c8` sur `<html>` (peach chaud, non attaché en fixed, meilleure perf iOS)
- Radius : `8px` (standard), `16px` (large), formes plus rondes/friendly
- Box shadow : ombre chaude `rgba(180, 60, 0, 0.10)` au lieu de gris froid

**Piège nouveau avec `background-attachment: fixed` sur iOS :**  
`background-attachment: fixed` sur `body` crée des problèmes de compositing sur iOS Safari (fond ne se repeint pas lors du scroll). Solution : mettre le gradient sur `<html>` avec `background-attachment` par défaut (scroll). L'élément `<html>` couvre toute la hauteur du document même sur les longues pages.

**Fix UX mobile Game.vue, ordre des colonnes :**  
Sur mobile, le timer + bouton "J'ai fini" apparaissait EN BAS du formulaire (après le défilement de toutes les catégories). Fix : `+mobile { order: -1 }` sur `.time-and-button-column` + disposition CSS Grid sur `.inner-time-and-button` (progress à gauche, label + bouton à droite) + `font-size: 5em` au lieu de `8em` pour la jauge circulaire.

**Zones tactiles :** Ajout de `min-height: 44px` sur les boutons critiques dans GameVote et ShareGame (recommandation WCAG 2.5.5).

**index.html :** `<meta name="theme-color" content="#E64A19">` colore la barre d'adresse Chrome Android en orange été.

### 2026-07-09 : extraction design-system.sass depuis App.vue

**Décision :** Création de `pitit-bac/front/src/assets/design-system.sass`. Tout le CSS des overrides composants UI (`:root` tokens, `.button`, `.message`, `.box`, `.notification`, `.tag`, `.input`, `.panel`, `.o-switch`, ajustements mobile globaux) a été extrait de `App.vue <style>` vers ce partial Sass.

**App.vue garde** uniquement le CSS structurel de l'app shell : html/body (fond gradient), `#app`, overlay de chargement, container notifications, logo, layout colonnes, top-bar mobile, sticky players, footer, keyframes.

**Règle d'import :** `design-system.sass` est un partial sans `@import` propres, il s'attend à être inclus *après* `bulma/sass/utilities/_all` + `assets/variables` + `bulma/bulma` dans App.vue. Les variables `$primary`, `+mobile` etc. viennent du contexte parent.

**Pourquoi :** App.vue faisait 683 lignes (517 de CSS mixte), ce qui obligeait à le lire entièrement pour n'importe quel changement UI. Désormais : changement composant, lire uniquement le composant ; changement design system, lire `design-system.sass` (~160 lignes) ; changement layout/shell, lire App.vue (~350 lignes). Gain estimé : ~300 lignes de contexte évitées par session sur les tâches front simples.

### 2026-07-09 : refonte graphique summer vibes v2, design system complet

**Contexte :** L'UI précédente était fonctionnelle mais visuellement plate. Objectif : look moderne "soirée été entre amis", avec animations légères et direction artistique cohérente. Mobile-first, pas d'impact perf.

**Décisions architecture :**

- **Design tokens CSS** : variables CSS (`--card-bg`, `--card-border`, `--card-shadow`, `--card-shadow-lift`, `--transition`) déclarées dans `:root` dans `App.vue`. Permettent aux composants d'utiliser `var(--card-bg)` sans importer les variables SASS.
- **Overrides Oruga/Bulma 1.x** : le thème Oruga (Bulma 1.0.4) est injecté dynamiquement via JS après notre SCSS statique, donc il gagne la cascade pour certains éléments (notamment `.message.is-primary .message-body` qui apparaissait en teal au lieu d'orange). Solution : règles ciblées avec `#app .message.is-primary .message-body { ... !important }` pour garantir la spécificité.
- **Centralisation renforcée** : tout le design system (cartes, boutons, tags, inputs, panels, notifications) dans `App.vue <style>`. Les composants gardent leur CSS fonctionnel, ne définissent plus les couleurs de fond ou ombres.

**Changements visuels :**

- **Background** : gradient plus profond `#FFF9F0 → #FFE9C8 → #FFD298 → #FFBA70` (coucher de soleil estival).
- **Cartes** : `.message`, `.box`, `.notification`, `.panel`, fond semi-transparent chaud, bordure ambrée, ombre chaude. `border-radius: 20px` sur les cartes principales, `16px` sur les secondaires.
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

### 2026-07-09 : bug fix pour leave_game() + cache Vite sur file: dependencies

**Bug 1 avec `configuration = {}` dans `leave_game()` → crash au rejoin**  
Après leave, la config était vidée à `{}`. Au rejoin, `GameConfiguration.vue` s'affichait avant que le serveur n'envoie `config-updated`, tentait d'accéder à `configuration.scores.valid` → crash silencieux.  
**Fix :** supprimer `this.configuration = {}` de `leave_game()`. Le serveur envoie `config-updated` dès le join, la valeur précédente est un fallback propre pendant ces 50ms.

**Bug 2 (piège dev), cache Vite pre-bundlé sur dépendances `file:`**  
Vite pre-bundle `morel-games-core` au premier démarrage dans `node_modules/.vite/deps/`. Si le code source change APRÈS ce premier démarrage (ou si plusieurs instances Vite coexistent), les modules servis sont stale → `leave_game is not a function` en runtime même si le fichier est correct.  
**Fix systémique :** après avoir modifié un fichier dans `morel-games-core-master/`, tuer TOUS les serveurs Vite et purger `pitit-bac/front/node_modules/.vite/` avant de relancer.

### 2026-07-09 : fix cohérence visuelle, Bulma 1.x CSS vars vs. palette summer

**Problème découvert :** `@oruga-ui/theme-bulma/dist/theme.css` (Bulma 1.0.4) définit `--bulma-primary-h: 171deg` (turquoise) dans `:root`. Tous les composants Oruga utilisant `var(--bulma-primary)` ignoraient notre `$primary: #E64A19` SCSS (compilé statiquement) et restaient turquoise.

**Composants affectés :**
- **Slider** : rendu en `.slider .slider-fill` (pas `.o-slide__fill`), couleur = `var(--bulma-primary)` → turquoise
- **Switch** : rendu en `.switch.control .check` (pas `.o-switch .o-switch__check`), checked = `var(--bulma-primary)` → turquoise
- **CSS GameConfiguration.vue** : ciblait `.o-slide`, `.o-slide__track`, `.o-slide--disabled`, `.o-slide__thumb-wrapper` → aucun de ces sélecteurs n'existait dans le DOM

**Fix :**
1. `design-system.sass (:root)` : override des CSS vars Bulma 1.x, `--bulma-primary-h: 14deg`, `--bulma-primary-s: 80%`, `--bulma-primary-l: 50%`, + overrides directs `--bulma-switch-active-background-color` et `--bulma-slider-color` à `#E64A19`.
2. Correction sélecteurs `GameConfiguration.vue` : `.o-slide*` → `.slider*`, `.o-slide--disabled` → `.is-disabled`, `.o-switch[disabled]` → `.switch.is-disabled`.
3. `design-system.sass` : tags taginput stylés avec des chips peach chauds (`--bulma-tag-h: 14deg`, bg 88%), taginput container fond warm cream.

**Pourquoi ces classes diffèrent :** `bulmaConfig` de `@oruga-ui/theme-bulma` mappe les classes internes Oruga vers des classes Bulma custom (`rootClass: "slider"`, `fillClass: "slider-fill"`, `rootClass: "switch control"`, `inputClass: "check"`). Le CSS Oruga générique (`.o-*`) n'est jamais rendu avec ce theme.

**Piège supplémentaire avec le bouton `.delete` des tags taginput :**
- Oruga injecte une icône FA (`fa-xmark`) à l'intérieur du `<button class="delete is-small">` Bulma → l'icône FA masque les pseudo-éléments `::before`/`::after` qui dessinent la croix blanche.
- Bulma 0.9.4 (compilé dans App.vue, donc injecté APRÈS `theme-bulma/style.css` dans la cascade) overwrite le `background-color` du `.delete` avec `rgba(white, 0.2)` → cercle invisible sur fond clair.
- Fix : `.taginput-container .tag .delete { background-color: rgba(90,46,0,.15) !important; &::before/after background-color: rgba(90,46,0,.65) !important; .icon { display: none } }`

### 2026-07-09 : feature du bouton "Quitter le lobby"

**Contexte :** Sur mobile, une fois dans un lobby (phase CONFIG), il n'y avait aucun moyen de revenir à l'écran d'accueil (saisie du pseudo).

**Décision :** Ajouter `leave_game()` dans `useMorelStore` (morel-games-core). L'action : met `_client.kicked = true` (empêche la boucle de reconnexion automatique), ferme le WebSocket, purge les credentials sessionStorage, remet tout le store à zéro et redirige vers `/`.

**UI :**
- Mobile : barre `.mobile-top-bar` qui remplace l'ancien `.pititbac-logo.is-mobile`, logo centré + bouton `← Quitter` positionné en `absolute left: 1rem` pour ne pas décaler le logo.
- Desktop : bouton discret ghost en bas de la sidebar, caché sur mobile (`display: none`).
- Icône `angle-left` (déjà enregistrée dans `main.js` comme `faAngleLeft`).
- Traduction FR ajoutée dans `pitit-bac/front/locales/fr.json` : `"Leave": "Quitter"`.

**Piège reset store :** Pinia `$reset()` n'est pas disponible dans tous les contextes (Options API stores). Réinitialisation manuelle champ par champ dans `leave_game()`.

### 2026-07-09 : refonte visuelle summer vibes v3, logo custom, couleur coral, croix tags

**Contexte :** Logo SVG vert script hors-thème, orange trop foncé/industriel (`#E64A19`), bouton Suggestions ressemblait à un simple lien, croix des tags invisibles.

**Changements :**

1. **Logo → titre texte custom** : les 3 occurrences de `<img src="./assets/logo.svg">` remplacées par `<span class="game-title">Pitit Bac</span>`. Gradient coral en `background-clip: text`, Fira Sans 800. CSS adapté dans App.vue (`pititbac-logo`, `init-logo`, `mobile-top-logo`).

2. **Couleur primary : `#E64A19` → `#FF6B35`** (coral sunset plus lumineux, `$primary-dark` : `#BF360C` → `#E8581E`). CSS vars Bulma 1.x mis à jour : `--bulma-primary-h: 16deg`, `--bulma-primary-l: 60%`. Headers et gradients nettement plus "summer vibes".

3. **Bouton "Suggestions"** : transformé en pill button (`background: rgba($primary, 0.10)`, `border: 1.5px solid rgba($primary, 0.30)`, `border-radius: 20px`). Sélecteur dans `GameConfiguration.vue`.

4. **Croix × des tags, triple piège résolu :**
   - Tentative 1 (session précédente) : `.icon { display: none }` + `::before/::after background !important` → croix invisible (SVG FA couvrait les pseudo-éléments, puis fond transparent Bulma 0.9.4).
   - Tentative 2 : colorer le SVG via `color: currentColor` → SVG `fill=currentColor` ne se rend pas visuellement à 16px dans Chromium dans ce contexte.
   - Tentative 3 : `content: '×'` dans `::before` → SASS encode le caractère unicode littéral → caractère corrompu en UTF-8 à la compilation.
   - Tentative 4 : `content: '\D7'` (escape CSS) → SASS interprète l'escape et encode quand même mal.
   - **Fix final** : `background-image: url("data:image/svg+xml,...")` avec un SVG × dessiné en path ASCII (deux diagonales `stroke='%235A1600'`). Zéro dépendance d'encodage, zéro pseudo-élément, zéro FA. Croix clairement visible en brun chaud sur fond peach.

**Piège encodage SASS** : Les caractères unicode non-ASCII dans les strings SASS (y compris via `content: '\D7'`) peuvent être corrompus selon le chemin compilation Dart Sass → Vite → bundle. Ne jamais mettre de caractère non-ASCII dans `content` SASS. Préférer les SVG data URI (100% ASCII) pour tous les icônes CSS custom.

### 2026-07-09 : diagnostic "l'UI ne change jamais" + refonte v4 "playful illustré"

**Contexte :** Après 3 itérations "summer vibes" (tokens couleur, ombres, radius), le rendu restait perçu comme "à peine différent". Diagnostic demandé avant de retenter une 4e itération à l'aveugle.

**Diagnostic (app lancée réellement + screenshots Playwright, front `npm run serve` + back `node index.js`) :**
- Le rendu CSS fonctionne correctement (vérifié via `getComputedStyle` : gradients, ombres, focus states tous corrects). Une première capture semblait montrer un écran "invisible", c'était un artefact du screenshot pris pendant l'animation `fadeInUp` (0.53s), pas un bug réel.
- Le bouton "Start the game" pâle sur le screenshot de config = état `disabled` normal (`can_start` nécessite >1 joueur), pas un bug de contraste.
- **Vraie cause :** 3 itérations avaient changé uniquement les *tokens* (couleur primaire, radius, box-shadow) sur un squelette Bulma inchangé (colonne centrée, card blanche rectangulaire, formulaire). Repeindre une card blanche en orange ne la transforme pas en "soirée cocktail d'été", ça reste un panneau de configuration SaaS avec un accent chaud. Confirmé par du code mort : le keyframe `confettiFall` existait dans App.vue depuis la v2 sans jamais être utilisé nulle part.

**Décision (validée avec l'utilisateur via question à choix) :** direction "playful illustré", motifs SVG récurrents (palmier, cocktail, soleil, confettis), palette élargie (teal `#00BFA5` + jaune citron `#FFC93C` en plus du corail), texture de fond, ambiance affiche de festival plutôt que sobriété éditoriale.

**Ce qui a été fait :**
- `assets/variables.scss` : ajout `$accent-teal` / `$accent-yellow`, décoratifs uniquement, ne remplacent pas `$primary` dans les composants Bulma (boutons/tags restent corail).
- Nouveau composant `components/SummerDecor.vue` : motifs SVG inline (soleil animé en rotation, palmier, verre à cocktail, confettis flottants) en 2 variants (`hero` pour l'écran pseudo, `corner` pour le logo sidebar). Positionnement absolu, `aria-hidden`, `pointer-events: none`, animations dans `prefers-reduced-motion: no-preference`.
- `App.vue` : fond avec texture de points en plus du gradient (SVG data-uri) ; 3 blobs flous fixes (`.ambient-blobs`, z-index -1) en teal/jaune/corail pour la profondeur ; tagline sous le logo d'accueil (nouvelle clé i18n `"The word game for your summer nights"`).
- `GameEnd.vue` : confettis réels (26 pièces générées de façon déterministe, pas de `Math.random`, palette blanc/jaune/teal/pêche) qui tombent sur le hero des gagnants, nouveau keyframe `confettiRain` (le `confettiFall` mort dans App.vue reste inutilisé, pas supprimé, pourrait servir ailleurs).

**Décision architecture :** aucune décoration ajoutée dans `morel-games-core-master/` (Players.vue, AskPseudonym.vue), le core reste un framework multi-jeux réutilisable, la couche "summer vibes" reste 100% côté `pitit-bac/front`.

**Vérification :** app lancée réellement (front + back), 0 erreur console (`page.on('console')` + `page.on('pageerror')` vides), screenshots desktop + mobile sur écran pseudo et config.

### 2026-07-09 : refonte v5, décoration étendue à tout le site (config/jeu/vote) + 2 pièges corrigés

**Contexte :** Retour utilisateur après la v4, l'écran d'accueil était bien thématisé mais le reste (config, jeu, vote) beaucoup moins. Demande explicite : "plus de folie", plus de cocktails/palmiers partout, pas seulement sur l'accueil.

**Ce qui a été ajouté à `SummerDecor.vue` :**
- Nouveau variant `icon` (+ prop `motif`) : icône inline monochrome (`currentColor`, ~1.1em) pour les titres de header, différent des variants décoratifs multicolores existants. Motifs : cocktail, palm, pineapple, watermelon, sun.
- Nouveau variant `scatter` : calque ambiant plein écran (position fixed, `#app` direct child, ajouté une fois dans App.vue) avec des motifs dans les gouttières gauche/droite sur très grands écrans.
- `corner` enrichi d'un petit cocktail à côté du palmier existant.
- Icônes `icon` posées dans les headers : `GameConfiguration.vue` (cocktail dans "Configure the game"), `GameVote.vue` (palm dans le header de vote), `Game.vue` (sun dans la consigne de round), `GameEnd.vue` (pineapple dans la bannière "Another game?"), `App.vue` (cocktail dans la mobile-top-bar, visible sur tous les écrans mobile).

**Piège n°1, sélecteur d'attribut `[class^="..."]` qui ne matche jamais :**
Le calque `scatter` cachait par défaut ses motifs via `[class^="decor-g-"] { display: none }`, réactivés ensuite par breakpoint. Sauf que l'attribut `class` réel d'un élément est `"decor decor-g-palm-l"` (la classe de base `decor` listée en premier), `^=` teste que la chaîne *entière* commence par le préfixe, donc ne matche jamais un attribut qui commence par `"decor "`. Résultat : le `display:none` par défaut ne s'appliquait jamais, et les motifs `decor-g-*`/`decor-m-*` héritaient uniquement de `.decor { display: block }` sans aucune règle de taille/position en dehors de leur breakpoint → SVG absolu sans contrainte, étiré à la taille du viewport entier (palmier géant recouvrant tout l'écran de jeu, capturé en screenshot avant le fix). **Fix :** toujours lister les classes explicitement (`.decor-g-palm-l, .decor-g-cocktail-l, ...`), jamais de sélecteur d'attribut `^=` sur un élément qui a plusieurs classes dont une classe de base commune.

**Piège n°2, gouttières "vides" qui ne le sont pas à 1440px :**
Le calque `scatter` desktop supposait un espace vide notable de chaque côté du contenu (`+widescreen`, dès 1216px). En réalité le container Bulma fullhd fait ~1344px de large ; à 1440px (résolution laptop très courante) il ne reste que ~48px de gouttière de chaque côté, la sidebar (liste joueurs, "Share game") occupe presque toute la largeur restante. Un cocktail de gouttière se retrouvait à chevaucher le texte "Invite other players…". **Fix :** seuil relevé à un `@media (min-width: 1700px)` custom (pas un mixin Bulma standard) + motifs repoussés plus près du bord réel (0.6–1.4vw au lieu de 1–3vw). Vérifié sans chevauchement à 1440px (motifs simplement absents) et propre à 1920px.

**Mobile, décision de ne PAS mettre le calque `scatter` en mobile :** une première tentative plaçait 2 motifs (ananas, pastèque) en `position: fixed; bottom: ...` sur mobile. Problème : `position:fixed` reste collé au viewport quel que soit le scroll, alors que le contenu mobile est plein-large sans marge (radius 0, edge-to-edge), les motifs finissaient systématiquement à chevaucher des champs de formulaire au lieu de rester dans un espace vide. Supprimé. Le supplément mobile passe uniquement par des éléments en flux normal (icônes inline `variant="icon"` dans les headers + top-bar), jamais par un calque fixed superposé au contenu scrollable.

**Icône palm en petit format peu lisible :** la première version du SVG palm (variant `icon`) utilisait 4 triangles pleins en éventail, à ~20px (mobile-top-bar) ça ne se lit pas comme un palmier, juste une tache. Redessiné en 4 traits (stroke, pas fill) façon feuilles fines ; toujours pas parfait en dessous de ~24px, donc la mobile-top-bar utilise `cocktail` (qui se lit bien même petit) plutôt que `palm`.

**Vérification :** partie complète jouée avec 2 joueurs réels via Playwright (2 contextes navigateur, un slug de partie partagé), 0 erreur console sur les deux, écran de jeu (`Game.vue`) inspecté via `getComputedStyle`/`getBoundingClientRect` sur les éléments `.decor` pour confirmer le fix du piège n°1 avant/après.

### 2026-07-09 : GameConfiguration, rounds/temps déplacés en advanced settings + temps auto-calculé

**Demande utilisateur :** les sliders "Rounds" et "Time limit" encombraient l'écran principal de config. Déplacer dans "Advanced settings", avec des défauts sensés : 6 rounds fixes, et un temps par round calculé automatiquement (20s/catégorie), recalculé dynamiquement à l'ajout/suppression de catégories, sauf si le maître a modifié le slider de temps à la main, auquel cas il reste figé à sa valeur manuelle.

**Implémentation (`GameConfiguration.vue`) :**
- Nouveau flag `time_edited` (au même niveau que `categories_edited` existant, même logique de "dirty flag" jamais réinitialisé en cours de partie).
- `compute_auto_time(categories_count)` : `categories_count * 20`, arrondi au pas du slider (15s), clampé entre 15s et `infinite_duration`.
- `update_game_configuration()` (méthode partagée par presque tous les champs du formulaire) recalcule et écrase `config.time` à chaque appel tant que `!time_edited`, pas besoin de watcher dédié sur le nombre de catégories, cette méthode est déjà appelée à chaque changement de champ (categories, alphabet, scores, rounds…), donc le temps reste synchronisé "gratuitement".
- Nouvelle méthode `on_time_changed()` (bindée sur `@change` du slider de temps, à la place de `update_game_configuration` direct) : pose `time_edited = true` **avant** d'appeler `update_game_configuration()`, sinon le recalcul automatique à l'intérieur écraserait immédiatement la valeur que le joueur vient de choisir à la main.
- `load_suggestions(init)` : au même endroit où les catégories/alphabet par défaut sont posés pour une partie neuve, ajout de `config.turns = 6` (nouvelle constante `default_rounds`) et du calcul auto du temps initial.
- Template : les deux `<o-field>` (Rounds, Time) déplacés du formulaire principal vers la section advanced (nouvelle ligne `.columns` au-dessus de celle Alphabet/Scores). Le slider de temps garde `@change="on_time_changed"` (pas `update_game_configuration`). Un texte d'aide (`.config-defaults-hint`, `v-if="!time_edited"`) sous le slider explique le calcul auto ; un résumé similaire ("X rounds, Y par round par défaut, modifiable dans les paramètres avancés.") remplace les sliders dans la colonne de droite de l'écran principal, à côté du switch "Stop rounds...".

**Piège évité :** ne pas mettre le recalcul dans un `watch` sur `config` (qui ne se déclenche qu'au retour du serveur, avec un temps de latence), le brancher directement dans `update_game_configuration()` le rend synchrone avec la saisie locale, cohérent avec le pattern déjà utilisé pour `categories_edited`.

**Vérification :** testé via Playwright, valeur auto affichée correctement au chargement (8 catégories EN × 20s → arrondi à 165s = "2 minutes and 45 seconds"), le hint disparaît après un drag manuel du slider (`time_edited` passe à `true`), et le temps reste bien figé à la valeur manuelle après ajout d'une catégorie supplémentaire. 0 erreur console.

### 2026-07-09 : retour sur le slider de temps, passage à "temps par catégorie"

**Demande utilisateur (suite immédiate du point précédent) :** au lieu d'un slider de temps total par round avec verrouillage manuel, exposer directement un slider "temps par catégorie" ; le temps total par round devient une valeur **toujours dérivée** (catégories × temps/catégorie), affichée dynamiquement, sans notion de "verrouillage", il n'y a plus qu'une seule source de vérité (le temps par catégorie), donc `time_edited` n'a plus lieu d'être.

**Décision architecture, dérivation côté serveur, pas côté client :** `back/src/game.js` (`update_configuration`) devient la seule source de vérité pour le calcul `time = secondsPerCategory × categories.length` (clampé 15s → `infinite_duration - 1`, avec `secondsPerCategory >= infinite_duration` comme sentinel "illimité", exactement comme l'ancien slider). Le champ `time` envoyé par le client est désormais ignoré et recalculé serveur ; ça évite tout désync si deux clients modifient la config en même temps (le maître qui bouge le slider pendant qu'un changement de catégories arrive d'ailleurs, etc.). `secondsPerCategory: 20` ajouté à la configuration par défaut du constructeur `Game`.

**Front (`GameConfiguration.vue`) :**
- Suppression complète de `time_edited`/`compute_auto_time`/`on_time_changed` (obsolètes avec ce modèle, il n'y a plus de "manuel vs auto", juste une seule valeur toujours dérivée).
- Nouveaux computed `seconds_per_category_or_default`, `round_time_is_infinite`, `round_time_seconds` : recalculent la même formule que le back, **localement et instantanément** (pas d'attente d'aller-retour serveur), pour un retour visuel immédiat pendant qu'on bouge le slider ou qu'on ajoute/enlève une catégorie.
- `actual_time`/`actual_time_mobile` branchés sur `round_time_seconds` (dérivé local) au lieu de `config.time` (valeur serveur, potentiellement en retard d'un aller-retour WS).
- Slider "Time per category" : `min=5, max=infinite_duration, step=5`, ticks 10-80s + `∞`, bindé sur `config.secondsPerCategory`, `@change="update_game_configuration"` (méthode générique, plus besoin de handler dédié).
- Nouveau texte dynamique sous le slider : `→ {categories_count} categories, {limit} per round`, toujours visible (recalculé à chaque frappe/ajout/suppression de catégorie).

**Piège de test (pas un bug produit) :** `page.locator(...).press('Enter')` sur le champ du taginput Oruga ne confirmait pas toujours l'ajout d'une catégorie pendant les tests Playwright (dropdown d'autocomplétion qui intercepte l'event différemment selon si le keydown est émis au niveau de l'élément ou de la page). `page.keyboard.type(...)` puis `page.keyboard.press('Enter')` au niveau page fonctionne de façon fiable. Aucun rapport avec `ptitbac-commons`/l'app elle-même, juste une leçon pour les futurs tests Playwright sur ce composant.

**Vérification :** partie complète jouée à 2 joueurs avec 3 catégories (Animal/Vegetal/Colour, suppression des 5 autres via Playwright) et le défaut 20s/catégorie → écran de config affiche bien "1 minute per round" avant lancement, partie démarrée sans erreur. Testé aussi le drag du slider (+4 crans de 5s) et l'ajout/suppression de catégories : le texte dynamique se met à jour instantanément et correctement dans tous les cas (8→9 catégories : "2 minutes and 40 seconds" → "3 minutes" à 20s/catégorie). Back redémarré pour appliquer le nouveau schéma de configuration (`secondsPerCategory`). 0 erreur console sur les deux joueurs.

### 2026-07-09 : slider "Time per category" cassé sur mobile → remplacement par des steppers +/-

**Bug signalé (screenshot) :** les labels des ticks du slider "Time per category" (10s/20s/.../80s) se chevauchaient tous, illisibles. **Cause :** le slider gardait `max="infinite_duration"` (600) comme borne haute, hérité de l'ancien slider "temps total par round" où ça faisait sens (ticks 60-540 répartis sur toute la plage), mais les ticks utiles du nouveau modèle "temps par catégorie" (10-80) ne représentent que ~13% de cette plage 5-600, donc tous les labels s'écrasaient au même endroit visuellement.

**Retour UX plus large de l'utilisateur :** les sliders sont peu adaptés au tactile (cible de précision difficile à toucher du doigt), à corriger "pour toute la page", dans un esprit mobile-first.

**Décision :** remplacement des sliders `Rounds` et `Time per category` par des **steppers +/-** (nouveau composant réutilisable `NumberStepper.vue`), boutons de 48px (> 44px WCAG 2.5.5), pas de geste de glissé à précision fine requis, fonctionne aussi bien au clic qu'au tactile.

- `NumberStepper.vue` : props `modelValue`, `min`, `max`, `step`, `suffix`, `disabled` ; émet `update:modelValue` en continu et `change` (pour déclencher l'envoi au serveur, cohérent avec le `@change` déjà utilisé partout ailleurs dans ce fichier).
- Le tick "∞" du slider de temps (qui causait aussi le problème d'échelle) devient un **switch explicite "No time limit"**, plus lisible qu'un point caché en bout de course. Nouveau computed `no_time_limit` (getter/setter) dans `GameConfiguration.vue` : bascule `config.secondsPerCategory` vers/depuis `infinite_duration`, en gardant `last_manual_seconds_per_category` pour restaurer la dernière valeur choisie si le maître redécoche.
- Les clés i18n `"Rounds: {rounds}"` et `"Time per category: {seconds}"` (qui affichaient la valeur dans le label) deviennent `"Rounds"` / `"Time per category"` tout court, la valeur est maintenant affichée par le stepper lui-même, pas besoin de la dupliquer dans le label.

**Pas encore fait (hors scope de cette passe) :** la grille de scores (5 `o-input type="number"`) n'a pas été convertie en steppers, laissée telle quelle, ce sont des valeurs plus libres (peuvent être négatives, pas de bornes naturelles) où taper un nombre reste raisonnable au clavier tactile. À revisiter si retour utilisateur en ce sens.

**Vérification :** testé au clic (Playwright) sur mobile (390px), Rounds 6→8 (+2), Time per category 20s→5s (-3, clampé correctement au minimum), hint dynamique "8 categories, 40 seconds per round" à jour instantanément, toggle "No time limit" masque le stepper et affiche "infinite per round", et restaure bien 5s (dernière valeur manuelle) au dé-toggle. 0 erreur console.

### 2026-07-09 : langue française par défaut + piège majeur découvert, le sélecteur de langue n'a jamais fonctionné

**Demande utilisateur :** "Je veux que l'app soit en français par défaut, pas en anglais." L'app démarrait avec `morelI18n.load_locale_from_browser()`, qui retombe sur `navigator.language` en l'absence de préférence stockée, anglais pour n'importe quel navigateur non francophone.

**Fix demandé (`pitit-bac/front/src/main.js`) :** remplacé par `morelI18n.load_locale(localStorage.getItem('morel-locale') || 'fr')`, respecte un choix explicite déjà fait (sélecteur de langue), sinon force le français. Décision de ne PAS modifier `load_locale_from_browser()` dans `morel-games-core` (reste un comportement générique valide pour d'autres jeux basés sur ce framework), le choix "français par défaut" est spécifique à Pitit Bac, donc géré côté `pitit-bac/front`.

**Piège majeur découvert en testant ce changement, dans `morel-games-core-master/src/game/i18n.js` :**

`_set_already_loaded_locale()` faisait `this.i18n.global.locale.value = locale`. Avec `createI18n({ legacy: true })` (utilisé ici), `i18n.global.locale` est une **chaîne simple**, pas un `ref` de la Composition API, `.value` dessus est `undefined`, et `quelque_chose.value = x` sur un primitif est un no-op silencieux (pas d'erreur, aucun effet). Confirmé en isolant le bug : `typeof i18n.global.locale === "string"`.

**Conséquence réelle, au-delà de la demande initiale :** le sélecteur de langue (dropdown FR/EN dans le footer) **n'a jamais changé la langue affichée**, depuis toujours, pas seulement pour ce changement de défaut. Le seul cas où l'app semblait "fonctionner" en anglais était le tout premier rendu avant tout appel à `load_locale` (état initial `locale: 'en'` du constructeur `MorelI18n`), ce qui masquait complètement le bug.

**Fix :** `this.i18n.global.locale = locale` (sans `.value`), même chose pour la comparaison `if (this.i18n.global.locale === locale ...)` dans `load_locale()`. Deux occurrences, un seul fichier.

**Piège de rebuild :** ce fichier est dans `morel-games-core-master/src/`, pré-bundlé par Vite dans `node_modules/.vite/deps/` au premier démarrage (piège déjà documenté dans INDEX.md). Le serveur Vite qui tournait déjà depuis le début de la session servait encore l'ancien code après l'édit. Remède appliqué : tuer le process Vite, supprimer `pitit-bac/front/node_modules/.vite/`, relancer.

**Vérification :**
- Visite fraîche avec navigateur `en-US` simulé (Playwright, localStorage vide) → app entièrement en français dès le premier rendu, `<html lang="fr">`, 0 erreur console.
- Bug isolé et confirmé avant fix : assignation directe `i18n.global.locale.value = 'fr'` → aucun effet visible. Après fix : `i18n.global.locale = 'fr'` → changement instantané et correct de toute l'UI.
- `useMorelStore().set_locale('en')` (l'action exacte appelée par le sélecteur de langue) appelée directement → bascule tout l'app vers l'anglais correctement, confirmant que le sélecteur fonctionne réellement maintenant (le clic simulé via Playwright sur le dropdown Oruga teleporté restait capricieux en headless, probablement une limite de l'automatisation sur ce composant, pas un bug produit ; testé et confirmé au niveau de l'action qu'il déclenche).
- Partie complète rejouée à 2 joueurs après le fix, 0 erreur console.

### 2026-07-09 : refonte UX du sélecteur de catégories (champ + modal de suggestions)

**Demande utilisateur :** le sélecteur de catégories était "moche et vieux et pas pratique" sur mobile comme desktop.

**Diagnostic :** le champ principal (taginput) était déjà correctement stylé (chips coral, croix visibles, travail de sessions précédentes). Le vrai problème était la **modal de suggestions** : ~400 suggestions réparties en 30 groupes sans aucun moyen de chercher, et surtout les tags non sélectionnés étaient quasiment invisibles, `$background` (variables.scss, `#FFF8F3`) et le fond de la modal (`#fff9f3`) sont presque identiques, donc un tag Bulma par défaut (fond = `$background`) se fondait complètement dans l'arrière-plan. Zéro affordance "c'est cliquable".

**Ce qui a été fait (`GameConfiguration.vue`) :**
- **Recherche** dans la modal : nouveau champ (icône loupe, `faMagnifyingGlass` ajouté dans `main.js`), filtre en direct sur `filtered_suggestion_groups`, insensible aux accents (`normalize_for_search` : NFD + suppression des diacritiques combinants). Les groupes sans résultat sont masqués (pas de lignes vides). Champ **sticky** en haut du corps de la modal, reste accessible même après avoir scrollé loin dans la liste.
- **Tags redessinés** : chips toujours visibles (fond blanc translucide + bordure ambrée quand non sélectionné, gradient corail + coche `✓` quand sélectionné), tap targets plus généreux (`min-height: 2.3em`, padding augmenté) pour le tactile.
- **Compteur en direct** dans l'en-tête de la modal ("9 sélectionnées") et sur le label du champ principal ("Catégories à remplir 9").
- **Footer** : bouton "Fermer" neutre remplacé par un CTA primaire "Terminé" (pleine largeur).
- **État vide** : message dédié "Aucune catégorie ne correspond à votre recherche." si la recherche ne donne rien (distinct du message "aucune suggestion pour votre langue").
- Bouton "Suggestions" du champ principal : ajout d'une icône (ananas, `SummerDecor variant="icon"`) pour cohérence avec le reste du thème.

**Bug fixé au passage :** l'aide sous le champ catégories affichait littéralement `&nbsp;` (entité HTML non décodée), `:message` d'`o-field` rend du texte brut, pas du HTML. Remplacé par un espace normal dans `fr.json`.

**Piège rencontré, icône cassée dans `<o-input icon="...">` :**
1. Passer `class="suggestions-search"` directement sur `<o-input>` atterrit sur le `<input>` natif lui-même, pas sur un wrapper, cassait le positionnement sticky combiné à l'icône. Fix : wrapper `<div class="suggestions-search">` autour de l'`o-input`.
2. Une fois wrappé, l'icône loupe restait quand même mal positionnée (rendue en flux normal au-dessus de l'input au lieu d'être superposée à gauche). Cause : la config Oruga globale dans `main.js` (`input: { rootClass: 'control', inputClass: 'input' }`) écrase la logique interne du thème Bulma qui ajoute normalement `has-icons-left` sur `.control` quand une icône est présente, sans cette classe, `.icon.is-left` n'est jamais positionné en absolu. Fix : positionnement de l'icône refait à la main en CSS (`.control { position: relative } .icon.is-left { position: absolute; left: 0.9rem }`) plutôt que de dépendre de cette classe manquante. À garder en tête pour tout futur usage de `icon=` sur `o-input` dans ce projet.

**Piège de tooling (pas un bug produit) :** tentative initiale d'utiliser `̀-ͯ` (plage des diacritiques combinants) comme échappement ASCII dans le regex de `normalize_for_search`, plusieurs passes d'édition ont fini par écrire les caractères Unicode combinants littéraux dans le fichier source au lieu de la séquence d'échappement textuelle (perte probable au passage à travers plusieurs couches d'échappement shell/JS). Contourné en construisant les bornes du regex via `String.fromCharCode(0x0300)` / `String.fromCharCode(0x036f)`, garantit un fichier source 100 % ASCII pour cette regex, indépendamment de tout souci d'encodage d'outillage.

**Vérification :** recherche testée sans accent ("celebrite" trouve "Célébrité⋅e"), sélection/désélection avec mise à jour immédiate du compteur, état "aucun résultat", scroll avec recherche sticky sur mobile (390px), partie complète rejouée à 2 joueurs. 0 erreur console partout.
