import { defineStore } from 'pinia'

// Module-level references set by initMorelStore()
let _client = null
let _morel_i18n = null
let _t = message => message

export function initMorelStore(client, morel_i18n) {
  _client = client
  _morel_i18n = morel_i18n
  _t = morel_i18n
    ? morel_i18n.i18n.global.t.bind(morel_i18n.i18n.global)
    : message => message
}

export const useMorelStore = defineStore('morel', {
  state: () => ({
    slug: null,
    phase: 'PSEUDONYM',
    uuid: null,
    pseudonym: null,
    master: false,
    players: {},
    configuration: {},
    locked: false,
    lock_loading: false,
    kick_reason: null,
    loading: false,
    loading_reason: { title: null, description: null },
    error: { title: null, description: null },
    locales: {},
    locale_loading: false,
    notifications: []
  }),

  getters: {
    players_count: (state) => Object.keys(state.players).length,
    players_list: (state) => Object.values(state.players),
    players_list_sorted: (state) =>
      Object.values(state.players).sort((a, b) =>
        a.pseudonym.toLowerCase().localeCompare(b.pseudonym.toLowerCase())
      ),
    players_list_online: (state) =>
      Object.values(state.players).filter(player => player.online),
    players_count_online: (state) =>
      Object.values(state.players).filter(player => player.online).length,
    error_obj: (state) => (state.error && state.error.title ? state.error : null)
  },

  actions: {
    // --- State setters (replace Vuex mutations) ---
    set_slug(slug) { this.slug = slug },
    set_phase(phase) { this.phase = phase },
    set_uuid(uuid) { this.uuid = uuid },
    set_pseudonym(pseudonym) { this.pseudonym = pseudonym },
    set_master(is_master) { this.master = is_master },
    set_kick_reason(reason) { this.kick_reason = reason },
    update_configuration(config) { this.configuration = config },
    set_lock(locked) { this.locked = locked },
    set_lock_loading(locking) { this.lock_loading = locking },
    set_locales(locales) { this.locales = locales },
    set_locale_loading(loading) { this.locale_loading = loading },

    set_master_player(master_uuid) {
      Object.keys(this.players).forEach(uuid => {
        this.players[uuid].master = (uuid === master_uuid)
      })
    },

    add_player(player) {
      this.players[player.uuid] = player
    },

    remove_player(uuid) {
      delete this.players[uuid]
    },

    clear_players() {
      this.players = {}
    },

    clear_offline_players() {
      Object.values(this.players)
        .filter(player => !player.online)
        .map(player => player.uuid)
        .forEach(uuid => { delete this.players[uuid] })
    },

    change_player_online_status({ uuid, online }) {
      if (this.players[uuid]) this.players[uuid].online = online
    },

    change_player_pseudonym({ uuid, pseudonym }) {
      if (this.players[uuid]) this.players[uuid].pseudonym = pseudonym
    },

    change_player_readyness({ uuid, ready }) {
      if (this.players[uuid]) this.players[uuid].ready = ready
    },

    set_loading(loading) {
      this.loading = !!loading
      this.loading_reason = {
        title: typeof loading === 'string' ? loading : (loading && loading.title) || null,
        description: (loading && loading.description) || null
      }
    },

    set_error(error) {
      if (!error) {
        this.error = { title: null, description: null }
      } else {
        this.error = {
          title: typeof error === 'string' ? error : (error.title || null),
          description: error.description || null
        }
      }
    },

    // --- Notification queue (replaces Buefy Snackbar) ---
    add_notification(message, variant = '') {
      const id = Date.now() + Math.random()
      this.notifications.push({ id, message, variant })
      setTimeout(() => { this.remove_notification(id) }, 4000)
    },

    remove_notification(id) {
      this.notifications = this.notifications.filter(n => n.id !== id)
    },

    // --- Business actions (replace Vuex actions) ---
    async set_pseudonym_and_connect(pseudonym) {
      this.set_pseudonym(pseudonym)
      this.set_loading(_t('Connecting…'))
      this.set_kick_reason(null)

      try {
        await _client.connect()
        await _client.join_game()
        this.set_loading(false)
        this.set_phase('CONFIG')
      } catch (error) {
        console.error('Unable to connect to websocket server.', error)
        this.set_loading(false)
        this.add_notification(_t('Unable to connect to the game.'), 'danger')
      }
    },

    action_set_slug(slug) {
      const slug_changed = slug !== this.slug

      if (this.slug && slug_changed && this.phase === 'CONFIG') {
        this.add_notification(
          _t('You asked to join non-existant game. We created a new one for you.'),
          ''
        )
      }

      this.set_slug(slug)

      if (slug_changed) {
        window.history.pushState(null, '', `/${slug}`)
      }
    },

    player_join(player) {
      const state_player = this.players[player.uuid]
      if (!state_player) {
        this.add_player(player)
        this.change_player_readyness({ uuid: player.uuid, ready: true })
      } else {
        this.change_player_online_status({ uuid: player.uuid, online: true })
        this.change_player_pseudonym({ uuid: player.uuid, pseudonym: player.pseudonym })
      }

      if (player.ourself) {
        this.set_master(player.master)
      }

      if (this.phase !== 'CONFIG' && !player.ourself) {
        this.add_notification(
          _t('{name} joined the game', { name: player.pseudonym }),
          ''
        )
      }
    },

    player_left(uuid) {
      const player = this.players[uuid]
      if (!player) return

      this.add_notification(
        _t('{name} left the game', { name: player.pseudonym }),
        ''
      )

      if (this.phase === 'CONFIG') {
        this.remove_player(uuid)
      } else {
        this.change_player_online_status({ uuid, online: false })
      }
    },

    update_master(master_uuid) {
      this.set_master_player(master_uuid)
      this.set_master(this.uuid === master_uuid)

      if (this.master) {
        this.add_notification(_t('You are now the Game Master'), '')
      }
    },

    switch_master(new_master_uuid) {
      if (!this.master) return
      _client.switch_master(new_master_uuid)
    },

    kick_player(player_uuid) {
      if (!this.master) return
      _client.kick_player(player_uuid)
    },

    update_game_configuration(configuration) {
      this.update_configuration(configuration)
      _client.send_config_update()
    },

    lock_game(locked) {
      if (this.master) {
        this.set_lock_loading(true)
        _client.lock_game(locked)
      }
    },

    set_all_readyness(players_uuids_ready) {
      players_uuids_ready.forEach(uuid =>
        this.change_player_readyness({ uuid, ready: true })
      )
    },

    reset_all_readyness() {
      Object.keys(this.players).forEach(uuid =>
        this.change_player_readyness({ uuid, ready: false })
      )
    },

    disconnected_from_socket() {
      if (!this.loading) {
        this.set_loading({
          title: _t('Reconnecting…'),
          description:
            _t("The connection was lost, but we're trying to fix this problem.") +
            '<br />' +
            _t("<strong>If it doesn't work after a few seconds, try to reload the page</strong>—you won't lose your progress in the game.")
        })
      }
    },

    reconnect_to_socket() {
      this.set_loading(false)
    },

    reload_required() {
      this.set_error({
        title: _t('Connection lost.'),
        description:
          '<strong>' + _t('Reload the page to continue.') + '</strong><br />' +
          _t("The game server was restarted, or you stayed inactive (way) too long. The page will reload automatically in ten seconds.")
      })
    },

    set_locale(locale) {
      this.set_locale_loading(true)
      if (_morel_i18n) {
        _morel_i18n.load_locale(locale).then(() => this.set_locale_loading(false))
      }
    },

    leave_game() {
      if (_client && _client.client) {
        _client.kicked = true
        _client.client_uuid = null
        _client.secret = null
        _client.runtime_server_identifier = null
        _client.delete_persisted_credentials()
        _client.client.close()
      }
      this.phase = 'PSEUDONYM'
      this.slug = null
      this.uuid = null
      this.pseudonym = null
      this.master = false
      this.players = {}
      this.configuration = {}
      this.locked = false
      this.lock_loading = false
      this.kick_reason = null
      this.loading = false
      this.loading_reason = { title: null, description: null }
      this.error = { title: null, description: null }
      this.notifications = []
      window.history.pushState(null, '', '/')
    }
  }
})
