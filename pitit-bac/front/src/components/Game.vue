<template>
  <section class="columns game-answers">
    <div class="column is-9 answers-column">
      <o-notification :active="true" :closable="false" class="answers-intro">
        <SummerDecor variant="icon" motif="sun" />
        <i18n-t keypath="Fill all categories with words or phrases beginning with the letter {letter}, then submit your answers using the finish button." tag="span">
          <template #letter><strong>{{ letter }}</strong></template>
        </i18n-t>
        <span v-if="stop_on_first_completion">
          {{ $t('The first player to finish interrupts all the others!') }}
        </span>
      </o-notification>

      <div class="answers-form">
        <o-field
          v-for="(category, i) in categories"
          :key="i"
          :label="category"
          :variant="!is_category_valid(category) ? 'danger' : ''"
          :message="!is_category_valid(category) ? $t('You must enter a word or phrase beginning with the letter {letter}.', { letter }) : ''"
        >
          <o-input
            :placeholder="letter + '…'"
            size="medium"
            :autofocus="i == 0"
            v-model="answers[category]"
            @update:modelValue="answers_updated"
            :disabled="end_signal_received"
          ></o-input>
        </o-field>
      </div>
    </div>

    <div class="column is-3 time-and-button-column">
      <div class="box inner-time-and-button">
        <h3>{{ round_label }}</h3>
        <CircularProgress :value="percent_time" :label="letter"></CircularProgress>
        <div class="field">
          <o-tooltip
            :multiline="!we_finished"
            :label="finish_button_label"
            variant="dark"
            position="auto"
            teleport
          >
            <o-button
              variant="primary"
              size="medium"
              expanded
              :disabled="we_finished || end_signal_received || !all_fields_completed"
              @click.once="round_finished"
            >
              <template v-if="!we_finished">{{ $t('I finished!') }}</template>
              <template v-else>{{ $t('Please wait…') }}</template>
            </o-button>
          </o-tooltip>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { is_answer_valid } from 'ptitbac-commons'
import { mapState } from 'pinia'
import { useMorelStore } from 'morel-games-core'
import { useGameStore } from '../store.js'
import CircularProgress from './CircularProgress.vue'
import SummerDecor from './SummerDecor.vue'

export default {
  components: { CircularProgress, SummerDecor },

  data() {
    return {
      interval_id: null,
      answers: {},
      we_finished: false
    }
  },

  computed: {
    ...mapState(useMorelStore, {
      slug: state => state.slug,
      total_rounds: state => state.configuration.turns,
      stop_on_first_completion: state => state.configuration.stopOnFirstCompletion,
      categories: state => state.configuration.categories,
      total_time: state => state.configuration.time
    }),
    ...mapState(useGameStore, {
      current_round: state => state.current_round,
      letter: state => state.current_round.letter,
      time_left: state => state.current_round.time_left,
      end_signal_received: state => state.current_round.ended
    }),

    is_time_infinite() { return useGameStore().is_time_infinite },

    percent_time() {
      return this.is_time_infinite
        ? 100
        : 100 - Math.floor((this.time_left / this.total_time) * 100)
    },

    round_label() {
      const $t = this.$t.bind(this)
      const labels = {
        1: $t('First round'), 2: $t('Second round'), 3: $t('Third round'),
        4: $t('Fourth round'), 5: $t('Fifth round'), 6: $t('Sixth round'),
        7: $t('Seventh round'), 8: $t('Eighth round'), 9: $t('Ninth round'),
        10: $t('Tenth round'), 11: $t('Eleventh round'), 12: $t('Twelfth round'),
        13: $t('Thirteenth round'), 14: $t('Fourteenth round'), 15: $t('Fifteenth round'),
        16: $t('Sixteenth round'), 17: $t('Seventeenth round'), 18: $t('Eighteenth round'),
        19: $t('Nineteenth round'), 20: $t('Twentieth round'), 21: $t('Twenty-first round')
      }
      return labels[this.current_round.round] || $t('{n}th round', { n: this.current_round.round })
    },

    finish_button_label() {
      const $t = this.$t.bind(this)
      if (this.we_finished) return $t('Wait for the others…')
      else if (!this.all_fields_completed) return $t('Fill in all categories correctly before submitting')
      else if (this.stop_on_first_completion) return $t('Click here to submit your answers and interrupt all other players!')
      else return $t("Click here to submit your answers, and let other players know you're done. You'll still be able to change your answers before the time's up, or as long as not everyone finished.")
    },

    valid_answers() {
      return Object.values(this.answers).filter(answer => is_answer_valid(this.letter, answer))
    },
    all_fields_completed() {
      return this.valid_answers.length == this.categories.length
    }
  },

  mounted() {
    const gameStore = useGameStore()

    try {
      const stored_answers = JSON.parse(sessionStorage.getItem('pb-round-answers') || '')
      if (
        stored_answers.game === this.slug &&
        stored_answers.letter === this.letter &&
        stored_answers.round === this.current_round.round &&
        (new Date().getTime() - stored_answers.time) / 1000 < 600
      ) {
        this.answers = stored_answers.answers
        gameStore.update_round_answers(this.answers)
      }
    } catch {} // eslint-disable-line no-empty

    if (!this.is_time_infinite) {
      if (this.time_left === -1) {
        gameStore.update_time_left(this.total_time)
      }
      this.interval_id = setInterval(() => {
        gameStore.update_time_left(this.time_left - 1)
        if (this.time_left == 0) {
          clearInterval(this.interval_id)
          gameStore.update_time_left(-1)
        }
      }, 1000)
    }
  },

  beforeUnmount() {
    clearInterval(this.interval_id)
    useGameStore().update_time_left(-1)
  },

  methods: {
    answers_updated() {
      const gameStore = useGameStore()
      gameStore.update_round_answers(this.answers)
      sessionStorage.setItem('pb-round-answers', JSON.stringify({
        game: this.slug,
        round: this.current_round.round,
        letter: this.letter,
        time: new Date().getTime(),
        answers: this.answers
      }))
    },

    round_finished() {
      this.we_finished = true
      this.answers_updated()
      useGameStore().round_finished()
    },

    is_category_valid(category) {
      const answer = this.answers[category]
      if (!answer) return true
      return is_answer_valid(this.letter, answer)
    }
  }
}
</script>

