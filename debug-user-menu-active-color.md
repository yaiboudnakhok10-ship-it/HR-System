# Debug Session: user-menu-active-color
- **Status**: [OPEN]
- **Issue**: เมนู sidebar ใน UserLayout ยังแสดงพื้นหลังและไอคอนสีแดงตอน active ทั้งที่ต้องการให้เป็นพื้นขาว ตัวอักษรสีดำ และไอคอนสีดำตามภาพอ้างอิง
- **Debug Server**: Pending startup
- **Log File**: .dbg/trae-debug-log-user-menu-active-color.ndjson

## Reproduction Steps
1. เปิดหน้าใน UserLayout
2. คลิกเมนูด้านซ้าย เช่น "ลงทะเบียนหลักสูตร & พนักงาน" หรือ "ฟอร์มสร้างใบเตือนB"
3. สังเกตสีพื้นหลัง ตัวอักษร และไอคอนของเมนู active

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | มี selector CSS ตัวอื่นทับ `.sidebar .nav-item.active` อยู่ | High | Low | Pending |
| B | สีแดงเกิดจาก element อื่น เช่น wrapper หรือ pseudo-element ไม่ใช่ `a.nav-item` ตรง ๆ | Medium | Medium | Pending |
| C | class `active` ถูกต้อง แต่ icon/text ถูกย้อมแดงจากกฎ `.nav-item i` หรือ hover/parent state | High | Low | Pending |
| D | dev server หรือ browser cache ยังแสดง CSS เก่า | Medium | Low | Pending |

## Log Evidence
Pending

## Verification Conclusion
Pending
