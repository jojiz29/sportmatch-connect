# Contributing to SportMatch

¡Bienvenidos al equipo! Para asegurar que podamos escalar a 10,000+ usuarios de manera robusta, mantendremos este protocolo estricto. Nuestro objetivo es que el código de los 5 parezca escrito por una sola persona.

## 1. Feature-Sliced Design (FSD)

El proyecto usa una arquitectura modular. **NO** crees carpetas planas en la raíz de `src`. Toda la lógica debe estar encapsulada:

- `src/app`: Entry point global.
- `src/pages`: Componentes de ruta.
- `src/features`: Lógica de negocio (ej. Matchmaking, Wallet).
- `src/entities`: Modelos de negocio abstractos que reflejan Supabase (User, Court, Match).
- `src/shared`: Componentes UI genéricos (botones, modales) y utilidades.

## 2. Regla Inquebrantable: "Zero Any"

- **Prohibido usar `any`**. Nuestro ESLint fallará el build en CI/CD si detecta la palabra `any`.
- Define y usa interfaces estrictas en `src/entities/` para cada modelo de datos.

## 3. GitFlow

Las ramas en `main` están protegidas.

- Nombra tus ramas siguiendo el patrón: `tipo/nombre-de-feature`
- **Tipos de ramas**: `feature/`, `bugfix/`, `hotfix/`, `refactor/`
- **Ejemplo**: `feature/wallet-transactions`

## 4. Conventional Commits

Tus mensajes de commit deben seguir esta estructura:

```
tipo(área): mensaje en minúsculas en modo imperativo

ejemplo:
feat(map): implementar clustering de pines con leaflet
fix(wallet): corregir validación de saldo insuficiente
```

- `feat`: Nueva funcionalidad
- `fix`: Corrección de errores
- `refactor`: Cambio de código que no añade ni quita funcionalidad
- `chore`: Tareas de mantenimiento (instalar libs, etc)

## 5. Mocking para Supabase

Antes de cambiar `VITE_USE_MOCKS=false` a producción, asegúrate de que tus hooks usen el `apiClient` correctamente y que los mocks de `src/lib/mock.ts` reflejen 1:1 el esquema de PostgreSQL. No introduzcas atributos "inventados" en los mocks.
