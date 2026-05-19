const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const initializeSocket = require('./socket/socket');

const authRoutes = require('./routes/auth.routes');
const documentRoutes = require('./routes/document.routes');
const roomRoutes = require('./routes/room.routes');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Drawft API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

initializeSocket(io);

const PORT = process.env.PORT || 5000;

const Room = require('./models/Room');

connectDB().then(async () => {
  try {
    await Room.updateMany({}, { activeUsers: [] });
    console.log('Cleared stale active users from rooms');
  } catch (error) {
    console.error('Failed to clear stale users:', error);
  }

  server.listen(PORT, () => {
    console.log(`Drawft server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
});
