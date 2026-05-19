import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

const Canvas = forwardRef(({
  activeTool,
  strokeColor,
  strokeSize,
  onStroke,
  onLoadStrokes,
  socket,
  roomCode
}, ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const strokesRef = useRef([]);
  const currentStrokeRef = useRef([]);
  const snapshotRef = useRef(null);

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokesRef.current = [];
      }
    },
    loadStrokes: (strokes) => {
      strokesRef.current = strokes || [];
      redrawAll(strokes || []);
    },
    getStrokes: () => strokesRef.current
  }));

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;
    contextRef.current = ctx;
    redrawAll(strokesRef.current);
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  const redrawAll = (strokes) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(stroke => drawStroke(ctx, stroke));
  };

  const drawStroke = (ctx, stroke) => {
    if (!stroke || !stroke.points || stroke.points.length === 0) return;
    ctx.save();
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color || '#000000';
    }
    ctx.lineWidth = stroke.size || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if ((stroke.tool === 'rectangle') && stroke.points.length >= 2) {
      const s = stroke.points[0], e = stroke.points[stroke.points.length - 1];
      ctx.beginPath();
      ctx.rect(s.x, s.y, e.x - s.x, e.y - s.y);
      ctx.stroke();
    } else if ((stroke.tool === 'circle') && stroke.points.length >= 2) {
      const s = stroke.points[0], e = stroke.points[stroke.points.length - 1];
      const rx = Math.abs(e.x - s.x) / 2, ry = Math.abs(e.y - s.y) / 2;
      ctx.beginPath();
      ctx.ellipse(s.x + (e.x - s.x) / 2, s.y + (e.y - s.y) / 2, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if ((stroke.tool === 'line' || stroke.tool === 'arrow') && stroke.points.length >= 2) {
      const s = stroke.points[0], e = stroke.points[stroke.points.length - 1];
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const takeSnapshot = () => {
    const canvas = canvasRef.current, ctx = contextRef.current;
    if (canvas && ctx) snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const restoreSnapshot = () => {
    const ctx = contextRef.current;
    if (ctx && snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    setIsDrawing(true);
    setStartPos(point);
    currentStrokeRef.current = [point];
    if (['rectangle', 'circle', 'line', 'arrow'].includes(activeTool)) takeSnapshot();
    const ctx = contextRef.current;
    if (ctx && (activeTool === 'pen' || activeTool === 'eraser')) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    const ctx = contextRef.current;
    if (!ctx) return;
    currentStrokeRef.current.push(point);

    if (activeTool === 'pen' || activeTool === 'eraser') {
      ctx.save();
      if (activeTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = strokeColor;
      }
      ctx.lineWidth = strokeSize;
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.restore();

      if (socket && roomCode) {
        const prevPoint = currentStrokeRef.current[currentStrokeRef.current.length - 2] || startPos;
        socket.emit('draw-live', {
          roomCode,
          tool: activeTool,
          color: strokeColor,
          size: strokeSize,
          point,
          prevPoint
        });
      }
    } else {
      restoreSnapshot();
      drawStroke(ctx, { tool: activeTool, color: strokeColor, size: strokeSize, points: [startPos, point] });
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    const stroke = { tool: activeTool, color: strokeColor, size: strokeSize, points: currentStrokeRef.current };
    strokesRef.current.push(stroke);
    currentStrokeRef.current = [];
    snapshotRef.current = null;
    if (onStroke) onStroke(stroke);
  };

  useEffect(() => {
    if (!socket) return;
    const handleReceiveStroke = (stroke) => {
      strokesRef.current.push(stroke);
      const ctx = contextRef.current;
      if (ctx) drawStroke(ctx, stroke);
    };
    const handleReceiveLive = ({ tool, color, size, point, prevPoint }) => {
      const ctx = contextRef.current;
      if (!ctx) return;
      ctx.save();
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.restore();
    };
    const handleBoardCleared = () => {
      const canvas = canvasRef.current, ctx = contextRef.current;
      if (canvas && ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); strokesRef.current = []; }
    };
    const handleLoadBoard = (strokes) => {
      strokesRef.current = strokes || [];
      redrawAll(strokes || []);
      if (strokes && strokes.length > 0 && onLoadStrokes) onLoadStrokes();
    };
    socket.on('receive-stroke', handleReceiveStroke);
    socket.on('receive-live', handleReceiveLive);
    socket.on('board-cleared', handleBoardCleared);
    socket.on('load-board', handleLoadBoard);
    return () => {
      socket.off('receive-stroke', handleReceiveStroke);
      socket.off('receive-live', handleReceiveLive);
      socket.off('board-cleared', handleBoardCleared);
      socket.off('load-board', handleLoadBoard);
    };
  }, [socket]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'none',
        display: 'block',
        cursor: activeTool === 'eraser' ? 'cell' : 'crosshair',
      }}
      id="whiteboard-canvas"
    />
  );
});

Canvas.displayName = 'Canvas';
export default Canvas;
