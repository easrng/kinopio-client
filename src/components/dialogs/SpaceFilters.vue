<template lang="pug">
dialog.narrow.space-filters(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p Space Filters
  section
    button(@click.left="clearAllFilters")
      img.icon.cancel(src="@/assets/add.svg")
      span Clear all

    .row
      .checkbox-wrap
        label(:class="{active: showHiddenSpace}")
          input(type="checkbox" v-model="showHiddenSpace")
          img.icon(v-if="!showHiddenSpace" src="@/assets/view.svg")
          img.icon(v-if="showHiddenSpace" src="@/assets/view-hidden.svg")
          span Hidden Spaces

    .segmented-buttons
      button(@click="showAllSpaces" :class="{active: allIsActive}") All
      button(@click="showSpacesOnly" :class="{active: spacesIsActive}") Normal
      button(@click="showJournalsOnly" :class="{active: journalsIsActive}")
        MoonPhase(:moonPhase="moonPhase.name")
        span Journals

  section.results-section.collaborators
    UserList(:users="spaceUsers" :isClickable="true" @selectUser="filterByUser" :selectedUser="dialogSpaceFilterByUser")

</template>

<script>
import MoonPhase from '@/components/MoonPhase.vue'
import moonphase from '@/moonphase.js'
import UserList from '@/components/UserList.vue'

import uniqBy from 'lodash-es/uniqBy'

export default {
  name: 'SpaceFilters',
  components: {
    MoonPhase,
    UserList
  },
  props: {
    visible: Boolean,
    spaces: Array
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerClearAllSpaceFilters') {
        this.clearAllFilters()
      }
    })
  },
  mounted () {
    this.moonPhase = moonphase()
  },
  data () {
    return {
      moonPhase: {}
    }
  },
  computed: {
    dialogSpaceFilters () { return this.$store.state.currentUser.dialogSpaceFilters },
    dialogSpaceFilterByUser () { return this.$store.state.currentUser.dialogSpaceFilterByUser },
    allIsActive () {
      return Boolean(!this.dialogSpaceFilters)
    },
    journalsIsActive () {
      return this.dialogSpaceFilters === 'journals'
    },
    spacesIsActive () {
      return this.dialogSpaceFilters === 'spaces'
    },
    spaceUsers () {
      const currentUserId = this.$store.state.currentUser.id
      const spaces = this.spaces.filter(space => space.userId !== currentUserId)
      let users = spaces.map(space => space.users[0])
      users = users.filter(user => Boolean(user))
      users = uniqBy(users, 'id')
      return users
    },
    showHiddenSpace: {
      get () {
        return this.$store.state.currentUser.dialogSpaceFilterShowHidden
      },
      set () {
        this.toggleShowHiddenSpace()
      }
    }
  },
  methods: {
    toggleShowHiddenSpace () {
      const value = !this.$store.state.currentUser.dialogSpaceFilterShowHidden
      this.$store.dispatch('currentUser/update', { dialogSpaceFilterShowHidden: value })
    },
    showJournalsOnly () {
      this.updateFilter('journals')
    },
    showSpacesOnly () {
      this.updateFilter('spaces')
    },
    showAllSpaces () {
      this.updateFilter(null)
    },
    updateFilter (value) {
      this.$store.dispatch('currentUser/update', { dialogSpaceFilters: value })
    },
    updateUserFilter (value) {
      this.$store.dispatch('currentUser/update', { dialogSpaceFilterByUser: value })
    },
    filterByUser (event, user) {
      if (user.id === this.dialogSpaceFilterByUser.id) {
        this.updateUserFilter({})
      } else {
        this.updateUserFilter(user)
      }
    },
    clearAllFilters () {
      this.showAllSpaces()
      this.updateUserFilter({})
      this.$store.dispatch('currentUser/update', { dialogSpaceFilterShowHidden: false })
    }
  }
}
</script>

<style lang="stylus">
.space-filters
  @media(max-width 560px)
    left -100px
  @media(max-width 430px)
    left -190px
  @media(max-width 370px)
    left -240px
  .collaborators
    max-height calc(100vh - 200px)
  button + .row
    margin-top 10px
  .cancel
    vertical-align 0
</style>
