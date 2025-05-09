'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PowerIcon } from '@heroicons/react/24/outline'
import { signOut } from '@/auth'

export function CoolSignOut() {
  const [isHovered, setIsHovered] = useState(false)

  // Create a server action for sign out
  const handleSignOut = async () => {
    await signOut({ redirect: true, redirectTo: '/login' });
  }

  return (
    <div className="flex flex-col w-full gap-2">
      <motion.div
        className="hidden h-auto w-full grow rounded-md bg-black md:block"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      />
      <form action={handleSignOut}>
        <motion.button
          type="submit"
          className="relative overflow-hidden flex h-[48px] w-full items-center justify-center gap-2 rounded-md bg-black p-0.5"
          whileHover={{ scale: 1.05 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div
            className="flex h-full w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-4 text-sm font-medium"
            animate={{
              background: isHovered
                ? '#667eea' 
                : '#111',
            }}
          >
            <PowerIcon className={`h-5 w-5 ${isHovered ? 'text-white' : 'text-gray-400'}`} />
            <span className={`hidden md:inline ${isHovered ? 'text-white' : 'text-gray-300'}`}>
              Sign Out
            </span>
          </motion.div>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 opacity-0"
            animate={{ opacity: isHovered ? 0.3 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      </form>
    </div>
  )
}

