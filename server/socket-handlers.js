import {
  participantQueries,
  noteQueries,
  groupQueries,
  voteQueries,
  actionQueries,
  sessionQueries
} from './db.js';
import { verifyMagicToken } from './auth.js';
import { nanoid } from 'nanoid';

/**
 * Setup Socket.io event handlers
 */
export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join session room
    socket.on('join', async ({ token }) => {
      try {
        const result = verifyMagicToken(token);

        if (!result.valid) {
          socket.emit('error', { message: 'Invalid token' });
          return;
        }

        const { sessionId, email, role } = result.data;

        // Update participant status
        participantQueries.updateStatus.run(Date.now(), sessionId, email);

        // Join socket room
        socket.join(sessionId);
        socket.data = { sessionId, email, role };

        // Get all participants
        const participants = participantQueries.getBySession.all(sessionId);

        // Notify all clients in the room
        io.to(sessionId).emit('participants:updated', participants);

        // Send current session state to the joining user
        const session = sessionQueries.getById.get(sessionId);
        const notes = noteQueries.getBySession.all(sessionId);
        const groups = groupQueries.getBySession.all(sessionId);
        const votes = voteQueries.getBySession.all(sessionId);
        const actions = actionQueries.getBySession.all(sessionId);

        socket.emit('session:state', {
          session,
          notes,
          groups,
          votes,
          actions,
          participants
        });

        console.log(`User ${email} joined session ${sessionId}`);
      } catch (error) {
        console.error('Join error:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Add note
    socket.on('note:add', ({ column, text }) => {
      try {
        const { sessionId, email } = socket.data;
        const noteId = nanoid();
        const now = Date.now();

        noteQueries.create.run(noteId, sessionId, email, column, text, null, now);

        const note = {
          id: noteId,
          session_id: sessionId,
          author_email: email,
          column,
          text,
          group_id: null,
          created_at: now
        };

        io.to(sessionId).emit('note:added', note);
      } catch (error) {
        console.error('Note add error:', error);
        socket.emit('error', { message: 'Failed to add note' });
      }
    });

    // Move note (drag & drop)
    socket.on('note:move', ({ noteId, groupId, column }) => {
      try {
        const { sessionId } = socket.data;

        // Get the note to check its current group
        const note = noteQueries.getById.get(noteId);
        const oldGroupId = note?.group_id;

        // Update group (or null to ungroup)
        noteQueries.updateGroup.run(groupId, noteId);

        // Update column if provided
        if (column !== undefined && column !== note.column) {
          noteQueries.updateColumn.run(column, noteId);
        }

        io.to(sessionId).emit('note:moved', { noteId, groupId, column });

        // If the note was in a group, check if that group is now empty
        if (oldGroupId) {
          const noteCount = noteQueries.countByGroup.get(oldGroupId);

          if (noteCount.count === 0) {
            // Delete the empty group
            groupQueries.delete.run(oldGroupId);
            io.to(sessionId).emit('group:deleted', { groupId: oldGroupId });
            console.log(`Deleted empty group: ${oldGroupId}`);
          }
        }
      } catch (error) {
        console.error('Note move error:', error);
        socket.emit('error', { message: 'Failed to move note' });
      }
    });

    // Create group
    socket.on('group:create', ({ column, noteIds }) => {
      try {
        const { sessionId } = socket.data;
        const groupId = nanoid();
        const now = Date.now();

        groupQueries.create.run(groupId, sessionId, '', column, now);

        // Move notes to group
        noteIds.forEach(noteId => {
          noteQueries.updateGroup.run(groupId, noteId);
        });

        const group = {
          id: groupId,
          session_id: sessionId,
          title: '',
          column,
          created_at: now
        };

        io.to(sessionId).emit('group:created', { group, noteIds });
      } catch (error) {
        console.error('Group create error:', error);
        socket.emit('error', { message: 'Failed to create group' });
      }
    });

    // Update group title
    socket.on('group:update', ({ groupId, title }) => {
      try {
        const { sessionId } = socket.data;

        groupQueries.updateTitle.run(title, groupId);

        io.to(sessionId).emit('group:updated', { groupId, title });
      } catch (error) {
        console.error('Group update error:', error);
        socket.emit('error', { message: 'Failed to update group' });
      }
    });

    // Move group to different column
    socket.on('group:move', ({ groupId, column }) => {
      try {
        const { sessionId } = socket.data;

        groupQueries.updateColumn.run(column, groupId);

        io.to(sessionId).emit('group:moved', { groupId, column });
      } catch (error) {
        console.error('Group move error:', error);
        socket.emit('error', { message: 'Failed to move group' });
      }
    });

    // Cast vote
    socket.on('vote:cast', ({ targetId, targetType }) => {
      try {
        const { sessionId, email } = socket.data;
        const now = Date.now();

        // Check vote limit
        const session = sessionQueries.getById.get(sessionId);
        const currentVotes = voteQueries.countByUser.get(sessionId, email);

        if (currentVotes.count >= session.votes_per_person) {
          socket.emit('error', { message: 'Vote limit reached' });
          return;
        }

        voteQueries.cast.run(sessionId, email, targetId, targetType, now);

        const votes = voteQueries.getBySession.all(sessionId);
        io.to(sessionId).emit('votes:updated', votes);
      } catch (error) {
        // Vote might already exist (unique constraint)
        if (error.code === 'SQLITE_CONSTRAINT') {
          socket.emit('error', { message: 'Already voted for this item' });
        } else {
          console.error('Vote cast error:', error);
          socket.emit('error', { message: 'Failed to cast vote' });
        }
      }
    });

    // Remove vote
    socket.on('vote:remove', ({ targetId }) => {
      try {
        const { sessionId, email } = socket.data;

        voteQueries.remove.run(sessionId, email, targetId);

        const votes = voteQueries.getBySession.all(sessionId);
        io.to(sessionId).emit('votes:updated', votes);
      } catch (error) {
        console.error('Vote remove error:', error);
        socket.emit('error', { message: 'Failed to remove vote' });
      }
    });

    // Create action item (facilitator only)
    socket.on('action:create', ({ title, assignee, linkedTo }) => {
      try {
        const { sessionId, role } = socket.data;

        if (role !== 'facilitator') {
          socket.emit('error', { message: 'Only facilitator can create action items' });
          return;
        }

        const actionId = nanoid();
        const now = Date.now();

        actionQueries.create.run(actionId, sessionId, title, assignee, linkedTo, now);

        const action = {
          id: actionId,
          session_id: sessionId,
          title,
          assignee,
          linked_to: linkedTo,
          created_at: now
        };

        io.to(sessionId).emit('action:created', action);
      } catch (error) {
        console.error('Action create error:', error);
        socket.emit('error', { message: 'Failed to create action item' });
      }
    });

    // Change phase (facilitator only)
    socket.on('phase:change', ({ phase }) => {
      try {
        const { sessionId, role } = socket.data;

        if (role !== 'facilitator') {
          socket.emit('error', { message: 'Only facilitator can change phase' });
          return;
        }

        const now = Date.now();
        sessionQueries.updatePhase.run(phase, now, sessionId);

        io.to(sessionId).emit('phase:changed', { phase });
      } catch (error) {
        console.error('Phase change error:', error);
        socket.emit('error', { message: 'Failed to change phase' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
