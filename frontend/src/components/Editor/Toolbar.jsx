import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2
} from 'lucide-react';

const Toolbar = ({ editorRef }) => {
  const format = (type, value) => {
    if (!editorRef?.current) return;
    const editor = editorRef.current.getEditor();
    if (!editor) return;

    if (type === 'undo') {
      editor.history.undo();
      return;
    }
    if (type === 'redo') {
      editor.history.redo();
      return;
    }

    const current = editor.getFormat();

    if (type === 'header') {
      editor.format('header', current.header === value ? false : value);
    } else if (type === 'list') {
      editor.format('list', current.list === value ? false : value);
    } else if (type === 'align') {
      editor.format('align', current.align === value ? false : value);
    } else {
      editor.format(type, !current[type]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-white border border-[#E5E7EB] rounded-xl mb-2">
      <button onClick={() => format('bold')} className="btn-icon p-1.5" title="Bold" id="toolbar-bold">
        <Bold className="w-4 h-4" />
      </button>
      <button onClick={() => format('italic')} className="btn-icon p-1.5" title="Italic" id="toolbar-italic">
        <Italic className="w-4 h-4" />
      </button>
      <button onClick={() => format('underline')} className="btn-icon p-1.5" title="Underline" id="toolbar-underline">
        <Underline className="w-4 h-4" />
      </button>
      <button onClick={() => format('strike')} className="btn-icon p-1.5" title="Strikethrough" id="toolbar-strike">
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-[#E5E7EB] mx-1" />

      <button onClick={() => format('header', 1)} className="btn-icon p-1.5" title="Heading 1" id="toolbar-h1">
        <Heading1 className="w-4 h-4" />
      </button>
      <button onClick={() => format('header', 2)} className="btn-icon p-1.5" title="Heading 2" id="toolbar-h2">
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-[#E5E7EB] mx-1" />

      <button onClick={() => format('list', 'bullet')} className="btn-icon p-1.5" title="Bullet List" id="toolbar-bullet">
        <List className="w-4 h-4" />
      </button>
      <button onClick={() => format('list', 'ordered')} className="btn-icon p-1.5" title="Numbered List" id="toolbar-ordered">
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-[#E5E7EB] mx-1" />

      <button onClick={() => format('align', false)} className="btn-icon p-1.5" title="Align Left" id="toolbar-left">
        <AlignLeft className="w-4 h-4" />
      </button>
      <button onClick={() => format('align', 'center')} className="btn-icon p-1.5" title="Align Center" id="toolbar-center">
        <AlignCenter className="w-4 h-4" />
      </button>
      <button onClick={() => format('align', 'right')} className="btn-icon p-1.5" title="Align Right" id="toolbar-right">
        <AlignRight className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-[#E5E7EB] mx-1" />

      <button onClick={() => format('undo')} className="btn-icon p-1.5" title="Undo" id="toolbar-undo">
        <Undo2 className="w-4 h-4" />
      </button>
      <button onClick={() => format('redo')} className="btn-icon p-1.5" title="Redo" id="toolbar-redo">
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toolbar;
