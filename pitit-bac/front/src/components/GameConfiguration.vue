<template>
  <div class="game-configuration">
    <div class="message is-primary">
      <div class="message-header">
        <p><SummerDecor variant="icon" motif="cocktail" />{{ master ? $t('Configure the game') : $t('Game configuration') }}</p>
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
                    <div class="column is-8 categories-label-count">
                      {{ $t('Categories') }}
                      <span class="categories-count" v-if="config.categories.length">{{ config.categories.length }}</span>
                    </div>
                    <div class="column is-4 suggestions-link">
                      <a href="#" class="suggestions-link-trigger" @click.prevent="toggle_suggestions_modale()">
                        <SummerDecor variant="icon" motif="pineapple" />{{ $t('Suggestions') }}
                      </a>
                    </div>
                  </div>
                </template>
                <template #message="{ message }">
                  <span v-if="message" v-html="message" />
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
                <o-tooltip multiline position="auto" teleport :label="start_button_tooltip">
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
              <div class="field no-extended-margin-top">
                <o-switch
                  :disabled="!master"
                  v-model="config.stopOnFirstCompletion"
                  @update:modelValue="update_game_configuration"
                >
                  {{ $t('Stop rounds as soon as the first player finishes') }}
                </o-switch>
              </div>

              <div class="config-stats">
                <span class="config-stat-chip">{{ turns_summary }}</span>
                <span class="config-stat-chip">{{ seconds_per_category_summary }}</span>
              </div>
            </div>
          </div>
        </section>

        <div class="field start-button is-mobile">
          <o-tooltip multiline position="auto" teleport :label="start_button_tooltip">
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
        <o-modal v-model:active="suggestions_opened" teleport animation="modal-pop" @close="suggestions_search = ''">
          <div class="modal-card suggestions-card">
            <header class="modal-card-head">
              <p class="modal-card-title">
                {{ $t('Categories suggestions') }}
                <span class="suggestions-selected-count" v-if="config.categories.length">
                  {{ $tc('{n} selected | {n} selected', config.categories.length) }}
                </span>
              </p>
            </header>
            <section class="modal-card-body">
              <div v-if="master || categories_by_everyone">
                <p v-t="'Categories ideas are suggested below. You can always write your own categories directly, don\'t hesitate if you have original ideas or private references!'" />
                <p v-t="'Click on a category to add or remove it.'" />
              </div>
              <div v-else>
                <p v-t="'Categories ideas are suggested below. The game master can write your own categories directly, don\'t hesitate to ask if you have original ideas or private references!'" />
              </div>

              <div class="suggestions-search" v-if="suggested_categories.length > 0">
                <o-input
                  v-model="suggestions_search"
                  icon="magnifying-glass"
                  :placeholder="$t('Search a category…')"
                  expanded
                />
              </div>

              <template v-if="filtered_suggestion_groups.length > 0">
                <div class="tags" v-for="(categories_group, i) in filtered_suggestion_groups" :key="i">
                  <span
                    class="tag is-medium"
                    :class="{
                      'is-primary': has_category(suggestion),
                      'is-static': !master && !categories_by_everyone
                    }"
                    v-for="(suggestion, j) in categories_group"
                    :key="j"
                    @click="toggle_category(suggestion)"
                  >
                    <span class="tag-check" v-if="has_category(suggestion)">✓</span>{{ suggestion }}
                  </span>
                </div>
              </template>

              <o-notification v-else-if="suggested_categories.length === 0" :closable="false">
                {{ $t('Sorry, but there are no suggestions available for your language.') }}
              </o-notification>

              <o-notification v-else :closable="false">
                {{ $t('No categories match your search.') }}
              </o-notification>
            </section>
            <footer class="modal-card-foot">
              <o-button variant="primary" expanded @click="toggle_suggestions_modale()">
                {{ $t('Done') }}
              </o-button>
            </footer>
          </div>
        </o-modal>

        <!-- Alphabet presets modal -->
        <o-modal v-model:active="presets_opened" teleport animation="modal-pop">
          <div class="modal-card presets-card">
            <header class="modal-card-head">
              <p class="modal-card-title">{{ $t('Presets') }}</p>
            </header>
            <section class="modal-card-body">
              <div class="preset-group" v-for="(alphabets_cat, i) in Object.keys(alphabets)" :key="i">
                <h4>{{ $t(alphabets_cat) }}</h4>
                <p>{{ $t(alphabets[alphabets_cat].description) }}</p>
                <div class="tags">
                  <span
                    class="tag is-medium"
                    :class="{ 'is-primary': config.alphabet === alphabets[alphabets_cat].alphabets[alphabet_in_cat] }"
                    v-for="(alphabet_in_cat, j) in Object.keys(alphabets[alphabets_cat].alphabets)"
                    :key="j"
                    @click="select_alphabet_preset(alphabets[alphabets_cat].alphabets[alphabet_in_cat])"
                  >
                    <span class="tag-check" v-if="config.alphabet === alphabets[alphabets_cat].alphabets[alphabet_in_cat]">✓</span>{{ $t(alphabet_in_cat) }}
                  </span>
                </div>
              </div>
            </section>
            <footer class="modal-card-foot">
              <o-button variant="primary" expanded @click="toggle_presets_modale()">
                {{ $t('Done') }}
              </o-button>
            </footer>
          </div>
        </o-modal>

        <!-- Scores explanation modal -->
        <o-modal v-model:active="scores_info_opened" teleport animation="modal-pop">
          <div class="modal-card scores-info-card">
            <header class="modal-card-head">
              <p class="modal-card-title">{{ $t('How does it work?') }}</p>
            </header>
            <section class="modal-card-body">
              <div class="info-item"><h4 v-t="'Valid'" /><p v-t="'Points granted if the answer is correct, accepted by all players, and unique.'" /></div>
              <div class="info-item"><h4 v-t="'Duplicated'" /><p v-t="'Points granted if the answer is correct, accepted by all players, but when other players answered the same thing.'" /></div>
              <div class="info-item"><h4 v-t="'Invalid'" /><p v-t="'Points granted if the answer is not correct (does not start with the correct letter).'" /></div>
              <div class="info-item"><h4 v-t="'Refused'" /><p v-t="'Points granted if the answer starts with the correct letter, but was voted against by a majority of players.'" /></div>
              <div class="info-item"><h4 v-t="'Empty'" /><p v-t="'Points granted if the answer is missing.'" /></div>
              <div class="info-item"><p v-t="'Scores can be negative (points are then subtracted from the player\'s score).'" /></div>
            </section>
            <footer class="modal-card-foot">
              <o-button variant="primary" expanded @click="toggle_scores_info_modale()">
                {{ $t('Done') }}
              </o-button>
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
            <o-field :label="$t('Rounds')" class="no-extended-margin-top">
              <NumberStepper
                :model-value="config.turns"
                :min="1"
                :max="30"
                :step="1"
                :disabled="!master"
                @update:modelValue="val => (config.turns = val)"
                @change="update_game_configuration"
              />
            </o-field>
          </div>

          <div class="column is-half">
            <o-field :label="$t('Time per category')" class="no-extended-margin-top">
              <div class="time-per-category-field">
                <NumberStepper
                  v-if="!no_time_limit"
                  :model-value="config.secondsPerCategory"
                  :min="5"
                  :max="120"
                  :step="5"
                  suffix="s"
                  :disabled="!master"
                  @update:modelValue="val => (config.secondsPerCategory = val)"
                  @change="update_game_configuration"
                />
                <o-switch :disabled="!master" v-model="no_time_limit">
                  {{ $t('No time limit') }}
                </o-switch>
              </div>
            </o-field>
            <p class="config-defaults-hint">
              <i18n-t keypath="→ {categories_count} categories, {limit} per round">
                <template #categories_count>{{ config.categories.length }}</template>
                <template #limit>
                  <span class="is-date-desktop">{{ actual_time }}</span>
                  <span class="is-date-mobile">{{ actual_time_mobile }}</span>
                </template>
              </i18n-t>
            </p>
          </div>
        </div>

        <div class="columns">
          <div class="column is-half">
            <o-field :message="$t('Each round\'s letter will be drawn from these letters.')">
              <template #label>
                <div class="columns is-mobile">
                  <div class="column is-half">{{ $t('Alphabet') }}</div>
                  <div class="column is-half suggestions-link" v-if="master">
                    <a href="#" class="suggestions-link-trigger" @click.prevent="toggle_presets_modale()">
                      <SummerDecor variant="icon" motif="sun" />{{ $t('Presets') }}
                    </a>
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
                    <a href="#" class="suggestions-link-trigger" @click.prevent="toggle_scores_info_modale()">
                      <SummerDecor variant="icon" motif="watermelon" />{{ $t('How does it work?') }}
                    </a>
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
import SummerDecor from './SummerDecor.vue'
import NumberStepper from './NumberStepper.vue'

