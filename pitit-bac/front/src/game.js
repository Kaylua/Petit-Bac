import { MorelClient } from 'morel-games-core'

export default class GameClient extends MorelClient {
  set_game_store(gameStore) {
    this.game_store = gameStore
  }

  message_in_categories_by_everyone({ enabled }) {
    this.game_store.set_categories_by_everyone({ enabled, from_server: true })
  }

  message_in_catch_up_game_state(message) {
    this.game_store.catch_up(message)
  }

  message_in_round_starts_soon({ countdown }) {
    this.game_store.next_round_soon(countdown)
  }

  message_in_round_started({ round, letter }) {
    this.game_store.action_next_round({ round, letter })
  }

  message_in_round_ended() {
    this.game_store.end_round_and_send_answers()
  }

  message_in_vote_started({ answers, interrupted }) {
    this.game_store.start_vote({ answers, interrupted_by: interrupted })
  }

  message_in_vote_changed({ voter, vote }) {
    this.game_store.update_vote({ voter, vote })
  }

  message_in_game_ended({ scores }) {
    this.game_store.end_game({ scores })
  }

  message_in_game_restarted() {
    this.game_store.restart_game()
  }

  set_categories_by_everyone(categories_by_everyone) {
    return this.send_message('change-categories-by-everyone', {
      enabled: categories_by_everyone
    })
  }

  ask_start_game() {
    return this.send_message('start-game', {})
  }

  send_answers() {
    return this.send_message('send-answers', {
      answers: this.game_store.current_round.answers
    })
  }

  send_vote(author_uuid, category, vote) {
    return this.send_message('send-vote', {
      vote: { uuid: author_uuid, category, vote }
    })
  }

  send_vote_ready() {
    return this.send_message('vote-ready', {})
  }

  restart_game() {
    return this.send_message('restart', {})
  }
}
