<template lang="pug">
dialog.narrow.tag-picker(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{top: position.top + 'px'}")
  section.info-section(v-if="!search")
    p
      img.icon.search(src="@/assets/search.svg")
      span Type to add or search tags
  section.results-section
    ul.results-list
      li(v-if="search" @click="selectTag(null, true)" @touchend.stop :class="{hover: focusOnName === search}")
        .badge.tag-badge(:style="{backgroundColor: searchTagColor}")
          span {{search}}
      li(v-for="tag in filteredTags" @click="selectTag(tag, true)" @touchend.stop :class="{hover: focusOnName === tag.name}")
        .badge.tag-badge(:style="{backgroundColor: tag.color}")
          span {{tag.name}}

    Loader(:visible="loading")
</template>

<script>
import scrollIntoView from '@/scroll-into-view.js'
import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import fuzzy from 'fuzzy'
import last from 'lodash-es/last'

export default {
  name: 'TagPicker',
  components: {
    Loader
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerPickerNavigationKey') {
        const key = mutation.payload
        const searchTag = [{
          name: this.search,
          color: this.currentUserColor
        }]
        const tags = searchTag.concat(this.filteredTags)
        const currentIndex = tags.findIndex(tag => tag.name === this.focusOnName)
        if (!utils.arrayHasItems(this.filteredTags)) {
          this.closeDialog()
        } else if (key === 'ArrowUp') {
          this.focusPreviousItem(tags, currentIndex)
        } else if (key === 'ArrowDown') {
          this.focusNextItem(tags, currentIndex)
        }
      }
      if (mutation.type === 'triggerPickerSelect') {
        const searchTag = [{
          name: this.search,
          color: this.searchTagColor
        }]
        const tags = searchTag.concat(this.filteredTags)
        const currentTag = tags.find(tag => tag.name === this.focusOnName)
        this.selectTag(currentTag)
      }
    })
  },
  props: {
    visible: Boolean,
    position: Object,
    search: String,
    cursorPosition: Number
  },
  data () {
    return {
      tags: [],
      loading: false,
      focusOnName: ''
    }
  },
  computed: {
    currentUserColor () { return this.$store.state.currentUser.color },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    filteredTags () {
      let tags = this.tags.filter(tag => {
        return tag.name !== this.search
      })
      const options = {
        pre: '',
        post: '',
        extract: (item) => {
          let name = item.name || ''
          return name
        }
      }
      const filtered = fuzzy.filter(this.search, tags, options)
      tags = filtered.map(item => item.original)
      return tags.slice(0, 5)
    },
    searchTagColor () {
      let tag = this.tags.find(tag => {
        return tag.name === this.search
      })
      if (tag) {
        return tag.color
      } else {
        return this.currentUserColor
      }
    }
  },
  methods: {
    updateTags () {
      const spaceTags = this.$store.getters['currentSpace/spaceTags']()
      this.tags = spaceTags || []
      const cachedTags = cache.allTags()
      const mergedTags = utils.mergeArrays({ previous: spaceTags, updated: cachedTags, key: 'name' })
      this.tags = mergedTags
      this.updateRemoteTags()
    },
    async updateRemoteTags () {
      if (!this.currentUserIsSignedIn) { return }
      const remoteTagsIsFetched = this.$store.state.remoteTagsIsFetched
      let remoteTags
      if (remoteTagsIsFetched) {
        remoteTags = this.$store.state.remoteTags
      } else {
        this.loading = true
        remoteTags = await this.$store.dispatch('api/getUserTags') || []
        this.$store.commit('remoteTags', remoteTags)
        this.$store.commit('remoteTagsIsFetched', true)
        this.loading = false
      }
      const mergedTags = utils.mergeArrays({ previous: this.tags, updated: remoteTags, key: 'name' })
      this.tags = mergedTags
    },
    selectTag (tag, shouldCloseDialog) {
      const searchTag = {
        name: this.search,
        color: this.searchTagColor
      }
      tag = tag || searchTag
      this.$emit('selectTag', tag)
      if (shouldCloseDialog) {
        this.closeDialog()
      }
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },

    focusPreviousItem (tags, currentIndex) {
      const firstItemIsFocused = this.search === this.focusOnName
      const firstItem = tags[0]
      const previousItem = tags[currentIndex - 1]
      if (firstItemIsFocused) {
        this.closeDialog()
      } else if (previousItem) {
        this.focusOnName = previousItem.name
      } else {
        this.focusOnName = firstItem.name
      }
    },
    focusNextItem (tags, currentIndex) {
      const lastItem = last(tags)
      const lastItemIsFocused = lastItem.name === this.focusOnName
      const nextItem = tags[currentIndex + 1]
      if (lastItemIsFocused) {
        this.closeDialog()
      } else if (nextItem) {
        this.focusOnName = nextItem.name
      } else {
        this.focusOnName = lastItem.name
      }
    },
    closeDialog () {
      this.$emit('closeDialog')
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateTags()
        this.$nextTick(() => {
          this.scrollIntoView()
        })
      }
    },
    search (newSearch) {
      this.focusOnName = newSearch
    }
  }
}
</script>

<style lang="stylus">
.tag-picker
  .loader
    margin-left 6px
  .info-section
    padding-bottom 4px
  .results-section
    &:first-child
      padding-top 4px
</style>