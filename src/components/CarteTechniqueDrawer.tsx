import { ArrowRightOutlined, CheckSquareOutlined } from '@ant-design/icons'
import { App as AntApp, Drawer, Empty, List, Space, Spin, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/endpoints'
import type { CarteTechniqueDto } from '../api/types'
import { formatDate } from '../utils'
import { StatutTag } from './StatutTag'
import type { BoardSelection } from './selection'

interface CarteTechniqueDrawerProps {
  id: number | null
  onClose: () => void
  onOpen: (selection: BoardSelection) => void
}

export function CarteTechniqueDrawer({ id, onClose, onOpen }: CarteTechniqueDrawerProps) {
  const { notification } = AntApp.useApp()
  const [carte, setCarte] = useState<CarteTechniqueDto | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (id === null) return
    setLoading(true)
    try {
      setCarte(await api.getCarteTechnique(id))
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inattendue',
      })
    } finally {
      setLoading(false)
    }
  }, [id, notification])

  useEffect(() => {
    setCarte(null)
    void load()
  }, [load])

  return (
    <Drawer
      open={id !== null}
      onClose={onClose}
      width={640}
      title={carte ? carte.titre : 'Carte technique'}
    >
      {loading && !carte ? (
        <Spin style={{ display: 'block', margin: '80px auto' }} />
      ) : carte ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Text type="secondary">Créée le {formatDate(carte.createdAt)}</Typography.Text>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Traçabilité :
            </Typography.Text>
            <Typography.Link onClick={() => onOpen({ type: 'user-story', id: carte.userStoryId })}>
              {carte.userStoryTitre}
            </Typography.Link>
            <StatutTag statut={carte.userStoryStatut} />
            <ArrowRightOutlined style={{ color: '#999' }} />
            <Typography.Link onClick={() => onOpen({ type: 'compte-rendu', id: carte.compteRenduId })}>
              {carte.compteRenduTitre}
            </Typography.Link>
          </div>

          <Typography.Title level={5} style={{ margin: 0 }}>
            Description
          </Typography.Title>
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
            {carte.description}
          </Typography.Paragraph>

          <Typography.Title level={5} style={{ margin: 0 }}>
            Tâches ({carte.taches.length})
          </Typography.Title>
          <List
            size="small"
            dataSource={carte.taches}
            locale={{ emptyText: 'Aucune tâche' }}
            renderItem={(tache) => (
              <List.Item style={{ padding: '2px 0' }}>
                <Space>
                  <CheckSquareOutlined style={{ color: '#52c41a' }} />
                  <span>{tache}</span>
                </Space>
              </List.Item>
            )}
          />
        </Space>
      ) : (
        <Empty description="Carte technique introuvable" />
      )}
    </Drawer>
  )
}
