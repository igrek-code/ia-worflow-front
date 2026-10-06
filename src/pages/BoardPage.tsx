import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  App as AntApp,
  Badge,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/endpoints'
import type {
  CarteTechniqueDto,
  CompteRenduRequest,
  CompteRenduResumeDto,
  Statut,
  UserStoryDto,
} from '../api/types'
import { CarteTechniqueDrawer } from '../components/CarteTechniqueDrawer'
import { CompteRenduDrawer } from '../components/CompteRenduDrawer'
import { UserStoryDrawer } from '../components/UserStoryDrawer'
import type { BoardSelection } from '../components/selection'
import { usePolling } from '../hooks/usePolling'
import { formatDate, statutColor, statutLabel } from '../utils'

const STATUTS: Statut[] = [
  'EN_ATTENTE_VALIDATION',
  'A_RECTIFIER',
  'RECTIFICATION_EN_COURS',
  'VALIDEE',
]

interface BoardData {
  comptesRendus: CompteRenduResumeDto[]
  userStories: Record<Statut, UserStoryDto[]>
  cartesTechniques: CarteTechniqueDto[]
}

const EMPTY_DATA: BoardData = {
  comptesRendus: [],
  userStories: {
    EN_ATTENTE_VALIDATION: [],
    A_RECTIFIER: [],
    RECTIFICATION_EN_COURS: [],
    VALIDEE: [],
  },
  cartesTechniques: [],
}

