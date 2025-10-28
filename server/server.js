const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware أساسي
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات الثابتة - معدل
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.use('/api/sets', require('./routes/sets'));

// Routes الأساسية - معدل
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'الخادم يعمل بنجاح!',
        timestamp: new Date().toISOString()
    });
});

// الاتصال بقاعدة البيانات
const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shamsaldeen2712_db_user:6b5R9w9JMqWW9JSo@cluster0.6bg51jr.mongodb.net/study_platform?retryWrites=true&w=majority';
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ تم الاتصال بـ MongoDB Atlas بنجاح');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 الخادم يعمل على البورت: ${PORT}`);
        });
    } catch (error) {
        console.error('❌ فشل في الاتصال بقاعدة البيانات:', error);
        process.exit(1);
    }
};

connectDB();