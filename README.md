# FinanTrack Pro — Sistema Integral de Gestión Financiera y Seguridad

FinanTrack Pro es una aplicación de gestión patrimonial, presupuestaria y contable de nivel empresarial construida con **React 18**, **TypeScript**, **Tailwind CSS**, **Express** y **Web Crypto / WebAuthn**.

---

## 🔒 Arquitectura de Seguridad y Criptografía

### 1. Autenticación y Criptografía Robusta
- **PBKDF2**: Todos los PINs y Claves de Recuperación se derivan utilizando **PBKDF2 con 100.000 iteraciones**, HMAC-SHA-256 y sales criptográficas independientes de 16 bytes generadas mediante CSPRNG (`crypto.getRandomValues()`).
- **Recovery Key de Alta Entropía**:
  - Estándar: `RECOVER-XXXX-XXXX-XXXX-XXXX` (16 caracteres base-32 de alta legibilidad, 80 bits de entropía).
  - Alfabeto Crockford sin caracteres ambiguos (`0`, `1`, `I`, `O`).
  - Indexación de bytes uniforme (`byte & 31`) para eliminar sesgo de módulo.
- **Sin Secretos Hardcodeados**:
  - `MASTER_RECOVERY_KEY` y `RECOVERY_KEY_SALT` se configuran mediante variables de entorno seguras (`.env`).
  - Si no se configuran en el entorno, el servidor deshabilita de forma segura el endpoint de recuperación (`/api/auth/pin/reset`), impidiendo cualquier bypass.
- **Migración Progresiva de Hashes**:
  - Soporte transparente para verificar credenciales heredadas SHA-256 con migración automática e inmediata a PBKDF2 (`pbkdf2$`) en el primer inicio de sesión exitoso.

### 2. Autenticación Biométrica WebAuthn / Passkeys
- **FIDO2 / WebAuthn**: Registro y verificación mediante `@simplewebauthn/browser` y `@simplewebauthn/server`.
- **Protección contra Bypass**:
  - La verificación requiere comprobación criptográfica estricta de aserción pública y firma.
  - Challenges de un solo uso con ventana de expiración estricta y eliminación inmediata tras su uso.
  - Aislamiento total de usuario: validación cruzada entre `credential.userId` y la identidad solicitada.

### 3. Control de Acceso (RBAC) y Prevención IDOR
- **Roles Definidos**: `admin`, `manager`, `member`, `viewer`, `dependent`.
- **Sesiones Autorizadas en Servidor**: El servidor impone los permisos reales (`ROLE_PERMISSIONS`).
- **Anti-Spoofing en Logs de Auditoría**: Las acciones se registran con el usuario autenticado de la sesión o como `Cliente (Anónimo)` sin confiar en cabeceras manipulables por el cliente.
- **Protección IDOR**: Validación estricta de propiedad de cuentas y transacciones en endpoints API.

---

## 📊 Integridad Contable y Motor Financiero

- **Aritmética Exacta en Céntimos**:
  - Todas las operaciones monetarias se realizan convirtiendo importes a números enteros (`toCents` / `fromCents`), erradicando desviaciones de coma flotante IEEE 754.
- **Doble Entrada y Transferencias Multidivisa**:
  - Una transferencia deduce el importe exacto de la cuenta de origen (`fromDelta = -amount`) y acredita en destino el importe convertido según tipo de cambio (`toDelta = +convertedAmount`).
  - Las transferencias no contaminan las estadísticas de ingresos ni gastos operativos.
- **Reversibilidad y Consistencia**:
  - Mutaciones atómicas en `applyTransactionToAccounts`, `applyTransactionUpdateToAccounts` y `applyTransactionDeletionToAccounts` con cero residuo contable tras edición o borrado.

---

## 🛠️ Comandos de Desarrollo y Verificación

```bash
# Instalación de dependencias
npm ci

# Verificación de tipos y linting
npm run lint

# Ejecución de la suite completa de tests unitarios y de integración
npm test

# Compilación de producción
npm run build
```
