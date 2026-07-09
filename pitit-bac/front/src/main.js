import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createOruga, OrugaComponentPlugins } from '@oruga-ui/oruga-next'
import { bulmaConfig } from '@oruga-ui/theme-bulma'
import '@oruga-ui/theme-bulma/style.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCheck,
  faExclamationCircle,
  faLockOpen,
  faLock,
  faAngleRight,
  faAngleLeft,
  faAngleDown,
  faAngleUp,
  faCaretUp,
  faCaretDown,
  faXmark,
  faHourglassHalf,
  faUserSlash,
  faUserShield,
  faClipboard,
  faAward,
  faCircleNotch,
  faEye,
  faEyeSlash,
  faTimesCircle,
  faExclamationTriangle,
  faInfoCircle,
  faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { MorelI18n, MorelVue, initMorelStore, useMorelStore } from 'morel-games-core'
import { useGameStore, initGameStore } from './store.js'
import GameClient from './game.js'
import App from './App.vue'

// FontAwesome
library.add(
  faCheck,
  faExclamationCircle,
  faExclamationTriangle,
  faInfoCircle,
  faLockOpen,
  faLock,
  faAngleRight,
  faAngleLeft,
  faAngleDown,
  faAngleUp,
  faCaretUp,
  faCaretDown,
  faXmark,
  faTimesCircle,
  faHourglassHalf,
  faUserSlash,
  faUserShield,
  faClipboard,
  faAward,
  faCircleNotch,
  faEye,
  faEyeSlash,
  faMagnifyingGlass
)

// App bootstrap
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Oruga with Bulma theme + FontAwesome icon integration
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(createOruga({
  ...bulmaConfig,
  iconPack: 'fas',
  iconComponent: 'font-awesome-icon',
  // o-input doit produire <div class="control"><input class="input"> pour Bulma 0.9
  input: {
    ...bulmaConfig.input,
    rootClass: 'control',
    inputClass: 'input',
  },
}, OrugaComponentPlugins))

// WebSocket client
const client = new GameClient(
  import.meta.env.VITE_WS_URL.replace('{hostname}', document.location.hostname),
  'pb-protocol'
)

// i18n
const morelI18n = new MorelI18n(
  locale => import(/* @vite-ignore */ './../locales/' + locale + '.json'),
  { en: 'English', fr: 'Français' }
)

// Wire stores
initMorelStore(client, morelI18n)
initGameStore(client)

// Install i18n (must happen after pinia is installed)
app.use(morelI18n.i18n)

// Register morel Vue components (ask-pseudonym, players, share-game, locale-switcher)
app.use(MorelVue)

// Get store instances (pinia must be installed first)
const morelStore = useMorelStore()
const gameStore = useGameStore()

// Wire client ↔ stores
client.set_store(morelStore)
client.set_game_store(gameStore)

// Wire i18n → morel store (sets available locales)
morelI18n.set_store(morelStore)

// Langue par défaut : français, indépendamment de la langue du navigateur.
// On respecte quand même un choix explicite précédent (sélecteur de langue,
// persisté dans localStorage par MorelI18n), seul le cas "aucun choix connu"
// bascule sur 'fr' au lieu de l'auto-détection navigateur de
// load_locale_from_browser() (qui, elle, retomberait sur l'anglais pour
// n'importe quel navigateur non francophone).
morelI18n.load_locale(localStorage.getItem('morel-locale') || 'fr')

// Default configuration
morelStore.update_configuration({
  categories: [],
  stopOnFirstCompletion: true,
  turns: 4,
  time: 400,
  alphabet: '',
  scores: { valid: 10, duplicate: 5, invalid: 0, refused: 0, empty: 0 }
})

// Read slug from URL
const url_slug = window.location.pathname.slice(1).split('/')[0]
if (url_slug) {
  morelStore.action_set_slug(url_slug)
}

app.mount('#app')
