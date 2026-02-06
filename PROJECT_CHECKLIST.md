# Launch Checklist

- [ ] Confirm Vercel env vars are set
- [ ] Run `pnpm prisma migrate deploy`
- [ ] Validate Cron secrets and schedules
- [ ] Verify Blob uploads for avatars/attachments
- [ ] Test SSE + polling fallback in production
- [ ] Rotate `OPENCLAW_TOKEN_SEED`
- [ ] Enable database backups
- [ ] Enable error monitoring
