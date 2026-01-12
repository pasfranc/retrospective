import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Ungroup } from 'lucide-react';
import PhaseIndicator from '../components/PhaseIndicator';
import Group from '../components/Group';
import Note from '../components/Note';
import FacilitatorControls from '../components/FacilitatorControls';
import useRetroStore from '../store/retroStore';

function DraggableNote({ note }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Note note={note} revealed showAuthor />
    </div>
  );
}

function UngroupZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'ungroup-zone'
  });

  return (
    <div
      ref={setNodeRef}
      className={`card border-2 border-dashed transition-all ${
        isOver
          ? 'bg-orange-50 border-orange-400'
          : 'bg-slate-50 border-slate-300'
      }`}
    >
      <div className="text-center py-8">
        <Ungroup className={`w-12 h-12 mx-auto mb-3 ${isOver ? 'text-orange-500' : 'text-slate-400'}`} />
        <p className={`font-semibold mb-1 ${isOver ? 'text-orange-600' : 'text-slate-600'}`}>
          Ungroup Zone
        </p>
        <p className="text-xs text-slate-500">
          Drag notes from groups here to ungroup them
        </p>
      </div>
    </div>
  );
}

export default function Grouping() {
  const { socket, notes, groups, participants, isFacilitator, currentPhase, getUngroupedNotes } = useRetroStore();
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns = ['start', 'stop', 'continue'];

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedNoteId = active.id;
    const targetId = over.id;

    // Check if dropped on "ungroup" zone
    if (targetId === 'ungroup-zone') {
      socket?.emit('note:move', { noteId: draggedNoteId, groupId: null });
      return;
    }

    // Check if dropped on another note (to create group)
    const targetNote = notes.find(n => n.id === targetId);
    if (targetNote && draggedNoteId !== targetId) {
      // Create a new group - allow cross-column grouping
      socket?.emit('group:create', {
        column: 'mixed', // Use 'mixed' for all groups
        noteIds: [draggedNoteId, targetId]
      });
    } else if (targetId.startsWith('group-')) {
      // Dropped on a group
      const groupId = targetId.replace('group-', '');
      socket?.emit('note:move', { noteId: draggedNoteId, groupId });
    }
  };

  const activeNote = notes.find(n => n.id === activeId);
  const allUngroupedNotes = notes.filter(n => !n.group_id);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto py-8">
        <PhaseIndicator currentPhase={currentPhase} />

        <div className="mt-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">Grouping</h1>
          <p className="text-slate-600">
            Drag notes onto each other to create groups. You can group notes from different columns together!
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              {/* Groups Section */}
              {groups.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Groups ({groups.length})</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {groups.map(group => (
                      <div key={group.id} id={`group-${group.id}`}>
                        <Group group={group} editable />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ungrouped Notes by Column */}
              <div>
                <h2 className="text-xl font-bold mb-4">Ungrouped Notes</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {columns.map(column => {
                    const ungroupedNotes = getUngroupedNotes(column);

                    return (
                      <div key={column}>
                        <h3 className="text-lg font-semibold mb-3 capitalize">{column}</h3>

                        <SortableContext
                          items={ungroupedNotes.map(n => n.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {ungroupedNotes.map(note => (
                              <DraggableNote key={note.id} note={note} />
                            ))}

                            {ungroupedNotes.length === 0 && (
                              <div className="card bg-slate-50 text-center py-6 text-slate-400 text-sm">
                                No ungrouped notes
                              </div>
                            )}
                          </div>
                        </SortableContext>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {isFacilitator() && (
                <FacilitatorControls phase="grouping" canProgress />
              )}

              <UngroupZone />

              <div className="card bg-slate-50">
                <h4 className="font-semibold mb-2 text-sm">Grouping Stats</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Groups:</span>
                    <span className="font-medium">{groups.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ungrouped:</span>
                    <span className="font-medium">{allUngroupedNotes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Notes:</span>
                    <span className="font-medium">{notes.length}</span>
                  </div>
                </div>
              </div>

              <div className="card bg-blue-50">
                <h4 className="font-semibold mb-2 text-sm">💡 Tips</h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Drag notes onto each other to group</li>
                  <li>Group notes from different columns!</li>
                  <li>Drag grouped notes to "Ungroup Zone" to separate them</li>
                  <li>Everyone can organize simultaneously</li>
                </ul>
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeNote ? <Note note={activeNote} revealed showAuthor className="rotate-3" /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
