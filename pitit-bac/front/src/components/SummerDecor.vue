<template>
  <div v-if="variant === 'icon'" class="summer-icon" :class="'is-' + motif" aria-hidden="true">
    <svg v-if="motif === 'cocktail'" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h16l-7 8v7" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" />
      <path d="M8.5 19h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="9" cy="7.2" r="1.5" fill="currentColor" />
    </svg>
    <svg v-else-if="motif === 'palm'" viewBox="0 0 24 24" fill="none">
      <path d="M12 21c-.2-5-.2-8.5 0-12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 9c-2.2-2.4-4.6-3-8-3.4 2 2.6 4.4 4 8 4.4Z" />
        <path d="M12 9c-1-3-1.4-5-.8-8.4 1.8 2.2 2.6 4.6 .8 8.4Z" />
        <path d="M12 9c1-3 1.4-5 .8-8.4 -1.8 2.2-2.6 4.6-.8 8.4Z" />
        <path d="M12 9c2.2-2.4 4.6-3 8-3.4 -2 2.6-4.4 4-8 4.4Z" />
      </g>
    </svg>
    <svg v-else-if="motif === 'pineapple'" viewBox="0 0 24 24" fill="none">
      <path d="M12 8c-3 0-5.5 3-5.5 7s2.5 6 5.5 6 5.5-2.5 5.5-6-2.5-7-5.5-7Z" stroke="currentColor" stroke-width="1.8" />
      <path d="M9 12l6 5M15 12l-6 5" stroke="currentColor" stroke-width="1.2" />
      <path d="M12 8V3M9 6l3-3 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <svg v-else-if="motif === 'watermelon'" viewBox="0 0 24 24" fill="none">
      <path d="M3 11a9 9 0 0 1 18 0Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M5.3 11a6.7 6.7 0 0 1 13.4 0Z" fill="currentColor" fill-opacity="0.18" />
      <circle cx="9.5" cy="8.6" r="0.9" fill="currentColor" />
      <circle cx="12" cy="7.6" r="0.9" fill="currentColor" />
      <circle cx="14.5" cy="8.6" r="0.9" fill="currentColor" />
    </svg>
    <svg v-else viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5.3" />
        <line x1="12" y1="18.7" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5.3" y2="12" />
        <line x1="18.7" y1="12" x2="21.5" y2="12" />
        <line x1="5" y1="5" x2="7" y2="7" />
        <line x1="17" y1="17" x2="19" y2="19" />
        <line x1="5" y1="19" x2="7" y2="17" />
        <line x1="17" y1="7" x2="19" y2="5" />
      </g>
    </svg>
  </div>

  <div v-else class="summer-decor" :class="'is-' + variant" aria-hidden="true">
    <template v-if="variant === 'hero'">
      <svg class="decor decor-sun" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="18" fill="#FFC93C" />
        <g stroke="#FFC93C" stroke-width="5" stroke-linecap="round">
          <line x1="50" y1="6" x2="50" y2="20" />
          <line x1="50" y1="80" x2="50" y2="94" />
          <line x1="6" y1="50" x2="20" y2="50" />
          <line x1="80" y1="50" x2="94" y2="50" />
          <line x1="18.8" y1="18.8" x2="28.6" y2="28.6" />
          <line x1="71.4" y1="71.4" x2="81.2" y2="81.2" />
          <line x1="18.8" y1="81.2" x2="28.6" y2="71.4" />
          <line x1="71.4" y1="28.6" x2="81.2" y2="18.8" />
        </g>
      </svg>

      <svg class="decor decor-palm" viewBox="0 0 120 120" fill="none">
        <path d="M60 110 C58 80 58 55 60 35" stroke="#0B5D4A" stroke-width="5" stroke-linecap="round" />
        <path d="M60 40 C40 32 24 34 10 22 C28 18 44 22 58 34" fill="#00BFA5" />
        <path d="M60 38 C42 22 30 14 22 -2 C42 4 54 16 60 32" fill="#0B5D4A" />
        <path d="M60 36 C68 16 78 6 84 -8 C70 2 60 14 56 30" fill="#00BFA5" />
        <path d="M62 40 C82 30 98 30 114 16 C96 16 80 22 62 34" fill="#0B5D4A" />
        <path d="M60 44 C78 42 92 48 108 44 C94 54 78 54 60 48" fill="#00BFA5" />
      </svg>

      <svg class="decor decor-cocktail" viewBox="0 0 100 120" fill="none">
        <path d="M20 14 L50 54 L80 14 Z" fill="#FFF8F3" stroke="#E8581E" stroke-width="4" stroke-linejoin="round" />
        <line x1="50" y1="54" x2="50" y2="96" stroke="#E8581E" stroke-width="4" stroke-linecap="round" />
        <line x1="32" y1="108" x2="68" y2="108" stroke="#E8581E" stroke-width="4" stroke-linecap="round" />
        <line x1="50" y1="96" x2="50" y2="108" stroke="#E8581E" stroke-width="4" stroke-linecap="round" />
        <circle cx="38" cy="26" r="7" fill="#FFC93C" stroke="#E8581E" stroke-width="2.5" />
        <line x1="70" y1="8" x2="86" y2="-10" stroke="#00BFA5" stroke-width="4" stroke-linecap="round" />
      </svg>

      <span class="decor decor-dot is-a"></span>
      <span class="decor decor-dot is-b"></span>
      <span class="decor decor-dot is-c"></span>
      <span class="decor decor-dot is-d"></span>
    </template>

    <template v-else-if="variant === 'corner'">
      <svg class="decor decor-palm-small" viewBox="0 0 120 120" fill="none">
        <path d="M60 110 C58 80 58 55 60 35" stroke="#0B5D4A" stroke-width="5" stroke-linecap="round" />
        <path d="M60 40 C40 32 24 34 10 22 C28 18 44 22 58 34" fill="#00BFA5" />
        <path d="M60 38 C42 22 30 14 22 -2 C42 4 54 16 60 32" fill="#0B5D4A" />
        <path d="M60 36 C68 16 78 6 84 -8 C70 2 60 14 56 30" fill="#00BFA5" />
        <path d="M62 40 C82 30 98 30 114 16 C96 16 80 22 62 34" fill="#0B5D4A" />
      </svg>
      <svg class="decor decor-cocktail-small" viewBox="0 0 100 120" fill="none">
        <path d="M20 14 L50 54 L80 14 Z" fill="#FFF8F3" stroke="#E8581E" stroke-width="5" stroke-linejoin="round" />
        <line x1="50" y1="54" x2="50" y2="96" stroke="#E8581E" stroke-width="5" stroke-linecap="round" />
        <line x1="32" y1="108" x2="68" y2="108" stroke="#E8581E" stroke-width="5" stroke-linecap="round" />
        <line x1="50" y1="96" x2="50" y2="108" stroke="#E8581E" stroke-width="5" stroke-linecap="round" />
        <circle cx="36" cy="24" r="8" fill="#FFC93C" stroke="#E8581E" stroke-width="3" />
      </svg>
      <span class="decor decor-dot is-a"></span>
      <span class="decor decor-dot is-b"></span>
    </template>

    <template v-else-if="variant === 'scatter'">
      <!-- Gouttières desktop (large écran uniquement, cf. +widescreen dans le style) -->
      <svg class="decor decor-g-palm-l" viewBox="0 0 120 120" fill="none">
        <path d="M60 110 C58 80 58 55 60 35" stroke="#0B5D4A" stroke-width="5" stroke-linecap="round" />
        <path d="M60 40 C40 32 24 34 10 22 C28 18 44 22 58 34" fill="#00BFA5" />
        <path d="M60 38 C42 22 30 14 22 -2 C42 4 54 16 60 32" fill="#0B5D4A" />
        <path d="M60 36 C68 16 78 6 84 -8 C70 2 60 14 56 30" fill="#00BFA5" />
        <path d="M62 40 C82 30 98 30 114 16 C96 16 80 22 62 34" fill="#0B5D4A" />
      </svg>
      <svg class="decor decor-g-cocktail-l" viewBox="0 0 100 120" fill="none">
        <path d="M20 14 L50 54 L80 14 Z" fill="#FFF8F3" stroke="#E8581E" stroke-width="4" stroke-linejoin="round" />
        <line x1="50" y1="54" x2="50" y2="96" stroke="#E8581E" stroke-width="4" stroke-linecap="round" />
        <line x1="32" y1="108" x2="68" y2="108" stroke="#E8581E" stroke-width="4" stroke-linecap="round" />
        <line x1="50" y1="96" x2="50" y2="108" stroke="#E8581E" stroke-width="4" stroke-linecap="round" />
        <circle cx="38" cy="26" r="7" fill="#FFC93C" stroke="#E8581E" stroke-width="2.5" />
      </svg>
      <svg class="decor decor-g-pineapple-l" viewBox="0 0 60 80" fill="none">
        <path d="M30 24c-13 0-22 14-22 32s9 22 22 22 22-4 22-22-9-32-22-32Z" stroke="#E8581E" stroke-width="4" />
        <path d="M14 40l32 24M46 40L14 64" stroke="#E8581E" stroke-width="2.5" />
        <path d="M30 24V6M20 14l10-10 10 10" stroke="#0B5D4A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

      <svg class="decor decor-g-sun-r" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="16" fill="#FFC93C" />
        <g stroke="#FFC93C" stroke-width="5" stroke-linecap="round">
          <line x1="50" y1="10" x2="50" y2="22" />
          <line x1="50" y1="78" x2="50" y2="90" />
          <line x1="10" y1="50" x2="22" y2="50" />
          <line x1="78" y1="50" x2="90" y2="50" />
        </g>
      </svg>
      <svg class="decor decor-g-cocktail-r" viewBox="0 0 100 120" fill="none">
        <path d="M20 14 L50 54 L80 14 Z" fill="#FFF8F3" stroke="#00838F" stroke-width="4" stroke-linejoin="round" />
        <line x1="50" y1="54" x2="50" y2="96" stroke="#00838F" stroke-width="4" stroke-linecap="round" />
        <line x1="32" y1="108" x2="68" y2="108" stroke="#00838F" stroke-width="4" stroke-linecap="round" />
        <line x1="50" y1="96" x2="50" y2="108" stroke="#00838F" stroke-width="4" stroke-linecap="round" />
        <circle cx="62" cy="26" r="7" fill="#FF6B35" stroke="#00838F" stroke-width="2.5" />
      </svg>
      <svg class="decor decor-g-watermelon-r" viewBox="0 0 100 60" fill="none">
        <path d="M4 8a92 92 0 0 1 92 0Z" fill="#0B5D4A" />
        <path d="M12 8a80 80 0 0 1 76 0Z" fill="#FFF8F3" />
        <path d="M18 8a68 68 0 0 1 64 0Z" fill="#FF6B35" />
        <circle cx="38" cy="6" r="2.4" fill="#2D1B00" />
        <circle cx="50" cy="4" r="2.4" fill="#2D1B00" />
        <circle cx="62" cy="6" r="2.4" fill="#2D1B00" />
      </svg>
      <svg class="decor decor-g-palm-r" viewBox="0 0 120 120" fill="none">
        <path d="M60 110 C58 80 58 55 60 35" stroke="#0B5D4A" stroke-width="5" stroke-linecap="round" />
        <path d="M60 40 C40 32 24 34 10 22 C28 18 44 22 58 34" fill="#00BFA5" />
        <path d="M60 38 C42 22 30 14 22 -2 C42 4 54 16 60 32" fill="#0B5D4A" />
        <path d="M60 36 C68 16 78 6 84 -8 C70 2 60 14 56 30" fill="#00BFA5" />
        <path d="M62 40 C82 30 98 30 114 16 C96 16 80 22 62 34" fill="#0B5D4A" />
      </svg>

      <span class="decor decor-dot is-a"></span>
      <span class="decor decor-dot is-b"></span>
      <span class="decor decor-dot is-c"></span>
      <span class="decor decor-dot is-d"></span>
      <span class="decor decor-dot is-e"></span>
      <span class="decor decor-dot is-f"></span>
    </template>
  </div>
