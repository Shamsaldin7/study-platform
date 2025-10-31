const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// 🔍 تشخيص مفصل
console.log('=== تشخيص بدء التشغيل ===');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI موجود:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI يبدأ بـ mongodb:', process.env.MONGODB_URI?.startsWith('mongodb'));

if (process.env.MONGODB_URI) {
    console.log('MONGODB_URI length:', process.env.MONGODB_URI.length);
    // إظهار جزء من السلسلة (بدون الباسوورد)
    const safeURI = process.env.MONGODB_URI.replace(/:(.*)@/, ':****@');
    console.log('MONGODB_URI (safe):', safeURI);
} else {
    console.log('❌ MONGODB_URI غير موجود!');
}

// إعدادات أساسية
app.use(express.json());
app.use(express.static(__dirname));

// الاتصال بقاعدة البيانات
const connectDB = async () => {
    try {
        console.log('🔗 جاري الاتصال بقاعدة البيانات...');
        
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI غير محدد في Environment Variables');
        }
        
        // حل مشكلة DNS
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            // إعدادات DNS إضافية
            family: 4, // فرض استخدام IPv4
        };

        await mongoose.connect(process.env.MONGODB_URI, options);
        
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    } catch (error) {
        console.error('❌ خطأ في الاتصال:', error.message);
        console.log('🔍 نوع الخطأ:', error.name);
        console.log('🔍 رمز الخطأ:', error.code);
        
        // إعادة المحاولة مع إعدادات مختلفة
        console.log('🔄 إعادة المحاولة مع إعدادات بديلة...');
        setTimeout(connectDB, 5000);
    }
};

// نموذج البيانات
const CardSetSchema = new mongoose.Schema({
    name: { type: String, required: true },
    cards: { type: Array, required: true },
    knownCards: { type: Array, default: [] },
    reviewCards: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now }
});

const CardSet = mongoose.model('CardSet', CardSetSchema);

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Index.html'));
});

// حفظ المجموعة
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
            message: 'تم حفظ المجموعة بنجاح'
        });
    } catch (error) {
        console.error('Error saving set:', error);
        res.status(500).json({ 
            success: false, 
            message: 'فشل في حفظ المجموعة' 
        });
    }
});

// جلب جميع المجموعات
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

// جلب مجموعة محددة
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

// معالجة جميع المسارات الأخرى
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Index.html'));
});

// تشغيل الخادم
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`✅ الخادم يعمل على البورت: ${PORT}`);
        console.log(`🌐 الرابط: http://localhost:${PORT}`);
    });
};

startServer();
