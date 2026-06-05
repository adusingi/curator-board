# TASKS.md — Curator Board
*Active development tracker*
*Last updated: 2026-06-05*
*Current sprint: open-source cleanup and ingestion hardening*

---

## 🌍 Open-Source Cleanup — 2026-06-05

### Completed
- [x] Reposition the repo docs from commercial product language to open-source project language
- [x] Remove commercial delivery and release-packaging documents
- [x] Remove internal handoff and release-finalization notes that should not live in the public repo
- [x] Remove the repo-private deploy workflow
- [x] Add lightweight contributor guidance
- [x] Add maintainer support/donation mention in the README
- [x] Remove unused default static assets
- [x] Restyle the public board to a simpler editorial layout while keeping built-in themes

### Follow-up
- [ ] Add a real Buy Me a Coffee or sponsorship link once the maintainer chooses the public support URL
- [ ] Decide whether to add a public issue template and discussion guidelines

---

## 🔐 Ingestion and Auth

- [x] Admin login uses `ADMIN_PASSWORD`
- [x] Admin pages and admin mutations are protected by session auth
- [x] Browser-side use of `BOARD_API_SECRET` for admin flows is removed
- [x] Category create/edit works behind admin session auth
- [x] Ingestion works with no AI provider configured
- [x] No-provider fallback assigns category `other`
- [x] Provider-agnostic categorization interface exists

### Remaining
- [ ] Keep default metadata extraction working without enrichment keys
- [ ] Preserve optional rich social/video enrichment path
- [ ] Ensure enrichment failure never blocks ingestion

---

## 🤖 Runtime

- [x] TypeScript/Node Telegram bot is the primary ingestion runtime
- [x] Telegram link-capture workflow remains behaviorally equivalent
- [x] Bot config and deployment align with the current Node-first stack

---

## 📦 Deployment and Docs

- [x] Docker full-stack deployment path is documented
- [x] Separate bot deployment guide exists
- [x] Env examples distinguish required vs optional secrets

### Remaining
- [ ] Refresh deployment docs again after the next live verification pass
- [ ] Add contributor-oriented verification notes for common local checks

---

## 🌱 Later

- [ ] WhatsApp ingestion evaluation
- [ ] Multi-user admin accounts
- [ ] Hosted version evaluation
