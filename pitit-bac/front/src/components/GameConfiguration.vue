<template>
  <div class="game-configuration">
    <div class="message is-primary">
      <div class="message-header">
        <p>{{ master ? $t('Configure the game') : $t('Game configuration') }}</p>
      </div>
      <div class="message-body">
        <section>
          <div class="columns">
            <div class="column is-half is-column-with-start-button">
              <o-field
                :message="categories_field_message"
              >
                <template #label>
                  <div class="columns is-mobile">
                    <div class="column is-8">{{ $t('Categories') }}</div>
                    <div class="column is-4 suggestions-link">
                      <a href="#" class="suggestions-link-trigger" @click.prevent="toggle_suggestions_modale()">
                        {{ $t('Suggestions') }}
                      </a>
                    </div>
                  </div>
                </template>
                <o-taginput
                  v-model="config.categories"
                  :data="filtered_suggestions"
                  autocomplete
                  allow-new
                  :confirm-keys="['Enter', 'Tab']"
                  @update:modelValue="update_game_configuration"
                  @typing="update_suggestions"
                  :placeholder="$t('Add a category…')"
                  :disabled="!master && !categories_by_everyone"
                >
                </o-taginput>
              </o-field>

              <div class="field no-extended-margin-top" v-if="master">
                <o-switch
                  :model-value="categories_by_everyone"
                  @update:modelValue="update_categories_by_everyone"
                >
                  {{ $t('Allow everyone to update categories') }}
                </o-switch>
              </div>

              <div class="field start-button is-desktop">
                <o-tooltip multiline position="bottom" :label="start_button_tooltip">
                  <o-button
                    variant="primary"
                    size="medium"
                    expanded
                    :disabled="!master || !can_start"
                    @click="start_game"
                  >{{ $t('Start the game') }}</o-button>
                </o-tooltip>
              </div>
            </div>

            <div class="column is-half">
              <o-field
                :label="$t('Rounds: {rounds}', { rounds: config.turns })"
                class="no-extended-margin-top"
              >
                <o-slider
                  size="medium"
                  class="has-lots-of-ticks"
                  :min="1"
                  :max="20"
                  :tooltip="false"
                  :disabled="!master"
                  v-model="config.turns"
                  @change="update_game_configuration"
                >
                  <o-slider-tick v-for="val in [2, 4, 6, 8, 10, 12, 14, 16, 18]" :value="val" :key="val">
                    {{ val }}
                  </o-slider-tick>
                </o-slider>
              </o-field>

              <o-field>
                <template #label>
                  <i18n-t keypath="Time limit for each round: {limit}">
                    <template #limit>
                      <span class="is-date-desktop">{{ actual_time }}</span>
                      <span class="is-date-mobile">{{ actual_time_mobile }}</span>
                    </template>
                  </i18n-t>
                </template>
                <o-slider
                  size="medium"
                  class="has-lots-of-ticks"
                  :min="15"
                  :max="infinite_duration"
                  :step="15"
                  :tooltip="false"
                  :disabled="!master"
                  v-model="config.time"
                  @change="update_game_configuration"
                >
                  <o-slider-tick v-for="val in [60, 120, 180, 240, 300, 360, 420, 480, 540]" :value="val" :key="val">
                    {{ format_seconds(val) }}
                  </o-slider-tick>
                  <o-slider-tick :value="infinite_duration">&infin;</o-slider-tick>
                </o-slider>
              </o-field>

              <div class="field">
                <o-switch
                  :disabled="!master"
                  v-model="config.stopOnFirstCompletion"
                  @update:modelValue="update_game_configuration"
                >
                  {{ $t('Stop rounds as soon as the first player finishes') }}
                </o-switch>
              </div>
            </div>
          </div>
        </section>

        <div class="field start-button is-mobile">
          <o-tooltip multiline position="bottom" :label="start_button_tooltip">
            <o-button
              variant="primary"
              size="medium"
              expanded
              :disabled="!master || !can_start"
              @click="start_game"
            >{{ $t('Start the game') }}</o-button>
          </o-tooltip>
        </div>

        <!-- Suggestions modal -->
        <o-modal v-model:active="suggestions_opened">
          <div class="modal-card suggestions-card">
            <header class="modal-card-head">
              <p class="modal-card-title">{{ $t('Categories suggestions') }}</p>
            </header>
            <section class="modal-card-body">
              <div v-if="master || categories_by_everyone">
                <p v-t="'Categories ideas are suggested below. You can always write your own categories directly—don\'t hesitate if you have original ideas or private references!'" />
                <p v-t="'Click on a category to add or remove it.'" />
              </div>
              <div v-else>
                <p v-t="'Categories ideas are suggested below. The game master can write your own categories directly—don\'t hesitate to ask if you have original ideas or private references!'" />
              </div>

              <div class="tags" v-for="(categories_group, i) in suggested_categories" :key="i">
                <span
                  class="tag is-medium"
                  :class="{
                    'is-primary': has_category(suggestion),
                    'is-static': !master && !categories_by_everyone
                  }"
                  v-for="(suggestion, j) in categories_group"
                  :key="j"
                  @click="toggle_category(suggestion)"
                >{{ suggestion }}</span>
              </div>

              <o-notification v-if="suggested_categories.length === 0" :closable="false">
                {{ $t('Sorry, but there are no suggestions available for your language.') }}
              </o-notification>
            </section>
            <footer class="modal-card-foot">
              <button class="button" type="button" @click="toggle_suggestions_modale()">
                {{ $t('Close') }}
              </button>
            </footer>
          </div>
        </o-modal>
      </div>
    </div>

    <div
      class="avanced-section-toggle"
      :class="{ 'is-active': show_advanced }"
      @click="show_advanced = !show_advanced"
    >
      {{ $t('Advanced settings') }}
      <o-icon :icon="show_advanced ? 'caret-up' : 'caret-down'"></o-icon>
    </div>

    <div v-show="show_advanced" class="message is-primary avanced-section">
      <div class="message-body">
        <div class="columns">
          <div class="column is-half">
            <o-field :message="$t('Each round\'s letter will be drawn from these letters.')">
              <template #label>
                <div class="columns is-mobile">
                  <div class="column is-half">{{ $t('Alphabet') }}</div>
                  <div class="column is-half suggestions-link" v-if="master">
                    <o-dropdown aria-role="list" position="bottom-left">
                      <template #trigger>
                        <a href="" @click.prevent="" class="suggestions-link-trigger" role="button">
                          {{ $t('Presets') }}
                          <o-icon icon="caret-down" size="small"></o-icon>
                        </a>
                      </template>

                      <div v-for="(alphabets_cat, i) in Object.keys(alphabets)" :key="i">
                        <o-dropdown-item separator v-if="i != 0"></o-dropdown-item>
                        <div class="dropdown-item">
                          <h4>{{ $t(alphabets_cat) }}</h4>
                          <p>{{ $t(alphabets[alphabets_cat].description) }}</p>
                        </div>
                        <o-dropdown-item
                          aria-role="listitem"
                          :class="{ 'is-active': config.alphabet === alphabets[alphabets_cat].alphabets[alphabet_in_cat] }"
                          @click="config.alphabet = alphabets[alphabets_cat].alphabets[alphabet_in_cat]; update_game_configuration()"
                          v-for="(alphabet_in_cat, j) in Object.keys(alphabets[alphabets_cat].alphabets)"
                          :key="j"
                        >{{ $t(alphabet_in_cat) }}</o-dropdown-item>
                      </div>

                      <o-dropdown-item separator></o-dropdown-item>
                      <div class="dropdown-item">
                        <p>
                          {{ $t('Your language or alphabet is missing?') }}
                          <a href="https://github.com/MorelGames/pitit-bac/issues" target="_blank">
                            {{ $t('Explain us how to add it!') }}
                          </a>
                        </p>
                      </div>
                    </o-dropdown>
                  </div>
                </div>
              </template>
              <o-input
                type="text"
                v-model="config.alphabet"
                @blur="update_game_configuration"
                :disabled="!master"
              ></o-input>
            </o-field>
          </div>

          <div class="column is-half">
            <o-field class="scores-master-field">
              <template #label>
                <div class="columns is-mobile">
                  <div class="column is-half">{{ $t('Scores') }}</div>
                  <div class="column is-half suggestions-link">
                    <o-dropdown aria-role="list" position="bottom-left">
                      <template #trigger>
                        <a href="" @click.prevent="" class="suggestions-link-trigger" role="button">
                          {{ $t('How does it work?') }}
                          <o-icon icon="caret-down" size="small"></o-icon>
                        </a>
                      </template>
                      <div class="dropdown-item"><h4 v-t="'Valid'" /><p v-t="'Points granted if the answer is correct, accepted by all players, and unique.'" /></div>
                      <div class="dropdown-item"><h4 v-t="'Duplicated'" /><p v-t="'Points granted if the answer is correct, accepted by all players, but when other players answered the same thing.'" /></div>
                      <o-dropdown-item separator></o-dropdown-item>
                      <div class="dropdown-item"><h4 v-t="'Invalid'" /><p v-t="'Points granted if the answer is not correct (does not start with the correct letter).'" /></div>
                      <div class="dropdown-item"><h4 v-t="'Refused'" /><p v-t="'Points granted if the answer starts with the correct letter, but was voted against by a majority of players.'" /></div>
                      <div class="dropdown-item"><h4 v-t="'Empty'" /><p v-t="'Points granted if the answer is missing.'" /></div>
                      <o-dropdown-item separator></o-dropdown-item>
                      <div class="dropdown-item"><p v-t="'Scores can be negative (points are then subtracted from the player\'s score).'" /></div>
                    </o-dropdown>
                  </div>
                </div>
              </template>
              <div class="columns scores-columns is-mobile is-multiline" :class="{ 'is-disabled': !master }">
                <o-field class="column" :label="$t('Valid')">
                  <o-input type="number" v-model="config.scores.valid" @update:modelValue="update_game_configuration" :disabled="!master"></o-input>
                </o-field>
                <o-field class="column" :label="$t('Duplicated')">
                  <o-input type="number" v-model="config.scores.duplicate" @update:modelValue="update_game_configuration" :disabled="!master"></o-input>
                </o-field>
                <o-field class="column" :label="$t('Invalid')">
                  <o-input type="number" v-model="config.scores.invalid" @update:modelValue="update_game_configuration" :disabled="!master"></o-input>
                </o-field>
                <o-field class="column" :label="$t('Refused')">
                  <o-input type="number" v-model="config.scores.refused" @update:modelValue="update_game_configuration" :disabled="!master"></o-input>
                </o-field>
                <o-field class="column" :label="$t('Empty')">
                  <o-input type="number" v-model="config.scores.empty" @update:modelValue="update_game_configuration" :disabled="!master"></o-input>
                </o-field>
              </div>
            </o-field>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useMorelStore } from 'morel-games-core'
