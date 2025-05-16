"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDownIcon } from "lucide-react"
import { UpdateTheme, DeleteTheme } from "@/app/ui/themes/buttons"
import { formatDateToLocal } from "@/app/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/ui/themes/accordion"

interface Theme {
  id: string
  title: string
  image_url: string
  instrument: string
  seconds: number
  createdAt: string
  updatedAt: string
}

interface PrettyThemesTableProps {
  themes?: Theme[]
  
}

export default async function  PrettyThemesTable = ({ themes = [] }: PrettyThemesTableProps) => {
    themes = await fetchFilteredThemes(query, currentPage);
    console.log("PrettyThemesTable: ", themes); 
  return (
    <Accordion>
      {themes.map((theme) => (
        <AccordionItem key={theme.id}>
          <AccordionTrigger>
            <div className="flex items-center justify-between">
              <span>{theme.title}</span>
              <ChevronDownIcon className="h-5 w-5" />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center space-x-4 py-2">
              <Image
                className="h-10 w-10 rounded-full"
                src={theme.image_url}
                alt={theme.title}
                width={40}
                height={40}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{theme.title}</p>
                <p className="truncate text-sm text-gray-400">{theme.instrument}</p>
              </div>
              <p className="truncate text-sm font-medium text-gray-300">{theme.seconds}</p>
              <UpdateTheme themeId={theme.id} />
              <DeleteTheme themeId={theme.id} />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

