import Image from "next/image"
import type { Slide } from "@/types/slide"

interface SlideViewerProps {
  slide: Slide
}

export function SlideViewer({ slide }: SlideViewerProps) {
  return (
    <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="relative w-full h-full"
          style={{ maxWidth: "min(70vw, 70vh * 16 / 9)", maxHeight: "min(70vh, 70vw * 9 / 16)" }}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-black">
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
              <div className="w-full h-full">
                {slide.custom.videos.map((video, index) => (
                  <video key={index} src={video.src} autoPlay loop muted className="w-full h-full object-contain" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
