import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
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

    // Check if dropped on another note (to create group)
    const targetNote = notes.find(n => n.id === targetId);
    if (targetNote && draggedNoteId !== targetId) {
      // Create a new group
      const draggedNote = notes.find(n => n.id === draggedNoteId);
      if (draggedNote.column === targetNote.column) {
        socket?.emit('group:create', {
          column: draggedNote.column,
          noteIds: [draggedNoteId, targetId]
        });
      }
    } else if (targetId.startsWith('group-')) {
      // Dropped on a group
      const groupId = targetId.replace('group-', '');
      socket?.emit('note:move', { noteId: draggedNoteId, groupId });
    }
  };

  const activeNote = notes.find(n => n.id === activeId);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto py-8">
        <PhaseIndicator currentPhase={currentPhase} />

        <div className="mt-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">Grouping</h1>
          <p className="text-slate-600">
            Drag notes onto each other to create groups. Give groups meaningful titles.
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

                  return (
                    <div key={column}>
                      <h3 className="text-xl font-bold mb-4 capitalize">{column}</h3>

                      <div className="space-y-3">
                        {columnGroups.map(group => (
                          <div key={group.id} id={`group-${group.id}`}>
                            <Group group={group} editable />
                          </div>
                        ))}

                        <SortableContext
                          items={ungroupedNotes.map(n => n.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {ungroupedNotes.map(note => (
                            <DraggableNote key={note.id} note={note} />
                          ))}
                        </SortableContext>

                        {columnGroups.length === 0 && ungroupedNotes.length === 0 && (
                          <div className="card bg-slate-50 text-center py-8 text-slate-400 text-sm">
                            No notes in this column
                          </div>
                        )}
                      </div>
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
                    <span className="font-medium">
                      {notes.filter(n => !n.group_id).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card bg-blue-50">
                <h4 className="font-semibold mb-2 text-sm">💡 Tip</h4>
                <p className="text-xs text-slate-600">
                  Group similar notes together by dragging one note onto another. Everyone can organize!
                </p>
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
