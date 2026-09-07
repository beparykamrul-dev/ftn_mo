# FTN MO

Repository baseline verified through the connected GitHub repository.

## Runtime safety baseline

- Keep production credentials in environment/secret storage only.
- Do not commit API tokens, passwords, private keys, or certificates.
- Privileged operations must require authentication and explicit operator approval.
- Monitoring endpoints must report unavailable state when a live collector is not configured; synthetic production telemetry must not be used.