import { useGameStore } from '../store.js'
import alphabetsData from '../../data/alphabets.json'

export default {
  data() {
    return {
      filtered_suggestions: [],
      suggestions_opened: false,
      show_advanced: false,
      alphabets: alphabetsData,
      categories_edited: false,
      suggested_categories: []
    }
  },

  computed: {
    ...mapState(useMorelStore, {
      master: state => state.master,
      config: state => state.configuration
    }),
    ...mapState(useGameStore, ['categories_by_everyone', 'infinite_duration']),

    locale() { return this.$i18n.locale },

    flat_suggested_categories() {
      return Array.prototype.concat.apply([], this.suggested_categories)
    },

    actual_time() {
      return useGameStore().is_time_infinite
        ? this.$t('infinite')
        : this.format_seconds(this.config.time, true)
    },
    actual_time_mobile() {
      return useGameStore().is_time_infinite
        ? this.$t('infinite')
        : this.format_seconds(this.config.time, true, true)
    },

    can_start() {
      return this.has_categories && this.has_players && this.required_fields_filled
    },
    has_players() {
      return Object.values(useMorelStore().players).length > 1
    },
    has_categories() {
      return useMorelStore().configuration.categories.length !== 0
    },
    required_fields_filled() {
      const s = this.config.scores
      return (
        this.config.alphabet &&
        s.valid !== '' && s.valid !== undefined &&
        s.duplicate !== '' && s.duplicate !== undefined &&
        s.invalid !== '' && s.invalid !== undefined &&
        s.refused !== '' && s.refused !== undefined &&
        s.empty !== '' && s.empty !== undefined
      )
    },
    start_button_tooltip() {
      if (this.master) {
        if (!this.has_players) return this.$t("You're alone! Invite other players to join using the game link…")
        else if (!this.has_categories) return this.$t('You cannot start the game without categories.')
        else if (!this.required_fields_filled) return this.$t('Some fields are not correctly set.')
        else return ''
      } else {
        return this.$t('Please wait—the game master will start the game…')
      }
    },
    categories_field_message() {
      if (this.master || this.categories_by_everyone) {
        return (this.categories_by_everyone && !this.master
          ? this.$t('<strong>Everyone can update categories.</strong>') + ' '
          : '') +
          this.$t('Write down the category you want, and press enter to add it; or use the suggestions link to enter pre-selected categories.')
      }
      return ''
    }
  },

  methods: {
    load_suggestions(init) {
      import(/* @vite-ignore */ './../../locales/categories/' + this.locale + '.json')
        .then(categories => {
          this.suggested_categories = categories.default.suggestions

          if (!this.master) return

          if ((init && this.config.categories.length === 0) || (!init && !this.categories_edited)) {
            this.config.categories = categories.default.default.categories
            this.config.alphabet = categories.default.default.alphabet
            setTimeout(() => {
              useMorelStore().update_game_configuration(this.config)
            }, init ? 1000 : 1)
          } else if (init) {
            this.categories_edited = true
          }
        })
        .catch(() => { this.suggested_categories = [] })
    },

    format_seconds(seconds, long, mobile) {
      const mm = Math.floor(seconds / 60)
      const ss = seconds - mm * 60
      const $t = this.$t.bind(this)
      const $tc = this.$tc.bind(this)
      if (long) {
        if (mm > 0 && ss > 0) {
          return mobile
            ? $t('{minutes} and {seconds}', { minutes: $tc('{n} minute | {n} minutes', mm), seconds: $tc('{n}s | {n}s', ss) })
            : $t('{minutes} and {seconds}', { minutes: $tc('{n} minute | {n} minutes', mm), seconds: $tc('{n} second | {n} seconds', ss) })
        } else if (mm > 0) {
          return $tc('{n} minute | {n} minutes', mm)
        } else {
          return $tc('{n} second | {n} seconds', ss)
        }
      } else {
        return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
      }
    },

    update_game_configuration(edited_value) {
      if (edited_value !== undefined && typeof edited_value !== 'boolean' && !edited_value) return
      this.categories_edited = true
      this.$nextTick(() => useMorelStore().update_game_configuration(this.config))
    },

    update_suggestions(text) {
      text = text.toLowerCase().replace('...', '…')
      this.filtered_suggestions = this.flat_suggested_categories.filter(
        category => category.toLowerCase().indexOf(text) >= 0
      )
    },

    toggle_suggestions_modale() {
      this.suggestions_opened = !this.suggestions_opened
    },

    has_category(category) {
      return useMorelStore().configuration.categories.indexOf(category) !== -1
    },

    toggle_category(category) {
      if (!this.master && !this.categories_by_everyone) return
      const index = this.config.categories.indexOf(category)
      if (index === -1) {
        this.config.categories.push(category)
      } else {
        this.config.categories.splice(index, 1)
      }
      this.update_game_configuration()
    },

    update_categories_by_everyone() {
      useGameStore().set_categories_by_everyone({ enabled: !this.categories_by_everyone })
    },

    start_game() {
      useGameStore().ask_start_game()
    }
  },

  mounted() {
    this.load_suggestions(true)
  },

  watch: {
    locale() { this.load_suggestions() },

    config(newConfig, oldConfig) {
      if (JSON.stringify(newConfig.categories) !== JSON.stringify(oldConfig.categories)) {
        this.categories_edited = true
      }
    }
  }
}
</script>

