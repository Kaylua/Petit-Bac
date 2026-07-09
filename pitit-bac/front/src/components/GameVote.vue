<template>
  <section>
    <o-notification :active="true" :closable="false" class="votes-header">
      <div class="columns votes-header-column">
        <div class="column is-9">
          <p class="content votes-header-title">
            <SummerDecor variant="icon" motif="palm" />
            <i18n-t keypath="Here are everyone's proposals for the letter {letter}." tag="span">
              <template #letter><strong>{{ letter }}</strong></template>
            </i18n-t>
          </p>
          <p class="content">
            {{ $t("Are they acceptable? You'll be the judge!") }}
            {{ $t("Uncheck all the boxes against the proposals you refuse. Then, validate with the finish button.") }}
          </p>
        </div>
        <div class="column is-3">
          <div class="field">
            <o-button variant="primary" size="medium" expanded :disabled="ready" @click.once="vote_ready">
              <span v-if="ready" v-t="'Please wait…'" />
              <span v-else v-t="'I finished!'" />
            </o-button>
          </div>
        </div>
      </div>
    </o-notification>

    <o-notification
      variant="primary"
      class="interrupted-by is-flat"
      :active="true"
      :closable="false"
      v-if="interrupted && interrupted_by"
    >
      <i18n-t keypath="The round was interrupted by {name}, who was faster than the others!">
        <template #name><strong>{{ interrupted_by }}</strong></template>
      </i18n-t>
    </o-notification>

    <o-notification variant="dark" :active="true" :closable="false" v-if="categories.length === 0">
      {{ $t('It looks like no one answered anything during this round… So there is nothing to vote. Please click “I finished!” to start the next round.') }}
    </o-notification>

    <div class="all-answers">
      <article class="box category-answers" v-for="(category, i) in categories" :key="i">
        <h3 class="title is-4">{{ category }}</h3>

        <div
          class="level"
          :class="{ 'has-lots-of-votes': answer.votes.length > 10 }"
          v-for="(answer, j) in answers_in_category(category)"
          :key="j"
        >
          <div class="level-left">
            <div
              class="media answer"
              :class="{
                'is-invalid': !answer_accepted(category, answer.uuid) || (!answer.answer.valid && answer.answer.text),
                'is-empty': !answer.answer.text
              }"
            >
              <div class="media-left answer-checkbox">
                <o-checkbox
                  size="medium"
                  :model-value="own_vote(category, answer.uuid)"
                  :disabled="!answer.answer.valid"
                  @update:modelValue="toggle_vote(category, answer.uuid)"
                ></o-checkbox>
              </div>
              <div class="media-content">
                <p class="answer-text">
                  {{ answer.answer.text ? answer.answer.text : $t("(no answer)") }}
                </p>
                <ul class="answer-meta">
                  <li class="is-pseudonym">{{ answer.author.pseudonym }}</li>
                  <template v-if="answer.answer.valid">
                    <li v-for="(search_engine, k) in Object.keys(search_engines)" :key="k">
                      <o-tooltip
                        :label="search_label(answer.answer.text)"
                        position="bottom"
                        variant="light"
                        multiline
                      >
                        <a :href="search_url(search_engine, category, answer.answer.text)" target="search_engine">{{ search_engine }}</a>
                      </o-tooltip>
                    </li>
                  </template>
                  <li v-if="!answer.answer.valid" v-t="'Invalid answer'" />
                  <li v-else-if="!answer_accepted(category, answer.author.uuid)" v-t="'Rejected by a majority of players'" />
                </ul>
              </div>
            </div>
          </div>
          <div class="level-right">
            <div v-for="(vote, k) in answer.votes" :key="k">
              <div class="block">
                <o-tooltip :label="vote.voter.pseudonym">
                  <o-icon
                    icon="check"
                    v-if="vote.vote"
                    :aria-label="$t('{name} voted for this answer', { name: vote.voter.pseudonym })"
                  />
                  <o-icon
                    icon="xmark"
                    v-else
                    :aria-label="$t('{name} voted against this answer', { name: vote.voter.pseudonym })"
                    :class="{ 'is-real-vote': answer.answer.valid }"
                  />
                </o-tooltip>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <o-notification :active="true" :closable="false" class="mobile-bottom-submit-button">
      <div class="field">
        <o-button variant="primary" size="medium" expanded :disabled="ready" @click.once="vote_ready">
          <span v-if="ready" v-t="'Please wait…'" />
          <span v-else v-t="'I finished!'" />
        </o-button>
      </div>
    </o-notification>
  </section>
</template>

<script>
import { is_answer_accepted } from 'ptitbac-commons'
import { mapState } from 'pinia'
import { useMorelStore } from 'morel-games-core'
import { useGameStore } from '../store.js'
import SummerDecor from './SummerDecor.vue'

