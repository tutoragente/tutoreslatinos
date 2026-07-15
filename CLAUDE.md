# jade cobra — Sitio Web de Agencia de IA

## Descripción del Proyecto

Sitio web estático de una sola página (landing page) para **jade cobra**, una agencia especializada en soluciones de inteligencia artificial para negocios. El sitio está completamente en **español** y orientado a empresas que desean escalar sus operaciones mediante automatización e IA.

## Propósito

Captar clientes interesados en servicios de IA a través de:
- Una consultoría estratégica paga ($1,000 — sesión de 45 minutos)
- Implementación completa de automatización con IA (desde $15,000)

## Tecnologías Usadas

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura del sitio |
| Tailwind CSS v4.1.3 | Framework de estilos (compilado en `css/styles.css`) |
| CSS personalizado | Componentes propios en `css/app.css` |
| JavaScript vanilla | Interactividad en `js/main.js` |

## Estructura de Archivos

```
sibetweb/
├── index.html        # Página principal (única página del sitio)
├── css/
│   ├── styles.css    # Tailwind CSS compilado
│   └── app.css       # Estilos personalizados (variables, animaciones, componentes)
├── js/
│   └── main.js       # Navegación, menú móvil, scroll suave, formulario
└── images/           # Fotos de perfil para testimonios
```

## Secciones del Sitio

1. **Header** — Navegación fija con logo, links y menú hamburguesa para móvil
2. **Hero** — Titular principal, subtítulo, CTAs y estadísticas clave (300% ROI, 40+ horas/semana, 24/7)
3. **Servicios** — 6 cards: Automatización, Chatbots, Analítica Predictiva, Inteligencia de Clientes, Optimización del Rendimiento, Seguridad
4. **Precios** — 2 planes: "Inicio Perfecto" ($1,000) y "Solución Completa" ($15,000+), más el camino recomendado en 3 pasos
5. **Beneficios** — 6 métricas destacadas con badges de confianza
6. **Testimonios** — 6 reseñas de clientes con fotos
7. **Contacto** — Formulario de contacto + información de la empresa
8. **Footer** — Links, redes sociales, newsletter y pie de página

## Formulario de Contacto

- **ID:** `contact-form`
- **Campos:** Nombre, Email, Empresa, Tamaño del negocio (select), Mensaje
- **Estado actual:** El formulario actualmente solo muestra un mensaje de éxito visual (`#form-success`) al enviarse — **no envía datos a ningún backend todavía**
- **Pendiente:** Integrar con un servicio como Formspree, EmailJS o un endpoint propio

## Decisiones de Diseño

- Tema oscuro (`background: #000`) con acento en teal/cyan (`--primary: #00d4aa`)
- Tipografía del sistema (no hay fuente externa cargada)
- Animaciones CSS puras (orbs flotantes, hover en cards)
- Totalmente responsivo con breakpoint en 768px
- Sin dependencias de JS externas (vanilla JS únicamente)

## Memoria del Proyecto

### Cambios Realizados
- `2026-06-04` — Todo el copy del sitio traducido del inglés al español
- `2026-06-04` — `lang="en"` cambiado a `lang="es"` en el `<html>`

### Pendientes
- [ ] Conectar el formulario de contacto a un backend real (Formspree recomendado)
- [ ] Definir URL de producción antes de publicar (coordinar despliegue)
- [ ] Revisar SEO: meta tags, Open Graph, favicon
- [ ] Evaluar si se necesita una página de política de privacidad real
