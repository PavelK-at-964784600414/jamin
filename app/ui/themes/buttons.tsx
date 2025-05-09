"use client"
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteTheme } from '@/app/lib/actions';

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"



export function CreateTheme() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link href="/dashboard/themes/create">
      <motion.div
        className="relative flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-white shadow-md transition-all overflow-hidden"
        style={{
          background: "#172124", // Dark grey background base
          boxShadow: isHovered
            ? "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -4px rgba(59, 130, 246, 0.3)"
            : "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      >
        {/* Gradient overlay with animated opacity for gradual transition */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{
            background: "linear-gradient(to right, #4f46e5, #3b82f6)",
            zIndex: 0,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {/* Content positioned above the background */}
        <motion.span
          className="hidden md:block relative z-10"
          animate={{ x: isHovered ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          Create Theme
        </motion.span>
        <motion.div
          className="flex h-5 items-center md:ml-4 relative z-10"
          animate={{
            x: isHovered ? 4 : 0,
            rotate: isHovered ? 90 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Plus className="h-5 w-5" />
        </motion.div>

        {/* Animated background effect */}
        <motion.div
          className="absolute inset-0 -z-10 rounded-lg opacity-0"
          animate={{
            opacity: isHovered ? 0.5 : 0,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{
            background: "radial-gradient(circle, rgba(79, 70, 229, 0.4) 0%, rgba(59, 130, 246, 0) 70%)",
            zIndex: 1,
          }}
        />
      </motion.div>
    </Link>
  )
}

export function UpdateTheme({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/invoices/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteTheme({ id }: { id: string }) {
  const deleteInvoiceWithId = deleteTheme.bind(null, id);
 
  return (
    <form action={deleteInvoiceWithId}>
      <button className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
  );
}
