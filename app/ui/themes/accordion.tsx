'use client';
import React, { useState, createContext, useContext, ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline'; // Using Heroicons

interface AccordionContextProps {
  openItem: string | null;
  setOpenItem: (value: string | null) => void;
  onValueChange?: (value: string | null) => void; // Add onValueChange to context if needed for deeper components
}

const AccordionContext = createContext<AccordionContextProps | undefined>(undefined);

export const Accordion = ({
  children,
  type = 'single',
  onValueChange, // Accept onValueChange prop
}: {
  children: ReactNode;
  type?: 'single' | 'multiple';
  onValueChange?: (value: string | null) => void; // Define prop type
}) => {
  const [openItem, setOpenItemInternal] = useState<string | null>(null);

  const handleSetOpenItem = (value: string | null) => {
    setOpenItemInternal(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    // Pass the new handler to context
    <AccordionContext.Provider value={{ openItem, setOpenItem: handleSetOpenItem, onValueChange }}>
      <div className="w-full space-y-1 rounded-md">{children}</div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  children: ReactNode;
  value: string; // Unique value for each item
}

export const AccordionItem = ({ children, value }: AccordionItemProps) => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("AccordionItem must be used within an Accordion");
  }
  // For a 'multiple' type, each item would manage its own state or context would hold an array
  // const [isOpen, setIsOpen] = useState(false); // Self-managed state if not using context for single open

  const isOpen = context.openItem === value;
  const childrenArray = React.Children.toArray(children);
  const trigger = childrenArray[0];
  const content = childrenArray[1];

  return (
    <div className="accordion-item border-b border-gray-700 last:border-b-0 bg-gray-800 rounded-md overflow-hidden">
      {/* Pass isOpen and value to trigger for context-aware toggling */}
      {React.isValidElement(trigger) ? React.cloneElement(trigger as React.ReactElement<any>, { isOpen, value }) : trigger}
      {isOpen && content}
    </div>
  );
};

interface AccordionTriggerProps {
  children: ReactNode;
  isOpen?: boolean; // Injected by AccordionItem
  value?: string;   // Injected by AccordionItem
}

export const AccordionTrigger = ({ children, isOpen, value }: AccordionTriggerProps) => {
  const context = useContext(AccordionContext);
  if (!context) {
    // This case might occur if used outside cloneElement, though less likely with current AccordionItem setup
    throw new Error("AccordionTrigger must be used within an AccordionItem");
  }
  // Use the context setOpenItem which now also calls onValueChange
  return (
    <button
      onClick={() => context.setOpenItem(context.openItem === value ? null : value!)}
      className="flex w-full items-center justify-between p-4 text-left text-gray-200 hover:bg-gray-700 focus:outline-none transition-colors duration-150 ease-in-out"
      aria-expanded={isOpen}
    >
      <span className="flex-1 text-base font-medium">{children}</span>
      <ChevronDownIcon
        className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`}
      />
    </button>
  );
};

export const AccordionContent = ({ children }: { children: ReactNode }) => {
  return (
    <div className="accordion-content overflow-hidden transition-all duration-300 ease-in-out">
      <div className="p-4 pt-0 text-gray-300 bg-gray-800"> 
        {children}
      </div>
    </div>
  );
};