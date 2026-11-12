"use client"

import { useCallback, useState, type DragEvent } from "react"

/**
 * Drag-and-drop for the Studio upload box. Hands the dropped file to the same
 * handler the file picker uses (it validates type and size), with a data-URL preview.
 */
export function useImageDrop(onFile: (file: File, previewUrl: string) => void, disabled = false) {
  const [isDragging, setIsDragging] = useState(false)

  const onDragOver = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault()
      if (!disabled) setIsDragging(true)
    },
    [disabled]
  )

  const onDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled) return
      const file = e.dataTransfer.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => onFile(file, ev.target?.result as string)
      reader.readAsDataURL(file)
    },
    [disabled, onFile]
  )

  return { isDragging, dropProps: { onDragOver, onDragLeave, onDrop } }
}
