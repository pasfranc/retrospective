import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
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
      const draggedGroup = groups.find(g => g.id === groupId);

      // Check if dropped on a column drop zone
      if (targetId.startsWith('column-')) {
        const targetColumn = targetId.replace('column-', '');
        if (draggedGroup.column !== targetColumn) {
          socket?.emit('group:move', { groupId, column: targetColumn });
        }
        return;
      }

      // Check if dropped on another group - move to that group's column
      if (targetId.startsWith('group-')) {
        const targetGroupId = targetId.replace('group-', '');
        const targetGroup = groups.find(g => g.id === targetGroupId);
        if (targetGroup && draggedGroup.column !== targetGroup.column) {
          socket?.emit('group:move', { groupId, column: targetGroup.column });
        }
        return;
      }

      // Check if dropped on a note - move to that note's column
      const targetNote = notes.find(n => n.id === targetId);
      if (targetNote && draggedGroup.column !== targetNote.column) {
        socket?.emit('group:move', { groupId, column: targetNote.column });
        return;
      }

      return;
    }

    // Note dragging logic
    const draggedNoteId = activeId;
    const draggedNote = notes.find(n => n.id === draggedNoteId);

    // Check if dropped on a column - ungroup the note if it's in a group
    if (targetId.startsWith('column-')) {
      if (draggedNote?.group_id) {
        // Ungroup the note
        socket?.emit('note:move', { noteId: draggedNoteId, groupId: null });
      }
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
      return;
    }

    // Check if dropped on a group
    if (targetId.startsWith('group-')) {
      const groupId = targetId.replace('group-', '');
      socket?.emit('note:move', { noteId: draggedNoteId, groupId });
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
            Drag notes onto each other to create groups. Drag notes from groups to empty space to ungroup them.
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
                  <li>Drag notes onto each other to group them</li>
                  <li>Drag notes from different columns to group together</li>
                  <li>Drag groups to move them between columns</li>
                  <li>Drag notes from groups to empty space to ungroup</li>
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
