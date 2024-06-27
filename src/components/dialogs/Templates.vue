<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import SpaceList from '@/components/SpaceList.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'

import dayjs from 'dayjs'

const store = useStore()

const dialogElement = ref(null)
const resultsSectionElement = ref(null)

onMounted(() => {
  initUserTemplates()
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  updateHeight()
  if (value) {
    initUserTemplates()
  }
})

const state = reactive({
  dialogHeight: null,
  resultsSectionHeight: null,
  localSpaces: [],
  spaces: [],
  isLoadingRemoteSpaces: false
})

const parentDialog = computed(() => 'templates')
const changeSpace = (space) => {
  store.dispatch('currentSpace/changeSpace', space)
}

// templates

const initUserTemplates = () => {
  updateWithLocalSpaces()
  updateWithRemoteSpaces()
}

// user templates

const updateWithLocalSpaces = () => {
  let localSpaces = cache.getAllSpaces().filter(space => {
    return space.isTemplate
  })
  localSpaces = sortSpacesByEditedAt(localSpaces)
  state.localSpaces = localSpaces || []
  updateHeight()
}
const updateWithRemoteSpaces = async () => {
  const currentUserIsSignedIn = store.getters['currentUser/isSignedIn']
  if (!currentUserIsSignedIn) { return }
  state.isLoadingRemoteSpaces = true
  let remoteSpaces = await store.dispatch('api/getUserSpaces')
  remoteSpaces = remoteSpaces.filter(space => space.isTemplate)
  remoteSpaces = sortSpacesByEditedAt(remoteSpaces)
  state.localSpaces = remoteSpaces
  state.isLoadingRemoteSpaces = false
  updateHeight()
}
// copied from SpaceDetails.vue
const sortSpacesByEditedAt = (spaces) => {
  const sortedSpaces = spaces.sort((a, b) => {
    const bEditedAt = dayjs(b.editedAt).unix()
    const aEditedAt = dayjs(a.editedAt).unix()
    return bEditedAt - aEditedAt
  })
  return sortedSpaces
}

// dialog height

const updateHeight = () => {
  updateDialogHeight()
  updateResultsSectionHeight()
}
const updateResultsSectionHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = resultsSectionElement.value
  state.resultsSectionHeight = utils.elementHeight(element, true)
}
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

</script>

<template lang="pug">
dialog.templates.narrow(
  v-if="visible"
  :open="visible"
  @touchend.stop
  @click.left.stop
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
)
  section
    p Templates
  section(v-if="state.localSpaces.length < 1")
    p You haven't created any templates yet.
  section.results-section(v-else ref="resultsSectionElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="state.localSpaces"
      :showCategory="true"
      @selectSpace="changeSpace"
      :isLoading="state.isLoadingRemoteSpaces"
      :parentDialog="parentDialog"
    )
</template>

<style lang="stylus">
dialog.templates
  overflow auto
  .icon
    display inline-block
  .results-section
    .inline-badge
      &.learning
        background-color #f0e68c
        color var(--primary-on-light-background)
      &.life
        background-color #b9a8ff
        color var(--primary-on-light-background)
      &.work-school
        background-color #ffc0cb
        color var(--primary-on-light-background)
      &.product
        background-color #ee83ee
        color var(--primary-on-light-background)
</style>
