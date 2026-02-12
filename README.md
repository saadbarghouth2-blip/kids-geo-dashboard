# Kids Geo Dashboard (React) — Enhanced UI

Dashboard تعليمي تفاعلي للأطفال:
- UI منظم + Cards + Stats + Control Panel
- خريطة غنية: Layers (حدود مصر/النيل/الدلتا/Glow مناطق/إحداثيات) + Spotlight rings + Heat circles
- Active Legend مرقّم + Drawer معلومات للمكان
- مساعد ذكي "كأنك بتكلم الداشبورد" + Typewriter + Actions (FlyTo / فتح نشاط)
- Activities: Drag & Drop + Quiz
- Drawing Tools: نقاط + مسار + قياس مسافة + مسح
- Toasts + Animations + Glow/Patterns

## التشغيل
1) فك الضغط
2) افتح Terminal داخل مجلد المشروع
3) npm install
4) npm run dev

## تعديل المحتوى
- الدروس:
  src/data/lessons/*.json
- طبقات GeoJSON:
  src/data/geo/*.json

## ملاحظة
الطبقات المرسومة هنا "تقريبية" لتجربة UI والـInteractive.
لو عايز دقة GIS كاملة نربط GeoJSON حقيقي أو FeatureService/GeoServer.