</template>

<script>
export default {
  name: 'SummerDecor',
  props: {
    variant: {
      type: String,
      default: 'hero',
      validator: (v) => ['hero', 'corner', 'scatter', 'icon'].includes(v)
    },
    motif: {
      type: String,
      default: 'cocktail',
      validator: (v) => ['cocktail', 'palm', 'pineapple', 'watermelon', 'sun'].includes(v)
    }
  }
}
</script>

<style lang="sass">
@import "bulma/sass/utilities/_all"
@import "../assets/variables"

// Icône inline monochrome (currentColor) — utilisée dans les titres/headers,
// à la différence de .summer-decor qui est un calque décoratif en position absolue.
.summer-icon
  display: inline-flex
  align-items: center
  justify-content: center
  width: 1.1em
  height: 1.1em
  margin-right: 0.4em
  vertical-align: -0.18em

  svg
    width: 100%
    height: 100%

// Partial décoratif — piochant dans la palette élargie (teal/jaune) en plus
// du corail. Purement cosmétique : aria-hidden, pointer-events: none, ne
// doit jamais capter le focus ni gêner la mise en page.

.summer-decor
  position: absolute
  inset: 0
  overflow: visible
  pointer-events: none
  z-index: 0

  .decor
    position: absolute
    display: block
    filter: drop-shadow(0 4px 10px rgba(120, 40, 0, 0.10))

  .decor-dot
    border-radius: 50%
    width: 10px
    height: 10px

    &.is-a
      background: $accent-teal
    &.is-b
      background: $accent-yellow
    &.is-c
      background: $primary
    &.is-d
      background: $accent-teal
    &.is-e
      background: $accent-yellow
    &.is-f
      background: $primary

  @media (prefers-reduced-motion: no-preference)
    .decor-sun, .decor-g-sun-r
      animation: decorSpin 22s linear infinite
    .decor-palm, .decor-palm-small, .decor-g-palm-l, .decor-g-palm-r
      animation: decorSway 5s ease-in-out infinite
    .decor-cocktail, .decor-cocktail-small, .decor-g-cocktail-l, .decor-g-cocktail-r
      animation: decorBob 4s ease-in-out infinite
    .decor-dot
      animation: decorFloat 6s ease-in-out infinite
    .decor-g-pineapple-l, .decor-g-watermelon-r
      animation: decorBob 5s ease-in-out infinite

  &.is-hero
    .decor-sun
      width: 220px
      height: 220px
      top: -5.6rem
      left: 50%
      transform: translateX(-50%)
      opacity: 0.55

      +mobile
        top: -4.2rem

    .decor-palm
      width: 92px
      height: 92px
      top: -1.2rem
      left: -3.6rem
      transform: rotate(-18deg)

      +mobile
        width: 62px
        height: 62px
        top: -0.6rem
        left: -0.4rem

    .decor-cocktail
      width: 66px
      height: 80px
      top: -0.4rem
      right: -3.2rem

      +mobile
        width: 46px
        height: 56px
        top: 0.4rem
        right: -0.2rem

    .decor-dot
      &.is-a
        top: -2.6rem
        left: 20%
      &.is-b
        top: 1rem
        right: 14%
      &.is-c
        top: 4.5rem
        left: 6%
      &.is-d
        top: -3.4rem
        right: 28%

  &.is-corner
    .decor-palm-small
      width: 46px
      height: 46px
      top: -0.6rem
      left: -1.6rem
      transform: rotate(-14deg)
      opacity: 0.9

    .decor-cocktail-small
      width: 30px
      height: 36px
      top: -0.9rem
      left: 5.4rem
      opacity: 0.9

    .decor-dot
      &.is-a
        top: -0.8rem
        left: 2.2rem
      &.is-b
        top: 2.6rem
        left: 6.4rem

  // Calque ambiant plein écran — ajouté une seule fois dans App.vue, visible
  // sur tous les écrans (pas seulement l'accueil). Position fixed (pas
  // absolute) : le composant est un enfant direct de #app, ce calque doit
  // couvrir le viewport entier peu importe la hauteur de la page.
  &.is-scatter
    position: fixed

    // Le sélecteur d'attribut [class^="decor-g-"] ne fonctionne PAS ici : la
    // valeur de l'attribut class est "decor decor-g-palm-l" (la classe de
    // base "decor" est listée en premier), donc ^= ne matche jamais. Piège
    // rencontré : sans ce display:none par défaut, les éléments gutter/mobile
    // n'ont aucune règle de taille/position en dehors de leur breakpoint et
    // le SVG se met à occuper toute la largeur du viewport (position
    // absolute avec des offsets résolus à 0 par le calcul de position
    // statique). Toujours lister les classes une par une.
    .decor-g-palm-l, .decor-g-cocktail-l, .decor-g-pineapple-l, .decor-g-sun-r, .decor-g-cocktail-r, .decor-g-watermelon-r, .decor-g-palm-r
      display: none

    // Le contenu (sidebar + card) occupe déjà ~1344px de large (container
    // Bulma fullhd) — en dessous de ~1700px de viewport, la "gouttière"
    // restante est trop étroite et les motifs chevauchent le contenu réel
    // (piège rencontré : un cocktail de la gouttière recouvrait le texte de
    // la sidebar à 1440px, résolution laptop très courante). On réserve donc
    // ce calque aux très grands écrans, où la gouttière est franchement vide.
    @media (min-width: 1700px)
      .decor-g-palm-l, .decor-g-cocktail-l, .decor-g-pineapple-l, .decor-g-sun-r, .decor-g-cocktail-r, .decor-g-watermelon-r, .decor-g-palm-r
        display: block
        opacity: 0.85

      .decor-g-palm-l
        width: 100px
        height: 100px
        top: 6vh
        left: 0.8vw
        transform: rotate(-16deg)

      .decor-g-cocktail-l
        width: 58px
        height: 70px
        top: 38vh
        left: 1.2vw

      .decor-g-pineapple-l
        width: 52px
        height: 68px
        top: 68vh
        left: 1.4vw
        transform: rotate(-8deg)

      .decor-g-sun-r
        width: 90px
        height: 90px
        top: 8vh
        right: 1.4vw
        opacity: 0.5

      .decor-g-cocktail-r
        width: 58px
        height: 70px
        top: 26vh
        right: 1vw
        transform: rotate(6deg)

      .decor-g-watermelon-r
        width: 76px
        height: 46px
        top: 52vh
        right: 0.6vw
        transform: rotate(-4deg)

      .decor-g-palm-r
        width: 84px
        height: 84px
        top: 76vh
        right: 1.2vw
        transform: rotate(20deg) scaleX(-1)

      .decor-dot
        &.is-a
          top: 20vh
          left: 6vw
        &.is-b
          top: 60vh
          left: 5.5vw
        &.is-c
          top: 16vh
          right: 6vw
        &.is-d
          top: 44vh
          right: 5.5vw
        &.is-e
          top: 84vh
          right: 6vw
        &.is-f
          top: 90vh
          left: 6.5vw

    // Sur mobile, ce calque ne rend rien : les icônes de gouttière n'ont pas
    // leur place sur un contenu plein écran sans marge, et un calque en
    // position fixed superposerait des motifs sur le formulaire au lieu de
    // rester dans un espace vide (essayé, donnait un rendu "sale" au scroll).
    // La touche estivale mobile passe par les icônes inline des headers
    // (variant="icon") et la barre du haut, pas par ce calque ambiant.
    +mobile
      .decor-dot
        display: none

@keyframes decorSpin
  from
    transform: translateX(-50%) rotate(0deg)
  to
    transform: translateX(-50%) rotate(360deg)

@keyframes decorSway
  0%, 100%
    transform: rotate(-18deg)
  50%
    transform: rotate(-10deg)

@keyframes decorBob
  0%, 100%
    transform: translateY(0)
  50%
    transform: translateY(-8px)

@keyframes decorFloat
  0%, 100%
    transform: translateY(0)
  50%
    transform: translateY(-10px)
</style>
