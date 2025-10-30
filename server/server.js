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

// خدمة الملفات الثابتة - مسارات مطلقة ومتعددة
app.use(express.static(path.join(__dirname, '..'))); // المجلد الرئيسي
app.use(express.static(path.join(__dirname, '..', '/'))); // الجذر

// Routes API
app.use('/api/sets', require('./routes/sets'));

// Routes الأساسية - مسارات مطلقة مع تحقق
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, '..', 'index.html');
    console.log('📁 جاري تحميل ملف الرئيسي:', filePath);
    
    // التحقق من وجود الملف
    if (require('fs').existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        console.error('❌ ملف index.html غير موجود في:', filePath);
        res.status(500).send('الملف الرئيسي غير موجود - تحقق من المسارات');
    }
});

// Route اختباري محسن
app.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'الخادم يعمل بنجاح!',
        database: mongoose.connection.readyState === 1 ? 'متصل' : 'غير متصل',
        rootDir: __dirname,
        timestamp: new Date().toISOString()
    });
});

// Route لفحص الملفات
app.get('/check-files', (req, res) => {
    const fs = require('fs');
    const rootPath = path.join(__dirname, '..');
    const indexPath = path.join(rootPath, 'index.html');
    
    const files = {
        rootExists: fs.existsSync(rootPath),
        indexExists: fs.existsSync(indexPath),
        rootPath: rootPath,
        indexPath: indexPath,
        filesInRoot: fs.readdirSync(rootPath)
    };
    
    res.json(files);
});

// الاتصال بقاعدة البيانات
const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        
        if (!MONGODB_URI) {
            console.log('⚠️  لا يوجد رابط اتصال بقاعدة البيانات');
            return;
        }

        console.log('🔄 جاري الاتصال بقاعدة البيانات...');
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
        console.log('🔧 جاري العمل بدون قاعدة البيانات...');
    }
};

// تشغيل الخادم
const startServer = async () => {
    console.log('🚀 جاري تشغيل الخادم...');
    console.log('📁 المسار الحالي:', __dirname);
    
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🎉 الخادم يعمل على البورت: ${PORT}`);
        console.log(`🌍 الموقع متاح على: https://study-platform-2.onrender.com`);
        console.log(`📊 حالة قاعدة البيانات: ${mongoose.connection.readyState === 1 ? '✅ متصل' : '⚠️  غير متصل'}`);
    });
};

startServer();