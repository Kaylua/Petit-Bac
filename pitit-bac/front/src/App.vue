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
        <div class="pititbac-logo is-mobile" aria-hidden="true">
          <img src="./assets/logo.svg" alt="Pitit Bac" />
        </div>
        <div class="columns layout-columns">
          <div class="column is-3">
            <div class="pititbac-logo">
              <img src="./assets/logo.svg" alt="Pitit Bac" />
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
              <img src="./assets/logo.svg" alt="Pitit Bac" />
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

// ============================================================
// FOND GLOBAL — Gradient été, fixé sur tout le viewport
// ============================================================

html
  min-height: 100%
  background: linear-gradient(160deg, #fff9f0 0%, #fff0de 55%, #ffe6c8 100%) #fff9f0

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
// STYLES GLOBAUX CENTRALISÉS — évite répétitions dans composants
// ============================================================

// Notifications flottantes
.notification
  padding-right: 1.5rem !important
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.10)

  &.is-flat
    box-shadow: none

  .media-content
    overflow: hidden

// Sur mobile, les notifications/messages/héros pleine largeur
// perdent leurs coins arrondis (évite le décalage visuel sur bords écran)
+mobile
  main .notification,
  main .message .message-header,
  main .message .message-body,
  main .hero
    border-radius: 0

  main .box
    border-radius: 0

  // Empêche le zoom auto d'iOS Safari sur les inputs
  input[type="text"],
  input[type="number"],
  input[type="email"],
  input[type="password"],
  input[type="search"],
  textarea,
  select
    font-size: max(16px, 1em)

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
  background-color: rgba(#fff9f0, .9)
  backdrop-filter: blur(6px)

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
// FILE D'ATTENTE NOTIFICATIONS (toast en haut à droite)
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
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18)

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

.pititbac-logo
  margin-top: .2rem
  margin-bottom: 2rem

  &.is-mobile
    +mobile
      display: block
      text-align: center

      img
        width: 90%
        max-height: 4rem

  &:not(.is-mobile)
    +mobile
      display: none
    +tablet
      display: block

.init-logo
  text-align: center
  margin-bottom: 4rem
  width: 100%

  img
    width: 70%

    +mobile
      width: 90%

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
  background-color: #fff9f4
  border-radius: 12px
  box-shadow: 0 2px 12px rgba(180, 60, 0, 0.10)

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
</style>
