<template>
  <div id="app">
    <div class="ambient-blobs" aria-hidden="true">
      <span class="blob-teal"></span>
      <span class="blob-yellow"></span>
      <span class="blob-coral"></span>
    </div>
    <SummerDecor variant="scatter" />

    <!-- Loading / error fullscreen overlay (replaces b-loading) -->
    <div class="loading-overlay is-full-page" v-if="has_fullscreen_message">
      <div class="loading-background"></div>
      <template v-if="loading_reason.title || (error && error.title)">
        <p
          v-html="loading_reason.title || (error && error.title)"
          :class="{ 'is-pulsing': !!loading }"
        ></p>
        <p
          class="loading-subtitle"
          v-if="loading_reason.description || (error && error.description)"
          v-html="loading_reason.description || (error && error.description)"
        ></p>
      </template>
    </div>

    <!-- Notification queue (replaces Buefy Snackbar) -->
    <div class="notifications-container">
      <o-notification
        v-for="notif in notifications"
        :key="notif.id"
        :variant="notif.variant || undefined"
        closable
        @close="removeNotification(notif.id)"
      >
        {{ notif.message }}
      </o-notification>
    </div>

    <morel-confirm-modal
      v-model:active="leave_confirm_active"
      variant="danger"
      :title="$t('Leave the game?')"
      :message="phase === 'CONFIG' ? $t('You will leave the lobby.') : $t('You will leave the game.')"
      :confirm-label="$t('Leave')"
      @confirm="confirm_leave_lobby"
    />

    <morel-confirm-modal
      v-model:active="end_game_confirm_active"
      variant="danger"
      :title="$t('End the game')"
      :message="$t('Every player will be disconnected and sent back to the home screen.')"
      :confirm-label="$t('End the game')"
      @confirm="confirm_end_game"
    />

    <main>
      <div
        class="container"
        :class="{ 'is-loading': has_fullscreen_message }"
        v-if="phase !== 'PSEUDONYM'"
      >
        <div class="mobile-top-bar">
          <span aria-hidden="true" class="mobile-top-logo game-title"><SummerDecor variant="icon" motif="cocktail" />Pitit Bac</span>
        </div>
        <div class="columns layout-columns">
          <div class="column is-3">
            <div class="pititbac-logo">
              <SummerDecor variant="corner" />
              <span class="game-title">Pitit Bac</span>
            </div>
            <morel-players
              :master-confirm-message="
                $t(
                  '<strong>{name}</strong> will be able to manage the game, its configuration, and relaunch a new game at the end. You\'ll lose those powers.'
                )
              "
              :master-confirm-help="
                $t(
                  'The game master cannot influence the votes or the game, only its configuration or relaunch. It can also kick players and lock the game.'
                )
              "
              :class="{ 'is-sticky': sticky_players_list }"
            />
            <morel-share-game />
            <div class="leave-lobby-desktop">
              <o-button
                size="small"
                icon-left="angle-left"
                class="leave-lobby-btn"
                @click="open_leave_confirm"
              >{{ $t('Leave') }}</o-button>
              <o-button
                v-if="master"
                size="small"
                icon-left="xmark"
                class="end-game-btn"
                @click="open_end_game_confirm"
              >{{ $t('End the game') }}</o-button>
            </div>
          </div>
          <div class="column is-9">
            <GameConfiguration v-if="phase === 'CONFIG'"></GameConfiguration>
            <Game v-else-if="phase === 'ROUND_ANSWERS'"></Game>
            <GameVote v-else-if="phase === 'ROUND_VOTES'"></GameVote>
            <GameEnd v-else-if="phase === 'END'"></GameEnd>
          </div>
        </div>

        <div class="mobile-bottom-actions">
          <o-button
            size="small"
            icon-left="angle-left"
            class="leave-lobby-btn"
            @click="open_leave_confirm"
          >{{ $t('Leave') }}</o-button>
          <o-button
            v-if="master"
            size="small"
            icon-left="xmark"
            class="end-game-btn"
            @click="open_end_game_confirm"
          >{{ $t('End the game') }}</o-button>
        </div>
      </div>

      <div
        v-else
        class="container"
        :class="{ 'is-loading': has_fullscreen_message }"
      >
        <SummerDecor variant="hero-vivid" />
        <div class="columns">
          <div class="column is-half is-offset-3">
            <header class="init-logo">
              <span class="game-title">Pitit Bac</span>
              <p class="init-tagline">{{ $t('The word game for your summer nights') }}</p>
            </header>
            <morel-ask-pseudonym />
          </div>
        </div>
      </div>
    </main>

    <footer class="footer" :class="{ 'is-loading': has_fullscreen_message }">
      <div class="content has-text-centered">
        <p>
          <i18n-t keypath="Pitit Bac is brought to you by {name}.">
            <template #name>
              <a href="https://amaury.carrade.eu">Amaury Carrade</a>
            </template>
          </i18n-t>
          &nbsp;
          <i18n-t keypath="This application is {open_source}.">
            <template #open_source>
              <a href="https://github.com/MorelGames/pitit-bac">{{ $t("open source, and published under a free licence") }}</a>
            </template>
          </i18n-t>
        </p>
        <morel-locale-switcher />
      </div>
    </footer>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useMorelStore } from 'morel-games-core'
