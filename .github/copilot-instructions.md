# DEIC Project - AI Agent Instructions

## 🏗️ Architecture Overview

**Next.js 14 + App Router** project with PrimeReact UI, featuring:
- Route groups: `(main)`, `(full-page)` for different layouts
- Multi-layer authentication with session guards and permission system
- Service layer pattern with centralized API calls
- Context-based state management (Auth, Layout, Notifications)

## 🔐 Authentication & Permissions

### Permission System
```typescript
// Resource.action pattern (e.g., 'proyectos.agregar', 'personas.editar')
const { hasPermission, canCreate, canUpdate, canDelete } = usePermissions();

// PermissionGuard usage
<PermissionGuard permission="proyectos.agregar">
  <Button label="Crear Proyecto" />
</PermissionGuard>

// SuperAdmin bypasses all permission checks
if (isSuperAdmin) { /* full access */ }
```

### Auth Guards
```typescript
// Multiple guard layers in layout.tsx
<AuthProvider>
  <SessionGuard>
    <AuthRouteGuard>
      <LayoutProvider>{children}</LayoutProvider>
    </AuthRouteGuard>
  </SessionGuard>
</AuthProvider>
```

## 📁 Key File Patterns

### Services (`/src/services/`)
```typescript
// Service pattern with axios instance
export const ProyectoService = {
  getListProyecto() { return http.get('/api/proyectos'); },
  createProyecto(data) { return http.post('/api/proyectos', data); },
  // ... CRUD operations
};
```

### Components (`/src/components/`)
- `PermissionGuard`: Conditional rendering based on permissions
- `AuthRouteGuard`: Route-level authentication
- `SessionGuard`: Session validation and auto-logout

### Contexts (`/layout/context/`)
- `authContext`: User auth, permissions, roles
- `layoutContext`: UI layout state (sidebar, theme)
- `notificationContext`: Toast notifications

### Types (`/types/`)
```typescript
// Custom type definitions
export interface Proyecto {
  uuid: string;
  nombre: string;
  // ... project fields
}
```

## 🔧 Development Workflow

### Build & Run
```bash
npm run dev      # Development server
npm run build    # Production build
npm run format   # Prettier formatting
npm run lint     # ESLint checking
```

### Component Creation Pattern
```typescript
'use client';
import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/src/hooks/usePermissions';

export default function MyComponent() {
  const { hasPermission } = usePermissions();
  // Component logic
}
```

### API Integration Pattern
```typescript
// In components
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await ProyectoService.getListProyecto();
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

## 🎨 UI Patterns

### PrimeReact Usage
```typescript
// DataTable with custom templates
<DataTable value={data} loading={loading}>
  <Column field="nombre" header="Nombre" />
  <Column header="Acciones" body={actionTemplate} />
</DataTable>

// Toast notifications
import { useNotification } from '@/layout/context/notificationContext';
const { showSuccess, showError, showInfo, showWarning } = useNotification();
```

### Form Handling
```typescript
// Yup validation schemas
const schema = Yup.object({
  nombre: Yup.string().required('Campo requerido'),
});

// Form submission with error handling
const handleSubmit = async (values) => {
  try {
    await ProyectoService.createProyecto(values);
    toast.current?.show({ severity: 'success', summary: 'Creado' });
  } catch (error) {
    handleFormError(error);
  }
};
```

## 🚨 Error Handling

### Global Error Handling
```typescript
// Axios interceptor handles 401/403 automatically
// Custom error handler for forms
import { useFormErrorHandler } from '@/src/utils/errorUtils';
const handleFormError = useFormErrorHandler(toast);
```

### Loading States
```typescript
// Consistent loading patterns
{loading ? <ProgressSpinner /> : <DataTable value={data} />}
```

## 📋 Key Conventions

### File Organization
- `/app/(main)/`: Main app routes with layout
- `/app/(full-page)/`: Full-page routes (auth, etc.)
- `/src/services/`: API service layer
- `/src/components/`: Reusable components
- `/layout/`: Layout components and contexts
- `/types/`: TypeScript definitions

### Naming Conventions
- Services: `{Entity}Service` (e.g., `ProyectoService`)
- Components: PascalCase with descriptive names
- Hooks: `use{CamelCase}` (e.g., `usePermissions`)
- Types: PascalCase interfaces

### Import Patterns
```typescript
// Absolute imports from src
import { ProyectoService } from '@/src/services';
// Types from root
import type { Proyecto } from '@/types';
```

## ⚡ Performance Patterns

### Data Fetching
- Use `useEffect` for initial data loading
- Implement loading states for all async operations
- Handle errors gracefully with user feedback

### Component Optimization
- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Avoid unnecessary re-renders with useCallback

## 🔍 Debugging Tips

### Common Issues
- Check permission guards when components don't render
- Verify auth state when API calls fail
- Check browser console for axios interceptor messages
- Use React DevTools for context debugging

### Useful Debug Commands
```bash
// Check auth state
console.log('Auth state:', useAuth());

// Check permissions
console.log('Permissions:', permissions);

// Check current route
console.log('Current path:', window.location.pathname);
```</content>
<parameter name="filePath">/home/iepc/nextjs-projects/deic/.github/copilot-instructions.md
