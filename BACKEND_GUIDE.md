# Backend Guide — DOST Agentliyi Könüllülərinin Növbə İdarəetmə Sistemi

**Müəllif:** Manus AI
**Versiya:** 1.0
**Tarix:** 12 iyul 2026

Bu sənəd hazırlanmış frontend tətbiqinin arxasında qurulacaq backend sisteminin tam texniki bələdçisidir. Sənəddə verilənlər bazası sxemi, bütün API endpoint-lərinin siyahısı, sorğu/cavab nümunələri, biznes qaydaları və frontend inteqrasiya nöqtələri təsvir olunur. Frontend hazırda **mock data** və **localStorage** ilə işləyir; backend hazır olduqda `client/src/lib/store.ts` faylındakı funksiyalar aşağıdakı endpoint-lərə yönləndirilməlidir.

---

## 1. Ümumi Arxitektura

Sistem klassik üçqatlı arxitektura üzərində qurulur: React əsaslı frontend (hazırdır), REST API təqdim edən backend server və relyasion verilənlər bazası. Tövsiyə olunan texnologiya yığını aşağıdakı cədvəldə verilmişdir, lakin API kontraktı qorunduğu müddətcə istənilən alternativ istifadə oluna bilər.

| Qat | Tövsiyə | Alternativlər |
|---|---|---|
| Backend framework | Node.js + Express / Fastify | NestJS, Django REST, Laravel, ASP.NET Core |
| Verilənlər bazası | PostgreSQL | MySQL, MariaDB |
| ORM | Drizzle / Prisma | TypeORM, Sequelize, Eloquent |
| Autentifikasiya | JWT (access + refresh token) | Session cookie |
| Excel generasiyası | Frontend-də `xlsx` ilə (hazırdır) | Backend-də `exceljs` ilə server-side |

