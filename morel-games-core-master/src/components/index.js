import ShareGame from './ShareGame.vue'
import Players from './Players.vue'
import PlayerAction from './PlayerAction.vue'
import AskPseudonym from './AskPseudonym.vue'
import LocaleSwitcher from './LocaleSwitcher.vue'
import ConfirmModal from './ConfirmModal.vue'

const components = {
  'share-game': ShareGame,
  'players': Players,
  'player-action': PlayerAction,
  'ask-pseudonym': AskPseudonym,
  'locale-switcher': LocaleSwitcher,
  'confirm-modal': ConfirmModal
}

export default {
  install(app) {
    Object.keys(components).forEach(name => {
      app.component(`morel-${name}`, components[name])
    })
  }
}
