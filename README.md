# Product Price Configurator Dashboard

A React + Vite localhost-ready dashboard for product attribute pricing, quotations, product management, and reports.

## Requirements

Install these first:

- Node.js LTS
- VS Code

Check Node:

```bash
node -v
npm -v
```

## Run in VS Code

1. Extract the ZIP.
2. Open the folder in VS Code.
3. Open terminal in VS Code.
4. Run:

```bash
npm install
npm run dev
```

5. Open the localhost URL shown in terminal, normally:

```text
http://localhost:5173
```

## Main files

```text
src/App.jsx   -> React logic and dashboard UI
src/App.css   -> Full styling
src/main.jsx  -> React entry point
package.json  -> commands and dependencies
```

## Features

- Product list
- Attribute-based pricing
- Live price update
- Quantity and discount
- Add product
- Save quotation
- Preview quote
- Export quote as .txt
- Approve/delete quotations
- LocalStorage persistence
- Reset demo data
- No external UI libraries
- No icon package dependency
