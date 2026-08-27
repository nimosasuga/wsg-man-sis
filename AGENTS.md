# Washeng GO Agent Rules

<!-- WASHENG_OPENCODE_AUTO_SKILL_ROUTER -->
## OpenCode Automatic Skill Routing

Untuk setiap task di repository Washeng GO:
- Jangan meminta user memilih frontend/backend/database/VPS jika agent dapat mengklasifikasikannya.
- Muat skill washeng-context terlebih dahulu.
- Muat washeng-laravel-inertia untuk Laravel/Inertia/React/UI/RBAC/CRUD.
- Muat washeng-database-appsheet untuk MySQL/AppSheet/schema/query/import/export/data.
- Muat washeng-vps-guardian untuk VPS/Docker/Caddy/TLS/deploy/production.
- Muat washeng-safe-coding sebelum task yang akan mengubah source, konfigurasi, database, atau production.
- Setelah task yang disetujui selesai dan terverifikasi, muat washeng-memory.
- Responsif UI adalah aturan mutlak: setiap tampilan wajib aman di HP, tablet, desktop, dan layar lebar; saat menu aktif tidak boleh ada elemen out of size, overflow horizontal tidak terkendali, teks terpotong, atau layout rusak. Wajib verifikasi breakpoint setelah perubahan UI.
- Satu task boleh memakai beberapa skill.

- Gunakan lazy loading; jangan membaca seluruh vault tanpa kebutuhan.
- Baca docs_washeng_go/README_HANDOFF.md dan docs_washeng_go/07_Workflow_Golden_Rules/06_WORKFLOW_GOLDEN_RULES.md.
- User cukup menyampaikan kebutuhan dengan bahasa biasa; pemilihan skill adalah tanggung jawab agent.
<!-- /WASHENG_OPENCODE_AUTO_SKILL_ROUTER -->
