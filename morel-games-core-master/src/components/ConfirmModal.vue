<template>
  <o-modal v-model:active="local_active" teleport animation="modal-pop">
    <div class="modal-card confirm-modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ title }}</p>
      </header>
      <section class="modal-card-body">
        <p v-html="message"></p>
        <p class="confirm-modal-help" v-if="help" v-html="help"></p>
      </section>
      <footer class="modal-card-foot confirm-modal-foot">
        <o-button @click="cancel">{{ cancelLabel || $t('Cancel') }}</o-button>
        <o-button :variant="variant" @click="confirm">{{ confirmLabel || $t('Confirm') }}</o-button>
      </footer>
    </div>
  </o-modal>
</template>

<script>
export default {
  props: {
    active: { type: Boolean, default: false },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    help: { type: String, default: '' },
    'confirm-label': { type: String, default: '' },
    'cancel-label': { type: String, default: '' },
    variant: { type: String, default: 'danger' }
  },

  emits: ['update:active', 'confirm', 'cancel'],

  computed: {
    local_active: {
      get() { return this.active },
      set(value) { this.$emit('update:active', value) }
    }
  },

  methods: {
    confirm() {
      this.$emit('confirm')
      this.local_active = false
    },
    cancel() {
      this.$emit('cancel')
      this.local_active = false
    }
  }
}
</script>

<style lang="sass">
@import "bulma/sass/utilities/_all"

.confirm-modal-card
  .confirm-modal-help
    margin-top: 1rem
    opacity: 0.75
    font-size: 0.92em

  .confirm-modal-foot
    display: flex
    flex-direction: column-reverse
    gap: 0.6rem

    .button
      width: 100%
      min-height: 44px

    +tablet
      flex-direction: row

      .button
        flex: 1
</style>
