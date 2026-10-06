import { ThunderboltOutlined } from '@ant-design/icons'
import {
  Alert,
  App as AntApp,
  Button,
  Drawer,
  Empty,
  List,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/endpoints'
import type { CompteRenduDto, GenerationStatut } from '../api/types'
import { usePolling } from '../hooks/usePolling'
import { formatDate } from '../utils'
import { StatutTag } from './StatutTag'
import type { BoardSelection } from './selection'

interface CompteRenduDrawerProps {
  id: number | null
  onClose: () => void
  onOpen: (selection: BoardSelection) => void
  onChanged: () => void | Promise<void>
}

export function CompteRenduDrawer({ id, onClose, onOpen, onChanged }: CompteRenduDrawerProps) {
  const { message, notification } = AntApp.useApp()
  const [cr, setCr] = useState<CompteRenduDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [lancement, setLancement] = useState(false)

  const load = useCallback(async () => {
    if (id === null) return
    setLoading(true)
    try {
      setCr(await api.getCompteRendu(id))
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
    setCr(null)
    void load()
  }, [load])

  // Polling piloté par l'état serveur : actif tant que la génération est EN_COURS,
  // que le lancer vienne de ce navigateur ou d'ailleurs.
  const generationEnCours = cr?.generationStatut === 'EN_COURS'
  usePolling(() => void load(), generationEnCours, 2000)

  // Toasts de fin de génération : détection de la transition EN_COURS → TERMINEE/ECHEC,
  // avec garde par id pour éviter les faux toasts au changement de compte rendu.
  const statutPrecedent = useRef<{ id: number; statut: GenerationStatut | null } | null>(null)
  useEffect(() => {
    if (!cr) {
      statutPrecedent.current = null
      return
    }
    const precedent = statutPrecedent.current
    statutPrecedent.current = { id: cr.id, statut: cr.generationStatut }
    if (!precedent || precedent.id !== cr.id || precedent.statut !== 'EN_COURS') return
    if (cr.generationStatut === 'TERMINEE') {
      message.success(`${cr.userStories.length} user stories générées`)
      void onChanged()
    } else if (cr.generationStatut === 'ECHEC') {
      notification.error({
        message: 'Échec de la génération des user stories',
        description: cr.erreurGeneration ?? 'Erreur inconnue',
      })
      void onChanged()
    }
  }, [cr, message, notification, onChanged])

  const handleGenerate = async () => {
    if (id === null) return
    setLancement(true)
    try {
      // 202 : la génération tourne en arrière-plan, on suit generationStatut via le polling.
      await api.generateUserStories(id)
      message.success('Génération lancée — l\'agent écrit les user stories en arrière-plan')
      await load()
      await onChanged()
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inattendue',
      })
    } finally {
      setLancement(false)
    }
  }

  const dejaGenerees = (cr?.userStories.length ?? 0) > 0

  return (
    <Drawer open={id !== null} onClose={onClose} width={720} title={cr ? cr.titre : 'Compte rendu'}>
      {loading && !cr ? (
        <Spin style={{ display: 'block', margin: '80px auto' }} />
      ) : cr ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Text type="secondary">Créé le {formatDate(cr.createdAt)}</Typography.Text>

          {!dejaGenerees && (
            <Popconfirm
              title="Générer les user stories ?"
              description="L'agent génère les user stories en arrière-plan (asynchrone)."
              onConfirm={() => void handleGenerate()}
            >
              <Button type="primary" ghost icon={<ThunderboltOutlined />} loading={lancement}>
                Générer les user stories
              </Button>
            </Popconfirm>
          )}

          {generationEnCours && (
            <Alert
              type="info"
              showIcon
              message="Génération en cours…"
              description="L'agent écrit les user stories en arrière-plan. Vous pouvez fermer cette fenêtre : le board se mettra à jour tout seul."
            />
          )}

          {cr.generationStatut === 'ECHEC' && !dejaGenerees && (
            <Alert
              type="error"
              showIcon
              message="La génération a échoué"
              description={cr.erreurGeneration ?? 'Erreur inconnue'}
            />
          )}

          <Typography.Title level={5} style={{ margin: 0 }}>
            Contenu
          </Typography.Title>
          <Typography.Paragraph
            style={{
              whiteSpace: 'pre-wrap',
              marginBottom: 0,
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 12,
              maxHeight: 320,
              overflow: 'auto',
            }}
          >
            {cr.contenu}
          </Typography.Paragraph>

          <Typography.Title level={5} style={{ margin: 0 }}>
            User stories ({cr.userStories.length})
          </Typography.Title>
          {cr.userStories.length === 0 ? (
            <Empty description="Aucune user story — lancez la génération" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              size="small"
              dataSource={cr.userStories}
              renderItem={(us) => (
                <List.Item
                  style={{ padding: '6px 0', cursor: 'pointer' }}
                  onClick={() => onOpen({ type: 'user-story', id: us.id })}
                >
                  <Space>
                    <Typography.Link>{us.titre}</Typography.Link>
                    <StatutTag statut={us.statut} />
                    <Tag color="blue">v{us.version}</Tag>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </Space>
      ) : (
        <Empty description="Compte rendu introuvable" />
      )}
    </Drawer>
  )
}
