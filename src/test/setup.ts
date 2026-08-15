import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

/**
 * Node 22+ 는 자체 `localStorage` 전역 getter(--localstorage-file 없으면 undefined)를 갖고 있어
 * jsdom 의 localStorage 를 가린다. 테스트에선 메모리 Storage 로 대체한다.
 */
if (typeof globalThis.localStorage === 'undefined' || globalThis.localStorage == null) {
  const store = new Map<string, string>()
  const memoryStorage: Storage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    key: (i) => [...store.keys()][i] ?? null,
    removeItem: (k) => {
      store.delete(k)
    },
    setItem: (k, v) => {
      store.set(String(k), String(v))
    },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true, writable: true })
}

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
})
