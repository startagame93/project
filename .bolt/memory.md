# Project memory

## Product intent & audience

- Nutriplan PWA helps users search foods, assign them to meals, calculate nutrition, and manage food-related inputs such as barcode scanning, diet paste/import, images, quantities, and portions.
- The product includes an authenticated admin dashboard for reviewing user-reported bugs, filtering reports by workflow status, updating statuses, and copying reports into development prompts.
- Users can view the current status of their own reports in the ticket board.

## Brand personality & voice

- User-facing food and ticket workflows use clear, concise Italian labels.
- Ticket statuses are:
  - Aperta
  - In lavorazione
  - Risolta
- Admin copy remains direct and functional, including labels such as “Gestione bug” and “Copia Segnalazioni per Bolt”.
- Bug reports should be retained without reporter names, dates, or unnecessary metadata when prepared for development.

## Visual design & UX direction

- Food selection and diet-assignment flows should minimize repeated work: preserve search context where useful, make recently used foods easy to access, and make the transition from selected food to assigned meal explicit.
- Quantity inputs must support replacing the existing value cleanly and reject invalid or ambiguous values before confirmation.
- Nutrition totals and displayed quantities should update immediately when foods are added, removed, or edited.
- Horizontal gesture navigation should not trigger during vertical list scrolling; require predominantly horizontal movement and avoid hijacking gestures originating in horizontally scrollable regions.
- Image-associated controls should be visible, quick to reach, and clearly distinguish removal from replacement.
- Food portion UX should support both gram-based and piece-based quantities where the food permits it.
- Reuse the shared ticket-status presentation across admin and user views.

## Decisions, constraints & rationale

- The existing tickets table stores status as unconstrained text; no migration is required.
- Status mapping:
  - `open` → Aperta
  - `in_progress` → In lavorazione
  - `closed` → Risolta
- Admin status changes use existing admin permissions, and existing access boundaries/database permissions must remain intact.
- Ticket filters belong in the existing Admin Dashboard Ticket tab; the upper “Gestione bug” area remains focused on copying reports for Bolt.
- Existing clipboard feedback and report-copy behavior should be preserved.
- Confirmed fixes in the current implementation:
  - The “Aggiungi alla dieta” grams field selects/replaces its current value on focus, preventing values such as `100` becoming `1300` when entering `300`.
  - Horizontal swipe navigation now requires a predominantly horizontal gesture and ignores gestures beginning in horizontally scrollable list areas, reducing accidental activation during vertical scrolling.
- The project compiled successfully after the confirmed fixes.
- Remaining reported food-flow issues are not considered resolved: removal recalculation, error messaging, AI-dependent barcode/diet paste behavior, image removal, piece-based portions, recent searches, missing foods/brands, search scroll position, and final selection-to-diet assignment.

## Open questions & assumptions

- Verify the two confirmed interaction fixes in a running app on touch devices and across responsive layouts.
- Define expected behavior and fallback messaging when the AI key is absent for barcode scanning or diet paste.
- Confirm the intended source and data model for recent foods, pasta varieties/brands, and foods such as involtini carne, prosciutto e formaggio.
- Decide whether search should preserve scroll position, return to the previous result position, or keep the query/results context after selecting an item.
- Clarify the desired flow after selecting a food: immediate meal assignment, an explicit confirmation step, or retaining the selection for batch assignment.
- Confirm piece-based nutrition semantics for packaged foods versus individual units.
- Verify robust numeric parsing, removal recalculation, empty states, image removal, clipboard behavior, and unexpected ticket statuses in a real environment.
- Confirm that ticket queries include only intended bug reports if the table contains other ticket categories.