"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Slide } from "@/types/slide"

interface SlideSidebarProps {
  slides: Slide[]
  currentSlide: number
  onSlideSelect: (slideId: number) => void
}

export function SlideSidebar({ slides, currentSlide, onSlideSelect }: SlideSidebarProps) {
  const slidePreviewRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const activeSlidePreview = slidePreviewRefs.current[currentSlide - 1]
    if (activeSlidePreview && scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current
      const scrollAreaRect = scrollArea.getBoundingClientRect()
      const activeSlideRect = activeSlidePreview.getBoundingClientRect()

      if (activeSlideRect.top < scrollAreaRect.top) {
        scrollArea.scrollTop -= scrollAreaRect.top - activeSlideRect.top
      } else if (activeSlideRect.bottom > scrollAreaRect.bottom) {
        scrollArea.scrollTop += activeSlideRect.bottom - scrollAreaRect.bottom
      }
    }
  }, [currentSlide])

  return (
    <div className="min-w-64 w-64 bg-gray-100 border-r border-gray-300 flex flex-col">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            ref={(el) => (slidePreviewRefs.current[index] = el)}
            className={`flex items-start p-2.5 m-2.5 cursor-pointer rounded-lg ${
              currentSlide === slide.id ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => onSlideSelect(slide.id)}
          >
            <div className="text-xs font-medium text-gray-500 mr-3 mt-1">{slide.id}</div>
            <div className="flex-1 w-full">
              <div className="rounded-lg overflow-hidden shadow-sm relative w-full" style={{ aspectRatio: "16 / 9" }}>
                <div className="absolute inset-0 flex bg-black">
                  {slide.onlyImage && (
                    <Image
                      src={slide.onlyImage || ""}
                      alt="Slide image"
                      layout="fill"
                      objectFit="contain"
                      className="w-full h-full"
                    />
                  )}
                  {slide.custom?.videos && (
                    <div className="w-full h-full relative flex bg-black">
                      <video
                        src={slide.custom.videos[0].src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}
