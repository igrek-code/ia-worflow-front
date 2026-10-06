import { Tag } from 'antd'
import type { Statut } from '../api/types'
import { statutColor, statutLabel } from '../utils'

export function StatutTag({ statut }: { statut: Statut }) {
  return <Tag color={statutColor(statut)}>{statutLabel(statut)}</Tag>
}
