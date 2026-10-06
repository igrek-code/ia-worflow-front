export type Statut = 'EN_ATTENTE_VALIDATION' | 'A_RECTIFIER' | 'RECTIFICATION_EN_COURS' | 'VALIDEE'

export type GenerationStatut = 'EN_COURS' | 'TERMINEE' | 'ECHEC'

export type Auteur = 'PO' | 'AGENT'

export interface CompteRenduRequest {
  titre: string
  contenu: string
}

export interface CommentaireRequest {
  auteur: Auteur
  contenu: string
}

export interface CompteRenduResumeDto {
  id: number
  titre: string
  generationStatut: GenerationStatut | null
  createdAt: string
}

export interface UserStoryResumeDto {
  id: number
  titre: string
  statut: Statut
  version: number
  cartesStatut: GenerationStatut | null
}

export interface CompteRenduDto {
  id: number
  titre: string
  contenu: string
  generationStatut: GenerationStatut | null
  erreurGeneration: string | null
  createdAt: string
  userStories: UserStoryResumeDto[]
}

export interface CommentaireDto {
  id: number
  auteur: Auteur
  contenu: string
  createdAt: string
}

export interface CarteTechniqueResumeDto {
  id: number
  titre: string
}

export interface CarteTechniqueDto {
  id: number
  titre: string
  description: string
  taches: string[]
  createdAt: string
  userStoryId: number
  userStoryTitre: string
  userStoryStatut: Statut
  compteRenduId: number
  compteRenduTitre: string
}

export interface UserStoryDto {
  id: number
  titre: string
  description: string
  criteres: string[]
  statut: Statut
  version: number
  cartesStatut: GenerationStatut | null
  erreurGeneration: string | null
  createdAt: string
  updatedAt: string | null
  compteRenduId: number
  compteRenduTitre: string
  commentaires: CommentaireDto[]
  cartesTechniques: CarteTechniqueResumeDto[]
}

export interface ApiError {
  status: number
  erreur: string
  horodatage: string
}
