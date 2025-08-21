"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
import type { DrawingTool } from "./enhanced-canvas-slide-viewer"

export interface PenSettings {
  color: string
  size: number
}

interface DrawingToolbarProps {
  tool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  penSettings: PenSettings
  onPenSettingsChange: (settings: PenSettings) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onClearCanvas: () => void
  onInsertImage: () => void
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

export function DrawingToolbar({
  tool,
  onToolChange,
  penSettings,
  onPenSettingsChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearCanvas,
  onInsertImage,
}: DrawingToolbarProps) {
  return (
    <div className="flex items-center space-x-2 p-2 bg-white border rounded-lg shadow-lg">
      {/* Tool Selection */}
      <div className="flex items-center space-x-1">
        <Button
          variant={tool === "pointer" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("pointer")}
          title="Pointer Tool"
        >
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button
          variant={tool === "pen" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("pen")}
          title="Drawing Pen"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button
          variant={tool === "hand" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("hand")}
          title="Pan Tool"
        >
          <Hand className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Pen Settings */}
      {tool === "pen" && (
        <div className="flex items-center space-x-2">
          {/* Color Palette */}
          <div className="flex items-center space-x-1">
            <Palette className="h-4 w-4 text-gray-500" />
            <div className="flex space-x-1">
              {PEN_COLORS.map((color) => (
                <button
                  key={color.value}
                  className={`w-6 h-6 rounded-full border-2 ${
                    penSettings.color === color.value
                      ? "border-gray-800 scale-110"
                      : "border-gray-300"
                  } transition-all`}
                  style={{ backgroundColor: color.value }}
                  onClick={() =>
                    onPenSettingsChange({ ...penSettings, color: color.value })
                  }
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Pen Size */}
          <div className="flex items-center space-x-1">
            <Circle className="h-4 w-4 text-gray-500" />
            <select
              value={penSettings.size}
              onChange={(e) =>
                onPenSettingsChange({
                  ...penSettings,
                  size: parseInt(e.target.value),
                })
              }
              className="text-sm border rounded px-2 py-1"
            >
              {PEN_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <Separator orientation="vertical" className="h-6" />

      {/* Undo/Redo */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Additional Actions */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onInsertImage}
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearCanvas}
          title="Clear Canvas"
          className="text-red-600 hover:text-red-700"
        >
          Clear
        </Button>
      </div>
    </div>
  )
}