import { createContext, useContext } from 'react'

// Shared by every card name/picture: show the hover popup, or open the full card page.
export const PreviewContext = createContext(null)

export function useOpenCard() {
  return useContext(PreviewContext).onOpenCard
}
