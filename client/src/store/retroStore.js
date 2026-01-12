import { create } from 'zustand';

const useRetroStore = create((set, get) => ({
  // Auth
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null }),

  // Session
  session: null,
  participants: [],
  currentPhase: 'waiting',

  // Notes and groups
  notes: [],
  groups: [],
  votes: [],
  actions: [],

  // Socket connection
  socket: null,
  connected: false,

  // Set socket
  setSocket: (socket) => set({ socket, connected: true }),
  setDisconnected: () => set({ connected: false }),

  // Update session state
  setSessionState: ({ session, notes, groups, votes, actions, participants }) => {
    set({
      session,
      notes,
      groups,
      votes,
      actions,
      participants,
      currentPhase: session.current_phase
    });
  },

  // Participants
  updateParticipants: (participants) => set({ participants }),

  // Notes
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  moveNote: ({ noteId, groupId }) => set((state) => ({
    notes: state.notes.map(n =>
      n.id === noteId ? { ...n, group_id: groupId } : n
    )
  })),

  // Groups
  addGroup: ({ group, noteIds }) => set((state) => ({
    groups: [...state.groups, group],
    notes: state.notes.map(n =>
      noteIds.includes(n.id) ? { ...n, group_id: group.id } : n
    )
  })),
  updateGroup: ({ groupId, title }) => set((state) => ({
    groups: state.groups.map(g =>
      g.id === groupId ? { ...g, title } : g
    )
  })),
  moveGroup: ({ groupId, column }) => set((state) => ({
    groups: state.groups.map(g =>
      g.id === groupId ? { ...g, column } : g
    )
  })),

  // Votes
  updateVotes: (votes) => set({ votes }),

  // Actions
  addAction: (action) => set((state) => ({ actions: [...state.actions, action] })),

  // Phase
  setPhase: (phase) => set({ currentPhase: phase }),

  // Helpers
  getVoteCount: (targetId) => {
    const { votes } = get();
    return votes.filter(v => v.target_id === targetId).length;
  },

  getUserVoteCount: () => {
    const { votes, user } = get();
    if (!user) return 0;
    return votes.filter(v => v.email === user.email).length;
  },

  hasUserVoted: (targetId) => {
    const { votes, user } = get();
    if (!user) return false;
    return votes.some(v => v.target_id === targetId && v.email === user.email);
  },

  isFacilitator: () => {
    const { user } = get();
    return user?.role === 'facilitator';
  },

  getNotesInGroup: (groupId) => {
    const { notes } = get();
    return notes.filter(n => n.group_id === groupId);
  },

  getUngroupedNotes: (column) => {
    const { notes } = get();
    return notes.filter(n => n.column === column && !n.group_id);
  }
}));

export default useRetroStore;
