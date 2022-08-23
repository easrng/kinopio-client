<template lang="pug">
.box(
  :key="box.id"
  :data-box-id="box.id"
  :data-is-locked="isLocked"
  :style="styles"
  :class="{hover: isHover, active: isDragging, 'box-jiggle': isDragging, 'is-resizing': isResizing}"
)

  //- name
  .box-info(
    :data-box-id="box.id"
    :style="labelStyles"
    :class="{unselectable: isPainting}"
    tabindex="0"

    @mouseover="updateIsHover(true)"
    @mouseleave="updateIsHover(false)"
    @mousedown.left="startBoxInfoInteraction"

    @mouseup.left="showBoxDetails"
    @keyup.stop.enter="showBoxDetails"

    @touchstart="startLocking"
    @touchmove="updateCurrentTouchPosition"
    @touchend="showBoxDetailsTouch"

    @click="selectAllContainedCards"
  )
    .locking-frame(v-if="isLocking" :style="lockingFrameStyle")
    template(v-if="isH1")
      h1 {{h1Name}}
    template(v-else-if="isH2")
      h2 {{h2Name}}
    template(v-else)
      span {{box.name}}

    .selected-user-avatar(v-if="isRemoteSelected || isRemoteBoxDetailsVisible" :style="{backgroundColor: remoteSelectedColor || remoteBoxDetailsVisibleColor}")
      img(src="@/assets/anon-avatar.svg")

  .lock-button-wrap.inline-button-wrap(v-if="isLocked")
    button.inline-button(tabindex="-1" :style="{background: color}")
      img.icon.lock-icon(src="@/assets/lock.svg")

  //- resize
  .bottom-button-wrap(v-if="!isLocked" :class="{unselectable: isPainting}")
    .resize-button-wrap.inline-button-wrap(
        @pointerover="updateIsHover(true)"
        @pointerleave="updateIsHover(false)"
        @mousedown.left="startResizing"
        @touchstart="startResizing"
      )
      button.inline-button.resize-button(
        tabindex="-1"
        :style="{background: color}"
      )
        img.resize-icon.icon(src="@/assets/resize.svg")

  //- fill
  .background.filled(v-if="hasFill" :style="{background: color}")

</template>

<script>
import utils from '@/utils.js'

import randomColor from 'randomcolor'

const borderWidth = 2
// let prevCursor

// locking
// long press to touch drag card
const lockingPreDuration = 100 // ms
const lockingDuration = 100 // ms
let lockingAnimationTimer, lockingStartTime, shouldCancelLocking
let isMultiTouch
let initialTouchEvent = {}
let touchPosition = {}
let currentTouchPosition = {}

