import { useCallback, useEffect, useState } from 'react'

export type Route = 'home' | 'combo10' | 'clues' | 'lineup' | 'career' | 'honours' | 'order' | 'ox'

const ROUTES: readonly Route[] = ['home', 'combo10', 'clues', 'lineup', 'career', 'honours', 'order', 'ox']

function parse(hash: string): Route {
  const key = hash.replace(/^#\/?/, '')
  return (ROUTES as readonly string[]).includes(key) ? (key as Route) : 'home'
}

/** 해시 라우팅(#/top10 …). GitHub Pages 에서 새로고침·뒤로가기가 그대로 동작한다. */
export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))

  useEffect(() => {
    const onHash = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = useCallback((r: Route) => {
    window.location.hash = r === 'home' ? '/' : `/${r}`
  }, [])

  return [route, navigate]
}
