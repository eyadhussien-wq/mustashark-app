# MUSTASHAREK — ROADMAP

**المرجع التنفيذي المختصر للخارطة الاستراتيجية**

> قاعدة الحوكمة: لا تنفيذ قبل التصنيف المعماري وربط المهمة بواقع المستودع.
> بوابة التنفيذ: Repository → Typecheck → Tests → Security Review → CI → PR → Review → Merge → Verify Main.

## الحالة الحالية

### S02 — Legal Representation
- S02.1 Request Quote — مكتمل ضمن المسار المنفذ.
- S02.2 Lawyer Proposal & 24h Expiry — مكتمل ضمن المسار المنفذ.
- S02.3 Accept & Pay — مكتمل ضمن المسار المنفذ.
- S02.4 Agreement & Electronic Confirmation — مكتمل ضمن المسار المنفذ.
- S02.5 POA / Court Proof Upload — مكتمل ضمن المسار المنفذ.
- S02.6 Active Case Workspace — مكتمل.
- S02.7 Active Case final synchronization — مكتمل حتى S02.7.5.
- S02.7.6 Audit Trail / Activity Log — **متوقف مؤقتاً**: لا يوجد Backend API جاهز لسجل تدقيق خاص بالقضية؛ لا Mocks ولا التفاف معماري.
- S02.7.7 Investor Attachments Sync — **محقق/مغطى حالياً** عبر واجهات المستندات الموجودة؛ لا تغيير مصطنع.

## S03 — Real Estate Opportunities

### S03.1 — Real Estate Opportunities Catalog UI
**مكتمل ومُدمج في main عبر PR #81.**

النطاق:
- بطاقات فرص عقارية.
- تفاصيل العقار والموقع، مع تركيز على السوق الأردني.
- العائد المتوقع.
- هامش الربح.
- قيمة الفرصة.
- واجهة كتالوج أمامية فقط دون Schema/Migration/Finance/Expo changes.

### S03 — التالي
- ربط فرص العقار بمصادر بيانات/API فعلية فقط بعد التحقق من وجودها.
- عدم اختلاق بيانات استثمارية أو عوائد فعلية داخل الواجهة.

## S04 — قريباً / FROZEN

**S04 مجمّدة مؤقتاً.**

لا يبدأ تنفيذ S04 أو إنشاء فروع تنفيذية لها حتى رفع التجميد واعتماد نطاقها المعماري والـ APIs المطلوبة.

## S05 — Lawyer Smart Safety Shield

### الهدف الاستراتيجي
بناء طبقة أمان ذكية للتحقق من المحامين والحد من المخاطر التشغيلية قبل الاعتماد، مع إبقاء التنفيذ المستقبلي مرتبطاً بـ APIs موثوقة ومصرح بها.

### النطاق المستقبلي
- التحقق من هوية المحامي وحالة الاعتماد.
- مؤشرات سلامة الحساب والوثائق.
- كشف الحالات غير الطبيعية أو المتعارضة قبل الإجراءات الحساسة.
- واجهة تنبيه واضحة للمستخدم والإدارة عند الحاجة.
- **API Integration — Future:** لا تنفيذ Backend أو Schema ضمن مرحلة UI الأولية؛ الربط يتم فقط بعد اعتماد الـ APIs ومصدر الحقيقة.

## D02 — Design System

D02 هو المرجع الرسمي للتصميم، مع الالتزام بـ RTL/i18n والاتساق البصري وإعادة استخدام المكونات قبل إنشاء مكونات مكررة.

## Validation Gate

كل بند يجب أن يمر عبر:

`Roadmap ID → Feature → Repository Files → Database Tables → API/Service → UI → Branch → PR → Tests → CI → Production Status → Verification Evidence`

ولا يُعتبر البند مغلقاً إلا بعد **Verify Main**.

## Global Execution Protocol

```text
MASTER ROADMAP
→ ROADMAP-REGISTRY
→ MASTER AUDIT MAP
→ DOMAIN / DATA / STATE / SECURITY CLASSIFICATION
→ FUNCTIONAL LIFECYCLE PLACEMENT
→ REPOSITORY AUDIT
→ IMPLEMENTATION
→ TYPECHECK
→ TESTS
→ SECURITY REVIEW
→ CI
→ PR
→ REVIEW
→ MERGE
→ VERIFY MAIN
→ CLOSED / VERIFIED
```
