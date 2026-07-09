<template>
  <o-dropdown v-model="current_locale" :position="position" aria-role="list">
    <template #trigger>
      <o-button
        variant="text"
        size="small"
        icon-right="caret-up"
        :loading="locale_loading"
        :disabled="locale_loading"
      >
        {{ locales[current_locale] }}
      </o-button>
    </template>

    <o-dropdown-item
      v-for="(locale, i) in Object.keys(locales)"
      :key="i"
      :value="locale"
      aria-role="listitem"
    >
      {{ locales[locale] }}
    </o-dropdown-item>
  </o-dropdown>
</template>

<script>
import { mapState } from 'pinia'
import { useMorelStore } from '../game/store.js'

export default {
  props: {
    position: { type: String, default: 'top-right' }
  },

  computed: {
    ...mapState(useMorelStore, ['locales', 'locale_loading']),
    current_locale: {
      get() {
        return this.$i18n.locale
      },
      set(locale) {
        useMorelStore().set_locale(locale)
      }
    }
  }
}
</script>

<style lang="sass" scoped>
@import "bulma/sass/utilities/all"

button.button.is-text
  padding-left: 1.2rem
  padding-right: 1.2rem
  font-size: 1em
  text-decoration: none
</style>
