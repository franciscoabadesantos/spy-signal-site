# Acceptance Criteria: <Feature>

## Scope

- User outcome:
- Included routes/components:
- Non-goals and protected behavior:

## Functional

- [ ] Primary workflow succeeds with confirmed contract data.
- [ ] Loading, empty, error, timeout, unauthorized, malformed/partial, and retry states are handled where applicable.
- [ ] No API, field, auth behavior, or fallback source is invented.

## Visual and responsive

- [ ] Matches existing tokens, components, density, and page language.
- [ ] Passes relevant sizes in `viewport-matrix.md`, including intermediate mode changes.
- [ ] No overflow, clipping, overlap, unreadable text, broken canvas/media framing, or unintended layout shift.

## Interaction and accessibility

- [ ] Semantic structure, accessible names, heading order, keyboard operation, visible focus, and focus restoration pass.
- [ ] Touch and non-hover paths pass; status is not communicated by color alone.
- [ ] Reduced motion preserves all information and actions.
- [ ] Scroll behavior passes `scroll-qa.md` when relevant.

## Performance and evidence

- [ ] No avoidable client boundary, dependency, listener/RAF leak, or expensive layout loop was introduced.
- [ ] Browser console/page errors reviewed; screenshots/trace paths recorded.
- [ ] `npm run verify` and the applicable `npm run qa:browser` or `npm run qa:frontend` result are recorded exactly.
- [ ] Remaining risks, skipped checks, and owner/next step are explicit.
