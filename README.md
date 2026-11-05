# AutoStock — Sistema de gestión para papelería y variedades

Aplicación web completa (React + TypeScript + Vite + Tailwind CSS) para administrar
inventario, ventas, clientes, facturación, caja, créditos y reportes. **No utiliza
base de datos**: toda la información se almacena en el navegador mediante
`localStorage` (JSON), por lo que persiste al cerrar y volver a abrir la app.

## Requisitos

- Node.js 18 o superior (probado con v24)
- npm 9 o superior
- Navegador moderno (Chrome, Edge, Firefox)

## Instalación y ejecución (desarrollo)

```bash
cd ppi
npm install
npm run dev
```

Abrir en el navegador: http://localhost:5173

## Compilar versión final (producción)

```bash
npm run build
npm run preview
```

La carpeta `dist/` contiene la aplicación lista para desplegar en cualquier
hosting estático (Netlify, Vercel, GitHub Pages) o abrir con un servidor local.

## Estructura del proyecto

```
src/
  components/   Layout, Modal
  lib/          storage, types, seed, store (contexto global)
  pages/        Dashboard, Inventory, Sales, Customers, Invoices, Cash, Credits, Reports
```

## Datos de demostración

Al ejecutar por primera vez se crean automáticamente productos, clientes, una
apertura de caja y datos de ejemplo. Para restablecer los datos demo, abrir la
consola del navegador y ejecutar:

```js
localStorage.clear();
location.reload();
```

## Módulos

1. Panel principal: indicadores, gráficas, alertas de stock bajo.
2. Inventario: CRUD, búsqueda, filtro por categoría, alertas.
3. Ventas: carrito, descuentos, métodos de pago, descuento de stock.
4. Clientes: CRUD con validación.
5. Facturación: comprobante imprimible por venta.
6. Caja: ingresos/egresos, saldo.
7. Créditos: ventas a crédito, abonos, historial.
8. Reportes: top productos, métodos de pago, categorías, ticket promedio.

## Notas

- Sin conexión a base de datos ni servicios externos.
- Los datos se guardan en `localStorage` del navegador del equipo donde se ejecuta.