"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Inter } from "next/font/google"
import type { Slide } from "@/types/slide"
import type { DrawingTool } from "./enhanced-canvas-slide-viewer"
import type { PenSettings } from "./drawing-toolbar"
import { Button } from "@/components/ui/button"
import { 
  MousePointer2, 
  Hand, 
  Edit3, 
  Undo2, 
  Redo2, 
  Image as ImageIcon,
  Palette,
  Circle
} from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

interface CanvasAction {
  type: "draw" | "clear" | "image"
  data: string
}

interface EnhancedFullscreenSlideshowProps {
  slide: Slide
  isVisible: boolean
  showSlide: boolean
  fullscreenRef: React.RefObject<HTMLDivElement>
  onNextSlide: () => void
  tool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
}

const PEN_COLORS = [
  { name: "Red", value: "#ff0000" },
  { name: "Blue", value: "#0000ff" },
  { name: "Green", value: "#00ff00" },
  { name: "Black", value: "#000000" },
  { name: "Yellow", value: "#ffff00" },
  { name: "Purple", value: "#800080" },
  { name: "Orange", value: "#ffa500" },
  { name: "White", value: "#ffffff" },
]

const PEN_SIZES = [1, 2, 3, 5, 8, 12, 16, 20]

export function EnhancedFullscreenSlideshow({
  slide,
  isVisible,
  showSlide,
  fullscreenRef,
  onNextSlide,
  tool,
  onToolChange,
}: EnhancedFullscreenSlideshowProps) {
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
    size: 4,
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
    if (!isVisible) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match screen
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

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
  }, [slide, isVisible, canvasStates, penSettings.color, penSettings.size])

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
    e.preventDefault()
    e.stopPropagation()

    if (tool === "pointer") {
      onNextSlide()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === "pen") {
      setIsDrawing(true)
      setLastPoint({ x, y })
    } else if (tool === "hand") {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [tool, onNextSlide])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

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
  }, [tool, isDrawing, isPanning, lastPoint, panStart])

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
        const maxWidth = canvas.width * 0.3
        const maxHeight = canvas.height * 0.3
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height)
        const width = img.width * scale
        const height = img.height * scale
        const x = (canvas.width - width) / 2
        const y = (canvas.height - height) / 2
        
        ctx.drawImage(img, x, y, width, height)
        
        const imageState: CanvasAction = { type: "image", data: canvas.toDataURL() }
        setUndoStack(prev => [...prev, imageState])
        setRedoStack([])
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  // Get cursor style based on tool
  const getCursorStyle = () => {
    switch (tool) {
      case "pen":
        return "crosshair"
      case "hand":
        return isPanning ? "grabbing" : "grab"
      default:
        return "none"
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return
      
      if (e.key === "p" || e.key === "P") {
        onToolChange("pen")
      } else if (e.key === "h" || e.key === "H") {
        onToolChange("hand")
      } else if (e.key === "c" || e.key === "C") {
        handleClearCanvas()
      } else if (e.key === "r" || e.key === "R") {
        setPanOffset({ x: 0, y: 0 })
      } else if (e.key === "i" || e.key === "I") {
        handleInsertImage()
      } else if (e.ctrlKey || e.metaKey) {
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
  }, [isVisible, onToolChange, handleClearCanvas, handleInsertImage, handleUndo, handleRedo])

  if (!isVisible) return null

  return (
    <div
      ref={fullscreenRef}
      className={`${inter.className} fixed inset-0 bg-black z-50 flex items-center justify-center`}
      style={{ cursor: tool === "pointer" ? "none" : "default" }}
    >
      <div
        className={`relative w-screen h-screen flex items-center justify-center overflow-hidden transition-opacity duration-300 ${showSlide ? "opacity-100" : "opacity-0"}`}
      >
        <div 
          ref={containerRef}
          className="relative w-full h-full" 
          style={{ 
            maxWidth: "177.78vh", 
            maxHeight: "56.25vw",
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
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
                quality={75}
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
          </div>
        </div>

        {/* Canvas overlay for drawing */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: getCursorStyle() }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Floating Toolbar */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            {/* Tool Selection */}
            <Button
              variant={tool === "pointer" ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange("pointer")}
              title="Pointer Tool"
              className="text-white"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "pen" ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange("pen")}
              title="Drawing Pen"
              className="text-white"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "hand" ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange("hand")}
              title="Pan Tool"
              className="text-white"
            >
              <Hand className="h-4 w-4" />
            </Button>

            {/* Pen Colors (when pen is selected) */}
            {tool === "pen" && (
              <>
                <div className="w-px h-6 bg-gray-500 mx-2" />
                <div className="flex space-x-1">
                  {PEN_COLORS.slice(0, 4).map((color) => (
                    <button
                      key={color.value}
                      className={`w-5 h-5 rounded-full border ${
                        penSettings.color === color.value
                          ? "border-white scale-110"
                          : "border-gray-400"
                      } transition-all`}
                      style={{ backgroundColor: color.value }}
                      onClick={() =>
                        setPenSettings({ ...penSettings, color: color.value })
                      }
                      title={color.name}
                    />
                  ))}
                </div>
                <select
                  value={penSettings.size}
                  onChange={(e) =>
                    setPenSettings({
                      ...penSettings,
                      size: parseInt(e.target.value),
                    })
                  }
                  className="text-xs bg-gray-700 text-white border border-gray-500 rounded px-1 py-1"
                >
                  {PEN_SIZES.slice(0, 6).map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </>
            )}

            <div className="w-px h-6 bg-gray-500 mx-2" />

            {/* Undo/Redo */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={undoStack.length <= 1}
              title="Undo (Ctrl+Z)"
              className="text-white disabled:text-gray-500"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
              className="text-white disabled:text-gray-500"
            >
              <Redo2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-500 mx-2" />

            {/* Additional Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInsertImage}
              title="Insert Image (I)"
              className="text-white"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCanvas}
              title="Clear Canvas (C)"
              className="text-red-400 hover:text-red-300"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Keyboard shortcuts help */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-xs">
          <div>P = Pen | H = Hand | C = Clear | R = Reset Pan | I = Insert Image</div>
          <div>Ctrl+Z = Undo | Ctrl+Y = Redo</div>
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