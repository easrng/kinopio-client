import utils from '@/utils.js'
import cache from '@/cache.js'
// store modules
import api from '@/store/api.js'
import broadcast from '@/store/broadcast.js'
import undoHistory from '@/store/undoHistory.js'
import currentUser from '@/store/currentUser.js'
import currentSpace from '@/store/currentSpace.js'
import currentCards from '@/store/currentCards.js'
import currentConnections from '@/store/currentConnections.js'
import upload from '@/store/upload.js'
// store plugins
import websocket from '@/store/plugins/websocket.js'

import { createStore } from 'vuex'
import nanoid from 'nanoid'
import uniqBy from 'lodash-es/uniqBy'

const store = createStore({
  strict: import.meta.env.MODE !== 'production',
  state: {
    pageHeight: 0,
    pageWidth: 0,
    maxPageSizeHeight: 0,
    maxPageSizeWidth: 0,
    viewportHeight: 0,
    viewportWidth: 0,
    isOnline: true,
    isReconnectingToBroadcast: false,
    isBeta: false,
    shouldHideConnectionOutline: false,
    newStuffIsUpdated: false,
    copiedCards: [],
    stripeIsLoaded: false,
    shouldHideFooter: false,
    shouldExplicitlyHideFooter: false,
    isTouchDevice: false,
    cardsCreatedLimit: 100,
    prevCursorPosition: { x: 0, y: 0 },
    spaceZoomPercent: 100,
    pinchCounterZoomDecimal: 1,
    currentSpacePath: '/',
    webfontIsLoaded: false,
    userHasScrolled: false,
    shouldPreventNextEnterKey: false,

    // search
    searchIsVisible: false,
    search: '',
    searchResultsCards: [],
    previousResultCardId: '',

    // reset password
    resetPasswordApiKey: '',
    passwordResetIsVisible: false,

    // services
    importArenaChannelIsVisible: false,
    isAuthenticatingWithArena: false,

    // current user state
    currentUserIsDrawingConnection: false,
    currentUserIsPainting: false,
    currentUserIsPaintingLocked: false,
    currentUserIsDraggingCard: false,
    currentUserIsHoveringOverConnectionId: '',
    currentUserIsPanningReady: false,
    currentUserIsPanning: false,

    // cards
    shouldAddCard: false,
    cardDetailsIsVisibleForCardId: '',
    parentCardId: '',
    childCardId: '',
    remoteCardDetailsVisible: [],
    preventCardDetailsOpeningAnimation: true,
    cardUserDetailsIsVisibleForCardId: '',
    hasEditedCurrentSpace: false,

    // connecting
    currentConnection: {}, // startCardId, startConnectorRect
    currentConnectionSuccess: {},
    currentConnectionCursorStart: {},
    connectionDetailsPosition: {}, // x, y
    connectionDetailsIsVisibleForConnectionId: '',
    currentConnectionColor: '',
    triggeredDrawConnectionFrame: {},
    remoteConnectionDetailsVisible: [],
    remoteCurrentConnections: [],
    currentCardConnections: [],

    // tags
    tagDetailsIsVisible: false,
    tagDetailsIsVisibleFromTagList: false,
    tagDetailsPosition: {}, // x, y
    currentSelectedTag: {},
    remoteTags: [],
    remoteTagsIsFetched: false,

    // links
    linkDetailsIsVisible: false,
    linkDetailsPosition: {}, // x, y
    currentSelectedLink: {},

    // pinned dialogs
    linksIsPinnedDialog: false,
    tagsIsPinnedDialog: false,

    // dragging
    currentDraggingCardId: '',
    remoteCardsDragging: [],
    remoteUploadDraggedOverCards: [],
    preventDraggedCardFromShowingDetails: false,
    triggeredTouchCardDragPosition: {},
    cardsWereDragged: false,

    // multiple selection
    multipleSelectedActionsIsVisible: false,
    multipleSelectedActionsPosition: {},
    multipleCardsSelectedIds: [],
    previousMultipleCardsSelectedIds: [],
    previousMultipleConnectionsSelectedIds: [],
    remoteCardsSelected: [],
    remoteConnectionsSelected: [],
    multipleConnectionsSelectedIds: [],
    triggeredPaintFramePosition: {},

    // loading
    isLoadingSpace: false,
    isJoiningSpace: false, // broadcast
    spaceUrlToLoad: '',
    spaceCollaboratorKeys: [],
    remotePendingUploads: [],
    hasRestoredFavorites: false,
    loadSpaceShowDetailsForCardId: '',
    loadJournalSpace: false,
    loadJournalSpaceTomorrow: false,
    loadNewSpace: false,
    urlPreviewLoadingForCardIds: [],

    // notifications
    notifications: [],
    notifySpaceNotFound: false,
    notifyConnectionError: false,
    notifyServerCouldNotSave: false,
    notifySpaceIsRemoved: false,
    notifyNewUser: false,
    notifySignUpToEditSpace: false,
    notifyCardsCreatedIsNearLimit: false,
    notifyCardsCreatedIsOverLimit: false,
    notifyKinopioUpdatesAreAvailable: false,
    notifyMoveOrCopyToSpace: false,
    notifyMoveOrCopyToSpaceDetails: {},
    hasNotifiedPressAndHoldToDrag: false,

    // notifications with position
    notificationsWithPosition: [],

    // filters
    filteredConnectionTypeIds: [],
    filteredFrameIds: [],
    filteredTagNames: [],

    // session data
    otherUsers: [], // { id, name color }
    otherSpaces: [], // { {user}, name, id }
    otherTags: []
  },
  mutations: {
    updatePageSizes: (state) => {
      const body = document.body
      const html = document.documentElement
      state.pageWidth = Math.max(state.maxPageSizeWidth, body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      state.pageHeight = Math.max(state.maxPageSizeHeight, body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
      state.viewportWidth = utils.visualViewport().width
      state.viewportHeight = utils.visualViewport().height
    },
    updateMaxPageSizes: (state, { width, height }) => {
      state.maxPageSizeWidth = width
      state.maxPageSizeHeight = height
    },
    updateSpacePageSize: (state) => {
      const extraScrollArea = 160
      state.pageWidth = extraScrollArea
      state.pageHeight = extraScrollArea
    },
    pageHeight: (state, height) => {
      utils.typeCheck({ value: height, type: 'number', origin: 'pageHeight' })
      state.pageHeight = height
    },
    pageWidth: (state, width) => {
      utils.typeCheck({ value: width, type: 'number', origin: 'pageWidth' })
      state.pageWidth = width
    },
    closeAllDialogs: (state) => {
      state.multipleSelectedActionsIsVisible = false
      state.cardDetailsIsVisibleForCardId = ''
      state.connectionDetailsIsVisibleForConnectionId = ''
      state.tagDetailsIsVisible = false
      state.tagDetailsIsVisibleFromTagList = false
      state.currentSelectedTag = {}
      state.linkDetailsIsVisible = false
      state.currentSelectedLink = {}
      state.searchIsVisible = false
      state.cardsWereDragged = false
    },
    isOnline: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isOnline' })
      state.isOnline = value
    },
    isReconnectingToBroadcast: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isReconnectingToBroadcast' })
      state.isReconnectingToBroadcast = value
    },
    isBeta: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isBeta' })
      state.isBeta = value
    },
    loadJournalSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'loadJournalSpace' })
      state.loadJournalSpace = value
    },
    loadJournalSpaceTomorrow: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'loadJournalSpaceTomorrow' })
      state.loadJournalSpaceTomorrow = value
    },
    loadNewSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'loadNewSpace' })
      state.loadNewSpace = value
    },
    addUrlPreviewLoadingForCardIds: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'addUrlPreviewLoadingForCardIds' })
      state.urlPreviewLoadingForCardIds.push(cardId)
    },
    removeUrlPreviewLoadingForCardIds: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'removeUrlPreviewLoadingForCardIds' })
      let cardIds = utils.clone(state.urlPreviewLoadingForCardIds)
      cardIds = cardIds.filter(id => cardId !== id) || []
      state.urlPreviewLoadingForCardIds = cardIds
    },
    shouldHideConnectionOutline: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldHideConnectionOutline' })
      state.shouldHideConnectionOutline = value
    },
    newStuffIsUpdated: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'newStuffIsUpdated' })
      state.newStuffIsUpdated = value
    },
    stripeIsLoaded: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'stripeIsLoaded' })
      state.stripeIsLoaded = value
    },
    shouldHideFooter: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldHideFooter' })
      state.shouldHideFooter = value
    },
    shouldExplicitlyHideFooter: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldExplicitlyHideFooter' })
      state.shouldExplicitlyHideFooter = value
    },
    isTouchDevice: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isTouchDevice' })
      state.isTouchDevice = value
    },
    prevCursorPosition: (state, cursor) => {
      state.prevCursorPosition = cursor
    },
    spaceZoomPercent: (state, value) => {
      utils.typeCheck({ value, type: 'number', origin: 'spaceZoomPercent' })
      state.spaceZoomPercent = value
    },
    pinchCounterZoomDecimal: (state, value) => {
      utils.typeCheck({ value, type: 'number', origin: 'pinchCounterZoomDecimal' })
      state.pinchCounterZoomDecimal = value
    },
    currentSpacePath: (state, value) => {
      utils.typeCheck({ value, type: 'string', origin: 'currentSpacePath' })
      state.currentSpacePath = value
    },
    webfontIsLoaded: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'webfontIsLoaded' })
      state.webfontIsLoaded = value
    },
    userHasScrolled: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'userHasScrolled' })
      state.userHasScrolled = value
    },
    shouldPreventNextEnterKey: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldPreventNextEnterKey' })
      state.shouldPreventNextEnterKey = value
    },
    searchIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'searchIsVisible' })
      state.searchIsVisible = value
    },
    search: (state, value) => {
      utils.typeCheck({ value, type: 'string', origin: 'search' })
      state.search = value
    },
    searchResultsCards: (state, results) => {
      utils.typeCheck({ value: results, type: 'array', origin: 'searchResultsCards' })
      state.searchResultsCards = results
    },
    previousResultCardId: (state, value) => {
      utils.typeCheck({ value, type: 'string', origin: 'previousResultCardId' })
      state.previousResultCardId = value
    },
    clearSearch: (state) => {
      state.search = ''
      state.searchResultsCards = []
      state.previousResultCardId = ''
    },
    resetPasswordApiKey: (state, apiKey) => {
      utils.typeCheck({ value: apiKey, type: 'string', origin: 'resetPasswordApiKey' })
      state.resetPasswordApiKey = apiKey
    },
    passwordResetIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'passwordResetIsVisible' })
      state.passwordResetIsVisible = value
    },
    importArenaChannelIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'importArenaChannelIsVisible' })
      state.importArenaChannelIsVisible = value
    },
    isAuthenticatingWithArena: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isAuthenticatingWithArena' })
      state.isAuthenticatingWithArena = value
    },
    triggerSpaceDetailsVisible: () => {},
    triggerFocusResultsFilter: () => {},
    triggerFocusSpaceDetailsName: () => {},
    triggerSignUpOrInIsVisible: () => {},
    triggerArenaAuthenticationError: () => {},
    triggerKeyboardShortcutsIsVisible: () => {},
    triggerReadOnlyJiggle: () => {},
    triggerSelectTemplateCategory: () => {},
    triggerUpdateMagicPaintPositionOffset: () => {},
    triggeredPaintFramePosition: (state, cursor) => {
      state.triggeredPaintFramePosition = cursor
    },
    triggerAddRemotePaintingCircle: () => {},
    triggerUpdateRemoteUserCursor: () => {},
    triggerUpdateRemoteDropGuideLine: () => {},
    triggerUpdateStopRemoteUserDropGuideLine: () => {},
    triggerUpdatePositionInVisualViewport: () => {},
    triggerUpgradeUserIsVisible: () => {},
    triggerUploadComplete: () => {},
    triggerPauseAllAudio: () => {},
    triggerScrollCardIntoView: (state, cardId) => {},
    triggerPickerNavigationKey: (state, key) => {},
    triggerPickerSelect: () => {},
    triggerUpdateNotifications: () => {},
    triggerSpaceZoomReset: () => {},
    triggerSpaceZoomOut: () => {},
    triggerSpaceZoomIn: () => {},
    triggerUnloadPage: () => {},
    triggerShowNextSearchCard: () => {},
    triggerShowPreviousSearchCard: () => {},
    triggerMoreFiltersIsNotVisible: () => {},
    triggerShowConnectionDetails: (state, options) => {},
    triggerUpdateWindowHistory: (state, options) => {},
    triggerAddCard: () => {},

    // Cards

    shouldAddCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldAddCard' })
      state.shouldAddCard = value
    },
    currentUserIsHoveringOverConnectionId: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'currentUserIsHoveringOverConnectionId' })
      state.currentUserIsHoveringOverConnectionId = connectionId
    },
    cardDetailsIsVisibleForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'cardDetailsIsVisibleForCardId' })
      state.cardDetailsIsVisibleForCardId = cardId
    },
    parentCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'parentCardId' })
      state.parentCardId = cardId
    },
    childCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'childCardId' })
      state.childCardId = cardId
    },
    addToCopiedCards: (state, cards) => {
      utils.typeCheck({ value: cards, type: 'array', origin: 'addToCopiedCards' })
      cards = cards.map(card => {
        card = utils.clone(card)
        return card
      })
      state.copiedCards = cards
    },
    updateRemoteCardDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'updateRemoteCardDetailsVisible' })
      delete update.type
      let cardDetailsVisible = utils.clone(state.remoteCardDetailsVisible)
      cardDetailsVisible = cardDetailsVisible.filter(card => card.id !== update.cardId) || []
      cardDetailsVisible.push(update)
      state.remoteCardDetailsVisible = cardDetailsVisible
    },
    clearRemoteCardDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteCardDetailsVisible' })
      state.remoteCardDetailsVisible = state.remoteCardDetailsVisible.filter(card => card.userId !== update.userId) || []
    },
    preventCardDetailsOpeningAnimation: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'preventCardDetailsOpeningAnimation' })
      state.preventCardDetailsOpeningAnimation = value
    },
    cardUserDetailsIsVisibleForCardId: (state, cardId) => {
      utils.typeCheck({ cardId, type: 'string', origin: 'cardUserDetailsIsVisibleForCardId', allowUndefined: true })
      state.cardUserDetailsIsVisibleForCardId = cardId
    },
    hasEditedCurrentSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'hasEditedCurrentSpace' })
      state.hasEditedCurrentSpace = value
    },

    // Connecting

    currentUserIsDrawingConnection: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsDrawingConnection' })
      state.currentUserIsDrawingConnection = value
    },
    currentConnectionSuccess: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', allowUndefined: true, origin: 'currentConnectionSuccess' })
      state.currentConnectionSuccess = object
    },
    currentConnectionCursorStart: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', origin: 'currentConnectionCursorStart' })
      state.currentConnectionCursorStart = object
    },
    currentConnection: (state, updates) => {
      let object = state.currentConnection
      object = utils.updateObject(object, updates)
      state.currentConnection = object
    },
    updateRemoteCurrentConnection: (state, updates) => {
      const keys = Object.keys(updates)
      const id = updates.id
      let connection = state.remoteCurrentConnections.find(remoteConnection => remoteConnection.id === id) || {}
      state.remoteCurrentConnections = state.remoteCurrentConnections.filter(remoteConnection => remoteConnection.id !== id)
      keys.forEach(key => {
        connection[key] = updates[key]
      })
      state.remoteCurrentConnections.push(connection)
    },
    removeRemoteCurrentConnection: (state, updates) => {
      const id = updates.id
      state.remoteCurrentConnections = state.remoteCurrentConnections.filter(remoteConnection => remoteConnection.id !== id)
    },
    updateCurrentCardConnections: (state, connections) => {
      connections = connections || []
      connections = connections.map(connection => connection.id)
      state.currentCardConnections = connections
    },

    // Painting

    currentUserIsPainting: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsPainting' })
      state.currentUserIsPainting = value
    },
    currentUserIsPaintingLocked: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsPaintingLocked' })
      state.currentUserIsPaintingLocked = value
    },

    // Dragging

    currentUserIsPanningReady: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsPanningReady' })
      state.currentUserIsPanningReady = value
    },
    currentUserIsPanning: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsPanning' })
      state.currentUserIsPanning = value
    },
    currentUserIsDraggingCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsDraggingCard' })
      state.currentUserIsDraggingCard = value
    },
    preventDraggedCardFromShowingDetails: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'preventDraggedCardFromShowingDetails' })
      state.preventDraggedCardFromShowingDetails = value
    },
    triggeredTouchCardDragPosition: (state, cursor) => {
      state.triggeredTouchCardDragPosition = cursor
    },
    cardsWereDragged: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'cardsWereDragged' })
      state.cardsWereDragged = value
    },
    currentDraggingCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'currentDraggingCardId' })
      state.currentDraggingCardId = cardId
    },
    addToRemoteCardsDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteCardsDragging' })
      delete update.type
      let cards = utils.clone(state.remoteCardsDragging)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      state.remoteCardsDragging = cards
    },
    clearRemoteCardsDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteCardsDragging' })
      state.remoteCardsDragging = state.remoteCardsDragging.filter(card => card.userId !== update.userId)
    },
    addToRemoteUploadDraggedOverCards: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteUploadDraggedOverCards' })
      delete update.type
      let cards = utils.clone(state.remoteUploadDraggedOverCards)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      state.remoteUploadDraggedOverCards = cards
    },
    clearRemoteUploadDraggedOverCards: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteUploadDraggedOverCards' })
      state.remoteUploadDraggedOverCards = state.remoteUploadDraggedOverCards.filter(card => card.userId !== update.userId)
    },

    // Tag Details

    tagDetailsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'tagDetailsIsVisible' })
      state.tagDetailsIsVisible = value
    },
    tagDetailsIsVisibleFromTagList: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'tagDetailsIsVisibleFromTagList' })
      state.tagDetailsIsVisibleFromTagList = value
    },
    tagDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'tagDetailsPosition' })
      state.tagDetailsPosition = position
    },
    currentSelectedTag: (state, tag) => {
      utils.typeCheck({ value: tag, type: 'object', origin: 'currentSelectedTag' })
      state.currentSelectedTag = tag
    },
    remoteTags: (state, tags) => {
      utils.typeCheck({ value: tags, type: 'array', origin: 'remoteTags' })
      state.remoteTags = tags
    },
    remoteTagsIsFetched: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'remoteTagsIsFetched' })
      state.remoteTagsIsFetched = value
    },

    // Link Details

    linkDetailsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'linkDetailsIsVisible' })
      state.linkDetailsIsVisible = value
    },
    linkDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'linkDetailsPosition' })
      state.linkDetailsPosition = position
    },
    currentSelectedLink: (state, link) => {
      utils.typeCheck({ value: link, type: 'object', origin: 'currentSelectedLink' })
      state.currentSelectedLink = link
    },

    // Pinned Dialogs

    linksIsPinnedDialog: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'linksIsPinnedDialog' })
      state.linksIsPinnedDialog = value
    },
    tagsIsPinnedDialog: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'tagsIsPinnedDialog' })
      state.tagsIsPinnedDialog = value
    },

    // Connection Details

    connectionDetailsIsVisibleForConnectionId: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'connectionDetailsIsVisibleForConnectionId' })
      state.connectionDetailsIsVisibleForConnectionId = connectionId
    },
    currentConnectionColor: (state, color) => {
      utils.typeCheck({ value: color, type: 'string', origin: 'currentConnectionColor' })
      state.currentConnectionColor = color
    },
    connectionDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'connectionDetailsPosition' })
      state.connectionDetailsPosition = position
    },
    triggeredDrawConnectionFrame: (state, cursor) => {
      state.triggeredDrawConnectionFrame = cursor
    },
    addToRemoteConnectionDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteConnectionDetailsVisible' })
      delete update.type
      let connections = utils.clone(state.remoteConnectionDetailsVisible)
      connections = connections.filter(connection => connection.userId !== update.userId) || []
      connections.push(update)
      state.remoteConnectionDetailsVisible = connections
    },
    clearRemoteConnectionDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteConnectionDetailsVisible' })
      state.remoteConnectionDetailsVisible = state.remoteConnectionDetailsVisible.filter(connection => connection.userId !== update.userId)
    },

    // Multiple Selection

    multipleSelectedActionsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'multipleSelectedActionsIsVisible' })
      state.multipleSelectedActionsIsVisible = value
    },
    multipleSelectedActionsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'multipleSelectedActionsPosition' })
      state.multipleSelectedActionsPosition = position
    },
    previousMultipleCardsSelectedIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array', origin: 'previousMultipleCardsSelectedIds' })
      state.previousMultipleCardsSelectedIds = cardIds
    },
    previousMultipleConnectionsSelectedIds: (state, connectionIds) => {
      utils.typeCheck({ value: connectionIds, type: 'array', origin: 'previousMultipleConnectionsSelectedIds' })
      state.previousMultipleConnectionsSelectedIds = connectionIds
    },
    addToMultipleCardsSelected: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'addToMultipleCardsSelected' })
      state.multipleCardsSelectedIds.push(cardId)
    },
    removeFromMultipleCardsSelected: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'removeFromMultipleCardsSelected' })
      state.multipleCardsSelectedIds = state.multipleCardsSelectedIds.filter(id => {
        return id !== cardId
      })
    },
    addToMultipleConnectionsSelected: (state, connectionId) => {
      state.multipleConnectionsSelectedIds.push(connectionId)
    },
    removeFromMultipleConnectionsSelected: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'removeFromMultipleConnectionsSelected' })
      state.multipleConnectionsSelectedIds = state.multipleConnectionsSelectedIds.filter(id => {
        return id !== connectionId
      })
    },
    clearMultipleSelected: (state) => {
      state.multipleCardsSelectedIds = []
      state.multipleConnectionsSelectedIds = []
    },
    multipleCardsSelectedIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array', origin: 'multipleCardsSelectedIds' })
      state.multipleCardsSelectedIds = cardIds
    },
    multipleConnectionsSelectedIds: (state, connectionIds) => {
      utils.typeCheck({ value: connectionIds, type: 'array', origin: 'multipleConnectionsSelectedIds' })
      state.multipleConnectionsSelectedIds = connectionIds
    },
    addToRemoteCardsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteCardsSelected' })
      delete update.type
      const isSelected = state.remoteCardsSelected.find(card => {
        const cardIsSelected = card.cardId === update.cardId
        const selectedByUser = card.userId === update.userId
        return cardIsSelected && selectedByUser
      })
      if (isSelected) { return }
      state.remoteCardsSelected.push(update)
    },
    removeFromRemoteCardsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteCardsSelected' })
      delete update.type
      state.remoteCardsSelected = state.remoteCardsSelected.filter(card => {
        const cardIsSelected = card.cardId === update.cardId
        const selectedByUser = card.userId === update.userId
        const cardIsUpdate = cardIsSelected && selectedByUser
        return !cardIsUpdate
      })
    },
    addToRemoteConnectionsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteConnectionsSelected' })
      delete update.type
      const isSelected = state.remoteConnectionsSelected.find(connection => {
        const connectionIsSelected = connection.connectionId === update.connectionId
        const selectedByUser = connection.userId === update.userId
        return connectionIsSelected && selectedByUser
      })
      if (isSelected) { return }
      state.remoteConnectionsSelected.push(update)
    },
    removeFromRemoteConnectionsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'removeFromRemoteConnectionsSelected' })
      delete update.type
      state.remoteConnectionsSelected = state.remoteConnectionsSelected.filter(connection => {
        const connectionIsSelected = connection.connectionId === update.connectionId
        const selectedByUser = connection.userId === update.userId
        const connectionIsUpdate = connectionIsSelected && selectedByUser
        return !connectionIsUpdate
      })
    },
    clearRemoteMultipleSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteMultipleSelected' })
      const user = update.user || update.updates.user
      state.remoteCardsSelected = state.remoteCardsSelected.filter(card => card.userId !== user.id)
      state.remoteConnectionsSelected = state.remoteConnectionsSelected.filter(connection => connection.userId !== user.id)
    },

    // Loading

    isLoadingSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isLoadingSpace' })
      state.isLoadingSpace = value
    },
    isJoiningSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isJoiningSpace' })
      state.isJoiningSpace = value
    },
    addToSpaceCollaboratorKeys: (state, spaceCollaboratorKey) => {
      utils.typeCheck({ value: spaceCollaboratorKey, type: 'object', origin: 'addToSpaceCollaboratorKeys' })
      state.spaceCollaboratorKeys.push(spaceCollaboratorKey) // { spaceId, collaboratorKey }
    },
    updateRemotePendingUploads: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'updateRemotePendingUploads' })
      delete update.type
      const existingUpload = state.remotePendingUploads.find(item => {
        const card = item.cardId === update.cardId
        const space = item.spaceId === update.spaceId
        return card || space
      })
      if (existingUpload) {
        state.remotePendingUploads = state.remotePendingUploads.map(item => {
          console.log('item', item, item.id, existingUpload.id, item.id === existingUpload.id)
          if (item.id === existingUpload.id) {
            item.percentComplete = update.percentComplete
          }
          return item
        })
      } else {
        state.remotePendingUploads.push(update)
      }
      state.remotePendingUploads = state.remotePendingUploads.filter(item => item.percentComplete !== 100)
    },
    hasRestoredFavorites: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'hasRestoredFavorites' })
      state.hasRestoredFavorites = value
    },
    loadSpaceShowDetailsForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'loadSpaceShowDetailsForCardId' })
      state.loadSpaceShowDetailsForCardId = cardId
    },
    spaceUrlToLoad: (state, spaceUrl) => {
      utils.typeCheck({ value: spaceUrl, type: 'string', origin: 'spaceUrlToLoad' })
      state.spaceUrlToLoad = spaceUrl
    },

    // Notifications

    addNotification: (state, notification) => {
      notification.id = nanoid()
      state.notifications.push(notification)
    },
    removeNotification: (state) => {
      state.notifications.shift()
    },
    clearAllNotifications: (state) => {
      state.notifyConnectionError = false
      state.notifyServerCouldNotSave = false
      state.notifySignUpToEditSpace = false
      state.notifyCardsCreatedIsNearLimit = false
      state.notifyCardsCreatedIsOverLimit = false
      state.notifyMoveOrCopyToSpace = false
      state.notificationsWithPosition = []
    },
    notifySpaceNotFound: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifySpaceNotFound' })
      state.notifySpaceNotFound = value
    },
    notifyConnectionError: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyConnectionError' })
      state.notifyConnectionError = value
    },
    notifyServerCouldNotSave: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyServerCouldNotSave' })
      state.notifyServerCouldNotSave = value
    },
    notifySpaceIsRemoved: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifySpaceIsRemoved' })
      state.notifySpaceIsRemoved = value
    },
    notifyNewUser: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyNewUser' })
      state.notifyNewUser = value
    },
    notifySignUpToEditSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifySignUpToEditSpace' })
      state.notifySignUpToEditSpace = value
    },
    notifyCardsCreatedIsNearLimit: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyCardsCreatedIsNearLimit' })
      state.notifyCardsCreatedIsNearLimit = value
    },
    notifyCardsCreatedIsOverLimit: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyCardsCreatedIsOverLimit' })
      state.notifyCardsCreatedIsOverLimit = value
      if (value === true) {
        state.notifyCardsCreatedIsNearLimit = false
      }
    },
    notifyKinopioUpdatesAreAvailable: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyKinopioUpdatesAreAvailable' })
      state.notifyKinopioUpdatesAreAvailable = value
    },
    notifyMoveOrCopyToSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyMoveOrCopyToSpace' })
      state.notifyMoveOrCopyToSpace = value
    },
    notifyMoveOrCopyToSpaceDetails: (state, value) => {
      utils.typeCheck({ value, type: 'object', origin: 'notifyMoveOrCopyToSpaceDetails' })
      state.notifyMoveOrCopyToSpaceDetails = value
    },
    hasNotifiedPressAndHoldToDrag: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'hasNotifiedPressAndHoldToDrag' })
      state.hasNotifiedPressAndHoldToDrag = value
    },

    // Notifications with Position

    addNotificationWithPosition: (state, notification) => {
      notification.id = nanoid()
      state.notificationsWithPosition.push(notification)
    },
    removeNotificationWithPosition: (state) => {
      state.notificationsWithPosition.shift()
    },

    // Filters

    clearSpaceFilters: (state) => {
      state.filteredConnectionTypeIds = []
      state.filteredFrameIds = []
      state.filteredTagNames = []
    },
    addToFilteredConnectionTypeId: (state, id) => {
      utils.typeCheck({ value: id, type: 'string', origin: 'addToFilteredConnectionTypeId' })
      state.filteredConnectionTypeIds.push(id)
    },
    removeFromFilteredConnectionTypeId: (state, id) => {
      utils.typeCheck({ value: id, type: 'string', origin: 'addToFilteredConnectionTypeId' })
      state.filteredConnectionTypeIds = state.filteredConnectionTypeIds.filter(typeId => typeId !== id)
    },
    addToFilteredFrameIds: (state, id) => {
      utils.typeCheck({ value: id, type: 'number', origin: 'addToFilteredFrameIds' })
      state.filteredFrameIds.push(id)
    },
    removeFromFilteredFrameIds: (state, id) => {
      utils.typeCheck({ value: id, type: 'number', origin: 'removeFromFilteredFrameIds' })
      state.filteredFrameIds = state.filteredFrameIds.filter(frameId => frameId !== id)
    },
    addToFilteredTagNames: (state, name) => {
      utils.typeCheck({ value: name, type: 'string', origin: 'addToFilteredTagNames' })
      state.filteredTagNames.push(name)
    },
    removeFromFilteredTagNames: (state, name) => {
      utils.typeCheck({ value: name, type: 'string', origin: 'removeFromFilteredTagNames' })
      state.filteredTagNames = state.filteredTagNames.filter(tagName => tagName !== name)
    },

    // Session Data

    updateOtherUsers: (state, updatedUser) => {
      if (!updatedUser) { return }
      utils.typeCheck({ value: updatedUser, type: 'object', origin: 'updateOtherUsers' })
      let users = utils.clone(state.otherUsers)
      users = users.filter(Boolean)
      users = users.filter(user => {
        if (user.id !== updatedUser.id) {
          return user
        }
      })
      users.push(updatedUser)
      state.otherUsers = users
    },
    updateOtherSpaces: (state, updatedSpace) => {
      utils.typeCheck({ value: updatedSpace, type: 'object', origin: 'updateOtherSpaces' })
      let spaces = utils.clone(state.otherSpaces)
      spaces = spaces.filter(space => {
        if (space.id !== updatedSpace.id) {
          return space
        }
      })
      spaces.push(updatedSpace)
      state.otherSpaces = spaces
    },
    otherTags: (state, remoteTags) => {
      remoteTags = uniqBy(remoteTags, 'name')
      state.otherTags = remoteTags
    }
  },

  actions: {
    updateSpaceAndCardUrlToLoad: (context, path) => {
      const matches = utils.spaceAndCardIdFromUrl(path)
      if (!matches) { return }
      if (matches.cardId) {
        context.commit('loadSpaceShowDetailsForCardId', matches.cardId)
      }
      context.commit('spaceUrlToLoad', matches.spaceUrl)
    },

    updatePageSizes: (context) => {
      const paddingX = Math.min(400, (utils.visualViewport().width / 4) * 3) + 100
      const paddingY = Math.min(400, (utils.visualViewport().height / 4) * 3)
      const cards = utils.clone(context.rootState.currentSpace.cards)
      if (cards.length) {
        const xPositions = Array.from(cards, card => card.x)
        const yPositions = Array.from(cards, card => card.y)
        const x = Math.max(...xPositions)
        const y = Math.max(...yPositions)
        context.commit('updateMaxPageSizes', {
          width: x + paddingX,
          height: y + paddingY
        })
      }
      context.commit('updatePageSizes')
    },
    clearAllFilters: (context) => {
      context.commit('clearSpaceFilters')
      context.dispatch('currentUser/clearUserFilters')
    },
    clearSpaceFilters: (context) => {
      context.commit('clearSpaceFilters')
    },
    closeAllDialogs: (context, value) => {
      const logging = value || 'Store.closeAllDialogs'
      context.commit('closeAllDialogs', logging)
      const space = utils.clone(context.rootState.currentSpace)
      const user = utils.clone(context.rootState.currentUser)
      context.commit('broadcast/updateUser', { user: utils.userMeta(user, space), type: 'updateUserPresence' }, { root: true })
      context.commit('broadcast/updateStore', { updates: { userId: user.id }, type: 'clearRemoteCardDetailsVisible' })
      context.commit('broadcast/updateStore', { updates: { userId: user.id }, type: 'clearRemoteConnectionDetailsVisible' })
    },
    toggleCardSelected: (context, cardId) => {
      const previousMultipleCardsSelectedIds = context.state.previousMultipleCardsSelectedIds
      const cardIsSelected = previousMultipleCardsSelectedIds.includes(cardId)
      if (cardIsSelected) {
        context.dispatch('removeFromMultipleCardsSelected', cardId)
      } else {
        context.dispatch('addToMultipleCardsSelected', cardId)
      }
    },
    addToMultipleCardsSelected: (context, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'addToMultipleCardsSelected' })
      if (context.state.multipleCardsSelectedIds.includes(cardId)) { return }
      context.commit('addToMultipleCardsSelected', cardId)
      const updates = {
        userId: context.rootState.currentUser.id,
        cardId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteCardsSelected' }, { root: true })
    },
    removeFromMultipleCardsSelected: (context, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'removeFromMultipleCardsSelected' })
      if (!context.state.multipleCardsSelectedIds.includes(cardId)) { return }
      context.commit('removeFromMultipleCardsSelected', cardId)
      const updates = {
        userId: context.rootState.currentUser.id,
        cardId
      }
      context.commit('broadcast/updateStore', { updates, type: 'removeFromRemoteCardsSelected' }, { root: true })
    },
    clearMultipleSelected: (context) => {
      if (context.state.multipleCardsSelectedIds.length || context.state.multipleConnectionsSelectedIds.length) {
        context.commit('clearMultipleSelected')
      }
      const space = context.rootState.currentSpace
      const user = context.rootState.currentUser
      context.commit('broadcast/updateStore', { user: utils.userMeta(user, space), type: 'clearRemoteMultipleSelected' }, { root: true })
    },
    toggleMultipleConnectionsSelected: (context, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'toggleMultipleConnectionsSelected' })
      const previousMultipleConnectionsSelectedIds = context.state.previousMultipleConnectionsSelectedIds
      const connectionIsSelected = previousMultipleConnectionsSelectedIds.includes(connectionId)
      if (connectionIsSelected) {
        context.dispatch('removeFromMultipleConnectionsSelected', connectionId)
      } else {
        context.dispatch('addToMultipleConnectionsSelected', connectionId)
      }
    },
    addToMultipleConnectionsSelected: (context, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'addToMultipleConnectionsSelected' })
      if (context.state.multipleConnectionsSelectedIds.includes(connectionId)) { return }
      context.commit('addToMultipleConnectionsSelected', connectionId)
      const updates = {
        userId: context.rootState.currentUser.id,
        connectionId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteConnectionsSelected' }, { root: true })
    },
    removeFromMultipleConnectionsSelected: (context, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'removeFromMultipleConnectionsSelected' })
      if (!context.state.multipleConnectionsSelectedIds.includes(connectionId)) { return }
      context.commit('removeFromMultipleConnectionsSelected', connectionId)
      const updates = {
        userId: context.rootState.currentUser.id,
        connectionId
      }
      context.commit('broadcast/updateStore', { updates, type: 'removeFromRemoteConnectionsSelected' }, { root: true })
    },
    connectionDetailsIsVisibleForConnectionId: (context, connectionId) => {
      context.commit('connectionDetailsIsVisibleForConnectionId', connectionId)
      const updates = {
        userId: context.rootState.currentUser.id,
        connectionId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteConnectionDetailsVisible' }, { root: true })
    }
  },

  getters: {
    shouldScrollAtEdges: (state, getters) => (event) => {
      let isPainting
      if (event.touches) {
        isPainting = state.currentUserIsPaintingLocked
      } else {
        isPainting = state.currentUserIsPainting
      }
      const isDrawingConnection = state.currentUserIsDrawingConnection
      const isDraggingCard = state.currentUserIsDraggingCard
      return isPainting || isDrawingConnection || isDraggingCard
    },
    otherUserById: (state, getters) => (userId) => {
      const otherUsers = state.otherUsers.filter(Boolean)
      const user = otherUsers.find(otherUser => otherUser.id === userId)
      return user
    },
    otherSpaceById: (state, getters) => (spaceId) => {
      const otherSpaces = state.otherSpaces.filter(Boolean)
      const space = otherSpaces.find(otherSpace => otherSpace.id === spaceId)
      return space
    },
    cachedOrOtherSpaceById: (state, getters) => (spaceId) => {
      const currentSpace = state.currentSpace
      const cachedSpace = cache.space(spaceId)
      if (spaceId === currentSpace.id) {
        return utils.clone(currentSpace)
      } else if (utils.objectHasKeys(cachedSpace)) {
        return cachedSpace
      } else {
        return getters.otherSpaceById(spaceId)
      }
    },
    spaceZoomDecimal: (state) => {
      return state.spaceZoomPercent / 100
    },
    spaceCounterZoomDecimal: (state, getters) => {
      return 1 / getters.spaceZoomDecimal
    }
  },

  modules: {
    api,
    broadcast,
    undoHistory,
    currentUser,
    currentSpace,
    currentCards,
    currentConnections,
    upload
  },
  plugins: [websocket()]
})

export default store