export default {
  components: { SummerDecor },

  data() {
    return {
      ready: false
    }
  },

  computed: {
    ...mapState(useMorelStore, {
      own_uuid: state => state.uuid,
      players: state => state.players,
      interrupted: state => state.configuration.stopOnFirstCompletion
    }),
    ...mapState(useGameStore, {
      letter: state => state.current_round.letter,
      votes: state => state.current_round.votes,
      search_engines: state => state.search_engines,
      interrupted_by_uuid: state => state.current_round.interrupted_by
    }),

    interrupted_by() {
      const player = useMorelStore().players[this.interrupted_by_uuid]
      return player ? player.pseudonym : null
    },

    categories() {
      return Object.keys(this.votes)
    }
  },

  mounted() {
    // For position: sticky to work, remove overflow: hidden on html
    document.getElementsByTagName('html')[0].classList.add('overflow')
    useGameStore().set_sticky_players_list(true)
  },

  beforeUnmount() {
    document.getElementsByTagName('html')[0].classList.remove('overflow')
    useGameStore().set_sticky_players_list(false)
  },

  methods: {
    answers_in_category(category) {
      const morelStore = useMorelStore()
      let answers = []

      Object.keys(this.votes[category]).forEach(uuid => {
        let votes = []

        Object.keys(this.votes[category][uuid].votes).forEach(voter_uuid => {
          votes.push({
            voter: morelStore.players[voter_uuid],
            vote: this.votes[category][uuid].votes[voter_uuid]
          })
        })

        votes.sort((a, b) => a.voter.pseudonym.toLowerCase().localeCompare(b.voter.pseudonym.toLowerCase()))

        answers.push({
          uuid,
          answer: {
            text: this.votes[category][uuid].answer,
            valid: this.votes[category][uuid].valid
          },
          votes,
          author: morelStore.players[uuid]
        })
      })

      answers.sort((a, b) => a.author.pseudonym.toLowerCase().localeCompare(b.author.pseudonym.toLowerCase()))

      return answers
    },

    answer_accepted(category, uuid) {
      return is_answer_accepted(this.votes[category][uuid].votes)
    },

    own_vote(category, uuid) {
      return this.votes[category][uuid].votes[this.own_uuid]
    },

    toggle_vote(category, uuid) {
      useGameStore().send_vote_update({
        voter: { uuid: this.own_uuid },
        vote: { uuid, category, vote: !this.own_vote(category, uuid) }
      })
    },

    vote_ready() {
      useGameStore().vote_ready()
      this.ready = true
    },

    search_label(text) {
      return this.$t('Search "{term}" on a search engine (in a new tab)', { term: text })
    },

    search_url(search_engine, category, text) {
      return this.search_engines[search_engine].replace('{s}', category + ' ' + text)
    }
  }
}
</script>

<style lang="sass">
@import "bulma/sass/utilities/_all"
@import "../assets/variables"

// Les border-radius: 0 sur mobile sont gérés globalement dans App.vue

.notification.votes-header
  position: sticky !important
  top: 10px
  z-index: 40
  background-color: rgba(255, 253, 249, 0.96) !important
  backdrop-filter: blur(12px)
  -webkit-backdrop-filter: blur(12px)
  border: 1px solid rgba(240, 175, 100, 0.22) !important
  box-shadow: 0 4px 20px rgba(150, 45, 0, 0.10) !important

  +mobile
    position: relative !important

  .media-content
    overflow: hidden

  .votes-header-column
    align-items: center

  .votes-header-title
    display: flex
    align-items: center
    font-weight: 600

    .summer-icon
      color: $primary
      flex-shrink: 0

    p.content
      margin-bottom: 0
      text-align: justify

    .field
      +mobile
        .button
          min-height: 44px

.notification.interrupted-by
  background: rgba($primary, 0.08) !important
  border-color: rgba($primary, 0.25) !important
  font-weight: 500

.all-answers
  display: flex
  flex-direction: column
  align-items: center
  gap: 1rem

  article.category-answers
    width: 99%
    text-align: left
    border-radius: 16px

    +mobile
      width: 100%

    h3.title.is-4
      font-size: 1.1em
      font-weight: 700
      color: $primary-dark
      padding-bottom: 0.6rem
      border-bottom: 2px solid rgba($primary, 0.12)
      margin-bottom: 1rem

    .level.has-lots-of-votes
      flex-direction: column
      align-items: flex-start

      .level-right
        align-self: end

    .level-left
      flex: 2

    .answer
      padding: 0.5rem 0
      border-radius: 8px
      transition: background 0.15s ease

      &:hover
        background: rgba(255, 230, 190, 0.12)

      .answer-checkbox
        padding-top: .2em

        +mobile
          padding: .4em .4em .4em 0

      .media-content
        overflow: hidden

      .answer-text
        padding-right: 1em
        font-size: 1.15em
        text-align: justify

        +mobile
          padding-right: 0

      ul.answer-meta
        font-size: .9em
        padding-left: .1em

        li
          display: inline-block

          &:not(:first-child)
            margin-left: .8em

            &:before
              content: "•"
              position: relative
              left: -.4em

          &.is-pseudonym
            font-weight: 600
            color: $primary-dark

          a
            color: $link

      &.is-invalid .answer-text
        color: $grey
        text-decoration: line-through

      &.is-empty .answer-text
        color: $grey-light
        font-style: italic

    .level-right
      .icon.is-real-vote
        color: hsl(360, 67%, 44%)

      +mobile
        display: flex
        flex-direction: row
        align-items: center
        margin-top: .4rem

.notification.mobile-bottom-submit-button
  +tablet
    display: none

  margin-top: 1.5rem

  .button
    min-height: 44px
</style>
