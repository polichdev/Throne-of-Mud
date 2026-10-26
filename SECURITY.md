# Security Policy

## Supported Versions

Security fixes and critical patches are prioritized for the latest active release branch.

| Version | Supported | Status |
| :------ | :-------- | :----- |
| `0.9.x` | Yes       | Current Active Development |
| `0.8.x` | Yes       | Maintenance / Critical patches |
| `< 0.8` | No        | End of Life |

---

## Threat Model & Attack Surface

**Throne of Mud** is an authentic 3D simulation game running client-side in the browser via WebGL and as a desktop application through Electron. The primary security boundaries and threat considerations are:

1. **Local State & Save File Deserialization**:
   - Game saves are stored in browser **IndexedDB** (`throne-of-mud-saves`) and serialized snapshots.
   - Deserialization processes must sanitize entity state, numerical attributes (preventing integer overflow, NaN propagation, or prototype pollution), and strings (ruler/realm names, custom letters).
   - Untrusted save files imported via JSON/binary must be validated against the schema defined in [`docs/SAVE_FORMAT.md`](docs/SAVE_FORMAT.md) before hydration into the Miniplex ECS world.

2. **Electron IPC & Node.js Integration**:
   - The desktop wrapper adheres strictly to Electron security best practices:
     - `contextIsolation: true`
     - `nodeIntegration: false`
     - `sandbox: true`
   - IPC channels between the renderer and main process are strictly typed and reject arbitrary code execution or unvalidated filesystem paths.

3. **Client-Side Rendering (WebGL / Shaders)**:
   - Custom GLSL vertex and fragment shaders are compiled at startup. Shader uniforms are clamped to valid mathematical bounds to prevent GPU crashes, infinite loops, or driver reset vulnerabilities.

---

## Reporting a Vulnerability

We appreciate responsible disclosure of security issues.

If you discover a security vulnerability:
1. **Do not open a public GitHub issue.**
2. Send an email to the security contact at `security@polich.dev` (or message the lead maintainer privately on GitHub).
3. Include:
   - A detailed description of the vulnerability and potential impact.
   - Exact reproduction steps, proof-of-concept scripts, or corrupted save payload.
   - Affected client environment (Browser + WebGL driver, or Electron desktop build).

### Response Timeline
- **Initial Acknowledgment:** Within 48 hours.
- **Triage & Reproduction:** Within 5 business days.
- **Patch Release:** Coordinated security advisory and release within 14 business days of confirmation.
