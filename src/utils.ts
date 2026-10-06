import type { Statut } from './api/types'

const STATUT_META: Record<Statut, { label: string; color: string }> = {
  EN_ATTENTE_VALIDATION: { label: 'En attente validation', color: 'gold' },
  A_RECTIFIER: { label: 'À rectifier', color: 'volcano' },
  RECTIFICATION_EN_COURS: { label: 'Rectification IA en cours', color: 'processing' },
  VALIDEE: { label: 'Validée', color: 'green' },
}

export function statutLabel(statut: Statut): string {
  return STATUT_META[statut]?.label ?? statut
}

export function statutColor(statut: Statut): string {
  return STATUT_META[statut]?.color ?? 'default'
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}
