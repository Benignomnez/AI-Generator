"use client"

// This is a simplified version of the toast hook
// In a real implementation, you would use a toast library like react-hot-toast or sonner

import { useState } from "react"

type ToastType = "default" | "destructive" | "success"

interface ToastProps {
  title?: string
  description?: string
  variant?: ToastType
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...props, id }

    setToasts((prevToasts) => [...prevToasts, newToast])

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, props.duration || 3000)

    // For debugging purposes, log the toast to console
    console.log(`Toast: ${props.title} - ${props.description}`)

    return id
  }

  const dismiss = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  return { toast, dismiss, toasts }
}

