# `scripts/` — Helpers de desarrollo

Scripts útiles para el dev loop diario. Todos se asumen ejecutables desde la raíz del repo.

## Scripts planeados

| Script | Qué hace |
|---|---|
| `setup.sh` | Setup inicial completo: deps Python, deps Node, volúmenes Docker |
| `dev.sh` | Levanta Moodle Docker + FastAPI + watch del bundle React |
| `purge.sh` | Limpia caches Moodle + tira ChromaDB local + reindexa |
| `sign_request.py` | Genera una request HMAC-firmada para probar el backend desde curl |
| `seed_chroma.py` | Indexa un PDF de prueba en ChromaDB (útil para dev) |

## Convenciones

- Bash scripts con `set -euo pipefail` arriba.
- Python scripts con shebang `#!/usr/bin/env python3` y type hints.
- Cada script con `--help` que explique uso.
