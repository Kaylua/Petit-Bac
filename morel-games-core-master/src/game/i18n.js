import { createI18n } from 'vue-i18n'

export const MorelI18n = class {
  constructor(locale_loader, available_locales) {
    this.store = null
    this.locale_loader = locale_loader
    this.available_locales = available_locales
    this.loaded_locales = ['en']
    this.morel_built_in_locales = ['fr']

    this.i18n = createI18n({
      legacy: true,
      locale: 'en',
      fallbackLocale: 'en',
      formatFallbackMessages: true,
      silentFallbackWarn: true,
      messages: {}
    })
  }

  set_store(morelStore) {
    this.store = morelStore
    this.store.set_locales(this.available_locales)
  }

  _set_already_loaded_locale(locale) {
    this.i18n.global.locale.value = locale
    document.querySelector('html').setAttribute('lang', locale)
    localStorage.setItem('morel-locale', locale)
    return locale
  }

  load_locale(locale) {
    if (this.i18n.global.locale.value === locale || this.loaded_locales.includes(locale)) {
      return Promise.resolve(this._set_already_loaded_locale(locale))
    }

    const morel_locale_promise = this.morel_built_in_locales.includes(locale)
      ? import(/* @vite-ignore */ './../../locales/' + locale + '.json')
      : Promise.resolve({})

    return morel_locale_promise.then(morel_messages => {
      return this.locale_loader(locale)
        .then(app_messages => {
          this.i18n.global.setLocaleMessage(locale, {
            ...(morel_messages.default || {}),
            ...(app_messages.default || {})
          })
          this.loaded_locales.push(locale)
          return this._set_already_loaded_locale(locale)
        })
        .catch(() => {
          if (!locale.includes('-')) return
          const locale_parts = locale.split('-')
          locale_parts.pop()
          return this.load_locale(locale_parts.join('-'))
        })
    })
  }

  load_locale_from_browser() {
    const stored_locale = localStorage.getItem('morel-locale')
    if (stored_locale) this.load_locale(stored_locale)
    else this.load_locale(navigator.language)
  }
}
