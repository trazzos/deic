# AccessDenied Component - Documentación

El componente `AccessDenied` proporciona una interfaz consistente y profesional para mostrar mensajes cuando un usuario no tiene permisos para acceder a una funcionalidad.

## 🎨 Variantes Disponibles

### 1. **Default** - Estilo estándar
```jsx
<AccessDenied 
  resource="users" 
  action="create" 
  showContact={true}
/>
```
- Ideal para la mayoría de casos
- Tamaño mediano con información básica
- Icono de candado y botón "Volver"

### 2. **Minimal** - Para espacios pequeños
```jsx
<AccessDenied 
  variant="minimal"
  message="No puedes editar este elemento"
/>
```
- Compacto para toolbars, botones, etc.
- Solo icono pequeño y mensaje breve
- Sin botones adicionales

### 3. **Card** - Estilo tarjeta
```jsx
<AccessDenied 
  variant="card"
  title="Función Premium"
  message="Esta funcionalidad está disponible solo para usuarios premium"
  showContact={true}
/>
```
- Diseño tipo tarjeta con sombra
- Ideal para modals o secciones destacadas
- Visualmente atractivo

### 4. **Detailed** - Información completa
```jsx
<AccessDenied 
  variant="detailed"
  resource="reports"
  action="read"
  showContact={true}
/>
```
- Máxima información para páginas completas
- Muestra datos del usuario actual
- Múltiples opciones de acción

## 📋 Propiedades

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'default' \| 'minimal' \| 'detailed' \| 'card'` | `'default'` | Estilo visual del componente |
| `title` | `string` | `'Acceso Restringido'` | Título personalizado |
| `message` | `string` | Auto-generado | Mensaje personalizado |
| `resource` | `string` | - | Recurso al que se intenta acceder |
| `action` | `string` | - | Acción que se intenta realizar |
| `showContact` | `boolean` | `false` | Mostrar información de contacto |
| `showBackButton` | `boolean` | `true` | Mostrar botón "Volver" |
| `onBack` | `function` | `window.history.back()` | Función personalizada para volver |
| `className` | `string` | `''` | Clases CSS adicionales |

## 🚀 Componentes Especializados

### PageAccessDenied
Para páginas completas:
```jsx
<PageAccessDenied resource="admin" />
```

### ActionAccessDenied  
Para acciones específicas:
```jsx
<ActionAccessDenied action="delete" resource="users" />
```

### AdminAccessDenied
Para áreas de administración:
```jsx
<AdminAccessDenied />
```

## 💡 Casos de Uso

### 1. En PermissionGuard
```jsx
<PermissionGuard 
  resource="users" 
  action="read"
  fallback={<PageAccessDenied resource="users" />}
>
  <UsersPage />
</PermissionGuard>
```

### 2. En botones y acciones
```jsx
<PermissionGuard 
  resource="users" 
  action="create"
  fallback={<ActionAccessDenied action="create" resource="users" />}
>
  <CreateButton />
</PermissionGuard>
```

### 3. En modals y dialogs
```jsx
{!hasPermission('admin.access') && (
  <Dialog visible={showModal} onHide={() => setShowModal(false)}>
    <AccessDenied 
      variant="card"
      title="Área Restringida"
      showContact={true}
    />
  </Dialog>
)}
```

### 4. Programáticamente
```jsx
const MyComponent = () => {
  const { canRead } = usePermissions();
  
  if (!canRead('sensitive_data')) {
    return (
      <AccessDenied 
        variant="detailed"
        resource="sensitive_data"
        action="read"
        showContact={true}
      />
    );
  }
  
  return <SensitiveDataView />;
};
```

## 🎯 Generación Automática de Mensajes

El componente genera automáticamente mensajes basados en `resource` y `action`:

| Resource | Action | Mensaje Generado |
|----------|--------|------------------|
| `users` | `create` | "No tienes permisos para crear usuarios" |
| `roles` | `update` | "No tienes permisos para editar roles" |
| `admin` | `access` | "No tienes permisos para acceder a administración" |

### Mapeo de Recursos
```typescript
const resourceNames = {
  'users': 'usuarios',
  'roles': 'roles', 
  'personas': 'personas',
  'proyectos': 'proyectos',
  'catalogos': 'catálogos',
  'admin': 'administración',
  'reports': 'reportes'
};
```

### Mapeo de Acciones
```typescript
const actionNames = {
  'create': 'crear',
  'read': 'ver',
  'update': 'editar', 
  'delete': 'eliminar',
  'manage': 'gestionar'
};
```

## 🎨 Personalización CSS

### Clases disponibles para styling:
- `.access-denied-default` - Variante default
- `.access-denied-minimal` - Variante minimal  
- `.access-denied-card` - Variante card
- `.access-denied-detailed` - Variante detailed

### Ejemplo de personalización:
```css
.custom-access-denied {
  border: 2px solid #ff6b6b;
  background: linear-gradient(135deg, #fff5f5, #ffe3e3);
}
```

```jsx
<AccessDenied 
  className="custom-access-denied"
  variant="card"
/>
```

## 📱 Responsive Design

Todos los componentes son responsive por defecto:
- **Mobile**: Layout vertical, texto más pequeño
- **Tablet**: Layout intermedio
- **Desktop**: Layout completo con todos los elementos

## ♿ Accesibilidad

- Iconos con `aria-label` descriptivos
- Estructura semántica HTML
- Contraste de colores WCAG compliant
- Navegación por teclado habilitada
- Screen reader friendly

## 🔧 Integración con el Sistema de Permisos

El componente se integra automáticamente con:
- **useAuth()** - Para obtener datos del usuario
- **Traducciones automáticas** - De recursos y acciones
- **Tema de PrimeReact** - Usa las clases del tema activo
- **Navegación** - Botones de volver y redirección

## 📝 Mejores Prácticas

1. **Usa la variante apropiada**:
   - `minimal` para elementos pequeños
   - `default` para casos generales
   - `card` para destacar
   - `detailed` para páginas completas

2. **Proporciona contexto**:
   - Siempre incluye `resource` y `action` cuando sea posible
   - Usa `showContact={true}` para restricciones importantes

3. **Consistencia**:
   - Usa los mismos recursos/acciones en toda la app
   - Mantén el mismo estilo para casos similares

4. **UX**:
   - Proporciona alternativas (botón volver, ir al dashboard)
   - Explica claramente qué permisos faltan
   - Incluye información de contacto cuando sea relevante
