export interface PermisoNode {
  key: string;
  title: string;
  name: string;
  children?: PermisoNode[];
}

interface Role {
	id: number;
	nombre: string;
	permisos: string[];
}