Bütün endpoint-lər `/api` prefiksi altında yerləşir. Cavablar JSON formatındadır və aşağıdakı ümumi strukturdan istifadə olunur:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Ad mütləqdir" } }
```

---

## 2. Verilənlər Bazası Sxemi

SRS-in 16-cı bölməsindəki cədvəllər aşağıdakı kimi dəqiqləşdirilir (PostgreSQL sintaksisi):

```sql
CREATE TABLE team_leaders (
  id            SERIAL PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE volunteers (
  id                    SERIAL PRIMARY KEY,
  first_name            VARCHAR(100) NOT NULL,
  last_name             VARCHAR(100) NOT NULL,
  shifts                TEXT[] NOT NULL DEFAULT '{}',   -- ['seher','gunorta','axsam']
  club_count            INT NOT NULL DEFAULT 0,
  initiative_count      INT NOT NULL DEFAULT 0,
  remaining_leave_hours NUMERIC(4,1) NOT NULL DEFAULT 0,
  active                BOOLEAN NOT NULL DEFAULT true,  -- soft delete (SRS §11)
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE areas (
  id   VARCHAR(50) PRIMARY KEY,   -- 'sorgu', 'aparat', ...
  name VARCHAR(100) NOT NULL
);

CREATE TABLE shifts (
  id             SERIAL PRIMARY KEY,
  date           DATE NOT NULL,
  shift_type     VARCHAR(10) NOT NULL CHECK (shift_type IN ('seher','gunorta','axsam')),
  team_leader_id INT REFERENCES team_leaders(id),
  tl_first_name  VARCHAR(100) NOT NULL,   -- TL adı snapshot kimi saxlanılır
  tl_last_name   VARCHAR(100) NOT NULL,
  saved_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (date, shift_type)               -- bir gündə hər tip növbədən yalnız biri
);

CREATE TABLE shift_volunteers (            -- növbəyə əlavə edilmiş könüllülər
  shift_id     INT REFERENCES shifts(id) ON DELETE CASCADE,
  volunteer_id INT REFERENCES volunteers(id),
  PRIMARY KEY (shift_id, volunteer_id)
);

CREATE TABLE time_slots (
  id         SERIAL PRIMARY KEY,
  shift_id   INT REFERENCES shifts(id) ON DELETE CASCADE,
  slot_index INT NOT NULL,                -- 0..5
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  UNIQUE (shift_id, slot_index)
);

CREATE TABLE assignments (
  id           SERIAL PRIMARY KEY,
  timeslot_id  INT REFERENCES time_slots(id) ON DELETE CASCADE,
  area_id      VARCHAR(50) REFERENCES areas(id),
  volunteer_id INT REFERENCES volunteers(id),
  UNIQUE (timeslot_id, volunteer_id)      -- bir intervalda könüllü yalnız bir sahədə
);

CREATE TABLE shift_notes (
  shift_id                  INT PRIMARY KEY REFERENCES shifts(id) ON DELETE CASCADE,
  gelmeyenler               TEXT DEFAULT '',
  icazeliler                TEXT DEFAULT '',
  gecikenler                TEXT DEFAULT '',
  eveze_gelenler            TEXT DEFAULT '',
  eveze_gedenler            TEXT DEFAULT '',
  diger_novbeden_gelenler   TEXT DEFAULT '',
  kluba_gedenler            TEXT DEFAULT '',
  tesebbus                  TEXT DEFAULT '',
  diger_novbeye_gedenler    TEXT DEFAULT ''
);
```

`areas` cədvəli aşağıdakı 8 sabit dəyərlə doldurulur (seed): Sorğu, Aparat, Əsas giriş, Özünəxidmət, 1-ci zal, 2-ci zal / SİMA, 2-ci mərtəbə, Könüllü masası.

---

## 3. API Endpoint Siyahısı

### 3.1 Autentifikasiya

| Metod | Endpoint | Təsvir | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Team Leader girişi, JWT qaytarır | — |
| POST | `/api/auth/logout` | Sessiyanı bitirir / refresh token-i ləğv edir | ✔ |
| POST | `/api/auth/refresh` | Access token-i yeniləyir | refresh token |
| GET | `/api/auth/me` | Cari istifadəçinin profili | ✔ |

**POST /api/auth/login — sorğu/cavab nümunəsi:**

```json
// Sorğu
{ "email": "orxan.veliyev@dost.gov.az", "password": "••••••••" }

// Cavab 200
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "user": { "id": 1, "firstName": "Orxan", "lastName": "Vəliyev", "email": "..." }
  }
}
```

### 3.2 Könüllülər (SRS §11–12)

| Metod | Endpoint | Təsvir | Auth |
|---|---|---|---|
| GET | `/api/volunteers` | Bütün aktiv könüllülərin siyahısı (`?active=false` ilə deaktivlər də) | ✔ |
| GET | `/api/volunteers/:id` | Bir könüllünün detalları | ✔ |
| POST | `/api/volunteers` | Yeni könüllü əlavə etmək | ✔ |
| PUT | `/api/volunteers/:id` | Könüllü məlumatlarını yeniləmək | ✔ |
| DELETE | `/api/volunteers/:id` | **Soft delete** — `active=false`; arxiv qeydləri qorunur | ✔ |
| GET | `/api/volunteers/:id/history` | Könüllünün iştirak etdiyi keçmiş növbələr | ✔ |
| POST | `/api/volunteers/:id/leave` | İcazə borcu əlavə etmək (+3 saat, SRS §12) | ✔ |
| POST | `/api/volunteers/:id/extra-service` | Əlavə xidmət (təşəbbüs) qeydiyyatı — icazə saatını azaldır (SRS §13) | ✔ |

**POST /api/volunteers — sorğu gövdəsi:**

```json
{
  "firstName": "Murad",
  "lastName": "Əliyev",
  "shifts": ["seher"],
  "clubCount": 5,
  "initiativeCount": 2,
  "remainingLeaveHours": 1
}
```

**POST /api/volunteers/:id/extra-service — sorğu gövdəsi:**

```json
{ "date": "2026-07-12", "window": "12:00-13:00", "hours": 1 }
```

Backend bu sorğuda əlavə xidmət pəncərəsinin SRS §13 qaydalarına uyğunluğunu yoxlamalıdır (bax bölmə 4.3).

### 3.3 Növbələr və Arxiv (SRS §4, §9, §14)

| Metod | Endpoint | Təsvir | Auth |
|---|---|---|---|
| GET | `/api/shifts` | Arxiv siyahısı; filtrlər: `?date=`, `?shiftType=`, `?page=`, `?limit=` | ✔ |
| GET | `/api/shifts/:id` | Bir növbənin tam detalı (intervallar, təyinatlar, qeydlər) | ✔ |
| POST | `/api/shifts` | Növbəni yadda saxlamaq (Save funksiyası, SRS §9) | ✔ |
| PUT | `/api/shifts/:id` | Mövcud növbəni yeniləmək (eyni gün redaktə üçün) | ✔ |
| GET | `/api/shifts/:id/export` | Excel faylı (server-side generasiya seçilərsə) | ✔ |
| GET | `/api/areas` | Xidmət sahələrinin siyahısı | ✔ |

**POST /api/shifts — tam sorğu gövdəsi (frontend-in göndərdiyi struktur):**

```json
{
  "date": "2026-07-12",
  "shiftType": "seher",
  "teamLeaderFirstName": "Orxan",
  "teamLeaderLastName": "Vəliyev",
  "volunteerIds": [1, 4, 6, 7, 10],
  "assignments": {
    "slot-0": { "sorgu": [1], "aparat": [4], "esas-giris": [6] },
    "slot-1": { "sorgu": [4], "zal-1": [7] },
    "slot-2": {}, "slot-3": {}, "slot-4": {}, "slot-5": {}
  },
  "notes": {
    "gelmeyenler": "Yoxdur",
    "icazeliler": "",
    "gecikenler": "Tural Nəbiyev (15 dəq)",
    "evezeGelenler": "",
    "evezeGedenler": "",
    "digerNovbedenGelenler": "",
    "klubaGedenler": "Aysel İbrahimova",
    "tesebbus": "",
    "digerNovbeyeGedenler": ""
  }
}
```

**GET /api/shifts/:id — cavab strukturu** frontend-dəki `Shift` tipinə (bax `client/src/lib/types.ts`) birəbir uyğun olmalıdır.

### 3.4 Statistika (Ana səhifə üçün, istəyə bağlı)

| Metod | Endpoint | Təsvir | Auth |
|---|---|---|---|
| GET | `/api/stats/overview` | Aktiv könüllü sayı, arxivlənmiş növbə sayı və s. | ✔ |

---

## 4. Biznes Qaydaları (Server-side Validasiya)

### 4.1 Zaman intervalları (SRS §3, §7)

Növbə saxlanılarkən backend seçilmiş növbə tipinə görə 6 ədəd 30 dəqiqəlik intervalı avtomatik yaradır: Səhər 09:00–12:00, Günorta 12:00–15:00, Axşam 15:00–18:00. `slot-0`–`slot-5` açarları ardıcıl intervallara uyğundur.

### 4.2 Təyinat qaydaları (SRS §5)

Bir zaman intervalında bir könüllü yalnız bir xidmət sahəsinə təyin oluna bilər (`assignments` cədvəlində `UNIQUE (timeslot_id, volunteer_id)`). Təyin olunan hər `volunteer_id` mütləq həmin növbənin `shift_volunteers` siyahısında olmalıdır. Bir sahəyə birdən çox könüllü təyin oluna bilər.

### 4.3 İcazə və əlavə xidmət (SRS §12–13)

Könüllü növbədə iştirak etmədikdə və icazə aldıqda sistem avtomatik olaraq `remaining_leave_hours` dəyərinə **3 saat** əlavə edir. İcazə borcu əlavə xidmət (təşəbbüs) vasitəsilə silinir. Gündəlik maksimum xidmət 4 saatdır, ona görə əlavə xidmət maksimum **1 saat** ola bilər və yalnız aşağıdakı pəncərələrdə icazəlidir:

| Könüllünün növbəsi | İcazəli əlavə xidmət pəncərəsi |
|---|---|
| Səhər | 12:00–13:00 (günortanın ilk saatı) |
| Günorta | 11:00–12:00 (səhərin son saatı) **və ya** 15:00–16:00 (axşamın ilk saatı) |
| Axşam | 14:00–15:00 (günortanın son saatı) |

`POST /api/volunteers/:id/extra-service` bu cədvələ uyğun gəlməyən pəncərəni `422 VALIDATION_ERROR` ilə rədd etməlidir. Uğurlu qeydiyyat `initiative_count`-u artırır və `remaining_leave_hours`-u `hours` qədər azaldır (mənfi ola bilməz).

### 4.4 Soft delete (SRS §11)

`DELETE /api/volunteers/:id` heç vaxt fiziki silmə etmir; yalnız `active=false` qoyur. Arxivdəki keçmiş növbələr silinmiş könüllünün adını göstərməyə davam edir, çünki `assignments` və `shift_volunteers` cədvəllərindəki əlaqələr qorunur.

### 4.5 Arxiv toxunulmazlığı (SRS §14)

Növbələr üçün `DELETE` endpoint-i nəzərdə tutulmayıb — arxiv məlumatları daimi saxlanılır. Yalnız eyni günün növbəsi `PUT /api/shifts/:id` ilə yenilənə bilər (tövsiyə: `saved_at`-dan sonrakı 24 saat ərzində).

---

## 5. HTTP Status Kodları

| Kod | İstifadə halı |
|---|---|
| 200 | Uğurlu GET/PUT |
| 201 | Uğurlu POST (yeni resurs yaradıldı) |
| 400 | Yanlış sorğu formatı |
| 401 | Token yoxdur və ya etibarsızdır |
| 404 | Resurs tapılmadı |
| 409 | Konflikt (məs. eyni gün + növbə tipi artıq mövcuddur) |
| 422 | Biznes qaydası pozuntusu (məs. yanlış əlavə xidmət pəncərəsi) |
| 500 | Server xətası |

---

## 6. Frontend İnteqrasiya Nöqtələri

Frontend-də bütün data əməliyyatları `client/src/lib/store.ts` faylında cəmləşdirilib. Backend hazır olduqda yalnız bu faylı dəyişmək kifayətdir — səhifə komponentlərinə toxunmaq lazım deyil. Uyğunluq cədvəli:

| store.ts funksiyası | Əvəzlənəcək API çağırışı |
|---|---|
| `getVolunteers()` | `GET /api/volunteers` |
| `addVolunteer(v)` | `POST /api/volunteers` |
| `updateVolunteer(v)` | `PUT /api/volunteers/:id` |
| `deactivateVolunteer(id)` | `DELETE /api/volunteers/:id` |
| `getShifts()` | `GET /api/shifts` |
| `getShiftById(id)` | `GET /api/shifts/:id` |
| `saveShift(shift)` | `POST /api/shifts` |

Tip tərifləri `client/src/lib/types.ts` faylındadır və API kontraktının mənbəyi hesab olunmalıdır. Mock data `client/src/lib/mockData.ts`-dədir; backend inteqrasiyasından sonra bu fayl silinə bilər.

---

## 7. Təhlükəsizlik Tövsiyələri

Şifrələr `bcrypt` (cost ≥ 12) ilə heşlənməlidir. Bütün endpoint-lər (login istisna) JWT middleware ilə qorunmalıdır. Rate limiting (`/api/auth/login` üçün 5 cəhd/dəqiqə) və CORS yalnız frontend domenini icazə verməklə konfiqurasiya edilməlidir. Bütün istifadəçi daxiletmələri server tərəfdə validasiya olunmalıdır (`zod`, `joi` və ya ekvivalent).

---

## 8. Yerləşdirmə Qeydləri

Backend `.env` faylı vasitəsilə konfiqurasiya olunmalıdır: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `CORS_ORIGIN`. Migrasiyaların idarəsi üçün `drizzle-kit` və ya `prisma migrate` tövsiyə olunur. İlkin seed skripti `areas` cədvəlini 8 xidmət sahəsi ilə doldurmalı və ən azı bir Team Leader hesabı yaratmalıdır.
