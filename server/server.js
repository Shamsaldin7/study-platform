const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 10000;

// 🔧 إعدادات أساسية
app.use(express.static(__dirname)); // لخدمة الملفات الثابتة (CSS, JS)

app.get('/', (req, res) => {
    // المسارات الممكنة بعد نقل الملفات إلى مجلد server
    const possiblePaths = [
        path.join(__dirname, 'Index.html'),           // في نفس المجلد
        path.join(__dirname, '../Index.html'),        // مجلد أعلى
        path.join(__dirname, 'index.html'),           // إذا كان اسم الملف صغير
        path.resolve(__dirname, 'Index.html')         // المسار المطلق
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

// 🚀 تشغيل الخادم
app.listen(PORT, () => {
    console.log(`✅ الخادم يعمل على البورت: ${PORT}`);
    console.log(`🌐 الرابط: http://localhost:${PORT}`);
});