import { useState, useCallback, useRef, useEffect } from 'react'

export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    setSeconds(initialSeconds)
    setIsActive(true)
  }, [initialSeconds])

  useEffect(() => {
    if (isActive && seconds > 0) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            setIsActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, seconds])

  return { seconds, isActive, start }
}
