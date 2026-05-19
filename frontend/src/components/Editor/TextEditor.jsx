import { useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['clean']
  ],
  history: {
    delay: 1000,
    maxStack: 100,
    userOnly: true
  }
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'align'
];

const TextEditor = ({ quillRef, content, onContentChange, onCursorChange }) => {
  const handleChange = useCallback((value, delta, source, editor) => {
    if (onContentChange) {
      onContentChange(editor.getContents(), delta, source);
    }
  }, [onContentChange]);

  const handleSelectionChange = useCallback((range, source, editor) => {
    if (range && onCursorChange) {
      try {
        const bounds = editor.getBounds(range.index);
        onCursorChange({
          index: range.index,
          length: range.length,
          top: bounds.top,
          left: bounds.left
        });
      } catch (e) {
        // Ignore bounds calculation errors during rapid typing
      }
    }
  }, [onCursorChange]);

  return (
    <div className="flex-1 relative">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={content}
        onChange={handleChange}
        onChangeSelection={handleSelectionChange}
        modules={modules}
        formats={formats}
        placeholder="Start typing your document..."
      />
    </div>
  );
};

export default TextEditor;
