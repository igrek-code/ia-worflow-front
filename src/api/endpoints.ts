import { request } from './client'
import type {
  CarteTechniqueDto,
  CommentaireDto,
  CommentaireRequest,
  CompteRenduDto,
  CompteRenduRequest,
  CompteRenduResumeDto,
  Statut,
  UserStoryDto,
} from './types'

export const api = {
  listComptesRendus: () => request<CompteRenduResumeDto[]>('/api/comptes-rendus'),
  createCompteRendu: (body: CompteRenduRequest) =>
    request<CompteRenduDto>('/api/comptes-rendus', { method: 'POST', body: JSON.stringify(body) }),
  getCompteRendu: (id: number) => request<CompteRenduDto>(`/api/comptes-rendus/${id}`),
  // Retourne 202 + CompteRenduDto : la génération est asynchrone,
  // suivre cr.generationStatut (EN_COURS → TERMINEE | ECHEC).
  generateUserStories: (id: number) =>
    request<CompteRenduDto>(`/api/comptes-rendus/${id}/generation-user-stories`, { method: 'POST' }),
  listUserStories: (statut?: Statut) =>
    request<UserStoryDto[]>(`/api/user-stories${statut ? `?statut=${statut}` : ''}`),
  getUserStory: (id: number) => request<UserStoryDto>(`/api/user-stories/${id}`),
  addCommentaire: (id: number, body: CommentaireRequest) =>
    request<CommentaireDto>(`/api/user-stories/${id}/commentaires`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  rectifyUserStory: (id: number) =>
    request<UserStoryDto>(`/api/user-stories/${id}/rectification`, { method: 'POST' }),
  validateUserStory: (id: number) =>
    request<UserStoryDto>(`/api/user-stories/${id}/validation`, { method: 'POST' }),
  listCartesTechniques: () => request<CarteTechniqueDto[]>('/api/cartes-techniques'),
  getCarteTechnique: (id: number) => request<CarteTechniqueDto>(`/api/cartes-techniques/${id}`),
}