export default {
  components: { SummerDecor, NumberStepper },

  data() {
    return {
      filtered_suggestions: [],
      suggestions_opened: false,
      suggestions_search: '',
      presets_opened: false,
      scores_info_opened: false,
      show_advanced: false,
      alphabets: alphabetsData,
      categories_edited: false,
      suggested_categories: [],
      default_rounds: 6,
      default_seconds_per_category: 20,
      last_manual_seconds_per_category: 20
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

    // Recherche insensible aux accents (ex: "ecole" trouve "école"), les
    // groupes sans aucune correspondance sont masqués plutôt que rendus
    // vides, pour ne pas laisser de blancs dans la liste filtrée.
    filtered_suggestion_groups() {
      const term = this.normalize_for_search(this.suggestions_search.trim())
      if (!term) return this.suggested_categories
      return this.suggested_categories
        .map(group => group.filter(item => this.normalize_for_search(item).includes(term)))
        .filter(group => group.length > 0)
    },

    // Le temps par round n'est plus une valeur saisie : il est dérivé
    // localement (instantané, pas d'aller-retour serveur) du temps par
    // catégorie et du nombre de catégories actuel. Le serveur recalcule la
    // même formule de son côté (source de vérité pour le timer de la
    // partie), voir update_configuration() dans back/src/game.js.
    seconds_per_category_or_default() {
      return this.config.secondsPerCategory || this.default_seconds_per_category
    },
    round_time_is_infinite() {
      return this.seconds_per_category_or_default >= this.infinite_duration
    },
    round_time_seconds() {
      if (this.round_time_is_infinite) return this.infinite_duration
      return Math.min(
        Math.max(this.seconds_per_category_or_default * this.config.categories.length, 15),
        this.infinite_duration - 1
      )
    },
    actual_time() {
      return this.round_time_is_infinite
        ? this.$t('infinite')
        : this.format_seconds(this.round_time_seconds, true)
    },
    actual_time_mobile() {
      return this.round_time_is_infinite
        ? this.$t('infinite')
        : this.format_seconds(this.round_time_seconds, true, true)
    },

    // Résumé compact affiché sur l'écran principal (pas de calcul du temps
    // total par round ici, juste les deux réglages bruts) : nombre de tours
    // et temps par catégorie, tels qu'actuellement configurés.
    turns_summary() {
      return this.$tc('{n} round | {n} rounds', this.config.turns)
    },
    seconds_per_category_summary() {
      return this.round_time_is_infinite
        ? this.$t('No time limit')
        : this.$t('{seconds}s per category', { seconds: this.seconds_per_category_or_default })
    },

    // Bascule "No time limit", remplace l'ancien tick "∞" en bout de slider
    // par un switch explicite. On retient la dernière valeur manuelle pour la
    // restaurer si le maître décoche.
    no_time_limit: {
      get() {
        return this.round_time_is_infinite
      },
      set(value) {
        if (value) {
          if (this.config.secondsPerCategory < this.infinite_duration) {
            this.last_manual_seconds_per_category = this.config.secondsPerCategory
          }
          this.config.secondsPerCategory = this.infinite_duration
        } else {
          this.config.secondsPerCategory = this.last_manual_seconds_per_category || this.default_seconds_per_category
        }
        this.update_game_configuration()
      }
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
        return this.$t('Please wait, the game master will start the game…')
      }
    },
    categories_field_message() {
      if (this.categories_by_everyone && !this.master) {
        return this.$t('<strong>Everyone can update categories.</strong>')
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
            this.config.turns = this.default_rounds
            this.config.secondsPerCategory = this.default_seconds_per_category
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

    normalize_for_search(text) {
      // Recherche insensible aux accents : décompose "é" en "e" + accent
      // (NFD) puis retire les diacritiques combinants (U+0300 à U+036F).
      // Bornes construites via charCode plutôt qu'un caractère unicode
      // littéral dans le source, pour éviter tout souci d'encodage.
      const diacritics_start = String.fromCharCode(0x0300)
      const diacritics_end = String.fromCharCode(0x036f)
      const diacritics_pattern = new RegExp('[' + diacritics_start + '-' + diacritics_end + ']', 'g')
      return text.toLowerCase().normalize('NFD').replace(diacritics_pattern, '')
    },

    toggle_suggestions_modale() {
      this.suggestions_opened = !this.suggestions_opened
    },

    toggle_presets_modale() {
      this.presets_opened = !this.presets_opened
    },

    select_alphabet_preset(alphabet) {
      this.config.alphabet = alphabet
      this.update_game_configuration()
      this.presets_opened = false
    },

    toggle_scores_info_modale() {
      this.scores_info_opened = !this.scores_info_opened
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

.config-defaults-hint
  margin-top: 0.9rem
  font-size: 0.85em
  color: $grey
  line-height: 1.4

// Résumé "X tours · Ys / catégorie" sur l'écran principal — chips pilule
// courtes, cohérentes avec les autres accents pastille de l'app (boutons
// Suggestions/Presets), plus modernes qu'une phrase de texte grise.
.config-stats
  display: flex
  flex-wrap: wrap
  gap: 0.5rem
  margin-top: 0.9rem

.config-stat-chip
  display: inline-flex
  align-items: center
  padding: 0.35rem 0.85rem
  border-radius: 999px
  background: rgba($primary, 0.10)
  border: 1.5px solid rgba($primary, 0.22)
  color: $primary-dark
  font-size: 0.8em
  font-weight: 700
  white-space: nowrap

.time-per-category-field
  display: flex
  align-items: center
  flex-wrap: wrap
  gap: 0.9rem 1.2rem

  +mobile
    gap: 0.7rem

// Le wrapper o-tooltip rend en `.tooltip` (Bulma theme), affiché en
// `inline-flex` par défaut, il ne s'étire donc pas pour laisser le bouton
// `expanded` qu'il contient occuper toute la largeur du champ. Sans ce
// fix, le bouton "Démarrer la partie" reste centré sur une largeur de
// contenu au lieu de remplir la carte (et son centre décalé fait déborder
// la bulle d'info centrée dessus).
div.field > div.tooltip
  display: inline-block
  width: 100%

.is-date-desktop
  +mobile
    display: none
.is-date-mobile
  +tablet
    display: none

.game-configuration
  .categories-label-count
    display: flex
    align-items: center
    gap: 0.4rem

    .categories-count
      display: inline-flex
      align-items: center
      justify-content: center
      min-width: 1.5em
      height: 1.5em
      padding: 0 0.35em
      border-radius: 999px
      background: rgba($primary, 0.14)
      color: $primary-dark
      font-size: 0.72em
      font-weight: 700
      font-variant-numeric: tabular-nums

  label.label .suggestions-link
    text-align: right
    font-weight: normal !important

    a.suggestions-link-trigger
      display: inline-flex
      align-items: center
      gap: 0.35rem
      background: rgba($primary, 0.10)
      border: 1.5px solid rgba($primary, 0.30)
      border-radius: 20px
      padding: 0.2rem 0.7rem
      font-size: 0.82em
      font-weight: 600
      color: $primary-dark !important
      cursor: pointer
      text-decoration: none !important
      transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease
      white-space: nowrap

      .summer-icon
        margin-right: 0
        color: $primary-dark

      &:hover
        background: rgba($primary, 0.18)
        border-color: rgba($primary, 0.50)
        transform: translateY(-1px)
        box-shadow: 0 3px 10px rgba($primary, 0.18)

      &:active
        transform: translateY(0) scale(0.96)

      +mobile
        min-height: 2.4em
        padding: 0.3rem 0.9rem
        font-size: 0.85em
        box-shadow: 0 2px 8px rgba($primary, 0.12)

  input.input[disabled]
    background: transparent
    border: none
    padding: 0
    color: $grey-dark
    cursor: default

  div.taginput.control .taginput-container[disabled]
    position: relative
    left: -2px
    background-color: rgba(255, 245, 240, 0.7)
    border-color: rgba(255, 220, 190, 0.5)
    cursor: default

    .tag .delete
      display: none
    .autocomplete.control
      display: none

  // Les sliders Oruga + Bulma theme rendent en .slider (et non .o-slide)
  .slider
    &.has-lots-of-ticks
      +mobile
        .slider-track
          .slider-tick:nth-of-type(2n)
            display: none

    &.is-disabled
      .slider-track
        opacity: 1 !important
        cursor: default !important
        .slider-tick
          background: transparent

      .slider-thumb-wrapper
        display: none

  // Les switchs Oruga + Bulma theme rendent en .switch.control (et non .o-switch)
  .switch.is-disabled
    opacity: 1 !important
    .control-label
      color: $dark
      cursor: default

// Modals (suggestions, présélections d'alphabet, explication des scores) :
// même style estival partagé pour une cohérence visuelle sur les 3 popups.
div.modal-card.suggestions-card,
div.modal-card.presets-card,
div.modal-card.scores-info-card
  width: auto
  border-radius: 20px
  overflow: hidden

  +mobile
    width: 100%
    height: 100%
    max-height: 100vh
    margin: 0
    border-radius: 0
    background-color: #fff9f3

    p
      width: calc(100vw - 2rem)
      text-align: justify

  p:not(:first-child)
    margin-top: .8rem

  .modal-card-head
    background: linear-gradient(135deg, $primary 0%, $primary-dark 100%)
    border-bottom: none
    border-radius: 0

    .modal-card-title
      display: flex
      align-items: baseline
      flex-wrap: wrap
      gap: 0.5rem
      color: white
      font-weight: 700

      .suggestions-selected-count
        font-size: 0.7em
        font-weight: 600
        color: rgba(255, 255, 255, 0.85)
        white-space: nowrap

  .modal-card-body
    background: #fff9f3

  .modal-card-foot
    background: rgba(255, 245, 235, 0.9)
    border-top: 1px solid rgba(240, 175, 100, 0.2)
    padding: 0.9rem 1.5rem

  // Champ de recherche, collant en haut du corps scrollable pour rester
  // accessible même en bas d'une longue liste filtrée. Wrapper séparé (pas
  // de class directement sur o-input) : le prop `class` d'o-input atterrit
  // sur le <input> natif lui-même (pas sur un wrapper), ce qui casse le
  // rendu de l'icône si on y accroche aussi le positionnement sticky.
  //
  // Piège icône : la config Oruga globale (main.js) fixe rootClass:'control'
  // pour input, ce qui écrase la logique interne du thème Bulma qui ajoute
  // normalement `has-icons-left` sur `.control` quand un icon est présent.
  // Sans cette classe, l'icône `.icon.is-left` reste en flux normal au lieu
  // d'être positionnée en absolu sur l'input → positionnement refait à la
  // main ci-dessous plutôt que de dépendre de cette classe manquante.
  .suggestions-search
    position: sticky
    top: -1.25rem
    z-index: 2
    margin: 1.2rem 0 0.4rem
    padding-top: 0.4rem
    background: #fff9f3

    +mobile
      top: -1rem

    .control
      position: relative
      display: flex
      align-items: center

      .icon.is-left
        position: absolute
        left: 0.9rem
        top: 50%
        transform: translateY(-50%)
        pointer-events: none
        color: $grey
        z-index: 1

    input.input
      padding-left: 2.6rem
      border-radius: 14px
      background: white !important

  div.tags
    display: flex
    flex-wrap: wrap
    gap: 0.55rem
    margin-top: 1.1rem

    .tag:not(body)
      display: inline-flex
      align-items: center
      height: auto
      min-height: 2.3em
      padding: 0.35em 0.95em
      background: rgba(255, 255, 255, 0.85)
      border: 1.5px solid rgba(230, 150, 90, 0.35)
      color: #6B4419
      font-weight: 500
      border-radius: 999px
      white-space: normal
      text-align: left
      line-height: 1.25

      .tag-check
        margin-right: 0.35em
        font-weight: 700

    .tag:not(.is-static)
      cursor: pointer
      transition: all 0.15s ease

      &:hover
        background-color: rgba(255, 255, 255, 0.98)
        border-color: rgba(230, 150, 90, 0.6)
        transform: translateY(-1px)

      &.is-primary
        background: linear-gradient(135deg, $primary 0%, $primary-dark 100%)
        border-color: transparent
        color: white
        font-weight: 600
        box-shadow: 0 3px 10px rgba($primary, 0.28)

        &:hover
          background: $primary-dark
          transform: translateY(-1px) scale(1.02)

    .tag.is-static
      cursor: default
      opacity: 0.85

      &:hover
        transform: none

  article.notification
    margin-top: 1rem

  // Modal présélections d'alphabet
  .preset-group
    &:not(:first-child)
      margin-top: 1.3rem
      padding-top: 1.1rem
      border-top: 1px solid rgba(230, 150, 90, 0.25)

    h4
      color: #2D1B00
      font-size: 1.05em
      font-variant: all-small-caps
      letter-spacing: 1px
      font-weight: 700

    p
      color: $grey
      font-size: .9em

  .presets-footer-note
    margin-top: 1.4rem
    padding-top: 1rem
    border-top: 1px solid rgba(230, 150, 90, 0.25)
    font-size: .85em
    color: $grey

    a
      color: $primary-dark
      font-weight: 600
      text-decoration: none

  // Modal explication des scores
  .info-item
    &:not(:last-child)
      margin-bottom: 1rem
      padding-bottom: 1rem
      border-bottom: 1px solid rgba(230, 150, 90, 0.25)

    h4
      color: #2D1B00
      font-size: 1.05em
      font-variant: all-small-caps
      letter-spacing: 1px
      font-weight: 700
      margin-bottom: .2rem

    p
      color: $grey
      font-size: .9em

div.column.is-column-with-start-button
  display: flex
  flex-direction: column

  .field:not(.start-button)
    flex: 4

// Bouton toggle "Paramètres avancés"
.avanced-section-toggle
  margin-bottom: 1.5rem
  text-align: center
  color: $grey
  cursor: pointer
  font-size: 0.9em
  font-weight: 500
  letter-spacing: 0.03em
  transition: color 0.2s ease

  &.is-active
    color: $primary-dark

  &:hover
    color: $primary

  .icon
    position: relative
    top: 6px

.avanced-section
  .message-body
    border: none

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
