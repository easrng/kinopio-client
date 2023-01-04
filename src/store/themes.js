import utils from '@/utils.js'

const themes = {
  light: {
    name: 'light',
    colors: {
      'primary': 'black',
      'primary-background': 'white',
      'text-link': '#143997',
      'primary-transparent': 'rgba(0,0,0,0.5)',
      'secondary-background': '#e3e3e3',
      'secondary-hover-background': '#d8d8d8',
      'secondary-active-background': '#cdcdcd',
      'danger-background': '#ffb8b3',
      'danger-hover-background': '#ffa49e',
      'danger-active-background': '#ff928b',
      'info-background': '#90ffff',
      'success-background': '#67ffbb',
      'search-background': 'yellow',
      'button-border': '#999',
      'text-link-dark': '#9ab2ee',
      'secondary-active-background-dark': '#666',
      'light-shadow': 'rgba(0,0,0,0.20)',
      'heavy-shadow': 'rgba(0,0,0,0.25)'
    }
  },
  dark: {
    name: 'dark',
    colors: {
      'primary': 'black',
      'primary-background': 'white',
      'text-link': '#143997',
      'primary-transparent': 'rgba(0,0,0,0.5)',
      'secondary-background': '#e3e3e3',
      'secondary-hover-background': '#d8d8d8',
      'secondary-active-background': '#cdcdcd',
      'danger-background': '#ffb8b3',
      'danger-hover-background': '#ffa49e',
      'danger-active-background': '#ff928b',
      'info-background': '#90ffff',
      'success-background': '#67ffbb',
      'search-background': 'yellow',
      'button-border': '#999',
      'text-link-dark': '#9ab2ee',
      'secondary-active-background-dark': '#666',
      'light-shadow': 'rgba(0,0,0,0.20)',
      'heavy-shadow': 'rgba(0,0,0,0.25)'
    }
  }
}

export default {
  namespaced: true,
  state: {
    currentTheme: {}
  },
  mutations: {
    currentTheme: (state, theme) => {
      utils.typeCheck({ value: theme, type: 'object' })
      state.currentTheme = theme
    }
  },
  actions: {
    update: (context, themeName) => {
      // colors
      const theme = context.getters.themeByName(themeName)
      const colors = theme.colors
      let keys = Object.keys(colors)
      keys.forEach(key => {
        utils.setCssVariable(key, colors[key])
      })
      context.commit('currentTheme', theme)
      // consts
      const consts = {
        'hover-shadow': `3px 3px 0 var(--heavy-shadow)`,
        'active-shadow': `5px 5px 0 var(--light-shadow)`,
        'active-inset-shadow': `inset 0 2px 3px var(--light-shadow)`,
        'button-hover-shadow': `2px 2px 0 var(--heavy-shadow)`,
        'button-active-inset-shadow': `inset 0 1px 2px var(--heavy-shadow)`
      }
      keys = Object.keys(consts)
      keys.forEach(key => {
        utils.setCssVariable(key, consts[key])
      })
    },
    restore: (context) => {
      const themeName = context.rootState.currentUser.theme
      context.dispatch('update', themeName)
    }
  },
  getters: {
    themeByName: () => (themeName) => {
      return themes[themeName]
    }
    // defaultLightCardColor
    // defaultDarkCardColor
    // defaultLightSpaceBackground
    // defaultDarkSpaceBackground
  }
}
