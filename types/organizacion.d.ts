// Base interfaces for organization structure
export interface Secretaria {
    id?: number;
    nombre: string;
    descripcion: string;
}

export interface Subsecretaria {
    id?: number;
    nombre: string;
    descripcion: string;
    secretaria_id: number;
    secretaria?: {
        id: number;
        nombre: string;
    };
}

export interface Direccion {
    id?: number;
    nombre: string;
    descripcion: string;
    subsecretaria_id: number;
    subsecretaria?: {
        id: number;
        nombre: string;
        secretaria?: {
            id: number;
            nombre: string;
        };
    };

}

export interface Departamento {
    id?: number;
    nombre: string;
    descripcion: string;
    direccion_id: number;
    direccion?: {
        id: number;
        nombre: string;
        subsecretaria?: {
            id: number;
            nombre: string;
            secretaria?: {
                id: number;
                nombre: string;
            };
        }
    }

}

export interface UnidadApoyo {
    id?: number;
    nombre: string;
    descripcion: string;
    secretaria_id: number;
    secretaria?: {
        id: number;
        nombre: string;
    };
}

// Form interfaces for create/update operations
export interface SecretariaForm {
    nombre: string;
    descripcion: string;
}

export interface SubsecretariaForm {
    nombre: string;
    descripcion: string;
    secretaria_id: number;
}

export interface DireccionForm {
    nombre: string;
    descripcion: string;
    subsecretaria_id: number;
}

export interface DepartamentoForm {
    nombre: string;
    descripcion: string;
    direccion_id: number;
}

export interface UnidadApoyoForm {
    id?: number;
    nombre: string;
    descripcion: string;
    secretaria_id: number;
}

// Filter interfaces for search/pagination
export interface SecretariaFilters {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: 'nombre' | 'descripcion' | 'created_at';
    sort_direction?: 'asc' | 'desc';
}

export interface SubsecretariaFilters extends SecretariaFilters {
    secretaria_id?: number;
}

export interface DireccionFilters extends SecretariaFilters {
    subsecretaria_id?: number;
    secretaria_id?: number;
}

export interface UnidadApoyoFilters extends SecretariaFilters {
    secretaria_id?: number;
}

// Dropdown/Select interfaces
export interface SelectOption {
    id: number;
    nombre: string;
}

export interface SecretariaSelect extends SelectOption {}

export interface SubsecretariaSelect extends SelectOption {
    secretaria_id: number;
}

export interface DireccionSelect extends SelectOption {
    subsecretaria_id: number;
}

// Hierarchy interfaces
export interface OrganizationHierarchy {
    secretarias: (Secretaria & {
        subsecretarias: (Subsecretaria & {
            direcciones: Direccion[];
        })[];
    })[];
}

export interface HierarchyValidation {
    valid: boolean;
    message?: string;
}

// Component Props interfaces
export interface OrganizacionPageProps {
    initialTab?: number;
}

export interface SecretariaDialogProps {
    visible: boolean;
    secretaria?: Secretaria;
    onHide: () => void;
    onSave: (secretaria: Secretaria) => void;
    loading?: boolean;
}

export interface SubsecretariaDialogProps {
    visible: boolean;
    subsecretaria?: Subsecretaria;
    secretarias: Secretaria[];
    onHide: () => void;
    onSave: (subsecretaria: Subsecretaria) => void;
    loading?: boolean;
}

export interface DireccionDialogProps {
    visible: boolean;
    direccion?: Direccion;
    subsecretarias: Subsecretaria[];
    onHide: () => void;
    onSave: (direccion: Direccion) => void;
    loading?: boolean;
}

// Table Action interfaces
export interface ActionButtonsProps {
    item: Secretaria | Subsecretaria | Direccion;
    type: 'secretaria' | 'subsecretaria' | 'direccion';
    onEdit: (item: any) => void;
    onDelete: (item: any) => void;
    canEdit: boolean;
    canDelete: boolean;
}

// Validation Error interfaces
export interface ValidationErrors {
    nombre?: string;
    descripcion?: string;
    secretaria_id?: string;
    subsecretaria_id?: string;
}

// Permission interfaces
export interface OrganizacionPermissions {
    'catalogos.organizacion': boolean;
    'catalogos.organizacion.secretaria.crear': boolean;
    'catalogos.organizacion.secretaria.editar': boolean;
    'catalogos.organizacion.secretaria.eliminar': boolean;
    'catalogos.organizacion.subsecretaria.crear': boolean;
    'catalogos.organizacion.subsecretaria.editar': boolean;
    'catalogos.organizacion.subsecretaria.eliminar': boolean;
    'catalogos.organizacion.direccion.crear': boolean;
    'catalogos.organizacion.direccion.editar': boolean;
    'catalogos.organizacion.direccion.eliminar': boolean;
}

// Export/Import interfaces
export interface OrganizacionExportData {
    secretarias: Secretaria[];
    subsecretarias: Subsecretaria[];
    direcciones: Direccion[];
    export_date: string;
    exported_by?: string;
}

export interface OrganizacionImportResult {
    success: boolean;
    created: {
        secretarias: number;
        subsecretarias: number;
        direcciones: number;
    };
    updated: {
        secretarias: number;
        subsecretarias: number;
        direcciones: number;
    };
    errors: string[];
    warnings: string[];
}

// Statistics interfaces
export interface OrganizacionStats {
    total_secretarias: number;
    total_subsecretarias: number;
    total_direcciones: number;
    secretarias_with_subsecretarias: number;
    subsecretarias_with_direcciones: number;
    average_subsecretarias_per_secretaria: number;
    average_direcciones_per_subsecretaria: number;
}

// Audit interfaces
export interface OrganizacionAuditLog {
    id: number;
    entity_type: 'secretaria' | 'subsecretaria' | 'direccion';
    entity_id: number;
    action: 'create' | 'update' | 'delete';
    old_values?: any;
    new_values?: any;
    user_id?: number;
    user_name?: string;
    created_at: string;
}

export default {
    Secretaria,
    Subsecretaria,
    Direccion,
    SecretariaForm,
    SubsecretariaForm,
    DireccionForm,
    ApiResponse,
    PaginatedResponse,
    OrganizationHierarchy,
    OrganizacionPermissions,
    OrganizacionStats,
    OrganizacionAuditLog
};
