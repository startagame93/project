# Project memory

## Product intent & audience

- Nutriplan is an Italian Progressive Web App for managing multi-week diets, meals, advanced nutrition, supplements, micronutrients, health metrics, barcode input, and dynamic shopping lists.
- Core users need reliable meal quantities, macro/micro totals, historical diet data, and usable operation on mobile devices, including iOS standalone PWA.
- Admins need secure tools for reviewing missing foods, approving global food data, monitoring security events, and exporting aggregated missing-food reports across all users.

## Brand personality & voice

- User-facing copy should be clear, concise, and functional Italian, especially around nutrition, privacy, offline state, scanner errors, and update notices.
- Admin tools should use direct operational language and clearly communicate scope, permissions, and destructive actions.
- Error and fallback messages must be honest: never imply nutrition data was found or calculated when it was unavailable.
- Any changelog or release-notice content should be brief, useful, and understandable without technical knowledge.

## Visual design & UX direction

- Preserve a polished, production-ready experience rather than generic dashboard patterns.
- Food-entry flows should minimize repeated work, preserve useful search context, and make meal assignment explicit.
- Quantity fields must replace the current value on focus, support valid gram- or piece-based quantities where applicable, and reject ambiguous or invalid input before saving.
- Nutrition totals—including calories, macros, vitamins, minerals, and electrolytes—must update immediately and consistently after additions, edits, and removals.
- Scanner UX should validate the barcode before lookup, provide a clear confirmation/fallback state, and work with native capture behavior on iOS standalone PWAs.
- Offline state, pending synchronization, conflicts, and stale-data risk should be visible without interrupting normal use.
- A post-update changelog popup should be dismissible and remain accessible through a persistent top-level “novità” control.
- Custom themes and the optional retro arcade aesthetic should remain visual-only; audio must be optional, muted by default where appropriate, and remember user volume/mute preferences locally.
- Maintain accessible contrast, touch targets, focus behavior, and responsive layouts across mobile and desktop.

## Decisions, constraints & rationale

- Security is now the first priority: protect admin-role changes, enforce RLS for personal data, secure server-side secrets, rate-limit sensitive operations, and retain audit visibility for anomalous access.
- A Gemini key architecture is unresolved: the current app asks users for their own key, while the proposed plan assumes a protected server-side key. Do not implement either model without an explicit decision.
- Admin-only global exports and approvals must be authorized server-side/database-side by the admin role, not merely hidden or filtered in the frontend.
- Missing foods should retain a stable `missingFoodId`, original name/variants, and a pending state without invented nutrition values. Global approval should support efficient retroactive linking of historical entries.
- Micronutrient calculations depend on the actual availability and quality of vitamin/mineral data in the food source; do not assume complete profiles for every food.
- Keep the existing project’s lightweight dependency approach. Additional validation or sanitization libraries require justification; use robust native/application validation where sufficient.
- Offline synchronization requires durable local storage, idempotent writes, and explicit conflict handling so reconnection cannot duplicate meals or reset totals.
- The confirmed grams-field replacement fix and horizontal-swipe guard already exist and should be verified, not redundantly reimplemented.
- The ticket/report system and “Copia Segnalazioni per Bolt” workflow should not be removed until the requested deletion scope is explicitly confirmed; preserve existing permissions and clipboard behavior meanwhile.
- Historical ticket context includes statuses `open`, `in_progress`, and `closed`, mapped respectively to `Aperta`, `In lavorazione`, and `Risolta`.

## Open questions & assumptions

- Does “togliamo del tutto” mean removing only the Bolt-copy action, removing ticket reports entirely, or removing both admin and user ticket views?
- Should Gemini use a project-owned server-side key with rate limits, or should each user continue supplying their own key?
- Which food database fields provide reliable micronutrient, vitamin, mineral, and electrolyte values, and what is the fallback when they are absent?
- What exact data must be included in the global missing-food export, and how should variants be deduplicated while preserving original user wording?
- Define the approval workflow and migration strategy for linking approved global foods to past diary entries through `missingFoodId`.
- Specify the release/version source for changelog notices and whether users can permanently dismiss a version’s notice.
- Define offline conflict precedence, retry behavior, authentication expiry handling, and idempotency keys.
- Confirm account deletion requirements, retention of audit logs, privacy wording for health data, and cascade-delete boundaries.
- Confirm whether the retro theme, custom theme editor, and audio are immediate scope or later independent workstreams.
- Verify all proposed security and data changes in a real Supabase environment, including RLS isolation and attempted role escalation.