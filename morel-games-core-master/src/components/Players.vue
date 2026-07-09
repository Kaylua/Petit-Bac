<template>
  <nav class="panel morel-players-list">
    <div class="panel-block" v-for="(player, i) in sorted_players" :key="i">
      <span class="panel-icon">
        <slot name="icon" v-bind:player="player">
          <o-icon pack="fas" icon="user-slash" size="small" v-if="!player.online" key="offline"></o-icon>
          <o-icon pack="fas" icon="check" size="small" v-else-if="player.ready" key="ready"></o-icon>
          <o-icon pack="fas" icon="hourglass-half" size="small" v-else key="not-ready"></o-icon>
        </slot>
      </span>

      <div class="panel-block-main">
        <slot name="label" v-bind:player="player">
          <span :class="{ 'is-offline': !player.online }">{{ player.pseudonym }}</span>
          <span class="is-size-7 ourself-mark" v-if="player.ourself">{{ $t('(you)') }}</span>
        </slot>
      </div>

      <slot name="actions" v-bind:player="player" />

      <template v-if="defaultIcons">
        <morel-player-action
          :label="$t('Kick this player')"
          icon="user-slash"
          v-if="we_are_master && !player.master && player.online"
          @click="kick_player(player.uuid)"
        />
        <morel-player-action
          :label="player.master ? $t('Game Master') : $t('Promote as Game Master')"
          icon="user-shield"
          :permanent="player.master"
          v-if="player.master || (we_are_master && player.online)"
          @click="switch_master(player.uuid)"
        />
      </template>
    </div>
  </nav>
</template>

<script>
import { mapState } from 'pinia'
import { useMorelStore } from '../game/store.js'
import PlayerAction from './PlayerAction.vue'

export default {
  props: {
    'default-icons': { type: Boolean, default: true },
    'kick-confirm-title': { type: String, default: '' },
    'kick-confirm-message': { type: String, default: '' },
    'kick-confirm-help': { type: String, default: '' },
    'kick-confirm-button-yes': { type: String, default: '' },
    'kick-confirm-button-no': { type: String, default: '' },
    'master-confirm-title': { type: String, default: '' },
    'master-confirm-message': { type: String, default: '' },
    'master-confirm-help': { type: String, default: '' },
    'master-confirm-button-yes': { type: String, default: '' },
    'master-confirm-button-no': { type: String, default: '' }
  },

  computed: {
    ...mapState(useMorelStore, {
      players: state => state.players,
      we_are_master: state => state.master,
      our_uuid: state => state.uuid,
      locked: state => state.locked,
      sorted_players: state =>
        Object.values(state.players).sort((a, b) =>
          a.pseudonym.toLowerCase().localeCompare(b.pseudonym.toLowerCase())
        ),
      players_count: state => Object.keys(state.players).length
    })
  },

  methods: {
    replace_name(text, def, name) {
      return (text != null ? (text || def) : '').replace(/{name}/g, name)
    },

    switch_master(uuid) {
      if (!this.we_are_master || uuid === this.our_uuid) return
      const player = this.players[uuid]
      if (!player || !player.online) return

      const $t = this.$t.bind(this)
      const message = this.replace_name(
        this.masterConfirmMessage,
        $t("<strong>{name}</strong> will be able to manage the game and its configuration. You'll lose those powers."),
        player.pseudonym
      )
      const help = this.replace_name(
        this.masterConfirmHelp,
        $t("The game master cannot cheat, only manage the game. It can also kick players and lock the game."),
        player.pseudonym
      )
      const title = this.replace_name(
        this.masterConfirmTitle,
        $t('Promote {name}?'),
        player.pseudonym
      )
      const confirmText = this.replace_name(
        this.masterConfirmButtonYes,
        $t('Promote'),
        player.pseudonym
      )

      if (window.confirm(`${title}\n\n${message.replace(/<[^>]+>/g, '')}\n${help.replace(/<[^>]+>/g, '')}\n\n${confirmText} / ${this.replace_name(this.masterConfirmButtonNo, $t('Stay Game Master'), player.pseudonym)}`)) {
        useMorelStore().switch_master(uuid)
      }
    },

    kick_player(uuid) {
      if (!this.we_are_master || uuid === this.our_uuid) return
      const player = this.players[uuid]
      if (!player || !player.online) return

      const $t = this.$t.bind(this)
      const title = this.replace_name(
        this.kickConfirmTitle,
        $t('Kick {name}?'),
        player.pseudonym
      )
      const message = this.replace_name(
        this.kickConfirmMessage,
        this.locked
          ? $t('<strong>{name}</strong> will be unable to join as long as the game is locked.')
          : $t('<strong>{name}</strong> will left the game, but will be able to re-join as the game is not locked.'),
        player.pseudonym
      )

      if (window.confirm(`${title}\n\n${message.replace(/<[^>]+>/g, '')}`)) {
        useMorelStore().kick_player(uuid)
      }
    }
  },

  components: {
    'morel-player-action': PlayerAction
  }
}
</script>

<style lang="sass">
@import "bulma/sass/utilities/_all"

.panel.morel-players-list
  // border-radius hérite de $radius via Bulma (8px avec le thème été)

  +mobile
    margin-left: 1rem
    margin-right: 1rem

  .panel-block
    align-items: center
    min-height: 44px

    &:first-child
      border-top-left-radius: $radius
      border-top-right-radius: $radius

    &:last-child
      border-bottom-left-radius: $radius
      border-bottom-right-radius: $radius

    .panel-icon, .panel-icon-right
      display: inline-block
      position: relative
      top: -2px
      width: 1em
      height: 1em

    .panel-block-main
      flex: 2

    .ourself-mark
      display: inline-block
      margin-left: .4em
      padding-top: .3em

    .is-master
      font-weight: bold

    .is-offline
      font-style: italic

    &:hover .morel-player-action-icon
      display: block
</style>
