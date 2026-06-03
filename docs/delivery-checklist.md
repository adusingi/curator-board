# Manual Delivery Checklist

*Run this checklist for every paid delivery.*

## Pre-delivery

- [ ] Payment confirmed in Stripe (or payment processor)
- [ ] Buyer email address recorded
- [ ] Delivery version decided — confirm the correct git tag exists (`git tag -l`)
- [ ] ZIP archive generated from the tag:
  ```bash
  git archive <tag> --format=zip -o curator-board-<tag>.zip
  ```
- [ ] ZIP opened and spot-checked: `LICENSE`, `README.md`, `docs/install-guide.md` all present
- [ ] No seller secrets in the archive (spot-check `.env.example` files)

## Delivery

- [ ] Compose delivery email using the template in this file
- [ ] Attach the ZIP or include the download link
- [ ] Send from the seller contact address (see RES-PROD-29 for final address)
- [ ] BCC or copy to a seller-controlled inbox for the record

## Post-delivery

- [ ] Log the delivery: buyer name, email, date, version tag, delivery method
- [ ] Mark the Stripe payment as fulfilled / add a note
- [ ] File the buyer email in a delivery archive folder

---

## Delivery email template

> **Subject:** Your Curator Board purchase — delivery
>
> Hi [Buyer name],
>
> Thank you for your purchase. Attached is Curator Board [version tag].
>
> To get started, open `docs/install-guide.md` inside the archive. It walks you through deploying the board and the Telegram bot step by step.
>
> If you run into any issues, reply to this email or reach us at aimabled@gmail.com.
>
> [Seller name]

Replace `[Buyer name]`, `[version tag]`, and `[Seller name]` before sending.

---

## Buyer log (append one row per delivery)

| Date | Buyer | Email | Version | Method |
|---|---|---|---|---|
| | | | | |
