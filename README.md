# Magic Sanguo MVP Prototype

This repo should start as a TypeScript headless combat simulator for a Bazaar-like ARPG-inspired roguelike formation card-builder.

Read first:

```text
docs/MVP_MASTER_DESIGN.md
```

Then follow:

```text
docs/MVP_BUILD_SEQUENCE.md
```

Current phase:

```text
Phase 1 — TypeScript project skeleton.
Next: Phase 2 — Core data model and validation.
```

Important MVP simplification:

```text
No Barrier / Ward / Energy Shield in MVP.
Use HP + Armor only.
```

## Local Setup

Install dependencies:

```sh
pnpm install
```

Run tests:

```sh
pnpm test
```

Run the TypeScript compiler without emitting files:

```sh
pnpm typecheck
```

Build the project:

```sh
pnpm build
```
