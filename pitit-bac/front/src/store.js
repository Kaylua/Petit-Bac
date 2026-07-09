import { defineStore } from 'pinia'
import { useMorelStore } from 'morel-games-core'

// Module-level client reference set by initGameStore()
let _client = null

export function initGameStore(client) {
  _client = client
}

export const useGameStore = defineStore('game', {
  state: () => ({
    current_round: {
      round: 0,
      letter: '',
      time_left: -1,
      ended: false,
      answers: {},
      votes: {},
      interrupted_by: null,
      countdown_task: null
    },
    scores: [],
    infinite_duration: 600,
    categories_by_everyone: false,
    search_engines: {
      Google: 'http://www.google.com/search?q={s}',
      Qwant: 'https://qwant.com/?q={s}&t=web'
    },
    sticky_players_list: false
  }),

  getters: {
    is_time_infinite: (state) => {
      const morel = useMorelStore()
      return morel.configuration.time === state.infinite_duration
    }
  },

  actions: {
    set_sticky_players_list(fixed) {
      this.sticky_players_list = fixed
    },

    set_categories_by_everyone({ enabled, from_server }) {
      this.categories_by_everyone = enabled
      if (!from_server) {
        _client.set_categories_by_everyone(enabled)
      }
    },

    set_countdown_task(task) {
      this.current_round.countdown_task = task
    },

    next_round(round_config) {
      this.current_round.round = round_config.round
      this.current_round.letter = round_config.letter
      this.current_round.ended = false
      this.current_round.answers = {}
      this.current_round.votes = {}
      this.current_round.interrupted_by = null
    },

    update_round_answers(answers) {
      this.current_round.answers = answers
    },

    update_time_left(time_left) {
      this.current_round.time_left = time_left
    },

    round_ended() {
      this.current_round.ended = true
    },

    set_interrupted_by(interrupted_by) {
      this.current_round.interrupted_by = interrupted_by
    },

    set_round_votes(votes) {
      this.current_round.votes = votes
    },

    set_round_vote(vote_update) {
      const { vote, voter } = vote_update
      this.current_round.votes[vote.category][vote.uuid].votes[voter.uuid] = vote.vote
    },

    set_scores(scores) {
      this.scores = scores
    },

    reset_state_for_restart() {
      this.current_round = {
        round: 0,
        letter: '',
        time_left: -1,
        ended: false,
        answers: {},
        votes: {},
        interrupted_by: null,
        countdown_task: null
      }
      this.scores = []
    },

    // --- Business actions ---
    ask_start_game() {
      _client.ask_start_game()
    },

    round_finished() {
      _client.send_answers()
    },

    end_round_and_send_answers() {
      this.round_ended()
      const morel = useMorelStore()
      morel.set_loading(morel.configuration ? 'Collecting answers from all players…' : true)
      _client.send_answers()
    },

    vote_ready() {
      _client.send_vote_ready()
    },

    ask_restart_game() {
      _client.restart_game()
    },

    next_round_soon(countdown) {
      const morel = useMorelStore()

      const set_countdown = n => {
        morel.set_loading({
          title: n > 0 ? n.toString() : 'Starting soon…',
          description: 'Brace yourself, the next round starts in a few seconds…'
        })
      }

      set_countdown(countdown)

      const task = setInterval(() => {
        set_countdown(--countdown)
        if (countdown <= 0) {
          clearTimeout(task)
          this.set_countdown_task(null)
        }
      }, 1000)

      this.set_countdown_task(task)
    },

    action_next_round(round_config) {
      if (this.current_round.countdown_task) {
        clearTimeout(this.current_round.countdown_task)
        this.set_countdown_task(null)
      }

      const morel = useMorelStore()
      morel.set_loading(false)
      this.next_round(round_config)
      morel.set_phase('ROUND_ANSWERS')
      morel.reset_all_readyness()
    },

    start_vote({ answers, interrupted_by }) {
      const morel = useMorelStore()
      morel.set_phase('ROUND_VOTES')
      morel.set_loading(false)
      this.set_round_votes(answers)
      morel.reset_all_readyness()

      if (interrupted_by) {
        this.set_interrupted_by(interrupted_by)
      }
    },

    send_vote_update(vote_update) {
      this.set_round_vote(vote_update)
      _client.send_vote(
        vote_update.vote.uuid,
        vote_update.vote.category,
        vote_update.vote.vote
      )
    },

    update_vote(vote_update) {
      this.set_round_vote(vote_update)
    },

    end_game({ scores }) {
      this.set_scores(scores)
      useMorelStore().set_phase('END')
    },

    restart_game() {
      this.reset_state_for_restart()
      const morel = useMorelStore()
      morel.clear_offline_players()
      morel.set_phase('CONFIG')
      sessionStorage.removeItem('pb-round-answers')
    },

    catch_up(catch_up) {
      const morel = useMorelStore()
      switch (catch_up.state) {
        case 'ROUND_ANSWERS_COUNTDOWN':
          this.next_round_soon(catch_up.countdown)
          break

        case 'ROUND_ANSWERS':
          this.action_next_round({ round: catch_up.round.round, letter: catch_up.round.letter })
          morel.set_all_readyness(catch_up.round.players_ready)
          if (catch_up.round.time_left) {
            this.update_time_left(catch_up.round.time_left)
          }
          break

        case 'ROUND_VOTES':
          this.start_vote({
            answers: catch_up.vote.answers,
            interrupted_by: catch_up.vote.interrupted
          })
          morel.set_all_readyness(catch_up.vote.players_ready)
          break

        case 'END':
          this.end_game({ scores: catch_up.end.scores })
          break
      }
    }
  }
})
