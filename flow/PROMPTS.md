# Google Flow — البرومبتات اللي اشتغلت (مشروع Flow بتاريخ 30 أكتوبر)
- الصور: Nano Banana 2.1، طول 9:16، ببلاش. الفيديو: Omni 1.1 Flash، 720p، 6 ثواني = 10 رصيد.
- لما تنزّل من Flow: ⋮ ← تنزيل الوسائط ← 1K للصورة (الحجم الأصلي) أو 1080p للفيديو. حط الملفات هنا بالأسامي دي.

| الملف | البرومبت |
|---|---|
| bg-gold-rising.jpg / bg-gold-streaks.jpg | Vertical 9:16 abstract luxury background for an Instagram reel. Deep matte black, soft warm golden light (#AD8330) rising from the bottom like a glow, thin gold light streaks, subtle film grain, large empty dark space in the middle for text, cinematic, premium, minimal. No text, no logos, no people. |
| gold-play.jpg / gold-play-2.jpg | A single glossy 3D gold play button icon with soft rounded edges, polished brushed gold (#AD8330 to #F0D9A2), studio lighting, centered, floating, isolated on a pure solid black background (#000000), product render, ultra detailed. No text. |
| gold-dust-loop.mp4 | Seamless slow cinematic loop for a vertical reel background: deep black space, fine golden dust particles (#AD8330) drifting slowly upward, soft warm gold glow breathing at the bottom of frame, thin gold light streaks gently waving, shallow depth of field, very slow camera push in. Calm, premium, no text, no objects, no people. |

قاعدة: أي شيء (object) اطلبه على خلفية سودة صافية، عشان يتقص بسهولة ويتحط في مكتبة الأشياء.

## التنزيل (Claude بيعمله بنفسه)
التنزيل من المتصفح اللي جوه التطبيق بيروح على `C:\Users\mrsem\Downloads`. الصورة بتتنزل 2K، والفيديو 1080p، والتحسين بياخد دقيقة أو اتنين. بعد ما يخلص، Claude بينقل الملفات هنا بأسامي واضحة. الأشياء اللي على خلفية سودة بتتقص وتتحط في `base/assets/objects` (ImageMagick floodfill بنسبة 12% من الأركان).
- خلفية متحركة في أي حلقة: `"bgVideo": "gold-dust-loop"` في script.json (والقوة: `"bgVideoOpacity": 0.32`).
