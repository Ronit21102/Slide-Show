"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import Image from "next/image"
import type { Slide } from "@/types/slide"
import { DrawingToolbar, type PenSettings } from "./drawing-toolbar"

export type DrawingTool = "pointer" | "pen" | "hand"

interface CanvasAction {
  type: "draw" | "clear" | "image"
  data: string // base64 image data of the canvas state
}

interface EnhancedCanvasSlideViewerProps {
  slide: Slide
  tool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  zoom: number
}

export function EnhancedCanvasSlideViewer({ 
  slide, 
  tool, 
  onToolChange, 
  zoom 
}: EnhancedCanvasSlideViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  
  // Pan state
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  
  // Pen settings
  const [penSettings, setPenSettings] = useState<PenSettings>({
    color: "#ff0000",
    size: 3,
  })
  
  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<CanvasAction[]>([])
  const [redoStack, setRedoStack] = useState<CanvasAction[]>([])
  const [canvasStates, setCanvasStates] = useState<Map<number, CanvasAction[]>>(new Map())

  // Save canvas state to undo stack
  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL()
    const action: CanvasAction = { type: "draw", data: imageData }
    
    setUndoStack(prev => [...prev, action])
    setRedoStack([]) // Clear redo stack when new action is performed
  }, [])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match container
    const container = containerRef.current
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    // Set drawing properties
    ctx.strokeStyle = penSettings.color
    ctx.lineWidth = penSettings.size
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Load canvas state for current slide
    const slideStates = canvasStates.get(slide.id)
    if (slideStates && slideStates.length > 0) {
      const lastState = slideStates[slideStates.length - 1]
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = lastState.data
      setUndoStack(slideStates)
    } else {
      // Save initial empty state
      const initialState: CanvasAction = { type: "clear", data: canvas.toDataURL() }
      setUndoStack([initialState])
    }
  }, [slide, canvasStates, penSettings.color, penSettings.size])

  // Save canvas state when slide changes
  useEffect(() => {
    return () => {
      if (slide && undoStack.length > 0) {
        setCanvasStates(prev => new Map(prev.set(slide.id, undoStack)))
      }
    }
  }, [slide.id, undoStack])

  // Update pen settings
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.strokeStyle = penSettings.color
    ctx.lineWidth = penSettings.size
  }, [penSettings])

  // Handle mouse events for drawing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    if (tool === "pen") {
      setIsDrawing(true)
      setLastPoint({ x, y })
    } else if (tool === "hand") {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [tool, zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    if (tool === "pen" && isDrawing && lastPoint) {
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(x, y)
      ctx.stroke()
      setLastPoint({ x, y })
    } else if (tool === "hand" && isPanning && panStart) {
      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [tool, isDrawing, isPanning, lastPoint, panStart, zoom])

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      saveCanvasState()
    }
    setIsDrawing(false)
    setIsPanning(false)
    setLastPoint(null)
    setPanStart(null)
  }, [isDrawing, saveCanvasState])

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (undoStack.length <= 1) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const currentState = undoStack[undoStack.length - 1]
    const previousState = undoStack[undoStack.length - 2]

    setRedoStack(prev => [...prev, currentState])
    setUndoStack(prev => prev.slice(0, -1))

    // Restore previous state
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = previousState.data
  }, [undoStack])

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const stateToRestore = redoStack[redoStack.length - 1]
    
    setUndoStack(prev => [...prev, stateToRestore])
    setRedoStack(prev => prev.slice(0, -1))

    // Restore state
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = stateToRestore.data
  }, [redoStack])

  // Clear canvas
  const handleClearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const clearedState: CanvasAction = { type: "clear", data: canvas.toDataURL() }
    
    setUndoStack(prev => [...prev, clearedState])
    setRedoStack([])
  }, [])

  // Insert image
  const handleInsertImage = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.onload = () => {
        // Draw image at center of canvas
        const x = (canvas.width - img.width) / 2
        const y = (canvas.height - img.height) / 2
        ctx.drawImage(img, x, y)
        
        const imageState: CanvasAction = { type: "image", data: canvas.toDataURL() }
        setUndoStack(prev => [...prev, imageState])
        setRedoStack([])
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault()
          handleUndo()
        } else if ((e.key === "y") || (e.key === "z" && e.shiftKey)) {
          e.preventDefault()
          handleRedo()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleUndo, handleRedo])

  // Get cursor style based on tool
  const getCursorStyle = () => {
    switch (tool) {
      case "pen":
        return "crosshair"
      case "hand":
        return isPanning ? "grabbing" : "grab"
      default:
        return "default"
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Drawing Toolbar */}
      <div className="p-4 border-b">
        <DrawingToolbar
          tool={tool}
          onToolChange={onToolChange}
          penSettings={penSettings}
          onPenSettingsChange={setPenSettings}
          canUndo={undoStack.length > 1}
          canRedo={redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearCanvas={handleClearCanvas}
          onInsertImage={handleInsertImage}
        />
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <div
            ref={containerRef}
            className="relative w-full h-full"
            style={{ 
              maxWidth: "min(70vw, 70vh * 16 / 9)", 
              maxHeight: "min(70vh, 70vw * 9 / 16)",
              transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: "center"
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              {slide.onlyImage && (
                <Image
                  src={slide.onlyImage || ""}
                  alt="Slide image"
                  layout="fill"
                  objectFit="contain"
                  className="w-full h-full"
                  draggable={false}
                />
              )}
              {slide.custom?.videos && (
                <div className="w-full h-full">
                  {slide.custom.videos.map((video, index) => (
                    <video 
                      key={index} 
                      src={video.src} 
                      autoPlay 
                      loop 
                      muted 
                      className="w-full h-full object-contain"
                    />
                  ))}
                </div>
              )}
              
              {/* Canvas overlay for drawing */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-auto"
                style={{ cursor: getCursorStyle() }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for image insertion */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}