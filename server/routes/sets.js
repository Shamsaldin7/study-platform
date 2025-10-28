const express = require('express');
const router = express.Router();
const FlashcardSet = require('../models/FlashcardSet');

//الحصول على جميع مجموعات البطاقات التعليمية
router.get('/', async (req, res) => {
    try {
        const sets = await FlashcardSet.find()
            .select('name cards length createdAt')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(sets);
    } catch (error) {
        console.error('Error fetching sets:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحميل المجموعات'
        });
    }
});

//الحصول على مجموعة محددة
router.get('/:id', async (req, res) => {
    try {
        const set = await FlashcardSet.findById(req.params.id);

        if (!set) {
            return res.status(404).json({
                success: false,
                message: 'المجموعة غير موجودة'
            });
        }

        //زيادة عداد الوصول
        set.accessCount += 1;
        await set.save();

        res.json(set);
    } catch (error) {
        console.error('Error fetching set:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحميل المجموعة'
        });
    }
});

//حفظ مجموعة جديدة
router.post('/save-set', async (req, res) => {
    try {
        const { name, cards, knownCards, reviewCards } = req.body;

        if (!name || !cards || !Array.isArray(cards)) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صالحة'
            });
        }

        const newSet = new FlashcardSet({
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

//الحصول على مجموعة عبر رابط المشاركة
router.get('/share/:shareId', async (req, res) => {
    try {
        const set = await FlashcardSet.findOne({ shareId: req.params.shareId });

        if (!set) {
            return res.status(404).json({
                success: false,
                message: 'رابط المشاركة غير صالح'
            });
        }

        res.json(set);
    } catch (error) {
        console.error('Error fetching shared set:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحميل المجموعة'
        });
    }
});

//تحديث مجموعة (تقييم البطاقات)
router.put('/:id/progress', async (req, res) => {
    try {
        const { knownCards, reviewCards } = req.body;

        const set = await FlashcardSet.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    knownCards: knownCards || [],
                    reviewCards: reviewCards || []
                }
            },
            { new: true }
        );

        if (!set) {
            return res.status(404).json({
                success: false,
                message: 'المجموعة غير موجودة'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث التقدم بنجاح'
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحديث التقدم'
        });
    }
});

//حذف مجموعة
router.delete('/:id', async (req, res) => {
    try {
        const set = await FlashcardSet.findByIdAndDelete(req.params.id);

        if (!set) {
            return res.status(404).json({
                success: false,
                message: 'المجموعة غير موجودة'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف المجموعة بنجاح'
        });
    } catch (error) {
        console.error('Error deleting set:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في حذف المجموعة'
        });
    }
});

module.exports = router;