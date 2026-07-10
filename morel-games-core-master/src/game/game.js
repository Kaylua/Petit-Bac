/**
 * This class handles communication from/to the game server.
 *
 * To handle incoming message, create a method named `message_in_` then the
 * message's action, replacing dashes by underscores.
 */
export const MorelClient = class {
  constructor(ws_url, protocol) {
    this.ws_url = ws_url
    this.protocol = protocol || 'morel-protocol'

    this.runtime_server_identifier = null

    this.client = null
    this.client_uuid = null
    this.secret = null

    this.kicked = false

    // Pinia store reference set via set_store()
    this.store = null
  }

  set_store(morelStore) {
    this.store = morelStore
  }

  set_uuid_and_secret(uuid, secret) {
    this.client_uuid = uuid
    this.secret = secret
    this.store.set_uuid(uuid)
    this.persist_credentials()
  }

  persist_credentials() {
    sessionStorage.setItem(
      'morel-credentials',
      JSON.stringify({ uuid: this.client_uuid, secret: this.secret })
    )
  }

  delete_persisted_credentials() {
    sessionStorage.removeItem('morel-credentials')
  }

  load_persisted_credentials() {
    let credentials = sessionStorage.getItem('morel-credentials') || ''
    try {
      credentials = JSON.parse(credentials)
    } catch {
      return
    }
    if (!credentials.uuid || !credentials.secret) return
    this.set_uuid_and_secret(credentials.uuid, credentials.secret)
  }

  connect() {
    this.load_persisted_credentials()
    this.kicked = false

    return new Promise((resolve, reject) => {
      this.client = new WebSocket(this.ws_url, this.protocol)

      this.client.onerror = error => {
        console.error('WS initial connection error.')
        reject(error)
      }

      this.client.onopen = () => {
        resolve()
      }

      this.client.onclose = () => {
        this.client.close()
        if (!this.kicked) {
          this.store.disconnected_from_socket()
          setTimeout(() => this.reconnect(), 2000)
        }
      }

      this.client.onmessage = message => {
        if (typeof message.data !== 'string') {
          console.warn('Ignored non-string message received through websocket.', message)
          return
        }

        let data = null
        try {
          data = JSON.parse(message.data)
        } catch (error) {
          return
        }

        if (!data.action) return

        this.handle_message(data.action, data)
      }
    })
  }

  reconnect() {
    return this.connect()
      .then(() => this.join_game())
      .then(() => {
        this.store.reconnect_to_socket()
        this.store.clear_players()
      })
  }

  send_message(action, message) {
    return new Promise((resolve, reject) => {
      if (this.client.readyState == this.client.OPEN) {
        message = message || {}
        message.action = action
        message.uuid = this.client_uuid
        message.secret = this.secret
        message.slug = this.store.slug

        this.client.send(JSON.stringify(message))
        resolve()
      } else {
        reject('disconnected')
      }
    })
  }

  handle_message(action, message) {
    const method_name = 'message_in_' + action.replace(/\-/g, '_').trim().toLowerCase()
    if (typeof this[method_name] === 'function') {
      this[method_name](message)
    }
  }

  message_in_set_server_runtime_identifier({ runtime_identifier }) {
    if (!this.runtime_server_identifier) {
      this.runtime_server_identifier = runtime_identifier
    } else if (this.runtime_server_identifier !== runtime_identifier) {
      this.store.reload_required()
      this.delete_persisted_credentials()
      setTimeout(() => document.location.reload(), 10000)
    }
  }

  message_in_set_uuid({ uuid, secret }) {
    this.set_uuid_and_secret(uuid, secret)
  }

  message_in_kick({ locked }) {
    this.store.set_kick_reason(locked ? 'locked' : 'kicked')
    this.store.set_phase('PSEUDONYM')
    this.kicked = true
  }

  message_in_game_ended_by_master() {
    this.store.set_kick_reason('ended')
    this.store.set_phase('PSEUDONYM')
    this.kicked = true
  }

  message_in_set_slug({ slug }) {
    this.store.action_set_slug(slug)
  }

  message_in_set_master({ master }) {
    this.store.update_master(master.uuid)
  }

  message_in_player_join({ player }) {
    player.ourself = this.client_uuid === player.uuid
    this.store.player_join(player)
  }

  message_in_player_left({ player }) {
    this.store.player_left(player.uuid)
  }

  message_in_config_updated({ configuration }) {
    this.store.update_configuration(configuration)
  }

  message_in_game_locked({ locked }) {
    this.store.set_lock(!!locked)
    this.store.set_lock_loading(false)
  }

  message_in_player_ready({ player, ready }) {
    this.store.change_player_readyness({
      uuid: player.uuid,
      ready: ready === undefined || ready === null ? true : !!ready
    })
  }

  join_game() {
    return this.send_message('join-game', {
      pseudonym: this.store.pseudonym
    })
  }

  send_config_update() {
    return this.send_message('update-config', {
      configuration: this.store.configuration
    })
  }

  lock_game(locked) {
    return this.send_message('lock-game', { locked })
  }

  switch_master(new_master_uuid) {
    return this.send_message('switch-master', {
      master: { uuid: new_master_uuid }
    })
  }

  kick_player(player_uuid) {
    return this.send_message('kick-player', {
      kick: { uuid: player_uuid }
    })
  }

  leave_game() {
    return this.send_message('leave-game', {})
  }

  end_game() {
    return this.send_message('end-game', {})
  }
}
