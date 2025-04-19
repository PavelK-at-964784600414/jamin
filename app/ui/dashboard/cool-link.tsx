'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { TypeIcon as type, LucideIcon } from 'lucide-react'

interface CoolLinkProps {
  href: string
  name: string
  icon: LucideIcon
}

export function CoolLink({ href, name, icon: Icon }: CoolLinkProps) {
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link href={href} passHref>
      <motion.div
        className={`relative overflow-hidden rounded-xl ${
          isActive ? 'bg-gradient-to-br from-purple-600 to-blue-500' : 'bg-black'
        } p-0.5`}
        whileHover={{ scale: 1.05 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <motion.div
          className={`flex h-12 items-center justify-center gap-2 rounded-lg ${
            isActive ? 'bg-black' : 'bg-gray-900'
          } px-4 text-sm font-medium`}
          initial={false}
          animate={{
            background: isHovered
              ? '#667eea' 
              : isActive
              ? '#000'
              : '#111',
          }}
        >
          <Icon className={`h-5 w-5 ${isActive || isHovered ? 'text-white' : 'text-gray-400'}`} />
          <span className={`hidden md:inline ${isActive || isHovered ? 'text-white' : 'text-gray-300'}`}>
            {name}
          </span>
        </motion.div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 opacity-0"
          animate={{ opacity: isHovered || isActive ? 0.3 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </Link>
  )
}

