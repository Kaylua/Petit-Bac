<template>
  <section class="end-screen">
    <section class="hero is-medium is-primary is-bold is-winners-frame">
      <div class="hero-body">
        <div class="container">
          <div class="title winner first-winner">
            <o-icon icon="award"></o-icon>
            <p class="winner-names">{{ firsts }}</p>
            <p class="rank">
              <span>{{ $tc("Winner | Winners", firsts_count) }} · {{ firsts_points }}</span>
            </p>
          </div>
          <div class="subtitle second-and-third-winners" v-if="seconds_count > 0 || thirds_count > 0">
            <div class="columns">
              <div class="column is-4 winer second-winner" :class="{ 'is-offset-4': thirds_count === 0 }">
                <article class="winner second-winner" v-if="seconds_count > 0">
                  <p class="winner-names">{{ seconds }}</p>
                  <p class="rank">
                    <span>{{ $tc("Runner-up | Runners-up", seconds_count) }} · {{ seconds_points }}</span>
                  </p>
                </article>
              </div>
              <div class="column is-4 is-offset-4 winner third-winner">
                <article class="winner third-winner" v-if="thirds_count > 0">
                  <p class="winner-names">{{ thirds }}</p>
                  <p class="rank">
                    <span>{{ $tc("Third | Third", thirds_count) }} · {{ thirds_points }}</span>
                  </p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <o-notification :active="master" :closable="false" class="restart-game-banner">
      <div class="columns restart-game-columns">
        <div class="column is-9">
          <p class="content">
            <strong>{{ $t("Another game?") }}</strong><br />
            {{ $t("Click on this button to go back to the configuration screen with all players, and play again.") }}
          </p>
        </div>
        <div class="column is-3">
          <div class="field">
            <o-button v-t="'New game'" variant="primary" size="medium" expanded @click.once="restart_game" />
          </div>
        </div>
      </div>
    </o-notification>

    <article class="box all-scores">
      <div class="level is-mobile" v-for="(score, i) in scores" :key="i">
        <div class="level-left">
          <div class="columns is-rank-and-pseudonym is-mobile">
            <div class="column is-3 is-rank">
              <i18n-t v-if="score.rank === 1" keypath="1{st}">
                <template #st><sup>{{ $t("st") }}</sup></template>
              </i18n-t>
              <i18n-t v-else-if="score.rank === 2" keypath="2{nd}">
                <template #nd><sup>{{ $t("nd") }}</sup></template>
              </i18n-t>
              <i18n-t v-else-if="score.rank === 3" keypath="3{rd}">
                <template #rd><sup>{{ $t("rd") }}</sup></template>
              </i18n-t>
              <i18n-t v-else keypath="{n}{th}">
                <template #n>{{ score.rank }}</template>
                <template #th><sup>{{ $t("th") }}</sup></template>
              </i18n-t>
            </div>
            <div class="column is-9 is-pseudonym">
              {{ players[score.uuid].pseudonym }}
            </div>
          </div>
        </div>
        <div class="level-right">
          <p
            class="is-score"
            v-html="$tc('<span>{n}</span> point | <span>{n}</span> points', score.score)"
          />
        </div>
      </div>
    </article>
  </section>
</template>

<script>
import { mapState } from 'pinia'
import { useMorelStore } from 'morel-games-core'
import { useGameStore } from '../store.js'

export default {
  computed: {
    ...mapState(useMorelStore, {
      players: state => state.players,
      master: state => state.master
    }),
    ...mapState(useGameStore, {
      scores: state => state.scores
    }),

    firsts() { return this.nth_winners(1) },
    firsts_count() { return this.nth_winners_count(1) },
    firsts_points() { return this.nth_winners_points(1) },
    seconds() { return this.nth_winners(2) },
    seconds_count() { return this.nth_winners_count(2) },
    seconds_points() { return this.nth_winners_points(2) },
    thirds() { return this.nth_winners(3) },
    thirds_count() { return this.nth_winners_count(3) },
    thirds_points() { return this.nth_winners_points(3) }
  },

  methods: {
    array_to_string(array) {
      if (array.length === 0) return 'N/A'
      if (array.length === 1) return array[0].trim()
      const last = array.pop()
      return (array.join(', ') + ' ' + this.$t('and') + ' ' + last).trim()
    },

    nth_winners(n) {
      return this.array_to_string(
        this.scores.filter(score => score.rank === n).map(score => this.players[score.uuid].pseudonym)
      )
    },

    nth_winners_count(n) {
      return this.scores.filter(score => score.rank === n).length
    },

    nth_winners_points(n) {
      const nth_scores = this.scores.filter(score => score.rank === n)
      if (nth_scores && nth_scores.length > 0) {
        return this.$tc('{n} point | {n} points', nth_scores[0].score)
      }
      return ''
    },

    restart_game() {
      useGameStore().ask_restart_game()
    }
  }
}
</script>

<style lang="sass">
@import "bulma/sass/utilities/_all"

// Les border-radius: 0 sur mobile sont gérés globalement dans App.vue

.end-screen
  display: flex
  flex-direction: column
  align-items: center

  .hero.is-winners-frame
    width: 100%
    border-radius: $radius-large
    text-align: center
    animation: fadein 1s 1

    .hero-body
      padding: 4rem 1rem

      +mobile
        padding: 2.5rem 1rem

    .winner
      .winner-names
        padding: 1rem 0
        font-size: 1.2em

      .rank
        font-size: .66em
        font-weight: normal
        font-variant: all-small-caps

      .icon svg
        width: 3rem
        height: 3rem

    .second-and-third-winners
      margin-top: 4rem

      +mobile
        margin-top: 2rem

    .first-winner
      font-size: 2rem

      +mobile
        font-size: 1.6rem

    .second-winner
      font-size: 1.8rem

      +mobile
        font-size: 1.4rem

    .third-winner
      font-size: 1.6rem

      +mobile
        font-size: 1.2rem

  .restart-game-banner
    margin-top: 2rem

    .restart-game-columns
      align-items: center

      +mobile
        .button
          min-height: 44px

  .all-scores
    margin-top: 6rem
    width: 60%

    +mobile
      width: 100%
      margin-top: 3rem

    .level-left
      flex: 2

      .is-rank-and-pseudonym
        align-items: center
        width: 100%

        .is-rank
          flex: 1
          font-size: 2.2em
          font-weight: 200
          text-align: center

          +mobile
            font-size: 1.6em

        .is-pseudonym
          font-size: 1.5em

          +mobile
            font-size: 1.2em

    .level-right
      .is-score
        font-size: 1.4em

        +mobile
          font-size: 1.1em

        span
          font-weight: bold

@keyframes fadein
  0%
    opacity: 0
    transform: translateY(20px)
  100%
    opacity: 1
    transform: translateY(0)
</style>
