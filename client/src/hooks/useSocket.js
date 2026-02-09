import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useRetroStore from '../store/retroStore';

const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : 'http://localhost:3000';

export function useSocket(token, sessionId) {
  const {
    setSocket,
    setDisconnected,
    setSessionState,
    updateParticipants,
    addNote,
    editNote,
    deleteNote,
    moveNote,
    addGroup,
    updateGroup,
    moveGroup,
    deleteGroup,
    updateVotes,
    addAction,
    setPhase
  } = useRetroStore();

  useEffect(() => {
    if (!token || !sessionId) return;

    const socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      setSocket(socket);

      // Join session
      socket.emit('join', { token });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setDisconnected();
    });

    socket.on('session:state', (state) => {
      console.log('Received session state', state);
      setSessionState(state);
    });

    socket.on('participants:updated', (participants) => {
      updateParticipants(participants);
    });

    socket.on('note:added', (note) => {
      addNote(note);
    });

    socket.on('note:edited', (data) => {
      editNote(data);
    });

    socket.on('note:deleted', (data) => {
      deleteNote(data);
    });

    socket.on('note:moved', (data) => {
      moveNote(data);
    });

    socket.on('group:created', (data) => {
      addGroup(data);
    });

    socket.on('group:updated', (data) => {
      updateGroup(data);
    });

    socket.on('group:moved', (data) => {
      moveGroup(data);
    });

    socket.on('group:deleted', (data) => {
      deleteGroup(data);
    });

    socket.on('votes:updated', (votes) => {
      updateVotes(votes);
    });

    socket.on('action:created', (action) => {
      addAction(action);
    });

    socket.on('phase:changed', ({ phase }) => {
      setPhase(phase);
    });

    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
      alert(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, sessionId]);
}
