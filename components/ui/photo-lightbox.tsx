"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ShoppingCart, Download, Image as ImageIcon } from 'lucide-react'
import { Button } from './button'
import { useCartStore } from '@/store/cart-store'
import { Photo, PhotoFormat } from '@/types'
import { formatPrice } from '@/lib/utils'
import { PHOTO_FORMATS } from '@/lib/data'

interface PhotoLightboxProps {
  photos: Photo[]
  initialPhotoIndex: number
  isOpen: boolean
  onClose: () => void
}

export function PhotoLightbox({ photos, initialPhotoIndex, isOpen, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialPhotoIndex)
  const [showFormatMenu, setShowFormatMenu] = useState(false)
  const addItem = useCartStore(state => state.addItem)
  const items = useCartStore(state => state.items)

  const currentPhoto = photos[currentIndex]

  // Formats disponibles : numérique + tirages
  const digitalFormats = PHOTO_FORMATS.filter(f => f.id.includes('digital'))
  const printFormats = PHOTO_FORMATS.filter(f => f.id.includes('print'))

  // Vérifier si la photo numérique est déjà dans le panier
  const isDigitalInCart = items.some(
    item => item.type === 'photo' &&
    item.photo?.id === currentPhoto?.id &&
    item.format?.id.includes('digital')
  )

  useEffect(() => {
    setCurrentIndex(initialPhotoIndex)
  }, [initialPhotoIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          handlePrevious()
          break
        case 'ArrowRight':
          handleNext()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const handleAddToCart = (format: PhotoFormat) => {
    // Empêcher d'ajouter plusieurs fois le même format numérique
    if (format.id.includes('digital') && isDigitalInCart) {
      return
    }

    addItem(currentPhoto, format)
    setShowFormatMenu(false)
  }

  if (!currentPhoto) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-24 sm:top-28 right-4 z-50 text-white hover:text-gray-300 transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <X className="h-8 w-8" />
          </button>

          {/* Navigation Buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handlePrevious()
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-gray-300 transition-colors p-2 sm:p-3 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={photos.length <= 1}
          >
            <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-gray-300 transition-colors p-2 sm:p-3 hover:bg-white/10 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={photos.length <= 1}
          >
            <ChevronRight className="h-8 w-8 sm:h-10 sm:w-10" />
          </button>

          {/* Image Container */}
          <div
            className="relative w-full h-full flex items-center justify-center p-4 md:p-16"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              key={currentPhoto.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-7xl max-h-full w-full h-full"
            >
              <Image
                src={currentPhoto.url}
                alt={`Photo ${currentPhoto.id}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </motion.div>
          </div>

          {/* Info Panel */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 sm:p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="text-white">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-heading font-bold mb-1 sm:mb-2">
                    Photo {currentPhoto.id}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm md:text-base text-gray-300">
                    {currentPhoto.bibNumbers.length > 0 && (
                      <span>
                        Dossard(s): {currentPhoto.bibNumbers.join(', ')}
                      </span>
                    )}
                    <span className="text-primary-400 font-semibold text-base sm:text-lg">
                      {formatPrice(currentPhoto.price)}
                    </span>
                    <span className="text-gray-400">
                      {currentIndex + 1} / {photos.length}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <Button
                    onClick={() => setShowFormatMenu(true)}
                    className="flex-1 sm:flex-initial text-sm sm:text-base h-9 sm:h-10"
                  >
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="hidden sm:inline">Ajouter au panier</span>
                    <span className="sm:hidden">Ajouter</span>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Format Selection Menu */}
          <AnimatePresence>
            {showFormatMenu && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                onClick={() => setShowFormatMenu(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-xl p-6 max-w-md w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-xl">Choisir le format</h3>
                    <button
                      onClick={() => setShowFormatMenu(false)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Numérique */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Download className="h-5 w-5 text-blue-600" />
                        <p className="font-semibold">Format Numérique</p>
                      </div>
                      {digitalFormats.map((format) => (
                        <button
                          key={format.id}
                          onClick={() => handleAddToCart(format)}
                          disabled={isDigitalInCart}
                          className={`w-full text-left p-4 rounded-lg border-2 mb-2 transition-all ${
                            isDigitalInCart
                              ? 'border-green-300 bg-green-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{format.name}</p>
                              <p className="text-sm text-gray-600">{format.description}</p>
                            </div>
                            <p className="font-bold text-blue-600 text-lg">
                              {isDigitalInCart ? '✓' : formatPrice(format.price)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Tirages */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="h-5 w-5 text-blue-600" />
                        <p className="font-semibold">Format Tirage 13x19cm</p>
                      </div>
                      {printFormats.map((format) => (
                        <button
                          key={format.id}
                          onClick={() => handleAddToCart(format)}
                          className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 mb-2 transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{format.name}</p>
                              <p className="text-sm text-gray-600">{format.description}</p>
                            </div>
                            <p className="font-bold text-blue-600 text-lg">{formatPrice(format.price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
