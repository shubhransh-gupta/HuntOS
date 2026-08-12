import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { storage } from '@/services/storage'
import type { Application, ApplicationStatus } from '@/types'
import { APPLICATION_COLUMNS } from '@/types/application'
import { generateFollowUp } from '@/services/ai'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function DraggableApplicationCard({ app }: { app: Application }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id })
  const [followUp, setFollowUp] = useState('')
  const daysSince = app.appliedDate
    ? Math.floor((Date.now() - new Date(app.appliedDate).getTime()) / 86400000)
    : 0

  async function handleFollowUp() {
    const msg = await generateFollowUp(app.company, app.role, daysSince)
    setFollowUp(msg)
  }

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 }
    : undefined

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className="mb-2 cursor-grab p-3 active:cursor-grabbing">
        <p className="text-sm font-medium">{app.role}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">{app.company}</p>
        {app.appliedDate && <p className="text-xs">Applied: {new Date(app.appliedDate).toLocaleDateString()}</p>}
        {app.status === 'applied' && daysSince >= 7 && (
          <div className="mt-2">
            <p className="text-xs text-[var(--color-warning)]">{daysSince} days since application</p>
            <Button size="sm" variant="outline" className="mt-1 h-7 text-xs" onClick={handleFollowUp}>
              Generate Follow-up
            </Button>
          </div>
        )}
        {followUp && <pre className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap text-xs">{followUp}</pre>}
      </Card>
    </div>
  )
}

function DroppableColumn({ status, children }: { status: ApplicationStatus; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] rounded-lg border p-2 transition-colors ${isOver ? 'border-[var(--color-primary)] bg-[var(--color-accent)]/30' : 'border-[var(--color-border)] bg-[var(--color-secondary)]/30'}`}
    >
      {children}
    </div>
  )
}

export function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setApplications(await storage.getApplications())
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const newStatus = over.id as ApplicationStatus
    const app = applications.find((a) => a.id === active.id)
    if (!app || !APPLICATION_COLUMNS.some((c) => c.id === newStatus)) return
    if (app.status === newStatus) return

    await storage.updateApplication(app.id, {
      status: newStatus,
      appliedDate: newStatus === 'applied' && !app.appliedDate ? new Date().toISOString() : app.appliedDate,
    })
    await load()
  }

  const activeApp = applications.find((a) => a.id === activeId)

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Applications</h1>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {APPLICATION_COLUMNS.map((col) => {
            const colApps = applications.filter((a) => a.status === col.id)
            return (
              <div key={col.id} className="min-w-[200px] flex-shrink-0">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {col.label} ({colApps.length})
                </h3>
                <DroppableColumn status={col.id}>
                  {colApps.map((app) => (
                    <DraggableApplicationCard key={app.id} app={app} />
                  ))}
                </DroppableColumn>
              </div>
            )
          })}
        </div>
        <DragOverlay>
          {activeApp ? (
            <Card className="p-3 opacity-90 shadow-lg">
              <p className="text-sm font-medium">{activeApp.role}</p>
              <p className="text-xs">{activeApp.company}</p>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
