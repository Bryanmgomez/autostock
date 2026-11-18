# AutoStock — Sistema de gestión para papelería y variedades

Aplicación web completa (React + TypeScript + Vite + Tailwind CSS) con backend
Node.js + Express + SQLite (better-sqlite3) para administrar inventario, ventas,
clientes, facturación, caja, créditos y reportes.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Navegador moderno

## Instalación

```bash
# Frontend
cd ppi
npm install

# Backend
cd server
npm install
```

## Ejecución (desarrollo)

En dos terminales:

```bash
# Terminal 1 - Backend
cd ppi/server
npm run dev        # http://localhost:4000
```

```bash
# Terminal 2 - Frontend
cd ppi
npm run dev        # http://localhost:5173/autostock/
```

## Credenciales demo

- Gerente: `gerente` / `gerente123` (acceso completo)
- Cajero: `cajero` / `cajero123` (solo ventas y caja)

## Compilar frontend (producción)

```bash
cd ppi
npm run build
npm run preview    # sirve dist con proxy a la API
```

La carpeta `dist/` contiene el frontend listo para desplegar.

## Arquitectura

```
ppi/
  src/          Frontend React
  server/       Backend Express + SQLite (autostock.db)
```

## Persistencia

Los datos se guardan en `server/autostock.db` (SQLite). No se pierden al reiniciar.

Para restablecer los datos demo, detén el backend y elimina `server/autostock.db`, luego reinicia.

## Módulos

1. Panel principal (gerente): indicadores, gráficas, alertas de stock bajo.
2. Inventario (gerente): CRUD, IVA por producto, stock mínimo.
3. Ventas: carrito, descuentos por línea y global, IVA automático, pago, cambio, faltante, crédito.
4. Clientes: búsqueda por nombre/apellido/documento, validaciones, sin duplicados.
5. Facturación: comprobante imprimible.
6. Caja: apertura/cierre, ingresos/egresos, saldo esperado, sobrantes/faltantes, historial.
7. Créditos: ventas a crédito, abonos, deuda pendiente.
8. Reportes (gerente): ventas, IVA, descuentos, top productos, ganancias, movimientos de caja.

## Roles

- **Gerente**: acceso completo, administra usuarios, configuración, reportes.
- **Cajero**: solo ventas y caja. Los permisos se validan en backend (JWT + middleware).