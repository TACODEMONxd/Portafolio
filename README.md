# Portafolio Didáctico Interactivo
**Didáctica de los Estudios Sociales y la Educación Cívica • MEP Costa Rica**

Este proyecto está completamente desacoplado siguiendo las mejores prácticas de la arquitectura web moderna (separación de estructura HTML, presentación CSS, datos y comportamiento JavaScript).

---

## 📁 Estructura del Proyecto

```text
portafolio_educativo_interactivo_separado/
│
├── index.html          # Estructura semántica del portafolio (Apartados A, B, C, D, E)
│
├── css/
│   └── styles.css      # Estilos personalizados (animaciones del carrusel, accesibilidad, estados)
│
├── js/
│   ├── data.js         # Base de datos curricular completa (16 técnicas, conclusiones y referencias)
│   └── app.js          # Lógica interactiva (carrusel continuo, filtros disciplinares, teclado)
│
├── images/
│   └── Autor.jpeg      # Fotografía del autor en la Facultad de Ciencias Sociales
│
└── README.md           # Documentación del proyecto
```

---

## 🚀 Cómo Ejecutar el Proyecto

1. **Uso local directo (Doble Clic):**
   * Puedes abrir directamente el archivo `index.html` en cualquier navegador web moderno (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, Brave).
   * Al estar los datos desacoplados en `js/data.js` como una constante global segura, **no se producen bloqueos de CORS**, por lo que funciona al 100% incluso sin tener un servidor web instalado.

2. **Uso con servidor local (Opcional):**
   * Puedes usar la extensión **Live Server** de VS Code o ejecutar:
     ```bash
     npx serve .
     ```

---

## 🎯 Características y Buenas Prácticas Aplicadas

- **Separación absoluta de responsabilidades:**
  - `index.html`: Cero código `<style>` embebido y cero manejadores inline (`onclick`).
  - `css/styles.css`: Transiciones fluidas con curvas `cubic-bezier`, estilos de foco visible `:focus-visible` y soporte para `prefers-reduced-motion`.
  - `js/app.js`: Manejo de eventos desacoplado con `addEventListener` y atributos semánticos `data-*`.
  - `js/data.js`: Estructura de datos completa y limpia para facilitar futuras modificaciones curriculares sin tocar el código.
- **Navegación interactiva completa:**
  - Matriz rápida de 16 técnicas con resaltado en tiempo real.
  - Filtros temáticos por área curricular: Historia (4), Geografía (4), Cívica (4) y Transversal (4).
  - Control de carrusel con botones laterales (`❮` y `❯`), indicadores de posición y **teclado (flechas ← y →)**.
  - Diseño responsivo adaptado a dispositivos móviles, tabletas y computadoras de escritorio.