<style lang="sass">
@import "../assets/variables"

// La règle border-radius: 0 sur mobile est centralisée dans App.vue
.message-body
  .media-content
    overflow-x: inherit

    div.column.is-half:first-of-type
      +mobile
        padding-bottom: 0

  .start-button
    &.is-desktop
      +mobile
        display: none
    &.is-mobile
      +tablet
        display: none
      +mobile
        margin-top: 1.5rem

label.switch span.control-label
  position: relative
  top: 2px

div.column.is-half div.field:not(:first-child):not(.no-extended-margin-top)
  margin-top: 3rem

div.field > span.o-tooltip
  display: inline-block
  width: 100%

  &.o-tooltip--multiline:after
    width: 360px !important

.is-date-desktop
  +mobile
    display: none
.is-date-mobile
  +tablet
    display: none

.game-configuration
  label.label .suggestions-link
    text-align: right
    font-weight: normal !important

    a.suggestions-link-trigger
      color: $primary-dark !important
      cursor: pointer
      text-decoration: none !important

  input.input[disabled]
    background: transparent
    border: none
    padding: 0
    color: $grey-dark
    cursor: default

  div.taginput.control .taginput-container[disabled]
    position: relative
    left: -2px
    background-color: #fff5f0
    border-color: #fff5f0
    cursor: default

    .tag .delete
      display: none
    .autocomplete.control
      display: none

  .o-slide
    &.has-lots-of-ticks
      +mobile
        .o-slide__track
          .o-slide__tick:nth-of-type(2n)
            display: none

    &.o-slide--disabled
      .o-slide__track
        opacity: 1 !important
        cursor: default !important
        .o-slide__tick
          background: transparent

      .o-slide__thumb-wrapper
        display: none

  .o-switch[disabled]
    opacity: 1 !important
    .o-switch__label
      color: $dark
      cursor: default

