# Hexagonal Layers

The four-layer split mirrors classic hexagonal architecture:

| Layer | Folder | Knows about | Imported by |
|---|---|---|---|
| Domain | `src/domain/` | itself only | Ports, Application |
| Ports | `src/ports/` | Domain | Application, Infra |
| Application | `src/application/` | Domain, Ports | Composition Root, `app/api/**` |
| Infra | `src/infra/` | Domain, Ports, the world | Composition Root |

UI (`src/ui/**` and `app/**`) sits outside this hierarchy and uses the [[Composition Root]] to get a fully wired set of dependencies per request.

See [[Domain Layer]], [[Application Layer]], [[Ports Layer]], [[Infra Layer]].
