"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Plus, Minus, Hand, MousePointer2, Edit3 } from "lucide-react"
import type { DrawingTool } from "./canvas-slide-viewer"

interface SlideControlsProps {
  currentSlide: number
  totalSlides: number
  onPrevSlide: () => void
  onNextSlide: () => void
  onSlideChange: (slideNumber: number) => void
  tool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  zoom: number
  onZoomChange: (zoom: number) => void
}

export function SlideControls({
  currentSlide,
  totalSlides,
  onPrevSlide,
  onNextSlide,
  onSlideChange,
  tool,
  onToolChange,
  zoom,
  onZoomChange,
}: SlideControlsProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 0.1, 3))
  }

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 0.1, 0.1))
  }

  const handleZoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseFloat(e.target.value)
    onZoomChange(value)
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-t border-gray-300">
      <div className="flex items-center space-x-2">
        <Button 
          variant={tool === "pointer" ? "default" : "ghost"} 
          size="icon"
          onClick={() => onToolChange("pointer")}
          title="Pointer Tool"
        >
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button 
          variant={tool === "pen" ? "default" : "ghost"} 
          size="icon"
          onClick={() => onToolChange("pen")}
          title="Drawing Pen"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button 
          variant={tool === "hand" ? "default" : "ghost"} 
          size="icon"
          onClick={() => onToolChange("hand")}
          title="Pan Tool"
        >
          <Hand className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={onPrevSlide}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={currentSlide}
          onChange={(e) => onSlideChange(Number(e.target.value))}
          className="w-16 text-center"
        />
        <span>/ {totalSlides}</span>
        <Button variant="ghost" size="icon" onClick={onNextSlide}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={handleZoomOut}>
          <Minus className="h-4 w-4" />
        </Button>
        <select 
          className="bg-transparent border-none text-sm cursor-pointer"
          value={zoom}
          onChange={handleZoomSelect}
        >
          <option value={0.25}>25%</option>
          <option value={0.5}>50%</option>
          <option value={0.75}>75%</option>
          <option value={1}>100%</option>
          <option value={1.25}>125%</option>
          <option value={1.5}>150%</option>
          <option value={2}>200%</option>
        </select>
        <Button variant="ghost" size="icon" onClick={handleZoomIn}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
