<template>
  <div class="number-stepper" :class="{ 'is-disabled': disabled }">
    <button
      type="button"
      class="stepper-btn stepper-minus"
      :disabled="disabled || modelValue <= min"
      :aria-label="$t('Decrease')"
      @click="step_value(-step)"
    >−</button>
    <span class="stepper-value">{{ modelValue }}{{ suffix }}</span>
    <button
      type="button"
      class="stepper-btn stepper-plus"
      :disabled="disabled || modelValue >= max"
      :aria-label="$t('Increase')"
      @click="step_value(step)"
    >+</button>
  </div>
</template>

<script>
export default {
  name: 'NumberStepper',

  props: {
    modelValue: { type: Number, required: true },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    suffix: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  },

  emits: ['update:modelValue', 'change'],

  methods: {
    step_value(delta) {
      const next = Math.min(this.max, Math.max(this.min, this.modelValue + delta))
      if (next === this.modelValue) return
      this.$emit('update:modelValue', next)
      this.$emit('change', next)
    }
  }
}
</script>

<style lang="sass">
@import "bulma/sass/utilities/_all"
@import "../assets/variables"

// Contrôle +/- : cible tactile large (48px, > les 44px WCAG 2.5.5) plutôt
// qu'un slider à glisser, imprécis au doigt sur mobile.
.number-stepper
  display: inline-flex
  align-items: stretch
  border: 1.5px solid $border
  border-radius: 14px
  overflow: hidden
  background: rgba(255, 253, 249, 0.9)
  width: fit-content

  &.is-disabled
    opacity: 0.55

  .stepper-btn
    -webkit-appearance: none
    appearance: none
    border: none
    background: transparent
    width: 48px
    height: 48px
    flex-shrink: 0
    font-size: 1.4rem
    font-weight: 700
    line-height: 1
    color: $primary-dark
    cursor: pointer
    display: flex
    align-items: center
    justify-content: center
    transition: background 0.15s ease

    &:hover:not(:disabled)
      background: rgba($primary, 0.10)

    &:active:not(:disabled)
      background: rgba($primary, 0.18)

    &:disabled
      color: $grey-light
      cursor: default

  .stepper-value
    display: flex
    align-items: center
    justify-content: center
    min-width: 4.2em
    text-align: center
    font-weight: 700
    font-size: 1.1rem
    color: #2D1B00
    padding: 0 0.4rem
    font-variant-numeric: tabular-nums

    +mobile
      min-width: 3.6em
</style>
