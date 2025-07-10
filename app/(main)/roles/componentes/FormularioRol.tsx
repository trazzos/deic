"use client";
import React, { useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Tree } from "primereact/tree";

export interface PermisoNode {
  key: string;
  label: string;
  children?: PermisoNode[];
}

interface FormularioRolProps {
  visible: boolean;
  onHide: () => void;
  onSave: (data: { nombre: string; permisos: string[] }) => void;
  initialData?: { nombre: string; permisos: string[] };
  permisosTree: PermisoNode[];
}

export default function FormularioRol({ visible, onHide, onSave, initialData, permisosTree }: FormularioRolProps) {
  const [nombre, setNombre] = useState(initialData?.nombre || "");
  const [selectedKeys, setSelectedKeys] = useState<{ [key: string]: boolean }>(
    initialData?.permisos?.reduce((acc, key) => ({ ...acc, [key]: true }), {}) || {}
  );

  React.useEffect(() => {
    setNombre(initialData?.nombre || "");
    setSelectedKeys(initialData?.permisos?.reduce((acc, key) => ({ ...acc, [key]: true }), {}) || {});
  }, [initialData, visible]);

  const handleSave = () => {
    onSave({ nombre, permisos: Object.keys(selectedKeys).filter((k) => selectedKeys[k]) });
  };

  return (
    <Sidebar
      visible={visible}
      onHide={onHide}
      position="right"
      className="w-full md:w-4 lg:w-3"
      header={<span className="text-xl font-semibold text-primary">{initialData ? "Editar rol" : "Nuevo rol"}</span>}
      pt={{ header: { className: 'border-bottom-1 surface-border' }, content: { className: 'p-0' } }}
    >
      <div className="flex flex-column gap-4 p-4">
        <span className="p-float-label">
          <InputText
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full"
            autoFocus
          />
          <label htmlFor="nombre">Nombre del rol</label>
        </span>
        <div>
          <h4 className="mb-2 text-primary-700 text-base font-semibold">Permisos</h4>
          <Tree
            value={permisosTree}
            selectionMode="checkbox"
            selectionKeys={selectedKeys}
            onSelectionChange={(e) => setSelectedKeys(e.value)}
            className="w-full border-round shadow-1"
            filter
            filterPlaceholder="Buscar permiso..."
            nodeTemplate={(node, options) => (
              <span className="text-sm text-gray-800 dark:text-gray-200">{node.label}</span>
            )}
            expandedKeys={{}}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-outlined" />
          <Button label={initialData ? "Actualizar" : "Guardar"} icon="pi pi-save" onClick={handleSave} autoFocus />
        </div>
      </div>
    </Sidebar>
  );
}
