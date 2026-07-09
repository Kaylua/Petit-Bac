<template>
  <section class="share-game">
    <header>
      <slot name="title">
        <h3>{{ $t("Share game") }}</h3>
      </slot>
      <slot name="lock">
        <o-tooltip :label="lock_tooltip" position="bottom" :variant="type" :class="{'is-static': !master}">
          <o-button
            :icon-left="locked ? 'lock' : 'lock-open'"
            :loading="lock_loading"
            :disabled="!master"
            @click="toggle_lock"
            variant="text"
          />
        </o-tooltip>
      </slot>
    </header>

    <o-field grouped size="small">
      <o-input
        :model-value="share_url"
        size="small"
        readonly
        expanded
        id="share-url-field"
        @focus="$event.target.select()"
      ></o-input>
      <p class="control copy-button">
        <o-tooltip
          :label="copied ? $t('Copied!') : $t('Copy link to clipboard')"
          position="bottom"
          :variant="type"
          multiline
        >
          <o-button :variant="type" icon-left="clipboard" @click.stop.prevent="copy_url" expanded>
            {{ $t("Copy game link") }}
          </o-button>
        </o-tooltip>
      </p>
    </o-field>

    <p class="share-invite">
      <slot name="invite">
        {{ $t("Invite other players to open this link in their browser to join this game.") }}
      </slot>
    </p>
  </section>
</template>

<script>
import { mapState } from 'pinia'
import { useMorelStore } from '../game/store.js'

export default {
  props: {
    type: { type: String, default: 'light' }
  },

  data() {
    return { copied: false }
  },

  computed: {
    ...mapState(useMorelStore, {
      share_url: state => `${window.location.origin}/${state.slug}`,
      locked: state => state.locked,
      lock_loading: state => state.lock_loading,
      master: state => state.master
    }),
    lock_tooltip() {
      const $t = this.$t.bind(this)
      if (this.master) {
        return this.locked ? $t('Unlock the game') : $t('Lock the game')
      } else {
        return this.locked ? $t('Game locked') : $t('Game unlocked')
      }
    }
  },

  methods: {
    copy_url() {
      const share_url_field = document.getElementById('share-url-field')
      share_url_field.select()
      try {
        if (document.execCommand('copy')) {
          this.copied = true
          setTimeout(() => { this.copied = false }, 1600)
        }
      } catch (e) {
        console.error('Unable to copy game URL', e)
      }
      share_url_field.blur()
    },
    toggle_lock() {
      if (this.master) {
        useMorelStore().lock_game(!this.locked)
      }
    }
  }
}
</script>

<style lang="sass">
@import "bulma/sass/utilities/_all"

.share-game
  +mobile
    margin: 0 1rem 1.5rem

  header
    display: flex
    align-items: center

    h3
      flex: 4
      position: relative
      left: 1px
      font-weight: bold
      margin: 1rem 0 .4rem

    span.o-tooltip
      button.button
        position: relative
        top: 5px
        font-size: .9em
        color: $grey

        &, &:hover, &:active, &:focus
          background: none
          border: none
          box-shadow: none

        &:hover, &:active, &:focus
          color: $grey-dark

        span.icon
          transform: scale(-1, 1)

      &.is-static button.button
        cursor: default

  .field.is-grouped
    position: relative
    margin-bottom: .4em
    align-items: center

    input
      border-color: $grey-light
      border-radius: 4px
      font-size: 0.9rem

      +mobile
        font-size: 0.95rem

    .control:not(.copy-button)
      position: absolute
      margin-left: -999999px

    .control.copy-button
      &, & .o-tooltip
        width: 100%

  .share-invite
    position: relative
    left: 1px
    font-size: .9em
    color: $grey-dark !important
</style>
