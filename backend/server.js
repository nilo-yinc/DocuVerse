const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: '../.env' });

// Connect to DB using the package's config
require('./config/mongoose-connection');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Routes
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Fallback explicit routes for password OTP (in case of router mismatch)
const { requestPasswordOTP, verifyPasswordOTP } = require('./controllers/user.controller');
const isLoggedIn = require('./middlewares/isLoggedIn.middleware');
app.post('/api/v1/users/request-password-otp', isLoggedIn, requestPasswordOTP);
app.post('/api/v1/users/verify-password-otp', isLoggedIn, verifyPasswordOTP);

app.get('/', (req, res) => {
    res.send('DocuVerse API Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
