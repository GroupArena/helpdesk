--- src/contexts/TicketModalContext.tsx (原始)


+++ src/contexts/TicketModalContext.tsx (修改后)
import { createContext, useContext, useState, ReactNode } from 'react';

interface TicketModalContextType {
  selectedTicketId: string | null;
  openTicket: (ticketId: string) => void;
  closeTicket: () => void;
}

const TicketModalContext = createContext<TicketModalContextType | null>(null);

export function useTicketModal() {
  const context = useContext(TicketModalContext);
  if (!context) {
    throw new Error('useTicketModal must be used within a TicketModalProvider');
  }
  return context;
}

export function TicketModalProvider({ children }: { children: ReactNode }) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  function openTicket(ticketId: string) {
    setSelectedTicketId(ticketId);
  }

  function closeTicket() {
    setSelectedTicketId(null);
  }

  return (
    <TicketModalContext.Provider value={{ selectedTicketId, openTicket, closeTicket }}>
      {children}
    </TicketModalContext.Provider>
  );
}
