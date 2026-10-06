import { CheckCircleOutlined, CommentOutlined, RocketOutlined } from '@ant-design/icons'
import {
  Alert,
  App as AntApp,
  Button,
  Divider,
  Drawer,
  Empty,
  Input,
  List,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
} from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/endpoints'
import type { GenerationStatut, Statut, UserStoryDto } from '../api/types'
import { usePolling } from '../hooks/usePolling'
import { formatDate } from '../utils'
import { StatutTag } from './StatutTag'
import type { BoardSelection } from './selection'

interface UserStoryDrawerProps {
  id: number | null
  onClose: () => void
  onOpen: (selection: BoardSelection) => void
  onChanged: () => void | Promise<void>
}

export function UserStoryDrawer({ id, onClose, onOpen, onChanged }: UserStoryDrawerProps) {
  const { message, notification } = AntApp.useApp()
  const [us, setUs] = useState<UserStoryDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<'validation' | 'rectification' | null>(null)
  const [commentaire, setCommentaire] = useState('')
  const [posting, setPosting] = useState(false)

  const load = useCallback(async () => {
    if (id === null) return
    setLoading(true)
    try {
      setUs(await api.getUserStory(id))
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
    setUs(null)
    setCommentaire('')
    void load()
  }, [load])

  // Polling piloté par l'état serveur : rectification IA ou génération de cartes en cours.
  const rectificationEnCours = us?.statut === 'RECTIFICATION_EN_COURS'
  const cartesEnCours = us?.cartesStatut === 'EN_COURS'
  usePolling(() => void load(), rectificationEnCours || cartesEnCours, 2000)

  // Toasts de fin : détection des transitions, avec garde par id.
  const etatPrecedent = useRef<{
    id: number
    statut: Statut
    cartesStatut: GenerationStatut | null
  } | null>(null)
  useEffect(() => {
    if (!us) {
      etatPrecedent.current = null
      return
    }
    const precedent = etatPrecedent.current
    etatPrecedent.current = { id: us.id, statut: us.statut, cartesStatut: us.cartesStatut }
    if (!precedent || precedent.id !== us.id) return
    if (precedent.statut === 'RECTIFICATION_EN_COURS' && us.statut === 'EN_ATTENTE_VALIDATION') {
      message.success(`Rectification appliquée — version ${us.version}`)
      void onChanged()
    }
    if (precedent.statut === 'RECTIFICATION_EN_COURS' && us.statut === 'A_RECTIFIER') {
      notification.error({
        message: 'Échec de la rectification',
        description: us.erreurGeneration ?? 'Erreur inconnue',
      })
      void onChanged()
    }
    if (precedent.cartesStatut === 'EN_COURS' && us.cartesStatut === 'TERMINEE') {
      message.success(`${us.cartesTechniques.length} carte(s) technique(s) générée(s)`)
      void onChanged()
    }
    if (precedent.cartesStatut === 'EN_COURS' && us.cartesStatut === 'ECHEC') {
      notification.error({
        message: 'Échec de la génération des cartes techniques',
        description: us.erreurGeneration ?? 'Erreur inconnue',
      })
      void onChanged()
    }
  }, [us, message, notification, onChanged])

  const handleComment = async () => {
    if (!us || !commentaire.trim()) return
    setPosting(true)
    try {
      await api.addCommentaire(us.id, { auteur: 'PO', contenu: commentaire.trim() })
      message.success('Commentaire envoyé — la user story passe en « À rectifier »')
      setCommentaire('')
      await load()
      await onChanged()
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inattendue',
      })
    } finally {
      setPosting(false)
    }
  }

  const handleValidate = async () => {
    if (!us) return
    setBusy('validation')
    try {
      // 202 : la validation est enregistrée, les cartes sont générées en arrière-plan.
      await api.validateUserStory(us.id)
      message.success('User story validée — cartes techniques en cours de génération')
      await load()
      await onChanged()
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inattendue',
      })
    } finally {
      setBusy(null)
    }
  }

  const handleRectify = async () => {
    if (!us) return
    setBusy('rectification')
    try {
      // 202 : la rectification tourne en arrière-plan, suivie via le polling.
      await api.rectifyUserStory(us.id)
      message.success('Rectification lancée — l\'agent applique vos commentaires')
      await load()
      await onChanged()
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inattendue',
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Drawer
      open={id !== null}
      onClose={onClose}
      width={720}
      title={
        us ? (
          <Space align="center" wrap>
            {us.titre}
            <StatutTag statut={us.statut} />
            <Tag color="blue">v{us.version}</Tag>
          </Space>
        ) : (
          'User story'
        )
      }
    >
      {loading && !us ? (
        <Spin style={{ display: 'block', margin: '80px auto' }} />
      ) : us ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            Créée le {formatDate(us.createdAt)}
            {us.updatedAt ? ` · mise à jour le ${formatDate(us.updatedAt)}` : ''}
            {' · CR : '}
            <Typography.Link onClick={() => onOpen({ type: 'compte-rendu', id: us.compteRenduId })}>
              {us.compteRenduTitre}
            </Typography.Link>
          </Typography.Text>

          <Typography.Title level={5} style={{ margin: 0 }}>
            Description
          </Typography.Title>
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
            {us.description}
          </Typography.Paragraph>

          <Typography.Title level={5} style={{ margin: 0 }}>
            Critères d'acceptation ({us.criteres.length})
          </Typography.Title>
          <List
            size="small"
            dataSource={us.criteres}
            locale={{ emptyText: 'Aucun critère' }}
            renderItem={(critere) => <List.Item style={{ padding: '4px 0' }}>{critere}</List.Item>}
          />

          <Typography.Title level={5} style={{ margin: 0 }}>
            Actions PO
          </Typography.Title>
          {us.statut === 'EN_ATTENTE_VALIDATION' && (
            <>
              <Alert
                type="info"
                showIcon
                message="En attente de votre validation"
                description="Commentez pour demander une rectification (la carte passe en « À rectifier »), ou validez pour générer les cartes techniques."
              />
              <Input.TextArea
                rows={3}
                value={commentaire}
                onChange={(event) => setCommentaire(event.target.value)}
                placeholder="Vos remarques pour l'agent…"
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  icon={<CommentOutlined />}
                  loading={posting}
                  disabled={!commentaire.trim()}
                  onClick={() => void handleComment()}
                >
                  Commenter
                </Button>
                <Popconfirm
                  title="Valider cette user story ?"
                  description="Les cartes techniques seront générées par l'agent en arrière-plan (asynchrone)."
                  onConfirm={() => void handleValidate()}
                >
                  <Button type="primary" icon={<CheckCircleOutlined />} loading={busy === 'validation'}>
                    Valider
                  </Button>
                </Popconfirm>
              </div>
            </>
          )}

          {us.statut === 'A_RECTIFIER' && (
            <>
              {us.erreurGeneration && (
                <Alert
                  type="error"
                  showIcon
                  message="La dernière rectification a échoué"
                  description={us.erreurGeneration}
                />
              )}
              <Alert
                type="warning"
                showIcon
                message="À rectifier"
                description="Vos commentaires attendent l'agent. Lancez la rectification, ou complétez vos remarques."
              />
              <Input.TextArea
                rows={3}
                value={commentaire}
                onChange={(event) => setCommentaire(event.target.value)}
                placeholder="Compléter vos remarques…"
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  icon={<CommentOutlined />}
                  loading={posting}
                  disabled={!commentaire.trim()}
                  onClick={() => void handleComment()}
                >
                  Commenter à nouveau
                </Button>
                <Popconfirm
                  title="Lancer la rectification ?"
                  description="L'agent applique vos commentaires en arrière-plan et produit la version suivante."
                  onConfirm={() => void handleRectify()}
                >
                  <Button type="primary" icon={<RocketOutlined />} loading={busy === 'rectification'}>
                    Lancer la rectification
                  </Button>
                </Popconfirm>
              </div>
            </>
          )}

          {us.statut === 'RECTIFICATION_EN_COURS' && (
            <Alert
              type="info"
              showIcon
              message="Rectification en cours"
              description="L'agent applique vos commentaires en arrière-plan. Vous pouvez fermer cette fenêtre : le board se mettra à jour tout seul."
            />
          )}

          {us.statut === 'VALIDEE' && (
            <>
              {us.cartesStatut === 'EN_COURS' && (
                <Alert
                  type="info"
                  showIcon
                  message="User story validée"
                  description="L'agent rédige les cartes techniques en arrière-plan. Vous pouvez fermer cette fenêtre."
                />
              )}
              {us.cartesStatut === 'ECHEC' && (
                <Alert
                  type="warning"
                  showIcon
                  message="User story validée"
                  description={`La génération des cartes techniques a échoué : ${us.erreurGeneration ?? 'erreur inconnue'}`}
                />
              )}
              {(us.cartesStatut === null || us.cartesStatut === 'TERMINEE') && (
                <Alert
                  type="success"
                  showIcon
                  message="User story validée"
                  description="Les cartes techniques ont été générées."
                />
              )}
              {us.cartesTechniques.length > 0 && (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <Typography.Text strong>Cartes techniques générées</Typography.Text>
                  <List
                    size="small"
                    dataSource={us.cartesTechniques}
                    renderItem={(carte) => (
                      <List.Item style={{ padding: '4px 0' }}>
                        <Typography.Link
                          onClick={() => onOpen({ type: 'carte-technique', id: carte.id })}
                        >
                          {carte.titre}
                        </Typography.Link>
                      </List.Item>
                    )}
                  />
                </>
              )}
            </>
          )}

          <Typography.Title level={5} style={{ margin: 0 }}>
            Fil de commentaires ({us.commentaires.length})
          </Typography.Title>
          {us.commentaires.length === 0 ? (
            <Empty description="Aucun commentaire" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Timeline
              items={us.commentaires.map((item) => ({
                color: item.auteur === 'PO' ? 'blue' : 'purple',
                children: (
                  <div>
                    <Typography.Text strong>{item.auteur === 'PO' ? 'PO' : 'Agent'}</Typography.Text>{' '}
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDate(item.createdAt)}
                    </Typography.Text>
                    <Typography.Paragraph style={{ marginBottom: 0 }}>{item.contenu}</Typography.Paragraph>
                  </div>
                ),
              }))}
            />
          )}
        </Space>
      ) : (
        <Empty description="User story introuvable" />
      )}
    </Drawer>
  )
}
