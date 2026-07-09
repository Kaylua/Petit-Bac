<template>
  <div id="app">
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

    <main>
      <div
        class="container"
        :class="{ 'is-loading': has_fullscreen_message }"
        v-if="phase !== 'PSEUDONYM'"
      >
        <div class="mobile-top-bar">
          <span aria-hidden="true" class="mobile-top-logo game-title">Pitit Bac</span>
          <o-button
            v-if="phase === 'CONFIG'"
            size="small"
            icon-left="angle-left"
            class="leave-lobby-btn"
            @click="leave_lobby"
          >{{ $t('Leave') }}</o-button>
        </div>
        <div class="columns layout-columns">
          <div class="column is-3">
            <div class="pititbac-logo">
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
            <div class="leave-lobby-desktop" v-if="phase === 'CONFIG'">
              <o-button
                size="small"
                icon-left="angle-left"
                class="leave-lobby-btn"
                @click="leave_lobby"
              >{{ $t('Leave') }}</o-button>
            </div>
          </div>
          <div class="column is-9">
            <GameConfiguration v-if="phase === 'CONFIG'"></GameConfiguration>
            <Game v-else-if="phase === 'ROUND_ANSWERS'"></Game>
            <GameVote v-else-if="phase === 'ROUND_VOTES'"></GameVote>
            <GameEnd v-else-if="phase === 'END'"></GameEnd>
          </div>
        </div>
      </div>

      <div
        v-else
        class="container"
        :class="{ 'is-loading': has_fullscreen_message }"
      >
        <div class="columns">
          <div class="column is-half is-offset-3">
            <header class="init-logo">
              <span class="game-title">Pitit Bac</span>
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

export default {
  name: 'App',

  components: { GameConfiguration, Game, GameVote, GameEnd },

  computed: {
    ...mapState(useMorelStore, {
      phase: state => state.phase,
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
    leave_lobby() {
      useMorelStore().leave_game()
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
// FOND GLOBAL — Coucher de soleil été
// ============================================================

html
  min-height: 100%
  background: linear-gradient(155deg, #FFF9F0 0%, #FFE9C8 35%, #FFD298 65%, #FFBA70 100%) fixed

body
  min-height: 100vh
  background: transparent
  overflow-y: auto

  +mobile
    overflow-x: hidden

html.overflow, html.overflow body
  overflow-y: unset

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
    padding: 1.2rem 0 2rem 0

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
  margin-top: .2rem
  margin-bottom: 2rem

  &:not(.is-mobile)
    +mobile
      display: none
    +tablet
      display: block

  .game-title
    font-size: 2.8rem
    display: block
    filter: drop-shadow(0 3px 10px rgba($primary, 0.22))

.init-logo
  text-align: center
  margin-bottom: 3.5rem
  width: 100%

  .game-title
    font-size: 5.5rem
    display: block
    filter: drop-shadow(0 6px 20px rgba($primary, 0.22))

    +mobile
      font-size: 3.8rem

    @media (prefers-reduced-motion: no-preference)
      transition: transform 0.3s ease

      &:hover
        transform: scale(1.02) rotate(-0.4deg)

// ============================================================
// BARRE MOBILE HAUT (logo + bouton quitter)
// ============================================================

.mobile-top-bar
  display: none

  +mobile
    display: flex
    align-items: center
    justify-content: center
    position: relative
    min-height: 3.8rem
    padding: 0 1rem
    margin-bottom: 0.4rem

  .mobile-top-logo
    font-size: 2rem
    filter: drop-shadow(0 3px 8px rgba($primary, 0.22))

// Bouton "Quitter le lobby" — style ghost discret
.leave-lobby-btn
  font-size: 0.82em !important
  font-weight: 500 !important
  color: #5a3a1a !important
  background: rgba(255, 248, 238, 0.9) !important
  border-color: rgba(200, 140, 70, 0.35) !important
  border-radius: 10px !important
  box-shadow: none !important
  transition: background 0.15s ease, color 0.15s ease !important

  &:hover
    background: rgba(255, 228, 178, 0.5) !important
    color: $primary-dark !important
    border-color: rgba($primary, 0.4) !important

+mobile
  .mobile-top-bar .leave-lobby-btn
    position: absolute
    left: 1rem

// Bouton quitter — sidebar desktop uniquement
.leave-lobby-desktop
  margin-top: 1.2rem
  text-align: center

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
// ============================================================

.ask-pseudonym
  @media (prefers-reduced-motion: no-preference)
    animation: fadeInUp 0.45s ease 0.08s both

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

// Animations d'entrée pour les écrans principaux
@media (prefers-reduced-motion: no-preference)
  .game-configuration,
  .game-answers,
  .end-screen
    animation: fadeInUp 0.4s ease both
</style>
