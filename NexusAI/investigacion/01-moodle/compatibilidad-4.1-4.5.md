# Compatibilidad entre Moodle 4.1 y 4.5

> **Resumen:** NexusAI apunta a Moodle 4.1 LTS – 4.5 LTS, que cubre ~90% de las instalaciones universitarias actuales. Esto impone PHP 7.4+ como mínimo (4.1) y obliga a detectar `$CFG->branch` para usar Hooks API (4.3+) o callbacks legacy.

---

## Contexto

Las universidades prefieren versiones LTS y actualizan de LTS a LTS (4.1 → 4.5). Un plugin pensado solo para la última versión se queda afuera de gran parte del mercado. La estrategia de NexusAI es soportar el rango LTS-a-LTS completo.

## Cambios críticos entre versiones

| Versión | Fecha release | PHP mínimo | Novedades que impactan plugins |
|---|---|---|---|
| **4.1 LTS** | Nov 2022 | 7.4 | Base mínima. Solo callbacks legacy. |
| 4.2 | Abr 2023 | 8.0 | Theme Boost refactor parcial. |
| 4.3 | Oct 2023 | 8.0 | **Hooks API (PSR-14)** introducida. |
| 4.4 | Abr 2024 | **8.1** | Salto importante de PHP. Hooks API con DI. |
| **4.5 LTS** | Oct 2024 | 8.1 | **Subsistema IA nativo** (placements + providers). Bootstrap 5. Subsecciones de curso. |

## Detección de versión desde el plugin

```php
global $CFG;
// $CFG->branch contiene: 401, 402, 403, 404, 405

if ($CFG->branch >= 403) {
    // Usar Hooks API (disponible desde 4.3)
} else {
    // Usar callbacks legacy (before_footer, etc.)
}
```

Para NexusAI MVP usamos **callbacks legacy** (`before_footer()`) porque funcionan en todo el rango 4.1–4.5. Post-MVP podemos migrar a Hooks API con branch detection.

## Versiones que usan las universidades

Las universidades prefieren LTS. En 2025-2026 la distribución real es aproximadamente:

- ~50% en 4.1 LTS (fin de soporte: Dic 2025, muchas aún están migrando)
- ~30% en 4.5 LTS (la que vendrá siendo nueva LTS)
- ~15% en versiones intermedias (4.3, 4.4)
- ~5% en <4.1 (no soportado)

Con `$plugin->supported = [401, 405]` cubrimos el **~95%** de las instalaciones universitarias activas.

## Matriz de compatibilidad del plugin

| Feature NexusAI | 4.1 | 4.2 | 4.3 | 4.4 | 4.5 |
|---|---|---|---|---|---|
| `before_footer()` callback | ✅ | ✅ | ✅ | ✅ | ✅ |
| AMD + RequireJS | ✅ | ✅ | ✅ | ✅ | ✅ |
| `$DB` API | ✅ | ✅ | ✅ | ✅ | ✅ |
| Privacy API | ✅ | ✅ | ✅ | ✅ | ✅ |
| `class curl` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Subsistema IA nativo (opcional) | ❌ | ❌ | ❌ | ❌ | ✅ |

## CI automatizado con moodle-plugin-ci

Pipeline de GitHub Actions que prueba el plugin contra **múltiples versiones de Moodle en paralelo**.

```yaml
# .github/workflows/moodle-ci.yml
name: Moodle Plugin CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-22.04
    strategy:
      fail-fast: false
      matrix:
        include:
          - php: '7.4'
            moodle-branch: 'MOODLE_401_STABLE'
            database: 'pgsql'
          - php: '8.1'
            moodle-branch: 'MOODLE_405_STABLE'
            database: 'pgsql'
          - php: '8.1'
            moodle-branch: 'MOODLE_405_STABLE'
            database: 'mariadb'
    steps:
      - uses: actions/checkout@v4
      - uses: moodlehq/moodle-plugin-ci@v4
      - run: moodle-plugin-ci phpcs --max-warnings 0
      - run: moodle-plugin-ci phpunit
      - run: moodle-plugin-ci behat --profile chrome
```

## Decisiones tomadas para NexusAI

- **Rango soportado:** Moodle 4.1 LTS (branch 401) a 4.5 LTS (branch 405).
- **PHP mínimo:** 7.4 para mantener 4.1. Si en Sprint 2 vemos que 4.1 nos bloquea, subimos a PHP 8.1 y bajamos soporte a 4.4+.
- **Hooks API:** no en el MVP. Usamos `before_footer()` legacy que funciona en todo el rango.
- **Subsistema IA nativo de 4.5:** no lo adoptamos — solo soporta `generate_text`, `generate_image` y `summarise_text`. No hay acción "chat" nativa. Nuestro plugin standalone es más flexible.

## Abierto / pendiente

- [ ] Confirmar con el técnico Moodle de UCC qué versión corren efectivamente.
- [ ] Decidir estrategia si UCC está en 4.2 o 4.3 (nos cae en el medio del rango — sin LTS — pero igual soportado).
- [ ] Setear el CI multi-versión antes del Sprint 3.

## Referencias

- [Moodle Releases — ciclo LTS](https://moodledev.io/general/releases)
- [Moodle Developer Resources — PHP version support](https://moodledev.io/general/development/policies/php)
- [moodlehq/moodle-plugin-ci](https://github.com/moodlehq/moodle-plugin-ci)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
