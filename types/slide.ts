export interface Slide {
  id: number
  onlyImage?: string
  custom?: {
    content?: string
    image?: string
    videos?: { src: string }[]
  }
}
