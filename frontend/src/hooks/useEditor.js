import { useState, useEffect, useCallback, useRef } from 'react';

const useEditor = (socket, roomCode, initialContent) => {
  const [content, setContent] = useState(initialContent || null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [title, setTitle] = useState('Untitled Document');
  const quillRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef(Date.now());

  useEffect(() => {
    if (!socket) return;

    const handleLoadDocument = (documentContent) => {
      if (documentContent) {
        setContent(documentContent);
      }
    };

    const handleReceiveChanges = (delta) => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        if (editor) {
          editor.updateContents(delta);
        }
      }
    };

    socket.on('load-document', handleLoadDocument);
    socket.on('receive-changes', handleReceiveChanges);

    return () => {
      socket.off('load-document', handleLoadDocument);
      socket.off('receive-changes', handleReceiveChanges);
    };
  }, [socket]);

  const handleChange = useCallback((newContent, delta, source) => {
    if (source === 'user') {
      setContent(newContent);
      setSaveStatus('saving');

      if (socket && roomCode) {
        socket.emit('send-changes', { roomCode, delta });
      }
    }
  }, [socket, roomCode]);

  useEffect(() => {
    if (saveStatus !== 'saving') return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      if (socket && roomCode && quillRef.current) {
        const editor = quillRef.current.getEditor();
        const currentContent = editor ? editor.getContents() : content;
        socket.emit('save-document', { roomCode, content: currentContent, title });
        setSaveStatus('saved');
        lastSavedRef.current = Date.now();
      }
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [saveStatus, socket, roomCode, content, title]);

  const updateTitle = useCallback((newTitle) => {
    setTitle(newTitle);
    setSaveStatus('saving');
  }, []);

  return {
    content,
    setContent,
    saveStatus,
    title,
    setTitle: updateTitle,
    quillRef,
    handleChange
  };
};

export default useEditor;
