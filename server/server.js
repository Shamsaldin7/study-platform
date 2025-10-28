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
        database: mongoose.connection.readyState === 1 ? 'متصل' : 'غير متصل',
        timestamp: new Date().toISOString()
    });
});

// الاتصال بقاعدة البيانات
const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        
        console.log('🔄 محاولة الاتصال بقاعدة البيانات...');
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // 30 ثانية
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ تم الاتصال بـ MongoDB Atlas بنجاح');
        
    } catch (error) {
        console.error('❌ فشل في الاتصال بقاعدة البيانات:', error.message);
        console.log('⚠️  الموقع سيعمل بدون قاعدة بيانات');
    }
};

// تشغيل الخادم (مع أو بدون قاعدة بيانات)
const startServer = async () => {
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 الخادم يعمل على البورت: ${PORT}`);
        console.log(`🌍 رابط الموقع: https://study-platform-2.onrender.com`);
        console.log(`📊 حالة قاعدة البيانات: ${mongoose.connection.readyState === 1 ? '✅ متصل' : '❌ غير متصل'}`);
    });
};

startServer();