export default {
  name: 'Box',
  props: {
    box: Object
  },
  data () {
    return {
      isHover: false,
      isLocking: false,
      lockingPercent: 0,
      lockingAlpha: 0
    }
  },
  computed: {
    normalizedBox () {
      return this.normalizeBox(this.box)
    },
    styles () {
      let { x, y, resizeWidth, resizeHeight } = this.normalizedBox
      const width = resizeWidth
      const height = resizeHeight
      return {
        left: x + 'px',
        top: y + 'px',
        width: width + 'px',
        height: height + 'px',
        border: `${borderWidth}px solid ${this.color}`
      }
    },
    isSelected () {
      const selectedIds = this.$store.state.multipleBoxesSelectedIds
      return selectedIds.includes(this.box.id)
    },
    isLocked () { return this.box.isLocked },
    userColor () { return this.$store.state.currentUser.color },
    color () {
      const remoteColor = this.remoteBoxDetailsVisibleColor || this.remoteSelectedColor || this.remoteUserResizingBoxesColor || this.remoteBoxDraggingColor
      if (remoteColor) {
        return remoteColor
      } else if (this.isSelected) {
        return this.userColor
      } else {
        return this.normalizedBox.color
      }
    },
    fill () { return this.normalizedBox.fill },
    hasFill () { return this.fill !== 'empty' },
    labelStyles () {
      return {
        backgroundColor: this.color
      }
    },
    isPainting () { return this.$store.state.currentUserIsPainting },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    isDragging () {
      const isDragging = this.$store.state.currentUserIsDraggingBox
      const isCurrent = this.$store.state.currentDraggingBoxId === this.box.id
      return isDragging && (isCurrent || this.isSelected)
    },
    isResizing () {
      const isResizing = this.$store.state.currentUserIsResizingBox
      const isCurrent = this.$store.state.currentUserIsResizingBoxIds.includes(this.box.id)
      return isResizing && isCurrent
    },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    isH1 () {
      const pattern = 'h1Pattern'
      return this.nameHasPattern(pattern)
    },
    isH2 () {
      const pattern = 'h2Pattern'
      return this.nameHasPattern(pattern)
    },
    h1Name () {
      return this.box.name.replace('# ', '')
    },
    h2Name () {
      return this.box.name.replace('## ', '')
    },
    canEditBox () { return this.$store.getters['currentUser/canEditBox']() },
    lockingFrameStyle () {
      const initialPadding = 65 // matches initialLockCircleRadius in magicPaint
      const initialBorderRadius = 50
      const padding = initialPadding * this.lockingPercent
      const borderRadius = Math.max((this.lockingPercent * initialBorderRadius), 5) + 'px'
      const size = `calc(100% + ${padding}px)`
      const position = -(padding / 2) + 'px'
      return {
        width: size,
        height: size,
        left: position,
        top: position,
        background: this.userColor,
        opacity: this.lockingAlpha,
        borderRadius: borderRadius
      }
    },
    multipleBoxesIsSelected () { return Boolean(this.$store.state.multipleBoxesSelectedIds.length) },
    currentBoxIsSelected () {
      const selected = this.$store.state.multipleBoxesSelectedIds
      return selected.find(id => this.box.id === id)
    },
    selectedBoxes () {
      return this.$store.getters['currentBoxes/isSelected']
    },

    // Remote

    isRemoteSelected () {
      const remoteBoxesSelected = this.$store.state.remoteBoxesSelected
      const selectedBox = remoteBoxesSelected.find(box => box.boxId === this.box.id)
      return Boolean(selectedBox)
    },
    isRemoteBoxDetailsVisible () {
      const remoteBoxDetailsVisible = this.$store.state.remoteBoxDetailsVisible
      const visibleBox = remoteBoxDetailsVisible.find(box => box.boxId === this.box.id)
      return Boolean(visibleBox)
    },
    remoteBoxDetailsVisibleColor () {
      const remoteBoxDetailsVisible = this.$store.state.remoteBoxDetailsVisible
      const visibleBox = remoteBoxDetailsVisible.find(box => box.boxId === this.box.id)
      if (visibleBox) {
        const user = this.$store.getters['currentSpace/userById'](visibleBox.userId)
        return user.color
      } else {
        return undefined
      }
    },
    isRemoteBoxDragging () {
      const remoteBoxesDragging = this.$store.state.remoteBoxesDragging
      const isDragging = remoteBoxesDragging.find(box => box.boxId === this.box.id)
      return Boolean(isDragging)
    },
    remoteSelectedColor () {
      const remoteBoxesSelected = this.$store.state.remoteBoxesSelected
      const selectedBox = remoteBoxesSelected.find(box => box.boxId === this.box.id)
      if (selectedBox) {
        const user = this.$store.getters['currentSpace/userById'](selectedBox.userId)
        return user.color
      } else {
        return undefined
      }
    },
    remoteUserResizingBoxesColor () {
      const remoteUserResizingBoxes = this.$store.state.remoteUserResizingBoxes
      if (!remoteUserResizingBoxes.length) { return }
      let user = remoteUserResizingBoxes.find(user => user.boxIds.includes(this.box.id))
      if (user) {
        user = this.$store.getters['currentSpace/userById'](user.userId)
        return user.color
      } else {
        return undefined
      }
    },
    remoteBoxDraggingColor () {
      const remoteBoxesDragging = this.$store.state.remoteBoxesDragging
      const draggingBox = remoteBoxesDragging.find(box => box.boxId === this.box.id)
      if (draggingBox) {
        const user = this.$store.getters['currentSpace/userById'](draggingBox.userId)
        return user.color
      } else {
        return undefined
      }
    }

  },
  methods: {
    normalizeBox (box) {
      const init = 200
      box = utils.clone(box)
      box.resizeWidth = box.resizeWidth || init
      box.resizeHeight = box.resizeHeight || init
      box.color = box.color || randomColor({ luminosity: 'light' })
      box.fill = box.fill || 'filled'
      return box
    },
    startResizing (event) {
      if (!this.canEditSpace) { return }
      if (utils.isMultiTouch(event)) { return }
      this.$store.dispatch('history/pause')
      this.$store.dispatch('closeAllDialogs', 'Card.startResizing')
      this.$store.commit('currentUserIsResizingBox', true)
      this.$store.commit('preventMultipleSelectedActionsIsVisible', true)
      let boxIds = [this.box.id]
      const multipleBoxesSelectedIds = this.$store.state.multipleBoxesSelectedIds
      if (multipleBoxesSelectedIds.length) {
        boxIds = multipleBoxesSelectedIds
      }
      this.$store.commit('currentUserIsResizingBoxIds', boxIds)
      const updates = {
        userId: this.$store.state.currentUser.id,
        boxIds: boxIds
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteUserResizingBoxes' })
      event.preventDefault() // allows resizing box without scrolling on mobile
    },
    startBoxInfoInteraction (event) {
      if (!this.currentBoxIsSelected) {
        this.$store.dispatch('clearMultipleSelected')
      }
      this.$store.commit('currentDraggingBoxId', '')
      this.$store.dispatch('closeAllDialogs', 'Box.startBoxInfoInteraction')
      this.$store.commit('currentUserIsDraggingBox', true)
      this.$store.commit('currentDraggingBoxId', this.box.id)
      const updates = {
        boxId: this.box.id,
        userId: this.$store.state.currentUser.id
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'addToRemoteBoxesDragging' })
      if (event.shiftKey) { return } // should not select contained cards if shift key
      this.selectContainedCards()
    },
    selectAllContainedCards (event) {
      const isMeta = event.metaKey || event.ctrlKey
      if (!isMeta) { return }
      if (!this.canEditSpace) { return }
      this.selectContainedCards()
      this.$store.commit('currentDraggingBoxId', '')
      this.$store.dispatch('closeAllDialogs', 'Box.selectAllContainedCards')
    },
    selectContainedCards () {
      const cardMap = this.$store.state.currentCards.cardMap
      cardMap.forEach(card => {
        if (this.isCardInSelectedBoxes(card)) {
          this.$store.dispatch('addToMultipleCardsSelected', card.id)
        }
      })
      if (!this.multipleBoxesIsSelected) {
        this.$store.commit('preventMultipleSelectedActionsIsVisible', true)
      }
    },
    isCardInSelectedBoxes (card) {
      if (card.isLocked) { return }
      const canEditCard = this.$store.getters['currentUser/canEditCard'](card)
      if (!canEditCard) { return }
      const boxes = this.selectedBoxes
      const isInside = boxes.find(box => {
        box = this.normalizeBox(box)
        const { x, y } = box
        const width = box.resizeWidth
        const height = box.resizeHeight
        // ┌─────────────────────────────────────┐
        // │ Box                                 │
        // │                                     │
        // │                                     │
        // │                                     │
        // │      x1 = x          x2 = x + w     │
        // │         ██───────────────██         │
        // │         │                 │         │
        // │         │      Card       │         │
        // │         │                 │         │
        // │         ██───────────────██         │
        // │      y1 = y          y2 = y + h     │
        // │                                     │
        // │                                     │
        // │                                     │
        // │                                     │
        // └─────────────────────────────────────┘
        const x1 = utils.isBetween({
          value: card.x,
          min: x,
          max: x + width
        })
        const x2 = utils.isBetween({
          value: card.x + card.width,
          min: x,
          max: x + width
        })
        const y1 = utils.isBetween({
          value: card.y,
          min: y,
          max: y + height
        })
        const y2 = utils.isBetween({
          value: card.y + card.height,
          min: y,
          max: y + height
        })
        return x1 && x2 && y1 && y2
      })
      return isInside
    },
    updateIsHover (value) {
      if (this.isDragging) { return }
      if (this.isPainting) { return }
      this.isHover = value
    },
    showBoxDetails (event) {
      const userId = this.$store.state.currentUser.id
      this.$store.dispatch('currentBoxes/afterMove')
      if (this.$store.state.currentUserIsPainting) { return }
      if (isMultiTouch) { return }
      if (this.$store.state.currentUserIsPanningReady || this.$store.state.currentUserIsPanning) { return }
      if (this.$store.state.boxesWereDragged) {
        this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteBoxesDragging' })
        return
      }
      if (!this.canEditBox) { this.$store.commit('triggerReadOnlyJiggle') }
      this.$store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteBoxesDragging' })
      this.$store.dispatch('closeAllDialogs', 'Box.showBoxDetails')
      this.$store.dispatch('clearMultipleSelected')
      this.$store.commit('boxDetailsIsVisibleForBoxId', this.box.id)
      event.stopPropagation() // only stop propagation if cardDetailsIsVisible, to prevent stopInteractions()
      this.$store.commit('currentUserIsDraggingBox', false)
    },

    // h1, h2

    nameHasPattern (pattern) {
      const result = utils.markdown()[pattern].exec(this.box.name)
      return Boolean(result)
    },

    // touch locking

    cancelLocking () {
      shouldCancelLocking = true
    },
    cancelLockingAnimationFrame () {
      this.isLocking = false
      this.lockingPercent = 0
      this.lockingAlpha = 0
      shouldCancelLocking = false
    },
    startLocking (event) {
      console.log('startLocking', event)
      this.updateTouchPosition(event)
      this.updateCurrentTouchPosition(event)
      this.isLocking = true
      shouldCancelLocking = false
      setTimeout(() => {
        if (!lockingAnimationTimer) {
          lockingAnimationTimer = window.requestAnimationFrame(this.lockingAnimationFrame)
        }
      }, lockingPreDuration)
    },
    lockingAnimationFrame (timestamp) {
      if (!lockingStartTime) {
        lockingStartTime = timestamp
      }
      const elaspedTime = timestamp - lockingStartTime
      const percentComplete = (elaspedTime / lockingDuration) // between 0 and 1
      if (!utils.cursorsAreClose(touchPosition, currentTouchPosition)) {
        this.notifyPressAndHoldToDrag()
        this.cancelLockingAnimationFrame()
      }
      if (shouldCancelLocking) {
        this.cancelLockingAnimationFrame()
      }
      if (this.isLocking && percentComplete <= 1) {
        const percentRemaining = Math.abs(percentComplete - 1)
        this.lockingPercent = percentRemaining
        const alpha = utils.easeOut(percentComplete, elaspedTime, lockingDuration)
        this.lockingAlpha = alpha
        window.requestAnimationFrame(this.lockingAnimationFrame)
      } else if (this.isLocking && percentComplete > 1) {
        console.log('🔒🐢 box lockingAnimationFrame locked')
        lockingAnimationTimer = undefined
        lockingStartTime = undefined
        this.isLocking = false
        this.startBoxInfoInteraction(initialTouchEvent)
      } else {
        window.cancelAnimationFrame(lockingAnimationTimer)
        lockingAnimationTimer = undefined
        lockingStartTime = undefined
        this.cancelLockingAnimationFrame()
      }
    },
    notifyPressAndHoldToDrag () {
      const hasNotified = this.$store.state.hasNotifiedPressAndHoldToDrag
      if (!hasNotified) {
        this.$store.commit('addNotification', { message: 'Press and hold to drag boxes', icon: 'press-and-hold' })
      }
      this.$store.commit('hasNotifiedPressAndHoldToDrag', true)
    },
    updateTouchPosition (event) {
      initialTouchEvent = event
      isMultiTouch = false
      if (utils.isMultiTouch(event)) {
        isMultiTouch = true
        return
      }
      touchPosition = utils.cursorPositionInViewport(event)
    },
    updateCurrentTouchPosition (event) {
      currentTouchPosition = utils.cursorPositionInViewport(event)
      if (this.isDragging || this.isResizing) {
        event.preventDefault() // allows dragging boxes without scrolling
      }
    },
    touchIsNearTouchPosition (event) {
      const currentPosition = utils.cursorPositionInViewport(event)
      const touchBlur = 12
      const isTouchX = utils.isBetween({
        value: currentPosition.x,
        min: touchPosition.x - touchBlur,
        max: touchPosition.x + touchBlur
      })
      const isTouchY = utils.isBetween({
        value: currentPosition.y,
        min: touchPosition.y - touchBlur,
        max: touchPosition.y + touchBlur
      })
      if (isTouchX && isTouchY) {
        return true
      }
    },
    showBoxDetailsTouch (event) {
      this.cancelLocking()
      if (this.touchIsNearTouchPosition(event)) {
        this.showBoxDetails(event)
      }
    }
  }
}
</script>

