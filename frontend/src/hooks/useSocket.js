import { useEffect, useCallback } from 'react';
import { useSocketContext } from '../context/SocketContext';

const useSocket = (roomCode, userId, userName) => {
  const { socket, connected } = useSocketContext();

  const joinRoom = useCallback(() => {
    if (socket && roomCode && userId && userName) {
      socket.emit('join-document', { roomCode, userId, userName });
    }
  }, [socket, roomCode, userId, userName]);

  const sendChanges = useCallback((delta) => {
    if (socket && roomCode) {
      socket.emit('send-changes', { roomCode, delta });
    }
  }, [socket, roomCode]);

  const sendCursorMove = useCallback((range, color) => {
    if (socket && roomCode) {
      socket.emit('cursor-move', { roomCode, userId, userName, range, color });
    }
  }, [socket, roomCode, userId, userName]);

  const saveDocument = useCallback((content, title) => {
    if (socket && roomCode) {
      socket.emit('save-document', { roomCode, content, title });
    }
  }, [socket, roomCode]);

  const sendStroke = useCallback((stroke) => {
    if (socket && roomCode) {
      socket.emit('draw-stroke', { roomCode, stroke });
    }
  }, [socket, roomCode]);

  const saveWhiteboard = useCallback((whiteboardData) => {
    if (socket && roomCode) {
      socket.emit('save-whiteboard', { roomCode, whiteboardData });
    }
  }, [socket, roomCode]);

  const clearBoard = useCallback(() => {
    if (socket && roomCode) {
      socket.emit('clear-board', { roomCode, userName });
    }
  }, [socket, roomCode, userName]);

  useEffect(() => {
    if (connected && roomCode && userId && userName) {
      joinRoom();
    }
  }, [connected, roomCode, userId, userName, joinRoom]);

  return {
    socket,
    connected,
    sendChanges,
    sendCursorMove,
    saveDocument,
    sendStroke,
    saveWhiteboard,
    clearBoard,
    joinRoom
  };
};

export default useSocket;
