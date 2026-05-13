import { useEffect, useRef, useState, useCallback } from 'react'
import useAppStore from '../store/useAppStore'

export function useWebSocket(room = 'global') {
  const [connectionState, setConnectionState] = useState('disconnected')
  const ws = useRef(null)
  const reconnectTimeout = useRef(null)
  const { applyWsEvent } = useAppStore()

  const connect = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
    ws.current = new WebSocket(`${wsUrl}/${room}`)

    ws.current.onopen = () => {
      setConnectionState('connected')
      // Ping interval to keep connection alive
      ws.current.pingInterval = setInterval(() => {
        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)
    }

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'pong') return
        if (data.event && data.payload) {
          applyWsEvent(data.event, data.payload)
        }
      } catch (err) {
        console.error("WebSocket parsing error:", err)
      }
    }

    ws.current.onclose = () => {
      setConnectionState('disconnected')
      clearInterval(ws.current?.pingInterval)
      // Auto-reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(connect, 3000)
    }

    ws.current.onerror = () => {
      ws.current.close()
    }
  }, [room, applyWsEvent])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimeout.current)
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [connect])

  const sendMessage = useCallback((event, payload) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ event, payload }))
    }
  }, [])

  return { connectionState, sendMessage }
}
