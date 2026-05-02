# Setup Node + React + Webpack

> **Resumen:** Cómo levantar el entorno de frontend. Node 20 LTS, npm, Webpack con watch mode. El bundle se genera en `amd/build/chatwidget-lazy.min.js` y se commitea al repo.

---

## Contexto

La parte React vive dentro del plugin Moodle en `local/nexusai/react/`. Este doc explica cómo arrancar el dev loop del frontend.

## Prerrequisitos

- Node.js 20 LTS (`node --version` → `v20.x.x`).
- npm 10+ (viene con Node 20).
- (Recomendado) `nvm` para gestionar versiones.

## Setup paso a paso

### 1. Instalar Node con nvm

```bash
nvm install 20
nvm use 20
node --version  # v20.11.x o superior
```

### 2. Instalar dependencias

```bash
cd nexusAI/plugin/local/nexusai
npm install
```

(El `package.json` vive en la raíz del plugin, con `react/` como subcarpeta del source.)

### 3. Build de producción

```bash
npm run build
# Genera amd/build/chatwidget-lazy.min.js
```

### 4. Dev con watch mode

```bash
npm run dev
# Watch — recompila en cada cambio
```

## Scripts del `package.json`

```json
{
    "scripts": {
        "build":      "webpack --mode production",
        "dev":        "webpack --mode development --watch",
        "lint":       "eslint react/src --ext .js,.jsx",
        "lint:fix":   "eslint react/src --ext .js,.jsx --fix",
        "test":       "jest",
        "test:watch": "jest --watch"
    }
}
```

## Estructura de archivos

Ver [06-frontend-react/webpack-config.md](../06-frontend-react/webpack-config.md) para el detalle completo de la configuración. Resumen:

```
local/nexusai/
├── package.json                   # Deps + scripts
├── webpack.config.js              # Config de bundle
├── babel.config.json              # Babel presets
├── .eslintrc.json                 # Reglas ESLint
├── react/
│   └── src/                       # Source de React
└── amd/build/                     # Output (commiteado)
```

## Dev loop recomendado

1. Tener Moodle Docker corriendo (ver [docker-moodle.md](docker-moodle.md)).
2. `npm run dev` en una terminal → watch mode.
3. Hacer cambios en `react/src/`.
4. Webpack detecta, regenera `amd/build/chatwidget-lazy.min.js`.
5. Hard refresh en el navegador (con `$CFG->cachejs = false`).

Si sos muy purista:

```bash
# Terminal 1 — Moodle
bin/moodle-docker-compose up

# Terminal 2 — FastAPI
uvicorn app.main:app --port 8001 --reload

# Terminal 3 — Webpack
cd plugin/local/nexusai
npm run dev
```

## ESLint

`.eslintrc.json` base:

```json
{
    "env": { "browser": true, "es2022": true },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended"
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "ecmaFeatures": { "jsx": true }
    },
    "settings": { "react": { "version": "detect" } },
    "rules": {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off"
    }
}
```

## Testing con Jest + React Testing Library

Dependencias:

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom \
    @testing-library/user-event jest-environment-jsdom \
    babel-jest
```

`jest.config.js`:

```javascript
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEach: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '\\.(css|less|scss)$': 'identity-obj-proxy',
        '^core/(.*)$': '<rootDir>/react/__mocks__/core/$1.js',  // Mock de módulos Moodle
    },
    testMatch: ['**/__tests__/**/*.test.jsx'],
};
```

Mock de `core/ajax` para tests:

```javascript
// react/__mocks__/core/ajax.js
export const call = jest.fn(() => Promise.resolve([{ answer: 'mock' }]));
```

## Troubleshooting

| Síntoma | Causa | Solución |
|---|---|---|
| `Module not found: Error: Can't resolve 'core/ajax'` al correr tests | Falta el mock | Agregarlo en `react/__mocks__/core/` |
| Bundle size > 512 KB warning | Deps nuevas pesadas | Revisar `bundle analyzer`: `npm install -D webpack-bundle-analyzer` |
| Cambios no se reflejan en Moodle | Caché JS Moodle | `$CFG->cachejs = false` + hard refresh |
| ESLint no reconoce JSX | `parserOptions.ecmaFeatures.jsx` en `.eslintrc.json` | Verificar config |
| Hot reload lento | Watch mode default de Webpack | Considerar migrar a Vite en post-MVP |

## Checklist antes de commit

```bash
npm run lint
npm run test
npm run build  # Asegurar que el bundle de prod se genera
git add amd/build/chatwidget-lazy.min.js  # El bundle se commitea
```

## Decisiones tomadas para NexusAI

- **Node 20 LTS**.
- **npm** (no yarn ni pnpm — mantenemos simple).
- **Webpack 5** (no Vite — mejor compatibilidad con target AMD).
- **Jest + React Testing Library** para tests.
- **ESLint con `eslint:recommended` + plugins React**.
- **Bundle commiteado** (convención Moodle).

## Abierto / pendiente

- [ ] Decidir si usamos TypeScript (a decidir en Sprint 1).
- [ ] Configurar pre-commit (lint + test) con Husky.
- [ ] Evaluar Vite para dev (más rápido) con Webpack solo para build prod.

## Referencias

- [Node.js — Releases](https://nodejs.org/en/about/previous-releases)
- [Webpack — getting started](https://webpack.js.org/guides/getting-started/)
- [Jest docs](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
