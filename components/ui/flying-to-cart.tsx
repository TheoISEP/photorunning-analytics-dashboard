"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'

interface FlyingItem {
  id: string
  startX: number
  startY: number
  type: 'photo' | 'pack'
}

export function FlyingToCart() {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([])

  useEffect(() => {
    const handleAddToCart = (event: CustomEvent) => {
      const { startElement, type } = event.detail
      const rect = startElement.getBoundingClientRect()

      const newItem: FlyingItem = {
        id: `flying-${Date.now()}-${Math.random()}`,
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
        type: type || 'photo'
      }

      setFlyingItems(prev => [...prev, newItem])

      // Retirer l'item après l'animation
      setTimeout(() => {
        setFlyingItems(prev => prev.filter(item => item.id !== newItem.id))
      }, 1000)
    }

    window.addEventListener('add-to-cart-animation' as any, handleAddToCart as any)
    return () => {
      window.removeEventListener('add-to-cart-animation' as any, handleAddToCart as any)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[200]">
      <AnimatePresence>
        {flyingItems.map((item) => {
          // Trouver la position du panier
          const cartButton = document.getElementById('cart-button')
          const cartRect = cartButton?.getBoundingClientRect()

          if (!cartRect) return null

          const endX = cartRect.left + cartRect.width / 2
          const endY = cartRect.top + cartRect.height / 2

          return (
            <motion.div
              key={item.id}
              initial={{
                x: item.startX,
                y: item.startY,
                scale: 1,
                opacity: 1
              }}
              animate={{
                x: endX,
                y: endY,
                scale: 0.3,
                opacity: 0.8
              }}
              exit={{
                opacity: 0,
                scale: 0
              }}
              transition={{
                duration: 0.8,
                ease: [0.43, 0.13, 0.23, 0.96]
              }}
              className="absolute"
              style={{
                left: 0,
                top: 0
              }}
            >
              <div className="w-12 h-12 bg-[#db2f34] rounded-full flex items-center justify-center shadow-xl">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