import { useGameStore } from './store.js'

import GameConfiguration from './components/GameConfiguration.vue'
import Game from './components/Game.vue'
import GameVote from './components/GameVote.vue'
import GameEnd from './components/GameEnd.vue'
import SummerDecor from './components/SummerDecor.vue'

export default {
  name: 'App',

  components: { GameConfiguration, Game, GameVote, GameEnd, SummerDecor },

  data() {
    return {
      leave_confirm_active: false,
      end_game_confirm_active: false
    }
  },

  computed: {
    ...mapState(useMorelStore, {
      phase: state => state.phase,
      master: state => state.master,
      loading: state => state.loading,
      loading_reason: state => state.loading_reason,
      error: state => state.error,
      notifications: state => state.notifications
    }),
    ...mapState(useGameStore, ['sticky_players_list']),
    has_fullscreen_message() {
      return !!this.loading || !!(this.error && this.error.title)
    }
  },

  watch: {
    phase() {
      this.$nextTick(() => window.scrollTo(0, 0))
    }
  },

  methods: {
    open_leave_confirm() {
      this.leave_confirm_active = true
    },
    confirm_leave_lobby() {
      useMorelStore().leave_game()
    },
    open_end_game_confirm() {
      if (!this.master) return
      this.end_game_confirm_active = true
    },
    confirm_end_game() {
      useMorelStore().end_game()
    },
    removeNotification(id) {
      useMorelStore().remove_notification(id)
    }
  }
}
</script>

<style lang="sass">
@import "bulma/sass/utilities/_all"
@import url("https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,200;0,400;0,600;0,700;1,400&display=swap")

@import "assets/variables"

@import "bulma/bulma"
@import "assets/design-system"

// ============================================================
// FOND GLOBAL : coucher de soleil été
// ============================================================

