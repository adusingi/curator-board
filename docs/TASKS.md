# TASKS.md — Resources Self-Hosted Product
*Active development tracker*
*Last updated: 2026-06-03*
*Current sprint: self-hosted productization*

---

## 🧹 Cleanup and Documentation — 2026-06-03
**Branch:** `codex/to-prd-skill-and-doc-cleanup`

### Completed
- [x] Remove throwaway UI prototype routes and components
- [x] Remove demo seed script and package script
- [x] Extract shared board API key helper for current machine-auth routes
- [x] Refresh `docs/PRD.md` to the self-hosted product direction
- [x] Refresh `docs/PLANNING.md` to the self-hosted product direction
- [x] Refresh `docs/TASKS.md` to the self-hosted product direction
- [x] Create `docs/SELF_HOSTED_V1_PRD.md` as discussion capture
- [x] Create `docs/SELF_HOSTED_V1_ISSUES.md` as issue-ready breakdown

### Follow-up
- [ ] Decide whether `SELF_HOSTED_V1_PRD.md` and `SELF_HOSTED_V1_ISSUES.md` should remain as working notes or be merged fully into the canonical docs set
- [ ] Refresh `README.md` so it no longer describes the app as a personal one-owner tool

---

## 🔐 Phase 1 — Admin Auth Productization

### Auth foundation
- [ ] **RES-PROD-1** Add `ADMIN_PASSWORD` configuration
- [ ] **RES-PROD-2** Add admin login flow with session cookie
- [ ] **RES-PROD-3** Protect admin pages and admin mutations with session auth
- [ ] **RES-PROD-4** Remove browser-side use of `BOARD_API_SECRET` from admin

### Admin capabilities
- [ ] **RES-PROD-5** Keep resource edit/delete working behind admin session auth
- [ ] **RES-PROD-6** Add category create UI and persistence
- [ ] **RES-PROD-7** Add category edit UI and persistence

---

## 🧠 Phase 2 — Ingestion Platform

### No-key fallback
- [ ] **RES-PROD-8** Allow ingestion with no AI provider configured
- [ ] **RES-PROD-9** Assign `other` when no provider is available

### Provider abstraction
- [ ] **RES-PROD-10** Introduce provider-agnostic categorization interface
- [ ] **RES-PROD-11** Add config-driven provider selection
- [ ] **RES-PROD-12** Preserve current successful categorization path during the transition

### Optional enrichment
- [ ] **RES-PROD-13** Keep default metadata extraction working without enrichment keys
- [ ] **RES-PROD-14** Preserve optional rich social/video enrichment path
- [ ] **RES-PROD-15** Ensure enrichment failure never blocks ingestion

---

## 🤖 Phase 3 — Telegram Bot Rewrite

- [ ] **RES-PROD-16** Replace the Python Telegram bot with a TypeScript/Node.js bot
- [ ] **RES-PROD-17** Keep current Telegram link-capture workflow behaviorally equivalent
- [ ] **RES-PROD-18** Align bot config and deployment with the new Node-first product story
- [ ] **RES-PROD-19** Retire the Python bot from the main product path

---

## 📦 Phase 4 — Packaging and Delivery

### Documentation and deployment
- [ ] **RES-PROD-20** Write Vercel-friendly web deployment guide
- [ ] **RES-PROD-21** Write separate bot deployment guide
- [ ] **RES-PROD-22** Verify and document the Docker full-stack deployment path
- [ ] **RES-PROD-23** Update env examples to distinguish required vs optional secrets

### Commercial packaging
- [ ] **RES-PROD-24** Define the one-time-purchase delivery package
- [ ] **RES-PROD-25** Create manual delivery checklist
- [ ] **RES-PROD-26** Prepare buyer-facing install materials

---

## 🌱 Later Expansion

- [ ] **RES-LATER-1** WhatsApp ingestion evaluation
- [ ] **RES-LATER-2** Hosted non-technical offer evaluation
- [ ] **RES-LATER-3** Multi-user admin accounts
- [ ] **RES-LATER-4** Automated post-payment delivery
