const Room = require('../models/Room');
const Document = require('../models/Document');

const USER_COLORS = [
  '#4F46E5', '#7C3AED', '#0891B2', '#16A34A',
  '#EA580C', '#DC2626', '#D97706', '#DB2777'
];

const getRandomColor = (existingColors) => {
  const available = USER_COLORS.filter(c => !existingColors.includes(c));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
};

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('leave-document', async ({ roomCode }) => {
      try {
        socket.leave(roomCode);
        const room = await Room.findOne({ roomCode });
        if (!room) return;

        const user = room.activeUsers.find(u => u.socketId === socket.id);
        if (user) {
          room.activeUsers = room.activeUsers.filter(u => u.socketId !== socket.id);
          await room.save();

          io.to(roomCode).emit('user-left', {
            userId: user.userId,
            name: user.name,
            activeUsers: room.activeUsers
          });
          io.to(roomCode).emit('active-users-update', room.activeUsers);
        }
      } catch (error) {
        console.error('Error leaving document:', error);
      }
    });

    socket.on('join-document', async ({ roomCode, userId, userName }) => {
      try {
        socket.join(roomCode);

        const room = await Room.findOne({ roomCode });
        if (!room) return;

        const existingColors = room.activeUsers.map(u => u.color);
        const color = getRandomColor(existingColors);

        // Remove any existing connection for this user before adding new one
        room.activeUsers = room.activeUsers.filter(u => u.userId !== userId);

        room.activeUsers.push({
          userId,
          name: userName,
          socketId: socket.id,
          color
        });
        await room.save();

        const document = await Document.findById(room.document);

        if (room.type === 'whiteboard' && document) {
          socket.emit('load-board', document.whiteboardData || []);
        }

        if (room.type === 'document' && document && document.content) {
          socket.emit('load-document', document.content);
        }

        socket.to(roomCode).emit('user-joined', {
          userId,
          name: userName,
          color,
          activeUsers: room.activeUsers
        });

        io.to(roomCode).emit('active-users-update', room.activeUsers);
      } catch (error) {
        console.error('Error joining document:', error);
      }
    });

    socket.on('send-changes', ({ roomCode, delta }) => {
      socket.to(roomCode).emit('receive-changes', delta);
    });

    socket.on('cursor-move', ({ roomCode, userId, userName, range, color }) => {
      socket.to(roomCode).emit('cursor-update', {
        userId,
        userName,
        range,
        color
      });
    });

    socket.on('save-document', async ({ roomCode, content, title }) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room) return;

        const updateData = { lastModified: Date.now() };
        if (content !== undefined) updateData.content = content;
        if (title !== undefined) updateData.title = title;

        await Document.findByIdAndUpdate(room.document, updateData);
      } catch (error) {
        console.error('Error saving document:', error);
      }
    });

    socket.on('draw-stroke', ({ roomCode, stroke }) => {
      socket.to(roomCode).emit('receive-stroke', stroke);
    });

    socket.on('draw-live', (data) => {
      socket.to(data.roomCode).emit('receive-live', data);
    });

    socket.on('save-whiteboard', async ({ roomCode, whiteboardData }) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room) return;

        await Document.findByIdAndUpdate(room.document, {
          whiteboardData,
          lastModified: Date.now()
        });
      } catch (error) {
        console.error('Error saving whiteboard:', error);
      }
    });

    socket.on('clear-board', async ({ roomCode, userName }) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room) return;

        await Document.findByIdAndUpdate(room.document, {
          whiteboardData: [],
          lastModified: Date.now()
        });

        socket.to(roomCode).emit('board-cleared', { userName });
      } catch (error) {
        console.error('Error clearing board:', error);
      }
    });

    socket.on('disconnect', async () => {
      try {
        const rooms = await Room.find({ 'activeUsers.socketId': socket.id });

        for (const room of rooms) {
          const user = room.activeUsers.find(u => u.socketId === socket.id);
          if (user) {
            room.activeUsers = room.activeUsers.filter(u => u.socketId !== socket.id);
            await room.save();

            io.to(room.roomCode).emit('user-left', {
              userId: user.userId,
              name: user.name,
              activeUsers: room.activeUsers
            });

            io.to(room.roomCode).emit('active-users-update', room.activeUsers);
          }
        }

        console.log(`User disconnected: ${socket.id}`);
      } catch (error) {
        console.error('Error on disconnect:', error);
      }
    });
  });
};

module.exports = initializeSocket;