html
  min-height: 100%
  background-color: #FFE9C8
  background-image: linear-gradient(155deg, #FFF9F0 0%, #FFE9C8 35%, #FFD298 65%, #FFBA70 100%), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Ccircle cx='2' cy='2' r='2' fill='%23FFFFFF' fill-opacity='0.35'/%3E%3C/svg%3E")
  background-repeat: no-repeat, repeat
  background-size: 100% 100%, 64px 64px

body
  position: relative
  min-height: 100vh
  background: transparent
  overflow-y: auto
  overflow-x: hidden

html.overflow, html.overflow body
  overflow-y: unset

// ============================================================
// BLOBS DE PROFONDEUR : halos flous fixes, palette élargie
// ============================================================

.ambient-blobs
  position: fixed
  inset: 0
  overflow: hidden
  pointer-events: none
  z-index: -1

  span
    position: absolute
    border-radius: 50%
    filter: blur(60px)
    opacity: 0.30

    +mobile
      filter: blur(36px)
      opacity: 0.22

  .blob-teal
    width: 32vw
    height: 32vw
    min-width: 260px
    min-height: 260px
    top: -8vw
    right: -8vw
    background: $accent-teal

  .blob-yellow
    width: 26vw
    height: 26vw
    min-width: 220px
    min-height: 220px
    bottom: 4vh
    left: -6vw
    background: $accent-yellow

  .blob-coral
    width: 20vw
    height: 20vw
    min-width: 180px
    min-height: 180px
    bottom: -6vw
    right: 12vw
    background: $primary

// ============================================================
// APP SHELL
// ============================================================

#app
  font-family: "Fira Sans", Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
  display: flex
  flex-direction: column
  min-height: 100vh
  color: #2D1B00
  padding-top: 60px

  +mobile
    // Marge basse augmentée : laisse la place à .mobile-bottom-actions,
    // fixée en bas de l'écran (Quitter / Terminer la partie), pour ne pas
    // qu'elle recouvre le footer.
    padding: 1.2rem 0 calc(4.6rem + env(safe-area-inset-bottom))

  +tablet
    padding: 1.6rem 1rem

  main
    flex: 2

// ============================================================
// OVERLAY CHARGEMENT
// ============================================================

.loading-overlay.is-full-page
  position: fixed
  top: 0
  left: 0
  width: 100%
  height: 100%
  z-index: 999
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  padding: 1em 20%
  background-color: rgba(#fff9f0, .92)
  backdrop-filter: blur(8px)
  -webkit-backdrop-filter: blur(8px)

  +mobile
    padding: 1em

  .loading-background
    display: none

  p
    font-size: 2.8em
    font-weight: 200
    text-align: center

    +mobile
      font-size: 1.8em

    &.is-pulsing
      animation: pulse 2s infinite

    strong
      font-weight: 400

    &.loading-subtitle
      margin-top: 2em
      font-size: 1.8em
      animation: none

      +mobile
        font-size: 1.3em

// ============================================================
// FILE D'ATTENTE NOTIFICATIONS (toast haut droite)
// ============================================================

.notifications-container
  position: fixed
  top: 1rem
  right: 1rem
  z-index: 1000
  display: flex
  flex-direction: column
  gap: 0.5rem
  max-width: 400px

  +mobile
    top: 0
    right: 0
    left: 0
    max-width: 100%

  .notification
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15)

    @media (prefers-reduced-motion: no-preference)
      animation: slideInRight 0.28s ease both

    +mobile
      border-radius: 0
      margin: 0

// ============================================================
// LAYOUT & LOGO
// ============================================================

.container, .footer
  &.is-loading
    filter: blur(4px)

.field
  .help
    color: $grey-dark

.game-title
  font-family: "Fira Sans", sans-serif
  font-weight: 800
  letter-spacing: -0.025em
  line-height: 1.05
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%)
  -webkit-background-clip: text
  -webkit-text-fill-color: transparent
  background-clip: text

.pititbac-logo
  position: relative
  margin-top: .2rem
  margin-bottom: 2rem

  &:not(.is-mobile)
    +mobile
      display: none
    +tablet
      display: block

  .game-title
    position: relative
    z-index: 1
    font-size: 2.8rem
    display: block
    filter: drop-shadow(0 3px 10px rgba($primary, 0.22))

