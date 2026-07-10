<template>
  <div class="ask-pseudonym">
    <o-field :variant="unfilled_error ? 'danger' : type" addons>
      <template #label>{{ $t(label) }}</template>
      <o-input
        :placeholder="$t(placeholder)"
        :size="size"
        expanded
        :maxlength="maxlength"
        v-model.trim="pseudonym"
        @keyup.enter="start_game"
        autofocus
      ></o-input>
      <p class="control">
        <button
          class="button"
          :class="[size ? 'is-' + size : '', type ? 'is-' + type : '']"
          :aria-label="$t(labelButton)"
          @click="start_game"
        >
          <o-icon icon="chevron-right"></o-icon>
        </button>
      </p>
    </o-field>

    <p class="joining-existing-game" v-if="is_existing_game && !kick_reason">
      <slot name="existing">
        {{ $t("You're joining an existing game.") }}<br />
        <i18n-t keypath="If you wish, you can also {create_new_game}.">
          <template #create_new_game>
            <a href="#" @click.prevent="erase_slug">{{ $t("create a new game") }}</a>
          </template>
        </i18n-t>
      </slot>
    </p>

    <slot name="error" v-bind:reason="kick_reason">
      <div v-if="kick_reason" class="message kick-reason" :class="kick_reason === 'ended' ? 'is-warning' : 'is-danger'">
        <div class="message-body">
          <p>
            <template v-if="kick_reason === 'locked'">
              {{ $t("You cannot join this game because it's locked.") }}
            </template>
            <template v-else-if="kick_reason === 'ended'">
              {{ $t('The game master ended this game for everyone.') }}
            </template>
            <template v-else>
              {{ $t("You got kicked out of the game.") }}
            </template>
          </p>
          <p>
            <o-button variant="danger" @click="create_new_game">{{ $t("Create a new game") }}</o-button>
          </p>
        </div>
      </div>
    </slot>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useMorelStore } from '../game/store.js'

export default {
  props: {
    label: { type: String, default: "What's your name?" },
    'label-button': { type: String, default: 'Join the game' },
    placeholder: { type: String, default: 'Enter your name…' },
    type: { type: String, default: 'primary' },
    size: { type: String, default: 'large' },
    maxlength: { type: Number, default: 32 }
  },

  data() {
    return {
      pseudonym: '',
      unfilled_error: false,
      starting: false
    }
  },

  computed: {
    ...mapState(useMorelStore, {
      is_existing_game: state => !!state.slug,
      kick_reason: state => state.kick_reason
    })
  },

  mounted() {
    this.pseudonym = localStorage.getItem('morel-pseudonym') || ''
  },

  methods: {
    start_game() {
      if (this.pseudonym) {
        this.starting = true
        setTimeout(() => { this.starting = false }, 1000)
        localStorage.setItem('morel-pseudonym', this.pseudonym)
        useMorelStore().set_pseudonym_and_connect(this.pseudonym)
      } else {
        this.unfilled_error = true
        setTimeout(() => { this.unfilled_error = false }, 2500)
      }
    },
    erase_slug() {
      const store = useMorelStore()
      store.action_set_slug('')
      store.set_kick_reason(null)
    },
    create_new_game() {
      this.erase_slug()
      this.start_game()
    }
  }
}
</script>

<style lang="sass">
@import "bulma/sass/utilities/mixins"

.ask-pseudonym
  .field
    &.has-addons-centered
      text-align: center
    &.has-addons-right
      text-align: right
  +mobile
    padding: 0 1rem

div.field div.field
  margin-top: 2em !important

p.joining-existing-game
  text-align: center

.kick-reason
  margin: auto
  width: 100%

  +mobile
    width: 100%

  .message-body
    border: none

    p
      text-align: center

      & + p
        margin-top: 1rem
</style>
