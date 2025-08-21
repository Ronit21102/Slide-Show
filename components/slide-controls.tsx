"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Plus, Minus, Hand, MousePointer2 } from "lucide-react"

interface SlideControlsProps {
  currentSlide: number
  totalSlides: number
  onPrevSlide: () => void
  onNextSlide: () => void
  onSlideChange: (slideNumber: number) => void
  zoomPercent: number
  onZoomChange: (zoomPercent: number) => void
  toolMode: "pointer" | "pan"
  onToolModeChange: (mode: "pointer" | "pan") => void
}

export function SlideControls({
  currentSlide,
  totalSlides,
  onPrevSlide,
  onNextSlide,
  onSlideChange,
  zoomPercent,
  onZoomChange,
  toolMode,
  onToolModeChange,
}: SlideControlsProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-t border-gray-300">
      <div className="flex items-center space-x-2">
        <Button
          variant={toolMode === "pointer" ? "default" : "ghost"}
          size="icon"
          onClick={() => onToolModeChange("pointer")}
        >
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button
          variant={toolMode === "pan" ? "default" : "ghost"}
          size="icon"
          onClick={() => onToolModeChange("pan")}
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onZoomChange(Math.max(10, Math.round(zoomPercent - 10)))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <select
          className="bg-transparent border-none text-sm"
          value={zoomPercent}
          onChange={(e) => onZoomChange(Number(e.target.value))}
        >
          <option value={50}>50%</option>
          <option value={75}>75%</option>
          <option value={100}>100%</option>
          <option value={150}>150%</option>
          <option value={200}>200%</option>
          <option value={300}>300%</option>
          <option value={400}>400%</option>
        </select>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onZoomChange(Math.min(400, Math.round(zoomPercent + 10)))}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