<style lang="stylus">
.box
  --min-box-size 70px
  position absolute
  border-radius 5px
  min-height var(--min-box-size)
  min-width var(--min-box-size)
  pointer-events none
  &.hover
    box-shadow var(--hover-shadow)
  &.active
    box-shadow var(--active-shadow)
  &.is-resizing
    box-shadow var(--active-shadow)

  h1
    font-family var(--serif-font)
    font-size 22px
    font-weight bold
    margin 0
    display inline-block
  h2
    font-family var(--serif-font)
    font-weight normal
    font-size 20px
    margin 0
    display inline-block

  .box-info
    pointer-events all
    position absolute
    cursor pointer
    padding 8px
    padding-right 10px
    border-bottom-right-radius 5px
    word-break break-word
    &:hover
      box-shadow var(--hover-shadow)
    &:active
      box-shadow var(--active-shadow)

  .lock-button-wrap
    pointer-events all
    position absolute
    right 0px
    top 0px
    cursor pointer
    button
      cursor pointer
    .lock-icon
      position absolute
      left 5.5px
      top 2px
      height 10px

  .bottom-button-wrap
    pointer-events all
    position absolute
    right 0px
    bottom 0px
    display flex
    .resize-button-wrap
      z-index 1
      cursor ew-resize
      button
        cursor ew-resize
    img
      -webkit-user-drag none

  .resize-icon
    position absolute
    left 4px
    top 4.5px

  .background
    position absolute
    left 0px
    top 0px
    width 100%
    height 100%
    z-index -1
    &.filled
      opacity 0.5

  .locking-frame
    position absolute
    z-index -1
    pointer-events none

  // same as Card.vue
  .selected-user-avatar
    padding 0 3px
    border-radius 3px
    position absolute
    top -5px
    left -5px
    pointer-events none
    z-index 1
    img
      width 10px
      height 10px

.box-jiggle
  animation boxJiggle 0.5s infinite ease-out forwards

@media (prefers-reduced-motion)
  .box-jiggle
    animation none

@keyframes boxJiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-1deg)
  50%
    transform rotate(1deg)
  75%
    transform rotate(-1deg)
  100%
    transform rotate(0deg)

</style>