<style lang="sass">
@import "bulma/sass/utilities/mixins"
@import "../assets/variables"

.answers-column
  .answers-intro
    display: flex
    align-items: flex-start

    .summer-icon
      color: $primary
      flex-shrink: 0
      margin-top: 0.15em

  .field
    &:not(:first-child)
      margin-top: 1.4em

    .label
      text-align: left
      font-weight: 600
      color: #3A1E00

  .answers-form
    +mobile
      margin: 0 1rem

.column.time-and-button-column
  display: flex
  flex-direction: column
  align-items: center

  // Timer remonte avant le formulaire sur mobile
  +mobile
    order: -1

  .inner-time-and-button
    display: flex
    flex-direction: column
    align-items: center
    position: fixed
    background: var(--card-bg, rgba(255, 253, 249, 0.97))
    border: 1px solid var(--card-border, rgba(240, 175, 100, 0.22))
    box-shadow: var(--card-shadow, 0 6px 28px rgba(150, 45, 0, 0.10))
    border-radius: 20px
    padding: 1.5rem 1.2rem

    h3
      font-size: 1em
      font-variant: all-small-caps
      letter-spacing: .12em
      color: $primary-dark
      font-weight: 600
      margin-bottom: 0

    .circular-progress
      margin-top: 1.6rem
      margin-bottom: 1.8rem

    .field
      width: 100%

      // Le wrapper o-tooltip rend en `.tooltip`, en `inline-flex` par défaut
      // (ne s'étire pas tout seul), sans ce fix le bouton `expanded` à
      // l'intérieur reste centré sur sa largeur de contenu.
      .tooltip
        display: inline-block
        width: 100%

      button
        cursor: pointer

    // Sur mobile : grille compacte, progress à gauche, label + bouton à droite
    +mobile
      position: unset
      width: 100%
      display: grid
      grid-template-areas: "progress info" "progress button"
      grid-template-columns: auto 1fr
      column-gap: 1rem
      row-gap: 0.5rem
      padding: 1rem
      border-radius: 0
      box-shadow: 0 2px 12px rgba(150, 45, 0, 0.08)

      h3
        grid-area: info
        font-size: 1em
        align-self: end
        margin: 0

      .circular-progress
        grid-area: progress
        font-size: 5em
        margin: 0

      .field
        grid-area: button
        align-self: start

// Notification d'instruction en haut du formulaire
.game-answers .notification
  font-size: 0.95em
</style>