div.modal-card.suggestions-card
  width: auto

  +mobile
    width: 100%
    height: 100%
    max-height: 100vh
    margin: 0
    background-color: #fff9f3

    p
      width: calc(100vw - 2rem)
      text-align: justify

  p:not(:first-child)
    margin-top: .8rem

  div.tags
    margin-top: 1.5rem

    .tag:not(.is-static)
      cursor: pointer
      &:hover
        background-color: $grey-lighter
        &.is-primary
          background-color: $primary-dark

    .tag.is-static
      cursor: default

  article.notification
    margin-top: 1rem

div.column.is-column-with-start-button
  display: flex
  flex-direction: column

  .field:not(.start-button)
    flex: 4

.avanced-section-toggle
  margin-bottom: 1.5rem
  text-align: center
  color: $grey-light
  cursor: pointer

  &.is-active
    color: $grey

  &:hover
    color: $grey-dark

  .icon
    position: relative
    top: 6px

.avanced-section
  .message-body
    border: none

    .suggestions-link
      position: relative
      top: -2px

      a .icon
        position: relative
        top: 6px

      .dropdown-content
        div.dropdown-item
          margin-bottom: .4rem
          text-align: left
          color: $grey

          +tablet
            min-width: 20rem

          h4
            color: $grey-dark
            font-size: 1.1em
            font-variant: all-small-caps
            letter-spacing: 1px
          p
            color: $grey
            font-size: .9em
          a
            color: $grey-dark
            text-decoration: none

          &:last-child
            margin-bottom: 0

    .scores-master-field
      +mobile
        margin-top: 1rem

      label.label
        margin-bottom: 0

      .scores-columns
        position: relative
        top: -4px

        .field.column
          display: flex
          flex-direction: column-reverse
          margin-top: 0 !important

          label
            flex: 2
            padding-top: .4rem
            padding-left: .1em
            font-weight: normal

          input[disabled]
            -moz-appearance: textfield

            &:-webkit-outer-spin-button, &:-webkit-inner-spin-button
              -webkit-appearance: none
              margin: 0

        &.is-disabled
          +mobile
            margin-top: .4rem

          .field.column
            flex-direction: column

            label
              padding-top: 0
              padding-left: 0

            div.control
              flex: 4
</style>