.init-logo
  position: relative
  text-align: center
  margin-bottom: 2.4rem
  width: 100%
  padding-top: 1.5rem

  // Halo lumineux derrière le titre, façon spotlight, pour renforcer le
  // pop de la typo blanche sur le dégradé (esprit "hero" moderne)
  &::before
    content: ""
    position: absolute
    z-index: 0
    top: -2rem
    left: 50%
    width: 480px
    height: 320px
    transform: translateX(-50%)
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 70%)
    pointer-events: none

    +mobile
      width: 320px
      height: 220px

  .game-title
    position: relative
    z-index: 1
    font-size: 7.4rem
    font-weight: 900
    letter-spacing: -0.045em
    display: block
    // Sur le fond vivid, le gradient corail "clippé dans le texte" perd tout
    // contraste : blanc plein + ombre portée chaude à la place, plus proche
    // de la typo "poster" de design.md
    color: #FFFBF3
    background: none
    -webkit-text-fill-color: initial
    text-shadow: 0 8px 28px rgba(120, 20, 0, 0.4), 0 2px 0 rgba(120, 20, 0, 0.15)
    filter: none

    +mobile
      font-size: 4.8rem

    @media (prefers-reduced-motion: no-preference)
      transition: transform 0.3s ease

      &:hover
        transform: scale(1.02) rotate(-0.4deg)

  .init-tagline
    position: relative
    z-index: 1
    display: inline-flex
    align-items: center
    gap: 0.5em
    margin-top: 1rem
    padding: 0.5em 1.1em
    border-radius: 999px
    background: rgba(255, 255, 255, 0.22)
    border: 1px solid rgba(255, 255, 255, 0.4)
    backdrop-filter: blur(8px)
    -webkit-backdrop-filter: blur(8px)
    font-size: 1rem
    font-weight: 700
    color: #FFFBF3
    text-shadow: 0 2px 8px rgba(120, 20, 0, 0.25)

    +mobile
      font-size: 0.85rem
      padding: 0.45em 0.9em

    &::before
      content: ""
      width: 7px
      height: 7px
      border-radius: 50%
      background: #FFF3C4
      flex-shrink: 0

      @media (prefers-reduced-motion: no-preference)
        animation: pulseDot 2s ease-in-out infinite

// ============================================================
// BARRE MOBILE HAUT (logo + bouton quitter)
// ============================================================

.mobile-top-bar
  display: none

  +mobile
    display: flex
    justify-content: center
    padding: 0.6rem 1rem 0.2rem
    margin-bottom: 0.4rem

  .mobile-top-logo
    font-size: 2rem
    filter: drop-shadow(0 3px 8px rgba($primary, 0.22))

    .summer-icon
      color: $primary
      width: 0.7em
      height: 0.7em

// Barre d'actions (Quitter / Terminer la partie) fixée en bas de l'écran sur
// mobile : zone du pouce, plus accessible qu'en haut (demande explicite,
// pattern mobile classique pour des actions secondaires/destructrices).
// `env(safe-area-inset-bottom)` évite la zone home-indicator iOS.
.mobile-bottom-actions
  display: none

  +mobile
    display: flex
    justify-content: center
    gap: 0.6rem
    position: fixed
    left: 0
    right: 0
    bottom: 0
    z-index: 30
    padding: 0.6rem 1rem calc(0.6rem + env(safe-area-inset-bottom))
    background: rgba(255, 249, 240, 0.92)
    backdrop-filter: blur(10px)
    -webkit-backdrop-filter: blur(10px)
    border-top: 1px solid rgba(200, 140, 70, 0.25)
    box-shadow: 0 -4px 16px rgba(150, 45, 0, 0.08)

    .button
      flex: 1
      max-width: 220px

// Boutons ronds "pilule" discrets, même famille visuelle (Leave = neutre,
// End Game = même forme mais teinte corail/danger pour bien le distinguer
// sans casser l'ambiance été, pas de bloc plein Bulma "is-danger")
.leave-lobby-btn,
.end-game-btn
  font-size: 0.82em !important
  font-weight: 500 !important
  border-radius: 999px !important
  box-shadow: none !important
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease !important

.leave-lobby-btn
  color: #5a3a1a !important
  background: rgba(255, 248, 238, 0.9) !important
  border-color: rgba(200, 140, 70, 0.35) !important

  &:hover
    background: rgba(255, 228, 178, 0.5) !important
    color: $primary-dark !important
    border-color: rgba($primary, 0.4) !important

.end-game-btn
  color: #B3261E !important
  background: rgba(255, 232, 227, 0.9) !important
  border-color: rgba(211, 47, 47, 0.35) !important

  &:hover
    background: rgba(255, 205, 195, 0.6) !important
    color: #8C1D18 !important
    border-color: rgba(211, 47, 47, 0.55) !important

// Boutons quitter / terminer la partie : sidebar desktop uniquement
.leave-lobby-desktop
  margin-top: 1.2rem
  display: flex
  flex-direction: column
  align-items: center
  gap: 0.5rem

  +mobile
    display: none

.columns.layout-columns
  +mobile
    display: flex
    flex-direction: column-reverse

// ============================================================
// LISTE JOUEURS STICKY
// ============================================================

