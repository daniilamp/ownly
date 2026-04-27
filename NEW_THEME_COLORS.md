# 🎨 NUEVO TEMA - COLORES

## Paleta de Colores

### Fondo
- **Gradiente principal**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Púrpura claro**: `#667eea`
- **Púrpura oscuro**: `#764ba2`

### Texto
- **Principal**: `#1a202c` (casi negro)
- **Secundario**: `#4a5568` (gris oscuro)
- **Terciario**: `#718096` (gris medio)
- **Blanco**: `#ffffff`

### Cards y Contenedores
- **Glass**: `rgba(255, 255, 255, 0.95)` con blur
- **Borde**: `rgba(255, 255, 255, 0.3)`
- **Sombra**: `0 8px 32px rgba(0, 0, 0, 0.1)`

### Botones

#### Primario (Púrpura)
- **Background**: `linear-gradient(135deg, #667eea, #764ba2)`
- **Hover**: Más brillante
- **Text**: `#ffffff`

#### Secundario (Blanco)
- **Background**: `rgba(255, 255, 255, 0.2)`
- **Hover**: `rgba(255, 255, 255, 0.3)`
- **Text**: `#ffffff`

#### Success (Verde)
- **Background**: `#48bb78`
- **Hover**: `#38a169`
- **Text**: `#ffffff`

#### Danger (Rojo)
- **Background**: `#f56565`
- **Hover**: `#e53e3e`
- **Text**: `#ffffff`

#### Warning (Amarillo)
- **Background**: `#ed8936`
- **Hover**: `#dd6b20`
- **Text**: `#ffffff`

### Estados

#### Hover
- **Transform**: `translateY(-2px)`
- **Shadow**: Más pronunciada

#### Active
- **Transform**: `translateY(0)`

#### Focus
- **Outline**: `2px solid rgba(102, 126, 234, 0.5)`

### Scrollbar
- **Track**: `rgba(255, 255, 255, 0.1)`
- **Thumb**: `rgba(255, 255, 255, 0.3)`
- **Thumb Hover**: `rgba(255, 255, 255, 0.5)`

---

## Aplicar en Componentes

### Ejemplo de Card
```jsx
<div className="glass rounded-2xl p-6">
  <h2 style={{ color: '#1a202c' }}>Título</h2>
  <p style={{ color: '#4a5568' }}>Texto</p>
</div>
```

### Ejemplo de Botón
```jsx
<button
  className="px-6 py-3 rounded-xl font-semibold text-white"
  style={{
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
  }}
>
  Botón
</button>
```

### Ejemplo de Input
```jsx
<input
  className="w-full px-4 py-3 rounded-xl outline-none"
  style={{
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: '#1a202c',
  }}
/>
```

---

## Características del Nuevo Tema

✅ **Más amigable**: Colores cálidos y vibrantes
✅ **Más legible**: Alto contraste entre texto y fondo
✅ **Más moderno**: Glass morphism y gradientes
✅ **Más profesional**: Limpio y elegante
✅ **Más accesible**: Cumple WCAG AA

