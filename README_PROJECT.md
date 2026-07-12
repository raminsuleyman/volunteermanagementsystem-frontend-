# DOST Növbə İdarəetmə Sistemi — Frontend

DOST Agentliyində Team Leader-lərin könüllülərin gündəlik iş qrafikini elektron formada hazırlamasına imkan verən veb tətbiq. Hazırda **mock data** (localStorage) ilə tam funksional işləyir; backend inteqrasiyası üçün **[BACKEND_GUIDE.md](./BACKEND_GUIDE.md)** sənədinə baxın.

## Funksiyalar

| Bölmə | Təsvir |
|---|---|
| Yeni Növbə | Növbə seçimi (Səhər/Günorta/Axşam), Team Leader məlumatları, könüllülərin əlavə edilməsi |
| İş Bölgüsü | 6 × 30 dəqiqəlik zaman intervalı, 8 xidmət sahəsi, **Drag & Drop** (touch dəstəyi ilə) |
| Gün Sonu Qeydləri | 9 kateqoriya üzrə qeydlər (gəlməyənlər, icazəlilər, gecikənlər və s.) |
| Excel Export | Kağız formasına uyğun `.xlsx` faylı — bir kliklə |
| Könüllülər | Siyahı, əlavə/redaktə/silmə (soft delete), klub/təşəbbüs/icazə saatı izlənməsi |
| Arxiv | Tarixi və növbə tipinə görə filtr, detallı baxış, yenidən Excel export |
| Responsive | Desktop cədvəl görünüşü, mobil kart görünüşü, alt naviqasiya |

## Texnologiyalar

React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui · @dnd-kit (drag & drop) · xlsx (Excel export) · wouter (routing)

## Quraşdırma və işə salma

```bash
pnpm install
pnpm dev        # development server (port 3000)
pnpm build      # production build
```

## Layihə strukturu

```
client/src/
  pages/
    Home.tsx           # Ana səhifə — statistika və son növbələr
    NewShift.tsx       # Yeni növbə yaratma (3 addım)
    ShiftBoard.tsx     # Drag & Drop iş bölgüsü lövhəsi
    Volunteers.tsx     # Könüllülərin idarə edilməsi
    Archive.tsx        # Arxiv siyahısı
    ArchiveDetail.tsx  # Arxivlənmiş növbənin tam detalı
  components/
    Layout.tsx         # Sidebar (desktop) + alt naviqasiya (mobil)
  lib/
    types.ts           # Tip tərifləri — API kontraktının mənbəyi
    mockData.ts        # Mock data (backend hazır olduqda silinəcək)
    store.ts           # localStorage store — API çağırışları ilə əvəzlənəcək
    excelExport.ts     # Excel export məntiqi
BACKEND_GUIDE.md       # Backend bələdçisi: DB sxemi, endpoint siyahısı, biznes qaydaları
ideas.md               # Dizayn sənədi (Civic Digital)
```