.morel-players-list.is-sticky
  position: sticky
  top: 10px
  z-index: 21
  background-color: rgba(255, 252, 248, 0.97) !important
  backdrop-filter: blur(12px)
  -webkit-backdrop-filter: blur(12px)
  border-radius: 16px !important
  box-shadow: var(--card-shadow-lift)

// ============================================================
// SHARE GAME
// ============================================================

.share-game h3
  color: #4E2E00
  font-weight: 700

// ============================================================
// PAGE D'ACCUEIL
// Inspiré de design.md (fond dégradé chaud, hiérarchie typo bold/tight
// tracking, carte "verre dépoli", CTA pilule) : on garde l'esprit (structure,
// contraste, formes) mais pas le contenu (jeux de cartes casino, Tailwind),
// adapté à la vraie page (logo + saisie du pseudo) et à la palette été
// existante plutôt qu'au jaune/orange casino du fichier source.
// ============================================================

.ask-pseudonym
  @media (prefers-reduced-motion: no-preference)
    animation: fadeInUp 0.45s ease 0.08s both

  // Pas de carte : deux essais de "panneau" (dégradé peint, verre dépoli
  // flouté+bordure blanche) ont tous les deux lu "vieillot" quel que soit
  // le traitement — le cadre/bordure/flou lui-même était le problème, pas
  // sa couleur. Le champ et le bouton flottent directement sur le dégradé
  // vivid : juste de l'espacement et une ombre douce sous chaque élément.
  max-width: 420px
  margin: 0 auto

  +tablet
    max-width: 460px

  .label
    color: #FFFBF3
    font-weight: 700
    font-size: 0.85rem
    letter-spacing: 0.04em
    margin-bottom: 0.7rem !important
    text-shadow: 0 2px 8px rgba(120, 20, 0, 0.3)

  .field.has-addons
    display: flex
    flex-direction: column
    gap: 0.9rem

    .control
      width: 100%

    .input
      border-radius: 999px !important
      height: 3.5rem
      padding-left: 1.5rem
      font-size: 1.05rem
      background: #FFFFFF
      border: none
      box-shadow: 0 10px 28px rgba(90, 15, 0, 0.22)
      transition: box-shadow 0.2s ease

      &:focus
        box-shadow: 0 10px 28px rgba(90, 15, 0, 0.22), 0 0 0 3px rgba(255, 255, 255, 0.6)

    .button
      width: 100%
      height: 3.5rem
      border-radius: 999px !important
      font-size: 1.05rem
      font-weight: 700
      gap: 0.5rem
      box-shadow: 0 10px 28px rgba(90, 15, 0, 0.3) !important

// ============================================================
// FOOTER
// ============================================================

.footer
  color: lighten($dark, 35%)
  font-size: 0.9em

  a
    color: $link

// ============================================================
// ANIMATIONS
// ============================================================

@keyframes pulse
  0%
    color: $dark
  50%
    color: lighten($primary, 20%)
  100%
    color: $dark

@keyframes pulseDot
  0%, 100%
    opacity: 0.5
    transform: scale(1)
  50%
    opacity: 1
    transform: scale(1.25)

@keyframes fadeInUp
  from
    opacity: 0
    transform: translateY(18px)
  to
    opacity: 1
    transform: translateY(0)

@keyframes slideInRight
  from
    opacity: 0
    transform: translateX(18px)
  to
    opacity: 1
    transform: translateX(0)

@keyframes bounceIn
  0%
    opacity: 0
    transform: scale(0.88) translateY(8px)
  65%
    transform: scale(1.04)
  100%
    opacity: 1
    transform: scale(1)

@keyframes confettiFall
  0%
    opacity: 1
    transform: translateY(-10px) rotate(0deg)
  100%
    opacity: 0
    transform: translateY(80px) rotate(360deg)

@keyframes tagPopIn
  from
    opacity: 0
    transform: scale(0.85)
  to
    opacity: 1
    transform: scale(1)

// Animations d'entrée pour les écrans principaux
@media (prefers-reduced-motion: no-preference)
  .game-configuration,
  .game-answers,
  .end-screen
    animation: fadeInUp 0.4s ease both
</style>
