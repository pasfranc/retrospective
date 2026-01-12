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

function DraggableGroup({ group }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `group-${group.id}`
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Group group={group} editable />
    </div>
  );
}

function ColumnDropZone({ column }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column}`
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all rounded-lg ${
        isOver ? 'bg-blue-50 ring-2 ring-primary ring-opacity-50' : ''
      }`}
      style={{ minHeight: '100px' }}
    />
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

    const activeId = active.id;
    const targetId = over.id;

    // Check if dragging a group
    const isGroup = typeof activeId === 'string' && activeId.startsWith('group-');

    if (isGroup) {
      const groupId = activeId.replace('group-', '');

      // Check if dropped on a column
      if (targetId.startsWith('column-')) {
        const targetColumn = targetId.replace('column-', '');
        socket?.emit('group:move', { groupId, column: targetColumn });
        return;
      }
      return;
    }

    // Original note dragging logic
    const draggedNoteId = activeId;

    // Check if dropped on "ungroup" zone
    if (targetId === 'ungroup-zone') {
      socket?.emit('note:move', { noteId: draggedNoteId, groupId: null });
      return;
    }

    // Check if dropped on another note (to create group)
    const targetNote = notes.find(n => n.id === targetId);
    if (targetNote && draggedNoteId !== targetId) {
      // Create a new group in the target note's column (allow cross-column grouping)
      socket?.emit('group:create', {
        column: targetNote.column, // Use target note's column
        noteIds: [draggedNoteId, targetId]
      });
    } else if (targetId.startsWith('group-')) {
      // Dropped on a group
      const groupId = targetId.replace('group-', '');
      socket?.emit('note:move', { noteId: draggedNoteId, groupId });
    } else if (targetId.startsWith('column-')) {
      // Dropped on a column - do nothing for notes (only groups can be moved between columns)
      return;
    }
  };

  const activeNote = notes.find(n => n.id === activeId);
  const activeGroup = groups.find(g => `group-${g.id}` === activeId);
  const allUngroupedNotes = notes.filter(n => !n.group_id);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto py-8">
        <PhaseIndicator currentPhase={currentPhase} />

        <div className="mt-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">Grouping</h1>
          <p className="text-slate-600">
            Drag notes onto each other to create groups. You can group notes from different columns together! Drag groups to move them between columns.
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="grid md:grid-cols-3 gap-6">
                {columns.map(column => {
                  const columnGroups = groups.filter(g => g.column === column);
                  const ungroupedNotes = getUngroupedNotes(column);
                  const allItems = [
                    ...columnGroups.map(g => `group-${g.id}`),
                    ...ungroupedNotes.map(n => n.id)
                  ];

                  return (
                    <div key={column} className="relative">
                      <h3 className="text-xl font-bold mb-4 capitalize">{column}</h3>

                      <SortableContext
                        items={allItems}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3 relative">
                          <ColumnDropZone column={column} />

                          <div className="space-y-3 absolute inset-0">
                            {columnGroups.map(group => (
                              <DraggableGroup key={group.id} group={group} />
                            ))}

                            {ungroupedNotes.map(note => (
                              <DraggableNote key={note.id} note={note} />
                            ))}

                            {columnGroups.length === 0 && ungroupedNotes.length === 0 && (
                              <div className="card bg-slate-50 text-center py-8 text-slate-400 text-sm">
                                No notes in this column
                              </div>
                            )}
                          </div>
                        </div>
                      </SortableContext>
                    </div>
                  );
                })}
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
                  <li>Drag groups to move them between columns</li>
                  <li>Drag grouped notes to "Ungroup Zone" to separate them</li>
                  <li>Everyone can organize simultaneously</li>
                </ul>
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeNote && <Note note={activeNote} revealed showAuthor className="rotate-3" />}
            {activeGroup && <Group group={activeGroup} editable />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
