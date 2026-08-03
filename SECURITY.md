# Security Policy

## Scope

MedLink is an educational prototype. It must use synthetic data only and must not be used to process real patient information, real payments or live clinical recordings.

Security-sensitive areas include authentication, role/consent enforcement, offline storage, synchronisation, object storage, real-time signalling, WebRTC/TURN configuration, attachments and audit logging.

## Reporting a vulnerability

Do not disclose security vulnerabilities, credentials, personal data or exploit details in a public issue.

Use GitHub's private security-advisory reporting for this repository when available. If private reporting is unavailable, open a minimal issue labelled `security` that contains no exploit details or sensitive information and request a private contact channel.

Include:

- affected component and version/commit;
- impact and preconditions;
- safe reproduction steps;
- suggested mitigation, if known.

## Response principles

- Confirm and triage reports before public discussion.
- Revoke exposed credentials immediately; credentials must never be committed.
- Fix access-control and data-exposure issues before feature work.
- Document security-relevant changes in the pull request and release history.
- Never test vulnerabilities against real users, third-party systems or real health data.

## Supported state

Only the latest `main` branch is supported while the project is under active academic development.
