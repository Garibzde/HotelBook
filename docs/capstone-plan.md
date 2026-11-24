# Capstone layihə planı

**Ad, soyad:** Qərib Qəribzadə
**Layihənin adı:** HotelBook
**GitHub repo linki:** https://github.com/Garibzde/HotelBook
**Təhvil tarixi:** 16 dekabr 2026

---

## 1. Layihə nə edir?

HotelBook otel rezervasiyası üçün backend API-dir. İstifadəçilər otelləri və otaqları axtarır, tarix seçib otaq rezerv edir və qalıb bitirdikdən sonra rəy yazır. Hər otelin öz meneceri var, o yalnız öz otelinin otaqlarını və rezervasiyalarını idarə edir. Admin otelləri və menecerləri idarə edir. Layihədə ən vacib məsələ eyni otağın eyni tarixə iki dəfə rezerv edilməməsidir.

Əsas hissə bitəndən sonra üç əlavə də edəcəyəm: onlayn ödəniş, rezervasiya təsdiqlənəndə istifadəçinin e-poçtuna QR kodlu məktub göndərilməsi və frontend.

---

## 2. Rollar

| Rol | Nə edə bilər? |
|---|---|
| USER | Qeydiyyat və giriş, otel və otaq axtarışı, otaq rezerv etmək, öz rezervasiyalarına baxmaq və ləğv etmək, qalıb bitirdiyi rezervasiyaya rəy yazmaq |
| MANAGER | Yalnız öz otelinin məlumatını, otaqlarını, şəkillərini və rezervasiyalarını idarə edir |
| ADMIN | Otel yaradır, menecer hesabı yaradıb otelə təyin edir, bütün rezervasiyalara baxır |

Qeydiyyat həmişə USER yaradır. MANAGER və ADMIN hesablarını yalnız admin (və ya seed) yarada bilər.

---

## 3. Modellər və sahələr

| Model | Sahələr (ad: tip) | Qeyd |
|---|---|---|
| User | id: Int, name: String, email: String, passwordHash: String, role: Role, managedHotelId: Int?, createdAt: DateTime | email unikaldır. managedHotelId yalnız menecer üçün doludur |
| Hotel | id: Int, name: String, city: String, address: String, description: String?, stars: Int, phone: String?, isActive: Boolean, createdAt: DateTime | Otel silinmir, isActive=false olur |
| Room | id: Int, hotelId: Int, roomNumber: String, name: String, type: RoomType, pricePerNight: Decimal, capacity: Int, description: String?, isActive: Boolean, createdAt: DateTime | Otaq nömrəsi otel daxilində unikaldır (`@@unique([hotelId, roomNumber])`) |
| Booking | id: Int, bookingCode: String, userId: Int, roomId: Int, checkIn: Date, checkOut: Date, guests: Int, totalPrice: Decimal, status: BookingStatus, expiresAt: DateTime?, createdAt: DateTime | İstifadəçi ilə otaq arasındakı birləşdirici model. bookingCode unikaldır (QR kod üçün), expiresAt ödəniş üçün gözləmə vaxtıdır |
| Review | id: Int, bookingId: Int, rating: Int, comment: String?, createdAt: DateTime | Bir rezervasiyaya bir rəy (`bookingId` unikaldır) |
| Image | id: Int, url: String, hotelId: Int?, roomId: Int?, createdAt: DateTime | Otel və ya otaq şəkli |
| Payment (əlavə) | id: Int, bookingId: Int, amount: Decimal, status: PaymentStatus, provider: String, providerRef: String?, createdAt: DateTime | Bir rezervasiyaya bir ödəniş (`bookingId` unikaldır) |

Enum-lar: Role (USER, MANAGER, ADMIN), RoomType (SINGLE, DOUBLE, TWIN, SUITE, FAMILY), BookingStatus (PENDING, CONFIRMED, CANCELLED, CHECKED_IN, COMPLETED), PaymentStatus (PENDING, PAID, FAILED, REFUNDED).

---

## 4. Əlaqələr

