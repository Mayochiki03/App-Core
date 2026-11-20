# 05 — เทียบกับ Spring Boot (สำหรับคนที่คุ้นกับ Java)

โครงสร้างหลังบ้านของตัวกลางนี้ตั้งใจให้ใกล้ Spring Boot ที่สุดเท่าที่ทำได้โดยไม่ใช้ของที่ซ่อนการทำงาน

| Spring Boot | ในโปรเจกต์นี้ | อยู่ที่ไหน |
|---|---|---|
| `@RestController` | Controller (Express router) | `examples/controller/vendor/vendor_controller.ts` |
| `@Service` | Service | `service/vendor/vendor_service.ts` |
| `JpaRepository` / DAO | Repository (knex query builder) | `repository/vendor/vendor_repository.ts` |
| `@Entity` | Entity (type) | `entity/vendor/vendor_entity.ts` |
| DTO + `@Valid` | Dto (zod) | `dto/vendor/vendor_dto.ts` |
| `@Autowired` / constructor injection | ต่อสายด้วยมือใน `pages/<หน้า>.ts` (`new Controller(new Service(new Repository()))`) | `examples/pages/vendor.ts` |
| `@ControllerAdvice` | ตัวจัดการ error กลาง | `backend/src/app.ts` |
| Flyway / Liquibase | Migration (knex) | `migration/vendor_migration.ts` |
| `application.yml` | `.env` | ที่โฟลเดอร์นอกสุด |
| `pom.xml` | `package.json` | |
| Spring Security | `core/auth.ts` (JWT ใน cookie) + `roles` ของหน้า | |
| `@EnableJpaAuditing` | `core/audit.ts` (บันทึกอัตโนมัติ) | |

## กฎของชั้น (เหมือน Spring)

```
Controller  →  Service  →  Repository  →  ฐานข้อมูล
 (request)     (Business Logic)  (query)
```

- Controller เรียกได้แค่ Service · Service เรียกได้แค่ Repository · **ห้ามข้ามชั้น**
- Controller ไม่มี Business Logic (แค่ตรวจ DTO → เรียก Service → ห่อผล) · Repository ไม่มี Business Logic (แค่ query) · Business Logic อยู่ที่ Service ที่เดียว

## โครงโฟลเดอร์หลังบ้าน (แยกตามชั้นก่อน แล้วแยกตามชื่อหน้า — เหมือน Spring Boot ดั้งเดิม)

```
backend/src/
  entity/
    log/log_entity.ts
    user/user_entity.ts
  dto/
    log/log_dto.ts
    user/user_dto.ts
  controller/
    log/log_controller.ts
    user/user_controller.ts
  service/
    log/log_service.ts
    user/user_service.ts
  repository/
    log/log_repository.ts
    user/user_repository.ts
  migration/user_migration.ts
  pages/
    log.ts  user.ts          ประกอบ Repository -> Service -> Controller + ลงทะเบียนหน้า
    index.ts                 รายชื่อหน้าทั้งหมด
```

ไฟล์ชื่อ `<หน้า>_<layer>.ts` · ชื่อ class ในไฟล์ยังเป็น PascalCase (`LogController`) · หน้าที่ไม่ใช้บางชั้น (เช่น `connection` ไม่มีฐานข้อมูล) ไม่ต้องสร้างไฟล์ของชั้นนั้น

## ต่างจาก Java ตรงไหน (ที่ควรรู้)

- ไม่มี decorator / annotation — ทุกอย่างเรียกกันตรง ๆ ค้นด้วยชื่อเจอเสมอ
- type ของ TypeScript หายไปตอนรัน (ไม่ใช่ class จริง) — ข้อมูลที่รับจากหน้าจอจึงต้องตรวจด้วย zod (Dto) ทุกครั้ง ไม่เชื่อ type อย่างเดียว
- `async` / `await` แทน thread — ฟังก์ชันที่คุยกับฐานข้อมูลต้องมี `await` เสมอ ลืม = ได้ Promise แทนข้อมูล
