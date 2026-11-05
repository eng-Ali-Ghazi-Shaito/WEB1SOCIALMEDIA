@AGENTS.md

# Claude Code workflow

- Always plan first: files to touch, which endpoint or event, which docs pages you checked,
  and the edge cases. Wait for my OK before writing code.
- Build order per feature: Prisma model → migration → Zod schema → types → repository → service →
  controller → middleware → route → test.
- Before saying a task is done, run `npx tsc --noEmit` and `npm test`, and check the work against
  the architecture and SOLID rules in AGENTS.md.
- Conventional Commits: `feat(auth): email verification (#2)`. Never commit `.env` or `src/generated/`.
- When you use a concept for the first time, explain it in 2–3 lines. I must be able to defend
  every line to my professor.