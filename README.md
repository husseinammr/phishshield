# 🛡️ PhishShield — نظام التوعية بالتصيد الإلكتروني

<div align="center">

![PhishShield Banner](https://img.shields.io/badge/PhishShield-Phishing%20Awareness%20System-blue?style=for-the-badge&logo=shield&logoColor=white)

[![Made With React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)]()

**مشروع تخرج | أمن المعلومات | جامعة ___________**

[🚀 عرض مباشر](#) • [📖 التوثيق](#architecture) • [📊 المميزات](#features)

</div>

---

## 📌 نظرة عامة

**PhishShield** منصة تعليمية متكاملة لرفع الوعي الأمني داخل المؤسسات ضد هجمات التصيد الإلكتروني (Phishing). يهدف المشروع إلى تدريب الموظفين على التعرف على رسائل التصيد من خلال محاكاة آمنة وتوجيههم فوراً لمحتوى توعوي تفاعلي.

> ⚠️ **ملاحظة أخلاقية:** هذا المشروع مخصص للأغراض التعليمية والدفاعية فقط. لا يتم جمع أي بيانات حساسة أو كلمات مرور في أي مرحلة.

---

## ✨ المميزات الرئيسية {#features}

| الميزة | الوصف |
|--------|-------|
| 📊 **لوحة تحكم تفاعلية** | إحصائيات حية لمعدلات النقر والوعي الأمني لكل قسم |
| 📧 **إدارة الحملات** | تتبع وعرض جميع حملات التوعية مع نسب الأمان |
| 🎬 **سيناريو توضيحي** | شرح تفاعلي خطوة بخطوة لرحلة الموظف كاملة |
| 🛡️ **صفحة التوعية** | محتوى تعليمي + اختبار تفاعلي بعد كل محاكاة |
| ⚡ **سجل مباشر** | تحديثات فورية للنشاط عبر WebSocket simulation |
| 📱 **تصميم متجاوب** | يعمل على جميع الأجهزة والشاشات |

---

## 🏗️ هيكل المشروع {#architecture}

```
phishshield/
│
├── 📊 Dashboard Page       # لوحة التحكم الرئيسية
│   ├── KPI Cards           # بطاقات الإحصائيات (مُرسَل / نقرات / وعي)
│   ├── Weekly Bar Chart    # رسم بياني أسبوعي للنشاط
│   ├── Dept Risk Bars      # معدل الخطر حسب القسم
│   └── Live Activity Feed  # سجل النشاط المباشر
│
├── 📧 Campaigns Page       # صفحة الحملات
│   ├── Summary Cards       # ملخص إجمالي
│   └── Campaigns Table     # جدول الحملات مع نسب الأمان
│
├── 🎬 Scenario Page        # السيناريو التوضيحي
│   ├── 6-Step Flow         # خطوات تفاعلية
│   ├── Code Preview        # كود توضيحي لكل خطوة
│   └── Auto-Play Mode      # تشغيل تلقائي للعرض
│
└── 🛡️ Awareness Page      # صفحة التوعية
    ├── Alert Banner        # تنبيه بالاختبار التوعوي
    ├── Warning Cards       # بطاقات الأخطاء المرتكبة
    ├── Safety Tips         # نصائح الوقاية
    └── Interactive Quiz    # اختبار تفاعلي
```

---

## 🚀 تشغيل المشروع محلياً

### المتطلبات
- Node.js 18+
- npm أو yarn

### خطوات التثبيت

```bash
# 1. استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/phishshield.git
cd phishshield

# 2. تثبيت المكتبات
npm install

# 3. تشغيل المشروع
npm start

# 4. افتح المتصفح على
http://localhost:3000
```

---

## 🛠️ التقنيات المستخدمة

```
Frontend
├── React 18          — واجهة المستخدم التفاعلية
├── Recharts          — الرسوم البيانية
└── CSS-in-JS         — التصميم المدمج

Design System
├── Color Palette     — Slate / Zinc (Dark Theme)
├── Accent Colors     — Blue / Green / Amber / Red
└── Typography        — Cairo (عربي) + Monospace (كود)
```

---

## 📊 واجهة المستخدم

### ألوان النظام

| اللون | الاستخدام | الكود |
|-------|-----------|-------|
| 🔵 الأزرق | الإحصائيات العامة | `#60a5fa` |
| 🟢 الأخضر | معدل الوعي والأمان | `#34d399` |
| 🟡 الأصفر | النقرات والتحذيرات | `#fbbf24` |
| 🔴 الأحمر | الأحداث الخطرة | `#f87171` |

---

## 🔒 المبادئ الأمنية

```
✅ لا يتم جمع كلمات المرور أو البيانات الحساسة
✅ جميع المحاكاة تنتهي بصفحة توعية فورية
✅ البيانات المعروضة للأغراض التعليمية فقط
✅ مبني وفق مبادئ Privacy by Design
```

---

## 📁 ملفات المشروع

```
phishshield/
├── phishshield-complete.jsx    # التطبيق الكامل المدمج
├── phishing-awareness-dashboard.jsx  # Dashboard منفصل
├── phishing-scenario.jsx       # السيناريو التوضيحي منفصل
├── README.md                   # هذا الملف
└── LICENSE                     # رخصة المشروع
```

---

## 👨‍💻 فريق التطوير

| الاسم | الدور |
|-------|-------|
| ___________ | مطور Full-Stack |
| ___________ | مصمم UI/UX |
| ___________ | باحث أمن معلومات |

**المشرف الأكاديمي:** د. ___________
**الجامعة:** ___________
**العام الدراسي:** 2024-2025

---

## 📄 الرخصة

هذا المشروع مرخص تحت [MIT License](LICENSE) — للاستخدام التعليمي والأكاديمي فقط.

---

<div align="center">

**صُنع بـ ❤️ لرفع الوعي الأمني**

⭐ إذا أعجبك المشروع، لا تنسَ النجمة!

</div>
