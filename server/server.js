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

// خدمة الملفات الثابتة - جميع المسارات الممكنة
app.use(express.static(path.join(__dirname, '..', '..')));
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname)));

// Routes API
app.use('/api/sets', require('./routes/sets'));

// Routes الأساسية - مسارات متعددة مع تحقق
app.get('/', (req, res) => {
    const fs = require('fs');
    
    // جميع المسارات الممكنة لـ index.html
    const possiblePaths = [
        path.join(__dirname, '..', '..', 'index.html'),  // للمجلد الرئيسي
        path.join(__dirname, '..', 'index.html'),        // للمجلد الأعلى
        path.join(__dirname, 'index.html'),              // للمجلد الحالي
        path.resolve(__dirname, '../../index.html'),     // المسار المطلق
    ];
    
    console.log('🔍 جاري البحث عن index.html في المسارات:');
    
    let foundPath = null;
    for (const filePath of possiblePaths) {
        console.log('   📁 فحص:', filePath);
        if (fs.existsSync(filePath)) {
            foundPath = filePath;
            console.log('✅ وجد الملف في:', foundPath);
            break;
        }
    }
    
    if (foundPath) {
        res.sendFile(foundPath);
    } else {
        console.error('❌ ملف index.html غير موجود في أي من المسارات التالية:');
        possiblePaths.forEach(p => console.log('   ❌', p));
        res.status(500).json({
            error: 'الملف الرئيسي غير موجود',
            searchedPaths: possiblePaths,
            currentDir: __dirname
        });
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
    const rootPath = path.join(__dirname, '..', '..');
    const serverPath = path.join(__dirname, '..');
    const currentPath = __dirname;
    
    const files = {
        rootDir: __dirname,
        rootExists: fs.existsSync(rootPath),
        serverExists: fs.existsSync(serverPath),
        currentExists: fs.existsSync(currentPath),
        filesInRoot: fs.existsSync(rootPath) ? fs.readdirSync(rootPath) : [],
        filesInServer: fs.existsSync(serverPath) ? fs.readdirSync(serverPath) : [],
        filesInCurrent: fs.existsSync(currentPath) ? fs.readdirSync(currentPath) : []
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