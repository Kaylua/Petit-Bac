import ShareGame from './ShareGame.vue'
import Players from './Players.vue'
import PlayerAction from './PlayerAction.vue'
import AskPseudonym from './AskPseudonym.vue'
import LocaleSwitcher from './LocaleSwitcher.vue'

const components = {
  'share-game': ShareGame,
  'players': Players,
  'player-action': PlayerAction,
  'ask-pseudonym': AskPseudonym,
  'locale-switcher': LocaleSwitcher
}

export default {
  install(app) {
    Object.keys(components).forEach(name => {
      app.component(`morel-${name}`, components[name])
    })
  }
}
