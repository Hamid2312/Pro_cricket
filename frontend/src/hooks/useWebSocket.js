import { useEffect, useRef, useState, useCallback } from 'react'
import useAppStore from '../store/useAppStore'

function wsBaseUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.replace(/\/$/, '')
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

export function useWebSocket(room = 'global', enabled = true) {
  const [connectionState, setConnectionState] = useState('disconnected')
  const ws = useRef(null)
  const reconnectTimeout = useRef(null)
  const unmounted = useRef(false)
  const { applyWsEvent } = useAppStore()

  const connect = useCallback(() => {
    if (!enabled || unmounted.current) return

    const url = `${wsBaseUrl()}/${room}`
    const socket = new WebSocket(url)
    ws.current = socket

    socket.onopen = () => {
      if (unmounted.current) {
        socket.close()
        return
      }
      setConnectionState('connected')
      socket.pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'pong') return
        if (data.event && data.payload) {
          applyWsEvent(data.event, data.payload)
        }
      } catch (err) {
        console.error('WebSocket parsing error:', err)
      }
    }

    socket.onclose = () => {
      setConnectionState('disconnected')
      clearInterval(socket.pingInterval)
      if (!unmounted.current && enabled) {
        reconnectTimeout.current = setTimeout(connect, 3000)
      }
    }

    socket.onerror = () => {
      socket.close()
    }
  }, [room, applyWsEvent, enabled])

  useEffect(() => {
    unmounted.current = false
    if (enabled) {
      connect()
    } else {
      setConnectionState('disconnected')
    }
    return () => {
      unmounted.current = true
      clearTimeout(reconnectTimeout.current)
      if (ws.current) {
        ws.current.onclose = null
        ws.current.close()
        ws.current = null
      }
    }
  }, [connect, enabled])

  const sendMessage = useCallback((event, payload) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ event, payload }))
    }
  }, [])

  return { connectionState, sendMessage }
}