export default function BoardPage() {
  const { message, notification } = AntApp.useApp()
  const [data, setData] = useState<BoardData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState<BoardSelection | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm<CompteRenduRequest>()

  // `silent` : rafraîchissement automatique sans faire clignoter le Spin du board.
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [comptesRendus, userStories, cartesTechniques] = await Promise.all([
        api.listComptesRendus(),
        api.listUserStories(),
        api.listCartesTechniques(),
      ])
      setData({
        comptesRendus,
        userStories: {
          EN_ATTENTE_VALIDATION: userStories.filter((us) => us.statut === 'EN_ATTENTE_VALIDATION'),
          A_RECTIFIER: userStories.filter((us) => us.statut === 'A_RECTIFIER'),
          RECTIFICATION_EN_COURS: userStories.filter((us) => us.statut === 'RECTIFICATION_EN_COURS'),
          VALIDEE: userStories.filter((us) => us.statut === 'VALIDEE'),
        },
        cartesTechniques,
      })
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inattendue',
      })
    } finally {
      if (!silent) setLoading(false)
    }
  }, [notification])

  useEffect(() => {
    void load()
  }, [load])

  const hasPending = useMemo(
    () =>
      data.comptesRendus.some((cr) => cr.generationStatut === 'EN_COURS') ||
      Object.values(data.userStories).some((stories) =>
        stories.some(
          (us) => us.statut === 'RECTIFICATION_EN_COURS' || us.cartesStatut === 'EN_COURS',
        ),
      ),
    [data],
  )
  usePolling(() => void load(true), hasPending, 3000)

  const handleCreate = async (values: CompteRenduRequest) => {
    setCreating(true)
    try {
      await api.createCompteRendu(values)
      message.success('Compte rendu créé')
      setModalOpen(false)
      form.resetFields()
      await load()
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inattendue',
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Board
        </Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading}>
          Rafraîchir
        </Button>
      </div>

      <Spin spinning={loading}>
        <div className="board-columns">
          <div className="board-column">
            <Card
              size="small"
              title={
                <span>
                  <Badge color="geekblue" text="Comptes rendus" />
                </span>
              }
              extra={
                <Button
                  size="small"
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => setModalOpen(true)}
                />
              }
            >
              {data.comptesRendus.map((cr) => (
                <Card
                  key={cr.id}
                  size="small"
                  hoverable
                  className="kanban-card"
                  onClick={() => setSelection({ type: 'compte-rendu', id: cr.id })}
                >
                  <Typography.Text strong>{cr.titre}</Typography.Text>
                  {(cr.generationStatut === 'EN_COURS' || cr.generationStatut === 'ECHEC') && (
                    <div style={{ marginTop: 4 }}>
                      <Tag color={cr.generationStatut === 'EN_COURS' ? 'processing' : 'error'}>
                        {cr.generationStatut === 'EN_COURS' ? 'génération IA en cours…' : 'génération IA en échec'}
                      </Tag>
                    </div>
                  )}
                  <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
                    {formatDate(cr.createdAt)}
                  </Typography.Paragraph>
                </Card>
              ))}
              {data.comptesRendus.length === 0 && (
                <Typography.Text type="secondary">Aucun compte rendu</Typography.Text>
              )}
            </Card>
          </div>

          {STATUTS.map((statut) => (
            <div className="board-column" key={statut}>
              <Card
                size="small"
                title={
                  <span>
                    <Badge color={statutColor(statut)} text={statutLabel(statut)} />
                  </span>
                }
                extra={<Badge count={data.userStories[statut].length} style={{ backgroundColor: '#8c8c8c' }} />}
              >
                {data.userStories[statut].map((us) => (
                  <Card
                    key={us.id}
                    size="small"
                    hoverable
                    className="kanban-card"
                    onClick={() => setSelection({ type: 'user-story', id: us.id })}
                  >
                    <Typography.Text strong>{us.titre}</Typography.Text>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag color="blue">v{us.version}</Tag>
                      {us.cartesStatut === 'EN_COURS' && <Tag color="processing">cartes IA en cours…</Tag>}
                      <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                        CR : {us.compteRenduTitre}
                      </Typography.Text>
                    </div>
                  </Card>
                ))}
                {data.userStories[statut].length === 0 && (
                  <Typography.Text type="secondary">Aucune user story</Typography.Text>
                )}
              </Card>
            </div>
          ))}

          <div className="board-column">
            <Card
              size="small"
              title={
                <span>
                  <Badge color="cyan" text="Cartes techniques" />
                </span>
              }
              extra={
                <Badge
                  count={data.cartesTechniques.length}
                  style={{ backgroundColor: '#8c8c8c' }}
                />
              }
            >
              {data.cartesTechniques.map((carte) => (
                <Card
                  key={carte.id}
                  size="small"
                  hoverable
                  className="kanban-card"
                  onClick={() => setSelection({ type: 'carte-technique', id: carte.id })}
                >
                  <Typography.Text strong>{carte.titre}</Typography.Text>
                  <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }} ellipsis>
                    US : {carte.userStoryTitre}
                  </Typography.Paragraph>
                </Card>
              ))}
              {data.cartesTechniques.length === 0 && (
                <Typography.Text type="secondary">Aucune carte technique</Typography.Text>
              )}
            </Card>
          </div>
        </div>
      </Spin>

      <Modal
        title="Nouveau compte rendu"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        confirmLoading={creating}
        onOk={() => void form.submit()}
        okText="Créer"
        cancelText="Annuler"
        destroyOnHidden
      >
        <Form<CompteRenduRequest> form={form} layout="vertical" onFinish={(values) => void handleCreate(values)}>
          <Form.Item name="titre" label="Titre" rules={[{ required: true, message: 'Titre requis' }]}>
            <Input placeholder="Compte rendu sprint 42" />
          </Form.Item>
          <Form.Item name="contenu" label="Contenu" rules={[{ required: true, message: 'Contenu requis' }]}>
            <Input.TextArea rows={10} placeholder="Collez ici le texte du compte rendu…" />
          </Form.Item>
        </Form>
      </Modal>

      <CompteRenduDrawer
        id={selection?.type === 'compte-rendu' ? selection.id : null}
        onClose={() => setSelection(null)}
        onOpen={setSelection}
        onChanged={load}
      />
      <UserStoryDrawer
        id={selection?.type === 'user-story' ? selection.id : null}
        onClose={() => setSelection(null)}
        onOpen={setSelection}
        onChanged={load}
      />
      <CarteTechniqueDrawer
        id={selection?.type === 'carte-technique' ? selection.id : null}
        onClose={() => setSelection(null)}
        onOpen={setSelection}
      />
    </>
  )
}
