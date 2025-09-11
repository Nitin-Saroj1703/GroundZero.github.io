// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Simple in-memory database (replace with a real database in production)
let users = [];
let reports = [];

// Load initial data if files exist
try {
  if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  }
  if (fs.existsSync('reports.json')) {
    reports = JSON.parse(fs.readFileSync('reports.json', 'utf8'));
  }
} catch (error) {
  console.log('No existing data files found, starting fresh');
}

// Save data to files
function saveData() {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  fs.writeFileSync('reports.json', JSON.stringify(reports, null, 2));
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveData();

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all reports (with optional filtering)
app.get('/api/reports', authenticateToken, (req, res) => {
  const { type, severity, limit = 50, page = 1 } = req.query;
  
  let filteredReports = [...reports];
  
  // Filter by type if provided
  if (type && type !== 'all') {
    filteredReports = filteredReports.filter(r => r.type === type);
  }
  
  // Filter by severity if provided
  if (severity) {
    filteredReports = filteredReports.filter(r => r.severity === severity);
  }
  
  // Sort by date (newest first)
  filteredReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedReports = filteredReports.slice(startIndex, endIndex);
  
  res.json({
    reports: paginatedReports,
    total: filteredReports.length,
    page: parseInt(page),
    totalPages: Math.ceil(filteredReports.length / limit)
  });
});

// Get a specific report
app.get('/api/reports/:id', authenticateToken, (req, res) => {
  const report = reports.find(r => r.id === req.params.id);
  
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  
  res.json(report);
});

// Create a new report
app.post('/api/reports', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const { type, severity, description, lat, lon } = req.body;
    
    if (!type || !severity || !description || !lat || !lon) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }
    
    const report = {
      id: Date.now().toString(),
      type,
      severity,
      description,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      image: imagePath,
      userId: req.user.id,
      username: req.user.username,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    reports.push(report);
    saveData();
    
    res.status(201).json({
      message: 'Report created successfully',
      report
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a report
app.put('/api/reports/:id', authenticateToken, (req, res) => {
  const reportIndex = reports.findIndex(r => r.id === req.params.id);
  
  if (reportIndex === -1) {
    return res.status(404).json({ error: 'Report not found' });
  }
  
  // Check if user owns the report or is admin
  if (reports[reportIndex].userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to update this report' });
  }
  
  const { type, severity, description, status } = req.body;
  
  // Update allowed fields
  if (type) reports[reportIndex].type = type;
  if (severity) reports[reportIndex].severity = severity;
  if (description) reports[reportIndex].description = description;
  if (status && req.user.role === 'admin') reports[reportIndex].status = status;
  
  reports[reportIndex].updatedAt = new Date().toISOString();
  saveData();
  
  res.json({
    message: 'Report updated successfully',
    report: reports[reportIndex]
  });
});

// Delete a report
app.delete('/api/reports/:id', authenticateToken, (req, res) => {
  const reportIndex = reports.findIndex(r => r.id === req.params.id);
  
  if (reportIndex === -1) {
    return res.status(404).json({ error: 'Report not found' });
  }
  
  // Check if user owns the report or is admin
  if (reports[reportIndex].userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to delete this report' });
  }
  
  // Remove associated image if exists
  if (reports[reportIndex].image) {
    const imagePath = path.join(__dirname, reports[reportIndex].image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  
  reports.splice(reportIndex, 1);
  saveData();
  
  res.json({ message: 'Report deleted successfully' });
});

// Get user's reports
app.get('/api/my-reports', authenticateToken, (req, res) => {
  const userReports = reports.filter(r => r.userId === req.user.id);
  res.json(userReports);
});

// Get statistics
app.get('/api/stats', authenticateToken, (req, res) => {
  const totalReports = reports.length;
  const potholeCount = reports.filter(r => r.type === 'pothole').length;
  const crackCount = reports.filter(r => r.type === 'crack').length;
  const trashCount = reports.filter(r => r.type === 'Trash Overflow').length;
  const otherCount = reports.filter(r => r.type === 'Other').length;
  const highSeverityCount = reports.filter(r => r.severity === 'high').length;
  
  res.json({
    totalReports,
    potholeCount,
    crackCount,
    trashCount,
    otherCount,
    highSeverityCount
  });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Default route
app.get('/', (req, res) => {
  res.send('GROUND ZERO API Server');
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});