const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

console.log('🔍 بدء تشغيل الخادم...');

// الاتصال بقاعدة البيانات
const connectDB = async () => {
    try {
        console.log('🔗 جاري الاتصال بقاعدة البيانات...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    } catch (error) {
        console.error('❌ خطأ في الاتصال:', error.message);
        process.exit(1);
    }
};

// نموذج البيانات
const CardSetSchema = new mongoose.Schema({
    name: String,
    cards: Array,
    knownCards: Array,
    reviewCards: Array,
    createdAt: { type: Date, default: Date.now }
});

const CardSet = mongoose.model('CardSet', CardSetSchema);

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Index.html'));
});

// API routes
app.post('/api/sets/save-set', async (req, res) => {
    try {
        const newSet = new CardSet(req.body);
        await newSet.save();
        res.json({ success: true, message: 'تم الحفظ بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'فشل في الحفظ' });
    }
});

app.get('/api/sets', async (req, res) => {
    try {
        const sets = await CardSet.find();
        res.json(sets);
    } catch (error) {
        res.status(500).json({ success: false, message: 'فشل في التحميل' });
    }
});

// تشغيل الخادم
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`✅ الخادم يعمل على البورت: ${PORT}`);
    });
};

startServer();
