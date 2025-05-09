import React, { useState } from 'react';

export const Accordion = ({ children }) => {
  return <div className="accordion">{children}</div>;
};

export const AccordionItem = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="accordion-item">
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        {children[0]}
      </div>
      {isOpen && <div className="accordion-content">{children[1]}</div>}
    </div>
  );
};

export const AccordionTrigger = ({ children }) => {
  return <div className="accordion-trigger">{children}</div>;
};

export const AccordionContent = ({ children }) => {
  return <div className="accordion-content">{children}</div>;
};