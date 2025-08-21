"use client"

import { useState, useEffect } from "react"
import { useSlides } from "@/hooks/use-slides"
import { useFullscreen } from "@/hooks/use-fullscreen"
import { useCanvasTools } from "@/hooks/use-canvas-tools"
import { SlideHeader } from "@/components/slide-header"
import { SlideToolbar } from "@/components/slide-toolbar"
import { SlideSidebar } from "@/components/slide-sidebar"
import { CanvasSlideViewer } from "@/components/canvas-slide-viewer"
import { SlideControls } from "@/components/slide-controls"
import { CanvasFullscreenSlideshow } from "@/components/canvas-fullscreen-slideshow"

export default function GoogleSlidesClone() {
  const [title, setTitle] = useState("v0 Exec Summit NYC")
  const [showHeader, setShowHeader] = useState(true)

  const { slides, currentSlide, setCurrentSlide, nextSlide, prevSlide, addSlide, getCurrentSlide } = useSlides()

  const { isFullscreen, isTransitioning, showSlide, fullscreenRef, startSlideshow, endSlideshow } = useFullscreen()

  const { tool, zoom, changeTool, changeZoom, resetZoom } = useCanvasTools()

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const nextKeys = ["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"]
      const prevKeys = ["ArrowLeft", "ArrowUp", "PageUp"]
      const endKeys = ["Escape"]
      const nonFullscreenNextKeys = ["ArrowDown", "PageDown"]
      const nonFullscreenPrevKeys = ["ArrowUp", "PageUp"]

      if (isFullscreen) {
        if (nextKeys.includes(e.key)) {
          e.preventDefault()
          nextSlide()
        } else if (prevKeys.includes(e.key)) {
          e.preventDefault()
          prevSlide()
        } else if (endKeys.includes(e.key) && isFullscreen) {
          e.preventDefault()
          endSlideshow()
        }
      } else {
        if (nonFullscreenNextKeys.includes(e.key)) {
          e.preventDefault()
          nextSlide()
        } else if (nonFullscreenPrevKeys.includes(e.key)) {
          e.preventDefault()
          prevSlide()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen, nextSlide, prevSlide, endSlideshow])

  // Click to advance in fullscreen
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fullscreenRef.current && !fullscreenRef.current.contains(event.target as Node)) {
        nextSlide()
      }
    }

    if (isFullscreen) {
      document.addEventListener("click", handleClickOutside)
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isFullscreen, nextSlide, fullscreenRef])

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 overflow-hidden">
      {/* Header */}
      {showHeader && <SlideHeader title={title} setTitle={setTitle} onStartSlideshow={startSlideshow} />}

      {/* Toolbar */}
      <SlideToolbar showHeader={showHeader} setShowHeader={setShowHeader} onAddSlide={addSlide} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SlideSidebar slides={slides} currentSlide={currentSlide} onSlideSelect={setCurrentSlide} />

        {/* Main Content */}
        <div className="flex-1 bg-gray-200 flex flex-col">
          <CanvasSlideViewer 
            slide={getCurrentSlide()} 
            tool={tool}
            onToolChange={changeTool}
            zoom={zoom}
          />

          {/* Bottom Controls */}
          <SlideControls
            currentSlide={currentSlide}
            totalSlides={slides.length}
            onPrevSlide={prevSlide}
            onNextSlide={nextSlide}
            onSlideChange={setCurrentSlide}
            tool={tool}
            onToolChange={changeTool}
            zoom={zoom}
            onZoomChange={changeZoom}
          />
        </div>
      </div>

      {/* Fullscreen Slideshow */}
      <CanvasFullscreenSlideshow
        slide={getCurrentSlide()}
        isVisible={isFullscreen || isTransitioning}
        showSlide={showSlide}
        fullscreenRef={fullscreenRef}
        onNextSlide={nextSlide}
        tool={tool}
        onToolChange={changeTool}
      />
    </div>
  )
}
