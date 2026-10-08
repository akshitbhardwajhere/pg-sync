# pg-sync

> PostgreSQL schema introspection that turns your database into useful code and documentation.

<p align="left">
  <a href="https://www.npmjs.com/package/@akshythere/pg-sync"><img src="https://img.shields.io/npm/v/@akshythere/pg-sync?color=cb3837&logo=npm" alt="npm version"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.0+"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-12%2B-336791?logo=postgresql&logoColor=white" alt="PostgreSQL 12+"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="MIT license"></a>
</p>

`pg-sync` connects directly to PostgreSQL, reads its catalog metadata, and generates artifacts from a normalized schema model. Use it as `pg-sync` or the shorter `pgs` command.

## Why pg-sync?

Keep generated types, framework schemas, and architecture documentation aligned with the database that actually runs your application.

- No ORM runtime dependency
- Direct queries against `pg_catalog` and `information_schema`
- Foreign keys and partitioned tables included in the schema model
- Prettier-formatted TypeScript output
- Interactive setup with a connection check

## Outputs

| Target       | Output                     | Best for                                            |
| ------------ | -------------------------- | --------------------------------------------------- |
| `typescript` | `schema.ts`                | Typed application code with zero runtime dependency |
| `frappe`     | One JSON DocType per table | Frappe custom DocTypes and field configuration      |
| `erd`        | `ERD.md` with Mermaid      | Schema reviews, technical docs, and onboarding      |

The generators understand nullable columns, defaults, arrays, primary keys, foreign keys, and common PostgreSQL types. Frappe output also maps relationships to `Link` fields and common numeric, date, and boolean types to suitable field types.

## How it works

```mermaid
flowchart LR
    A[(PostgreSQL)] --> B[Catalog introspection]
    B --> C[Normalized schema IR]
    C --> D[TypeScript]
    C --> E[Frappe DocTypes]
    C --> F[Mermaid ERD]
    D --> G[(Local files)]
    E --> G
    F --> G
```

## Install

### Use globally

```bash
npm install -g @akshythere/pg-sync
pgs --help
```

### Build from source

```bash
git clone https://github.com/akshitbhardwajhere/pg-sync.git
cd pg-sync
npm install
npm run build
npm link
```

## Quick start

### 1. Create a configuration

The wizard asks for your connection details, verifies the database connection, and writes `pg-sync.config.json`.

```bash
pgs init
```

Choose TypeScript interfaces, Frappe DocTypes, or Mermaid ERD documentation. The wizard defaults to `./src/types`, `./doctypes`, or `./docs` respectively.

Example configuration:

```json
{
  "connectionString": "postgresql://postgres:postgres@localhost:5432/mydb",
  "schema": "public",
  "target": "typescript",
  "outputDir": "./src/types"
}
```

### 2. Generate files

```bash
pgs generate
```

Command-line options override values from the config file:

```bash
# TypeScript definitions
pgs generate -u "postgresql://user:pass@localhost:5432/mydb" \
  -t typescript -o ./src/types

# Frappe DocTypes
pgs generate -t frappe -o ./doctypes

# Mermaid ERD documentation
pgs generate -t erd -o ./docs
```

`DATABASE_URL` is also supported when no connection string is supplied through a flag or configuration file.

## Configuration

Create `pg-sync.config.json` in the project root, or pass a custom file with `-c`.

| Property           | Type     | Default          | Description                      |
| ------------------ | -------- | ---------------- | -------------------------------- |
| `connectionString` | `string` | Required         | PostgreSQL connection URI        |
| `schema`           | `string` | `public`         | PostgreSQL schema to inspect     |
| `target`           | `string` | `typescript`     | `typescript`, `frappe`, or `erd` |
| `outputDir`        | `string` | Target-dependent | Directory for generated files    |

Useful flags:

```text
-u, --url <url>      PostgreSQL connection string
-s, --schema <name>  Database schema to inspect
-o, --output <dir>   Output directory
-t, --target <type>  typescript | frappe | erd
-c, --config <file>  Custom configuration path
```

## Development

```bash
npm run build          # Compile TypeScript
npm test               # Run the test suite
npm run test:coverage  # Generate coverage metrics
npm run test:watch    # Watch tests during development
```

Integration tests expect a reachable PostgreSQL instance. The CI workflow runs them against a PostgreSQL service container.

## Requirements

- Node.js 18+
- PostgreSQL 12+
- A database user with permission to read the target schema metadata

## License

Distributed under the [MIT License](https://opensource.org/licenses/MIT).
