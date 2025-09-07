// oxlint-disable-next-line no-unassigned-import
import './style.scss'
import { storage } from '#imports'

const setChatWidth = (width: number) => {
  document.body.style.setProperty('--custom-chat-width', `${width}px`)
}

const getChatWidth = (): number => {
  const style = getComputedStyle(document.body).getPropertyValue('--custom-chat-width')
  return parseInt(style, 10)
}

const lockBody = () => {
  document.body.classList.add('custom-chat-locked-body')
}

const unlockBody = () => {
  document.body.classList.remove('custom-chat-locked-body')
}

const LOCAL_STORAGE_KEY = 'local:customChatWidth'
const DEFAULT_WIDTH = 340

// oxlint-disable-next-line sort-keys
export default defineContentScript({
  matches: ['https://www.twitch.tv/*'],
  async main() {
    const chat = document.querySelector('.chat-shell__expanded')
    if (!chat) return

    // Insert resizer
    const resizer = document.createElement('div')
    resizer.className = 'custom-chat-shell__resizer'
    chat.append(resizer)

    // Init with
    const storageCustomChatWidth = await storage.getItem<number>(LOCAL_STORAGE_KEY)

    if (storageCustomChatWidth) {
      lockBody()
      setChatWidth(storageCustomChatWidth)
      setTimeout(unlockBody)
    }

    let startX = 0
    let startWidth = storageCustomChatWidth ?? DEFAULT_WIDTH

    // Pointer events
    const onPointerMove = (event: MouseEvent) => {
      const diff = event.clientX - startX
      const newWidth = Math.max(startWidth - diff, DEFAULT_WIDTH)

      setChatWidth(newWidth)
    }

    const onPointerUp = () => {
      unlockBody()
      globalThis.removeEventListener('mousemove', onPointerMove)
      const newWidth = getChatWidth()

      if (newWidth === startWidth) return
      storage.setItem(LOCAL_STORAGE_KEY, newWidth)
    }

    const onPointerDown = (event: MouseEvent) => {
      if (event.target !== resizer) return
      startX = event.clientX
      startWidth = chat.getBoundingClientRect().width
      lockBody()
      globalThis.addEventListener('mousemove', onPointerMove)
    }

    globalThis.addEventListener('mousedown', onPointerDown)
    globalThis.addEventListener('mouseup', onPointerUp)

    // Player
    const resizePlayer = () => {
      const playerTheatre = document.querySelector('.persistent-player--theatre')

      if (!playerTheatre) return
      const chatExpanded = chat.classList.contains('chat-shell__expanded')
      playerTheatre.classList[chatExpanded ? 'add' : 'remove']('custom-persistent-player--theatre')
    }

    const player = document.querySelector('.player-controls__right-control-group')
    player?.addEventListener('click', () => setTimeout(resizePlayer))

    const chatToggleButton = document.querySelector('[data-a-target="right-column__toggle-collapse-btn"]')
    chatToggleButton?.addEventListener('click', () => setTimeout(resizePlayer))
  },
})
