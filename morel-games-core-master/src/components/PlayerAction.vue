<template>
  <div
    class="panel-icon-right morel-player-action-icon"
    :class="{'is-permanent': permanent}"
    :aria-label="label"
    aria-haspopup="true"
    role="button"
  >
    <o-tooltip
      :label="label"
      position="bottom"
      :variant="type"
    >
      <o-icon :pack="pack" :icon="icon" size="small"></o-icon>
    </o-tooltip>
  </div>
</template>

<script>
export default {
  props: {
    permanent: { type: Boolean, default: false },
    label: { type: String, default: '', required: true },
    type: { type: String, default: 'light' },
    icon: { type: String, required: true },
    pack: { type: String, default: 'fas' }
  }
}
</script>

<style lang="sass">
@import "bulma/sass/utilities/_all"

.panel.morel-players-list .panel-block .panel-icon-right.morel-player-action-icon
  display: none
  color: $grey
  cursor: pointer

  &.is-permanent
    display: block
    color: $grey-light
    cursor: normal

  + .morel-player-action-icon
    margin-left: .8em
</style>
