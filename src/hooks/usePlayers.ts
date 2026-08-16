import { useSyncExternalStore } from 'react'
import { getSnapshot, subscribe } from '../lib/players'

export { setCount, resetScores, creditAndPass, MAX_PLAYERS } from '../lib/players'

export function usePlayers() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