| Əlaqə | Növ | `onDelete` |
|---|---|---|
| Hotel → Room | 1–çox | Cascade |
| Hotel → User (menecerlər) | 1–çox | SetNull |
| User → Booking | 1–çox | Restrict |
| Room → Booking | 1–çox | Restrict |
| User ↔ Room (Booking vasitəsilə) | çox–çox | Booking birləşdirici modeldir |
| Booking → Payment | 1–1 | Cascade |
| Booking → Review | 1–1 | Cascade |
| Hotel → Image, Room → Image | 1–çox | Cascade |

ER sxemi: `docs/er.png`

---

## 5. Endpoint-lər

Bütün yollar `/api` ilə başlayır.

| Method | Path | Kim? | Nə edir? |
|---|---|---|---|
| POST | /auth/register | hamı | USER hesabı yaradır |
| POST | /auth/login | hamı | Giriş, token qaytarır |
| GET | /auth/me | giriş etmiş | Öz məlumatı |
| GET | /hotels | hamı | Otel siyahısı (pagination, filter: city, stars, search, sort) |
| GET | /hotels/:id | hamı | Otel detalı |
| POST | /hotels | ADMIN | Otel yaradır |
| PUT | /hotels/:id | ADMIN, o otelin meneceri | Otel məlumatını dəyişir |
| PATCH | /hotels/:id/status | ADMIN | Oteli aktiv/deaktiv edir |
| POST | /hotels/:id/images | ADMIN, o otelin meneceri | Otel şəkli yükləyir |
| GET | /hotels/:hotelId/rooms | hamı | Otelin otaqları (pagination, filter: type, maxPrice, capacity) |
| GET | /rooms/available | hamı | Tarixə görə boş otaqlar (checkIn, checkOut, guests, city, type, maxPrice, pagination) |
| GET | /rooms/:id | hamı | Otaq detalı |
| POST | /hotels/:hotelId/rooms | ADMIN, o otelin meneceri | Otaq yaradır |
| PUT | /rooms/:id | ADMIN, o otelin meneceri | Otağı dəyişir |
| PATCH | /rooms/:id/status | ADMIN, o otelin meneceri | Otağı aktiv/deaktiv edir |
| POST | /rooms/:id/images | ADMIN, o otelin meneceri | Otaq şəkli yükləyir |
| POST | /bookings | USER | Rezervasiya yaradır |
| GET | /bookings/my | USER (sahibi) | Öz rezervasiyaları (pagination, filter: status) |
| GET | /bookings/:id | sahibi, o otelin meneceri, ADMIN | Rezervasiya detalı |
| PATCH | /bookings/:id/cancel | sahibi | Rezervasiyanı ləğv edir |
| GET | /manager/bookings | MANAGER | Öz otelinin rezervasiyaları (pagination, filter) |
| PATCH | /bookings/:id/status | o otelin meneceri, ADMIN | Statusu dəyişir |
| GET | /bookings | ADMIN | Bütün rezervasiyalar (pagination, filter) |
| POST | /bookings/:id/review | sahibi | Rəy yazır |
| GET | /hotels/:id/reviews | hamı | Otelin rəyləri (pagination) |
| POST | /admin/managers | ADMIN | Menecer hesabı yaradıb otelə təyin edir |
| GET | /health | hamı | Serverin işlədiyini yoxlayır |

Əlavələr (əsas hissə bitəndən sonra):

| Method | Path | Kim? | Nə edir? |
|---|---|---|---|
| POST | /bookings/:id/pay | sahibi | Ödəniş başladır (test rejimi və ya mock) |
| POST | /payments/webhook | ödəniş provayderi | Ödənişin nəticəsini bildirir, imza yoxlanılır |
| POST | /bookings/verify-code | o otelin meneceri | QR koddakı kodu yoxlayır, rezervasiyanı CHECKED_IN edir |

---

## 6. Biznes qaydaları

Hər qayda üçün test yazacağam.

