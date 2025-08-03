import React from 'react';
import { Button } from 'primereact/button';

interface EmptyStateProjectProps {
    onAddProject: () => void;
}

const EmptyStateProject = ({ onAddProject }: EmptyStateProjectProps) => {
    return (
        <div className="col-12">
            <div className="flex flex-column align-items-center justify-content-center p-6 bg-white border-round-lg shadow-1" 
                 style={{ minHeight: '60vh' }}>
                <div className="mb-4">
                    <i className="pi pi-folder-open text-6xl text-gray-300"></i>
                </div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                    No hay proyectos registrados
                </h2>
                <p className="text-gray-500 text-center mb-4 max-w-md">
                    Comienza creando tu primer proyecto para organizar y gestionar tus actividades de manera eficiente.
                </p>
                <Button 
                    label="Crear primer proyecto" 
                    icon="pi pi-plus"
                    onClick={onAddProject}
                    className="p-button-lg"
                />
            </div>
        </div>
    );
};

export default EmptyStateProject;
