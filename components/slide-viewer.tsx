"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Slide } from "@/types/slide"

type ToolMode = "pointer" | "pan"

interface SlideViewerProps {
  slide: Slide
  zoomPercent: number
  panOffset: { x: number; y: number }
  onPanOffsetChange: (offset: { x: number; y: number }) => void
  onZoomChange: (zoomPercent: number) => void
  toolMode: ToolMode
}

export function SlideViewer({ slide, zoomPercent, panOffset, onPanOffsetChange, onZoomChange, toolMode }: SlideViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null)

  // Load image when slide changes
  useEffect(() => {
    if (!slide.onlyImage) {
      setImage(null)
      setImageSize(null)
      return
    }
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = slide.onlyImage
    const handleLoad = () => {
      setImage(img)
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.addEventListener("load", handleLoad)
    return () => {
      img.removeEventListener("load", handleLoad)
    }
  }, [slide.onlyImage])

  // Resize canvas to device pixels based on container size
  const resizeCanvasToContainer = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))
    canvas.style.width = `${Math.max(1, Math.floor(rect.width))}px`
    canvas.style.height = `${Math.max(1, Math.floor(rect.height))}px`
    // Redraw after resize so content fits
    requestAnimationFrame(() => draw())
  }, [draw])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => resizeCanvasToContainer())
    ro.observe(containerRef.current)
    resizeCanvasToContainer()
    return () => {
      ro.disconnect()
    }
  }, [resizeCanvasToContainer])

  // Compute base scale (fit) to center image in canvas
  const baseScale = useMemo(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageSize) return 1
    const cw = canvas.width
    const ch = canvas.height
    const scale = Math.min(cw / imageSize.width, ch / imageSize.height)
    return scale
  }, [imageSize])

  const zoomScale = useMemo(() => Math.max(0.1, zoomPercent / 100), [zoomPercent])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (!image || !imageSize) return

    const totalScale = baseScale * zoomScale
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Apply transform: center + pan, then scale, draw centered image
    ctx.setTransform(totalScale, 0, 0, totalScale, centerX + panOffset.x * (window.devicePixelRatio || 1), centerY + panOffset.y * (window.devicePixelRatio || 1))
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    const iw = imageSize.width
    const ih = imageSize.height
    ctx.drawImage(image, -iw / 2, -ih / 2, iw, ih)
  }, [image, imageSize, baseScale, zoomScale, panOffset])

  useEffect(() => {
    draw()
  }, [draw])

  // Helpers to convert screen to world coords and adjust pan when zooming at cursor
  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const x = (clientX - rect.left) * dpr
      const y = (clientY - rect.top) * dpr
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const totalScale = baseScale * zoomScale
      return {
        x: (x - (centerX + panOffset.x * dpr)) / totalScale,
        y: (y - (centerY + panOffset.y * dpr)) / totalScale,
      }
    },
    [baseScale, zoomScale, panOffset]
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (!image) return
      e.preventDefault()
      const delta = -e.deltaY
      const factor = delta > 0 ? 1.1 : 0.9

      // Zoom around cursor: compute world point before zoom and keep it stationary
      const worldBefore = screenToWorld(e.clientX, e.clientY)
      const newZoom = Math.min(400, Math.max(10, Math.round(zoomPercent * factor)))
      const oldZoomScale = zoomScale
      const newZoomScale = Math.max(0.1, newZoom / 100)
      const scaleRatio = newZoomScale / oldZoomScale

      const dpr = window.devicePixelRatio || 1
      const canvas = canvasRef.current
      if (!canvas) return
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // Current screen position of the world point
      const currentScreenX = centerX + panOffset.x * dpr + worldBefore.x * (baseScale * oldZoomScale)
      const currentScreenY = centerY + panOffset.y * dpr + worldBefore.y * (baseScale * oldZoomScale)

      // Required pan to keep the same screen position after zoom
      const newPanX = (currentScreenX - centerX - worldBefore.x * (baseScale * newZoomScale)) / dpr
      const newPanY = (currentScreenY - centerY - worldBefore.y * (baseScale * newZoomScale)) / dpr

      // Apply
      onPanOffsetChange({ x: newPanX, y: newPanY })
      onZoomChange(newZoom)
    },
    [image, baseScale, zoomPercent, zoomScale, panOffset, onPanOffsetChange, onZoomChange, screenToWorld]
  )

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (toolMode !== "pan") return
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    setIsPanning(true)
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY }
  }, [toolMode])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPanning || toolMode !== "pan") return
    const last = lastPointerPosRef.current
    if (!last) return
    const dx = e.clientX - last.x
    const dy = e.clientY - last.y
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY }
    onPanOffsetChange({ x: panOffset.x + dx, y: panOffset.y + dy })
  }, [isPanning, toolMode, panOffset, onPanOffsetChange])

  const endPan = useCallback((e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e) {
      try { ;(e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId) } catch {}
    }
    setIsPanning(false)
    lastPointerPosRef.current = null
  }, [])

  // Receive zoom changes from parent
  useEffect(() => {
    draw()
  }, [zoomPercent, draw])

  // Redraw on pan
  useEffect(() => {
    draw()
  }, [panOffset, draw])

  return (
    <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="relative w-full h-full"
          style={{ maxWidth: "min(70vw, 70vh * 16 / 9)", maxHeight: "min(70vh, 70vw * 9 / 16)" }}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            {slide.onlyImage ? (
              <canvas
                ref={canvasRef}
                className="w-full h-full touch-none"
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endPan}
                onPointerCancel={endPan}
                onPointerLeave={endPan}
              />
            ) : slide.custom?.videos ? (
              <div className="w-full h-full">
                {slide.custom.videos.map((video, index) => (
                  <video key={index} src={video.src} autoPlay loop muted className="w-full h-full object-contain" />
                ))}
              </div>
            ) : null}
            {/* Hidden container for canvas sizing */}
            <div ref={containerRef} className="absolute inset-0 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
