# Project memory

## Product intent & audience

- Nutriplan PWA includes an admin dashboard for managing user-reported bugs.
- The bug workflow is intended to help the development team transfer user reports into actionable prompts for Bolt.
- Bug-report management is restricted to authenticated administrators.

## Brand personality & voice

- User-facing labels and confirmations are in Italian.
- Keep admin messaging direct and functional, including:
  - “Gestione bug”
  - “Copia Segnalazioni per Bolt”
  - “Copiato negli appunti!”
- Generated bug text should remain focused on report descriptions, without reporter names, dates, or unrelated metadata.

## Visual design & UX direction

- Add the bug-management UI as a visible section within the existing Admin Dashboard rather than as a separate workflow.
- Reuse existing project patterns for clipboard actions and on-screen alerts/toasts; the copy behavior was previously present in the unknown-foods section.
- The copy action should provide immediate success feedback and an error/empty-state alert when reports cannot be read or none exist.
- Clipboard output is a single development instruction containing numbered bug descriptions in database order, oldest to newest:
  - “Agisci come sviluppatore Full-Stack Senior...”
  - numbered report descriptions
  - no additional report metadata
- Prefer shared utilities for copy-to-clipboard behavior to avoid duplicating existing logic.

## Decisions, constraints & rationale

- Bug reports are read from the existing tickets table.
- The report description is stored in the `message` field; only this field is included in copied output.
- The admin dashboard implementation includes the “Copia Segnalazioni per Bolt” button and confirmation/error feedback.
- The final instruction’s “show an alert” requirement was interpreted as application behavior, not text to include in the clipboard payload.
- The project build completed successfully after the change.
- The feature should preserve the existing admin access boundary and database permissions.

## Open questions & assumptions

- The clipboard action has not yet been manually verified in the running application with an admin account.
- Confirm behavior in a real browser for clipboard permissions, empty ticket lists, database-read failures, and multiple reports.
- Verify that the existing tickets query excludes non-bug ticket types if the table contains other categories; the current context only confirms that bug reports use the tickets table.