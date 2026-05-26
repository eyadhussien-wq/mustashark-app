# دليل نشر مستشارك على Google Play

## المتطلبات الأولية

1. **حساب Expo** — أنشئ حساباً مجانياً على https://expo.dev
2. **حساب Google Play** — رسوم تسجيل لمرة واحدة 25 دولار على https://play.google.com/console
3. **Node.js** مثبّت على جهازك (إصدار 18 أو أحدث)

---

## الخطوة 1 — تثبيت EAS CLI

```bash
npm install -g eas-cli
eas login
```

---

## الخطوة 2 — ربط المشروع بـ Expo

```bash
cd artifacts/mustasharek
eas init
```

سيُعطيك Expo معرّف المشروع (`projectId`) — ضعه في `app.json` بدلاً من `YOUR_EAS_PROJECT_ID`.

---

## الخطوة 3 — بناء نسخة الإنتاج (AAB)

```bash
eas build --platform android --profile production
```

سيُرفع الكود تلقائياً إلى خوادم Expo وسيُرسَل لك رابط لمتابعة البناء.
وقت البناء: 10–20 دقيقة عادةً.

---

## الخطوة 4 — رفع التطبيق يدوياً على Play Console

1. افتح https://play.google.com/console
2. أنشئ تطبيقاً جديداً → اسم التطبيق: **مستشارك**
3. في قائمة **Testing → Internal testing** ارفع ملف `.aab` الذي أنتجه EAS
4. أكمل معلومات المتجر:
   - **الوصف القصير:** منصة استشارات قانونية أونلاين في قطر والأردن
   - **الوصف الكامل:** ربط العملاء بمحامين مرخّصين لتقديم الاستشارات القانونية عن بُعد
   - **الفئة:** Business / قانون ومحاماة
   - **التصنيف العمري:** للجميع

---

## الخطوة 5 — الرفع التلقائي (اختياري)

لرفع التحديثات تلقائياً بدون يدوي:

1. أنشئ **Service Account** في Google Cloud Console
2. امنحه دور **Release Manager** في Play Console
3. حمّل ملف JSON إلى جذر المشروع بالاسم `google-play-key.json`
4. ثم شغّل:
```bash
eas submit --platform android --profile production
```

---

## الخطوة 6 — نشر التحديثات بدون إعادة بناء (OTA)

للتحديثات البسيطة (تعديلات في الكود دون تغيير حزم native):

```bash
eas update --branch production --message "وصف التحديث"
```

---

## ملاحظات مهمة

- معرّف الحزمة: `com.mustasharek.app` — **لا تغيّره بعد النشر أبداً**
- `versionCode` يزداد تلقائياً مع كل بناء بسبب `"autoIncrement": true`
- ملف `google-play-key.json` **لا يُرفع على GitHub** — أضفه لـ `.gitignore`