1. Eyni otaq üçün tarixlər üst-üstə düşə bilməz, ləğv olunmuş rezervasiyalar sayılmır → 409. Yoxlama və yaratma bir transaction-da, otaq sətrinə kilid ilə edilir.
2. `checkOut` `checkIn`-dən sonra olmalıdır, `checkIn` keçmişdə ola bilməz, qonaq sayı otağın tutumundan çox ola bilməz → 400.
3. `totalPrice` serverdə hesablanır (gecə sayı × gecəlik qiymət), sorğudan qəbul edilmir.
4. Deaktiv otel və ya otaq rezerv edilə bilməz və siyahılarda görünmür → 404.
5. Qeydiyyat həmişə USER yaradır, sorğudakı `role` nəzərə alınmır.
6. İstifadəçi yalnız öz rezervasiyasına baxa və ləğv edə bilər, başqası → 404.
7. Menecer yalnız öz otelinin otaqlarına və rezervasiyalarına toxuna bilər, başqası → 404.
8. Ləğv yalnız PENDING və ya CONFIRMED statusda və giriş tarixindən əvvəl mümkündür → 409.
9. Rezervasiya PENDING yaranır. Ödəniş əlavə olunana qədər menecer CONFIRMED edir, ödəniş əlavə olunandan sonra isə uğurlu ödənişlə avtomatik CONFIRMED olur. Ardıcıllıq: PENDING → CONFIRMED → CHECKED_IN → COMPLETED. Yanlış keçid → 409.
10. Rəyi yalnız rezervasiya sahibi, yalnız COMPLETED rezervasiyaya və bir dəfə yaza bilər → 409 (bazada `bookingId @unique`).
11. E-poçt unikaldır və kiçik hərflə saxlanılır → 409 (bazada `@unique`).
12. Otel və otaq silinmir, `isActive=false` edilir (bazada `onDelete: Restrict`).

Əlavə hissənin qaydaları:

13. Ödəniş yalnız PENDING rezervasiya üçün və yalnız onun sahibi tərəfindən edilə bilər. Artıq ödənilmiş rezervasiyanı təkrar ödəmək → 409.
14. Vaxtı keçmiş (`expiresAt`) ödənilməmiş PENDING rezervasiya avtomatik CANCELLED olur və otaq yenidən boş sayılır.
15. Ödəniş webhook-unun imzası yoxlanılır, imza səhvdirsə → 400. Eyni hadisə iki dəfə gəlsə, yalnız bir dəfə işlənir.
16. QR koddakı kodu yalnız o otelin meneceri yoxlaya bilər, başqa otelin kodu → 404. Artıq istifadə olunmuş kod → 409.

---

## 7. Riskli yerlər

- **İkiqat rezervasiya.** İki nəfər eyni anda eyni otağı rezerv edə bilər. Yalnız transaction kifayət etmir, ona görə otaq sətrinə kilid qoyuram və paralel sorğu ilə test edirəm (biri 201, biri 409 almalıdır).
- **Başqasının məlumatına çıxış.** Sahiblik şərtini həmişə `where`-də yazıram, tapılmasa 404 qaytarıram. İki menecer və iki istifadəçi ilə test edirəm.
- **Fayl yükləmə.** Yalnız şəkil qəbul edirəm, ölçü limiti qoyuram, fayla təsadüfi ad verirəm.
- **Pul və tarix.** Qiymət Decimal ilə saxlanılır, tarixlər saatsız (date), qiyməti server hesablayır.
- **Giriş təhlükəsizliyi.** Rate limit qoyuram, `JWT_SECRET` yalnız `.env`-dədir, giriş xətası həmişə eyni mesajdır.
- **Ödəniş (əlavə).** Webhook-u kənardan hər kəs çağıra bilər, ona görə imzanı yoxlayıram. Eyni hadisə iki dəfə gələ bilər, ona görə təkrar işləməyin qarşısını alıram.
- **QR kod və e-poçt (əlavə).** `bookingCode` təsadüfi və təxmin edilməz olur, QR-ın içində şəxsi məlumat olmur. E-poçt göndərmək üçün parol (Gmail App Password) yalnız `.env`-də saxlanılır.

---

