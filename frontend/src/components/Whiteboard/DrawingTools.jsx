import {
  Pen, Eraser, Square, Circle, Minus, Trash2
} from 'lucide-react';

const TOOLS = [
  { id: 'pen', icon: Pen, label: 'Pen' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'line', icon: Minus, label: 'Line' }
];

const COLORS = [
  { value: '#000000', label: 'Black' },
  { value: '#4F46E5', label: 'Indigo' },
  { value: '#DC2626', label: 'Red' },
  { value: '#16A34A', label: 'Green' },
  { value: '#EA580C', label: 'Orange' },
  { value: '#7C3AED', label: 'Purple' },
  { value: '#2563EB', label: 'Blue' },
  { value: '#DB2777', label: 'Pink' }
];

const DrawingTools = ({
  activeTool,
  setActiveTool,
  strokeColor,
  setStrokeColor,
  strokeSize,
  setStrokeSize,
  onClearBoard
}) => {
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the entire board? This cannot be undone.')) {
      onClearBoard();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tools */}
      <div>
        <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Tools</p>
        <div className="flex flex-col gap-1">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#4F46E5] text-white shadow-md'
                    : 'text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#4F46E5]'
                }`}
                id={`tool-${tool.id}`}
                title={tool.label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div>
        <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Color</p>
        <div className="grid grid-cols-4 gap-1.5">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setStrokeColor(color.value)}
              className={`w-8 h-8 rounded-lg transition-all border-2 ${
                strokeColor === color.value
                  ? 'border-[#4F46E5] scale-110 shadow-md'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
              id={`color-${color.label.toLowerCase()}`}
            />
          ))}
        </div>
      </div>

      {/* Stroke Size */}
      <div>
        <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">
          Size: {strokeSize}px
        </p>
        <input
          type="range"
          min="1"
          max="20"
          value={strokeSize}
          onChange={(e) => setStrokeSize(parseInt(e.target.value))}
          className="w-full accent-[#4F46E5]"
          id="stroke-size-slider"
        />
        <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
          <span>1px</span>
          <span>20px</span>
        </div>
      </div>

      {/* Clear Board */}
      <div>
        <button
          onClick={handleClear}
          className="btn-danger w-full text-sm py-2"
          id="clear-board-btn"
        >
          <Trash2 className="w-4 h-4" />
          Clear Board
        </button>
      </div>
    </div>
  );
};

export default DrawingTools;
