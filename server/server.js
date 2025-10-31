const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// 🔍 تشخيص المتغيرات البيئية
console.log('🔍 فحص المتغيرات البيئية:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI موجود:', !!process.env.MONGODB_URI);

// 🛡️ إعدادات الأمان والأداء
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📁 خدمة الملفات الثابتة
app.use(express.static(__dirname));

// 🗄️ اتصال قاعدة البيانات
const connectDB = async () => {
    try {
        console.log('🔗 محاولة الاتصال بقاعدة البيانات...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ تم الاتصال بقاعدة MongoDB بنجاح');
    } catch (error) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
        process.exit(1);
    }
};

// 🗃️ نماذج البيانات
const CardSetSchema = new mongoose.Schema({
    name: { type: String, required: true },
    cards: { type: Array, required: true },
    knownCards: { type: Array, default: [] },
    reviewCards: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now }
});

const CardSet = mongoose.model('CardSet', CardSetSchema);

// 📄 routes - الصفحة الرئيسية
app.get('/', (req, res) => {
    const possiblePaths = [
        path.join(__dirname, 'Index.html'),
        path.join(__dirname, '../Index.html'),
        path.join(__dirname, 'index.html'),
        path.resolve(__dirname, 'Index.html')
    ];

    console.log('📌 جاري البحث عن Index.html في المسارات:');

    let foundPath = null;
    for (const filePath of possiblePaths) {
        console.log('🔍 نفحص:', filePath);
        if (fs.existsSync(filePath)) {
            foundPath = filePath;
            console.log('✅ وجدنا الملف في:', foundPath);
            break;
        }
    }

    if (foundPath) {
        res.sendFile(foundPath);
    } else {
        console.error('❌ Index.html غير موجود في أي من المسارات التالية:');
        possiblePaths.forEach(p => console.log('   ❌', p));
        res.status(500).json({
            error: "الملف الرئيسي غير موجود",
            possiblePaths: possiblePaths
        });
    }
});

// 🔌 API routes لحفظ واسترجاع المجموعات
app.post('/api/sets/save-set', async (req, res) => {
    try {
        const { name, cards, knownCards, reviewCards } = req.body;
        
        const newSet = new CardSet({
            name,
            cards,
            knownCards: knownCards || [],
            reviewCards: reviewCards || []
        });

        await newSet.save();
        
        res.json({ 
            success: true, 
            message: 'تم حفظ المجموعة بنجاح',
            setId: newSet._id 
        });
    } catch (error) {
        console.error('Error saving set:', error);
        res.status(500).json({ 
            success: false, 
            message: 'فشل في حفظ المجموعة' 
        });
    }
});

app.get('/api/sets', async (req, res) => {
    try {
        const sets = await CardSet.find().sort({ createdAt: -1 });
        res.json(sets);
    } catch (error) {
        console.error('Error fetching sets:', error);
        res.status(500).json({ 
            success: false, 
            message: 'فشل في تحميل المجموعات' 
        });
    }
});

app.get('/api/sets/:setId', async (req, res) => {
    try {
        const setId = req.params.setId;
        const set = await CardSet.findById(setId);
        
        if (!set) {
            return res.status(404).json({ 
                success: false, 
                message: 'المجموعة غير موجودة' 
            });
        }

        res.json(set);
    } catch (error) {
        console.error('Error fetching set:', error);
        res.status(500).json({ 
            success: false, 
            message: 'فشل في تحميل المجموعة' 
        });
    }
});

// معالجة جميع المسارات غير المعروفة
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Index.html'));
});

// 🚀 تشغيل الخادم
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`✅ الخادم يعمل على البورت: ${PORT}`);
            console.log(`🌐 الرابط: http://localhost:${PORT}`);
            console.log(`🗄️  حالة قاعدة البيانات: ${mongoose.connection.readyState === 1 ? 'متصل' : 'غير متصل'}`);
        });
    } catch (error) {
        console.error('❌ فشل في تشغيل الخادم:', error);
        process.exit(1);
    }
};

startServer();