## 8. Nə vaxt nə edəcəm?

| Mərhələ | Nə hazır olacaq | Tarix |
|---|---|---|
| 1 | Repo, Prisma schema, migration, auth (qeydiyyat, giriş, `/me`, rol yoxlaması) | 25 noyabr |
| 2 | Əsas CRUD (otel, otaq, menecer yaratma) + Zod + error handling + pagination və filter | 26 noyabr – 2 dekabr |
| 3 | Biznes qaydaları (rezervasiya, ləğv, status, rəy) + şəkil yükləmə + testlər | 3 – 9 dekabr |
| 4 | OpenAPI (Swagger), Docker, deploy, README | 10 – 14 dekabr |
| Ehtiyat | Düzəlişlər və təhvil | 15 – 16 dekabr |
| Əlavələr | Əvvəl ödəniş, sonra QR kod və e-poçt, sonra frontend | Əsas hissə bitəndən sonra |

---

## 9. AI-a review etdir (Claude)

```
Review my backend capstone plan below. I am a junior developer with about
3 weeks of part-time work. Stack: Node.js, Express 5, TypeScript,
PostgreSQL, Prisma 7, Zod, JWT, Vitest.

Check:
1. Is the scope realistic for the time I have? What should I cut?
2. Are the models and relations correct? Any missing relation or onDelete problem?
3. Are any important endpoints missing?
4. Security: auth, roles, ownership checks (who can edit/delete what)?
5. Which business rules need a database constraint, not only code?

Answer as a short list of concrete problems. Do not rewrite the whole plan.

[PLAN]
```

AI-ın tapdıqları (Claude):

1. Həcm 3 həftə üçün böyükdür. Frontend, ödəniş və QR kimi əlavələri çıxarmaq lazımdır.
2. Transaction tək başına ikiqat rezervasiyanın qarşısını almır. Kilid və ya Serializable izolyasiya lazımdır və paralel testlə yoxlanmalıdır.
3. `expiresAt` və PENDING statusunun mənası ödəniş axını olmadan aydın deyil. Ödəniş əlavə olunana qədər statusu kimin CONFIRMED etdiyi müəyyən olunmalıdır.
4. Menecer üçün sahiblik yoxlaması hər sorğuda `where` şərtində olmalıdır. `managedHotelId` yalnız MANAGER rolunda dolu olmalıdır.
5. Bazada CHECK constraint yoxdur (`checkOut > checkIn`, `rating` 1–5 arası, `pricePerNight > 0`). Prisma bunu sxemdə dəstəkləmir, migrasiyaya raw SQL ilə əlavə etmək olar.

Hansı ilə razı deyiləm və niyə:

Birinci tövsiyə ilə qismən razı deyiləm. Frontend, onlayn ödəniş və QR kod funksionallığının layihənin həcmini artırdığını qəbul edirəm. Lakin bu funksiyaları tamamilə çıxarmaq istəmirəm, çünki HotelBook layihəsini real otel rezervasiya sisteminə daha yaxın və portfoliom üçün daha funksional etmək istəyirəm.

İlk növbədə əsas backend funksiyalarını, biznes qaydalarını, təhlükəsizlik yoxlamalarını və testləri tamamlayacağam. Daha sonra vaxtım imkan verərsə, ardıcıllıqla onlayn ödəniş, QR kodlu e-poçt göndərilməsi və frontend hissəsini hazırlayacağam. Bu əlavələr əsas layihənin vaxtında təhvil verilməsinə mane olmayacaq.

Digər dörd tövsiyə ilə razıyam. İkiqat rezervasiyanın qarşısının alınması, rezervasiya statuslarının düzgün idarə edilməsi, menecerlərin sahiblik yoxlamaları və database səviyyəsində məhdudiyyətlərin tətbiqi sistemin təhlükəsizliyi, etibarlılığı və məlumatların bütövlüyü üçün vacibdir.
---

## 10. CLAUDE.md

- [ ] CLAUDE.md yazıldı və yoxlandı
- [ ] Biznes qaydaları planla eynidir