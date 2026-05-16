import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api, EMPTY_TEAM_ME } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [teamMe, setTeamMe] = useState(null)
  const [loadingTeam, setLoadingTeam] = useState(false)
  const refreshLock = useRef(false)

  async function refreshTeamMe(activeSession) {
    if (!activeSession?.access_token) {
      setTeamMe(null)
      return
    }
    if (refreshLock.current) return
    refreshLock.current = true
    setLoadingTeam(true)
    try {
      const data = await api.getTeamMe()
      setTeamMe(data)
    } catch (err) {
      if (err.status === 401) {
        setTeamMe({ ...EMPTY_TEAM_ME, user_id: activeSession.user?.id ?? null })
      } else {
        setTeamMe({ ...EMPTY_TEAM_ME, user_id: activeSession.user?.id ?? null })
      }
    } finally {
      setLoadingTeam(false)
      refreshLock.current = false
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null)
      if (s?.access_token) refreshTeamMe(s)
      else setTeamMe(null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s ?? null)
      // Avoid hammering /team/me on every token refresh tick
      if (event === 'SIGNED_OUT') {
        setTeamMe(null)
        return
      }
      if (s?.access_token && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
        refreshTeamMe(s)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId || !session?.access_token) return

    const channel = supabase
      .channel(`membership-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'players', filter: `auth_id=eq.${userId}` },
        () => refreshTeamMe(session)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'join_requests', filter: `user_id=eq.${userId}` },
        () => refreshTeamMe(session)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])

  const signOut = async () => {
    await supabase.auth.signOut()
    setTeamMe(null)
  }

  return (
    <AuthContext.Provider value={{ session, teamMe, loadingTeam, refreshTeamMe, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
