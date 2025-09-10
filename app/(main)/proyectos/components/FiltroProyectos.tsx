'use client';
import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

interface FiltroProyectosProps {
    visible: boolean;
    onToggle: () => void;
    filtros: {
        tipoProyecto: any;
        departamento: any;
        estatus: any;
    };
    onFiltroChange: (filtro: string, valor: any) => void;
    onLimpiarFiltros: () => void;
    accessAddProject: boolean;
    onAddProject: () => void;
    tiposProyecto: any[];
    departamentos: any[];
    totalRegistros: number;
}

const FiltroProyectos: React.FC<FiltroProyectosProps> = ({
    visible,
    onToggle,
    filtros,
    onFiltroChange,
    onLimpiarFiltros,
    accessAddProject,
    onAddProject,
    tiposProyecto,
    departamentos,
    totalRegistros
}) => {
    const estatusOptions = [
        { label: 'Todos los estatus', value: null },
        { label: 'Completado', value: 'completado' },
        { label: 'En curso', value: 'en_curso' },
        { label: 'Sin comenzar', value: 'pendiente' },
       
    ];

    const tiposProyectoOptions = [
        { label: 'Todos los tipos', value: null },
        ...tiposProyecto.map(tipo => ({
            label: tipo.nombre,
            value: tipo.id
        }))
    ];

    const departamentosOptions = [
        { label: 'Todos los departamentos', value: null },
        ...departamentos.map(dept => ({
            label: dept.nombre,
            value: dept.id
        }))
    ];

    return (
        <div className="p-3 bg-white border-round-lg shadow-1 border-1 surface-border">
            {/* Header con botón toggle y contador */}
            <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-2 gap-2">
                <div className="flex  align-items-center gap-2">
                    <Button
                        icon={visible ? "pi pi-filter-slash" : "pi pi-filter"}
                        label={visible ? "Ocultar filtros" : "Mostrar filtros"}
                        outlined
                        onClick={onToggle}
                    />
                    <span className="text-500 text-sm">
                        {totalRegistros} proyecto(s) encontrado(s)
                    </span>
                </div>
                {accessAddProject && (<Button icon="pi pi-plus" label='Agregar proyecto' onClick={onAddProject}></Button>)}
            </div>

            {/* Panel de filtros */}
            {visible && (
                <div className="flex flex-column gap-3 p-3 bg-gray-50 border-round">
                    {/* Fila de filtros */}
                    <div className="flex flex-column md:flex-row gap-3">
                        <div className="flex flex-1">
                            <Dropdown
                                value={filtros.tipoProyecto}
                                options={tiposProyectoOptions}
                                onChange={(e) => onFiltroChange('tipoProyecto', e.value)}
                                placeholder="Tipo de proyecto"
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-1">
                            <Dropdown
                                value={filtros.departamento}
                                options={departamentosOptions}
                                onChange={(e) => onFiltroChange('departamento', e.value)}
                                placeholder="Departamento"
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-1">
                            <Dropdown
                                value={filtros.estatus}
                                options={estatusOptions}
                                onChange={(e) => onFiltroChange('estatus', e.value)}
                                placeholder="Estatus"
                                className="w-full"
                            />
                        </div>
                        
                        <Button 
                            type="button" 
                            icon="pi pi-filter-slash" 
                            label="Limpiar filtros" 
                            outlined 
                            onClick={onLimpiarFiltros}
                            className="w-auto"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiltroProyectos;
