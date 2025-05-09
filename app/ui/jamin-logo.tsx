'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { lusitana } from '@/app/ui/fonts'

export default function TheminLogo() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="mb-2 overflow-hidden rounded-md bg-black-1200"
      animate={{
        backgroundColor: isHovered
          ? ['#111827', '#667eea', '#764ba2']
          : '#111827',
      }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href="/dashboard/themes"
        className="flex h-20 items-end justify-start p-4 md:h-40"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className={`${lusitana.className} relative flex h-full w-full items-end justify-start overflow-hidden rounded-md`}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            className="flex h-full w-full items-end justify-start rounded-md px-4 py-2"
            initial={false}
            animate={{
              background: isHovered
                 ? '#667eea' 
                : 'rgba(217, 211, 211, 0.05)',
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`h-6 w-6 md:h-8 md:w-8 ${isHovered ? 'text-white' : 'text-gray-300'}`} />
              <motion.p
                className={`text-xl font-bold md:text-2xl ${isHovered ? 'text-white' : 'text-gray-300'}`}
                initial={false}
                animate={{ scale: isHovered ? 1.1 : 1 }}
              >
                JamIn
              </motion.p>
            </div>
          </motion.div>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 opacity-0"
            animate={{ opacity: isHovered ? 0.3 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </Link>
    </motion.div>
  )
}

