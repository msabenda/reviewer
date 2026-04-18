/**
 * API-first learning paths: reusable PR review checklists (static curriculum layer).
 * Challenge linkage is thematic; filter the challenge list by track `api` + OWASP tags in-app.
 */
export const API_SECURITY_TRACKS = [
  {
    id: "authn-authz",
    title: "AuthN / AuthZ & BOLA",
    summary: "Sessions, JWTs, object ownership, and admin vs user routes.",
    checklist: [
      "Every resource ID in the path or body is authorized for the caller (not only authenticated).",
      "List/search endpoints cannot leak other tenants’ rows via missing filters.",
      "Admin or elevated operations are behind explicit roles and separate handlers.",
      "Token lifetimes, rotation, and revocation match your threat model.",
    ],
  },
  {
    id: "idor-mass-assignment",
    title: "IDOR & mass assignment",
    summary: "ORM create/update boundaries and predictable identifiers.",
    checklist: [
      "DTOs or allowlists define writable fields; ignore unknown JSON keys.",
      "Update endpoints never trust client-supplied primary keys or ownership fields.",
      "Serialization layers do not expose internal IDs when public opaque tokens are required.",
    ],
  },
  {
    id: "injection-deser",
    title: "Injection & unsafe deserialization",
    summary: "SQL/NoSQL/OS command paths and pickle/XML/YAML gadgets.",
    checklist: [
      "Parameterized queries or bound APIs for all dynamic SQL fragments.",
      "No user-controlled input in shell, template, or expression evaluators.",
      "Deserialization uses safe formats and schema validation; never raw `pickle` from clients.",
    ],
  },
  {
    id: "ssrf-egress",
    title: "SSRF & third-party fetch",
    summary: "Preview bots, webhooks, import-from-URL, and server-side HTTP clients.",
    checklist: [
      "URL allowlists or host blocklists for private/link-local/metadata ranges.",
      "Egress via dedicated proxies with logging; no ambient credentials on fetchers.",
      "Timeouts, size limits, and content-type checks on all outbound calls.",
    ],
  },
  {
    id: "rate-limits-abuse",
    title: "Rate limits & abuse",
    summary: "Credential stuffing, scraping, and expensive endpoints.",
    checklist: [
      "Auth, password reset, and OTP endpoints are strictly rate-limited per IP + identity.",
      "Expensive read/write endpoints have quotas or bot detection where appropriate.",
      "429 responses include stable error codes for clients; avoid user enumeration leaks.",
    ],
  },
  {
    id: "webhooks-hmac",
    title: "Webhooks & HMAC verification",
    summary: "Inbound callbacks and replay resistance.",
    checklist: [
      "Signature covers method, path, body, and timestamp; constant-time compare.",
      "Clock skew and replay windows enforced; idempotency keys for side effects.",
      "Raw body preserved for signature validation (before JSON parsing side effects).",
    ],
  },
  {
    id: "graphql-async",
    title: "GraphQL, async jobs & replay",
    summary: "Depth/complexity, authz per field, queues, and idempotent workers.",
    checklist: [
      "Query cost limits, pagination caps, and field-level authorization.",
      "Background jobs validate tenant + idempotency before mutating state.",
      "Retries cannot double-charge or duplicate external side effects.",
    ],
  },
];
