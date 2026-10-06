export type BoardSelection =
  | { type: 'compte-rendu'; id: number }
  | { type: 'user-story'; id: number }
  | { type: 'carte-technique'; id: number }
