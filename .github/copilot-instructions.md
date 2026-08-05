# MedLink code-review instructions

MedLink is an academic, offline-first telemedicine demonstration. Review changes as if
they could affect sensitive health information, but do not claim production, clinical,
payment, ABDM, FHIR, or regulatory compliance unless the implementation proves it.

## Review priorities

1. Treat patient information, consultation notes, prescriptions, recordings, payment
   data, authentication tokens, and device identifiers as sensitive. Flag exposure in
   logs, errors, fixtures, source control, URLs, or client-side storage.
2. Protect role boundaries. A patient may access only their own data; a doctor only
   their authorised clinical work; a coordinator must not receive clinical content by
   default. Flag missing authentication, authorisation, and ownership checks.
3. For API changes, require input validation, safe error handling, rate limiting where
   appropriate, and parameterised database access. Flag hard-coded secrets and insecure
   environment-variable handling.
4. For offline and synchronisation changes, check idempotency, conflict handling,
   retry safety, local encryption assumptions, and safe behaviour after network loss.
5. For WebRTC, recording, AI matching, and payments, ensure explicit consent and a
   clear demo-only boundary. AI may recommend a specialty or doctor but must not diagnose.

## Feedback style

- Report confirmed defects and security/privacy risks first, with the affected file and
  a concise reason.
- Label non-blocking improvements as `Suggestion`.
- Do not invent requirements or request large unrelated rewrites.
- Check that a meaningful change includes validation evidence, tests when practical, and
  documentation updates when it changes architecture, data handling, or scope.
