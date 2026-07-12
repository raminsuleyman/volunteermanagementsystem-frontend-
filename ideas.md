# DOST Növbə İdarəetmə Sistemi — Dizayn İdeyaları

## Üç Fərqli Üslub Yanaşması

### 1. Dövlət Rəqəmsal Xidmət (Civic Digital)
**Qısa təsvir:** Azərbaycan dövlət xidmətlərinin rəqəmsal estetikası — DOST brendinin isti narıncı-qırmızı tonları, təmiz cədvəllər, güclü tipoqrafiya. Peşəkar, etibarlı və rəsmi hiss.
**Ehtimal:** 0.08

### 2. Neo-Brutalist Növbə Lövhəsi
**Qısa təsvir:** Qalın konturlar, sərt kölgələr, canlı rəng blokları — kağız üzərindəki əl ilə yazılmış qrafiklərin rəqəmsal, cəsarətli interpretasiyası.
**Ehtimal:** 0.03

### 3. İsti Operativ Panel (Warm Operations)
**Qısa təsvir:** Yumşaq krem fon, dərin yaşıl vurğular, operativ idarəetmə panelinin rahat, insan mərkəzli versiyası.
**Ehtimal:** 0.05

---

## SEÇİLMİŞ YANAŞMA: Dövlət Rəqəmsal Xidmət (Civic Digital)

### Design Movement
Müasir dövlət rəqəmsal xidmət dizaynı (GOV.UK Design System + e-gov estetikası), DOST Agentliyinin brend kimliyi ilə birləşdirilmiş. İstinad: DOST loqosunun isti narıncı/qırmızı qradienti.

### Core Principles
1. **Aydınlıq hər şeydən üstündür** — hər ekranda Team Leader nə etməli olduğunu dərhal anlamalıdır.
2. **Sıx amma nəfəs alan cədvəllər** — iş qrafiki cədvəlləri kompakt, lakin oxunaqlıdır.
3. **Operativ sürət** — drag & drop, ani vizual geri bildirim, minimal klik sayı.
4. **Rəsmi istilik** — dövlət sistemidir, amma insan (könüllü) mərkəzlidir; DOST-un isti rəngləri soyuq bürokratiyanı yumşaldır.

### Color Philosophy
- **Signature Brand Color:** DOST Narıncısı `oklch(0.68 0.19 40)` (#E8541F-ə yaxın) — enerji, könüllülük, xidmət istiliyi.
- Fon: çox açıq isti boz-krem `oklch(0.98 0.005 60)` — kağız formasının rəqəmsal ekvivalenti.
- Mətn: dərin isti qara-qəhvəyi `oklch(0.22 0.02 40)`.
- Növbə rəngləri: Səhər — günəş sarısı-narıncı; Günorta — DOST narıncısı; Axşam — dərin bənövşəyi-mavi. Hər növbənin öz rəng kodu bütün sistemdə (badge, kart, arxiv) təkrarlanır.
- Status rəngləri: yaşıl (təyin edilib), boz (boş sahə), qırmızı (gəlməyən).

### Layout Paradigm
- Sol tərəfdə daimi sidebar naviqasiya (Yeni Növbə, Könüllülər, Arxiv) — daxili idarəetmə aləti üçün klassik amma effektiv.
- İş bölgüsü ekranı: sol paneldə könüllü siyahısı (drag mənbəyi), sağda zaman intervalı tabları + xidmət sahələri grid-i (drop hədəfi). Asimmetrik 1:3 bölgü.
- Mobil: sidebar alt naviqasiyaya çevrilir, iş qrafiki kart görünüşünə keçir.

### Signature Elements
1. **Növbə rəng zolağı** — hər kartın/bölmənin sol kənarında 4px rəngli zolaq (növbənin rəngi).
2. **Vaxt çipləri** — dairəvi künclü, monospace rəqəmli zaman intervalı çipləri (09:00–09:30).
3. **DOST qradient vurğusu** — əsas CTA düymələrində narıncıdan qırmızıya incə qradient.

### Interaction Philosophy
Drag & drop əsas qarşılıqlı əlaqədir: sürüklənən könüllü kartı yüngülcə böyüyür və kölgə alır; drop hədəfi narıncı halqa ilə işıqlanır. Hər əməliyyat toast ilə təsdiqlənir. Kliklə təyin etmə alternativi də mövcuddur (mobil üçün).

### Animation
- Kart daxilolmaları: 200ms ease-out, opacity+translateY(8px), 40ms stagger.
- Drag zamanı: scale(1.03) + shadow-lg, 150ms.
- Drop: yerləşən kart 250ms "settle" effekti.
- Düymələr: active-də scale(0.97), 140ms.

### Typography System
- Başlıqlar: **Manrope** (700/800) — müasir, texniki amma isti.
- Mətn: **Inter deyil — IBM Plex Sans** (400/500/600) — dövlət sistemi ciddiliyi.
- Rəqəmlər/vaxtlar: **IBM Plex Mono** — cədvəl dəqiqliyi.

### Brand Essence
DOST Agentliyi könüllüləri üçün kağızsız növbə idarəetməsi — Team Leader-lərin gündəlik iş bölgüsünü dəqiqələr içində hazırlamasına imkan verən operativ alət. Sifətlər: **operativ, etibarlı, isti**.

### Brand Voice
Qısa, əməli, hörmətli Azərbaycan dili. Nümunələr:
- "Növbəni seç, komandana başla."
- "Bu günün iş bölgüsü 3 dəqiqəyə hazır."
Qadağan: "Sistemə xoş gəlmisiniz" kimi boş ifadələr.

### Wordmark & Logo
"DOST Növbə" sözü Manrope ExtraBold ilə; yanında narıncı-qırmızı qradientli dairəvi simvol (əl/insan motivi). Header-də və favicon-da istifadə olunur.
