import React from 'react';
import { Button } from 'primereact/button';

interface EmptyStateActivityProps {
    onSelectProject?: () => void;
}

const EmptyStateActivity = ({ onSelectProject }: EmptyStateActivityProps) => {
    return (
        <div className="w-full max-w-md bg-white border-round-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-column align-items-center justify-content-center gap-4 p-8">
                <div className="flex align-items-center justify-content-center w-6rem h-6rem border-circle bg-gray-100 dark:bg-gray-700">
                    <i className="pi pi-list text-4xl text-gray-400 dark:text-gray-500"></i>
                </div>
                
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Selecciona un proyecto
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-height-3">
                        Elige un proyecto de la lista para ver y gestionar sus actividades y tareas.
                    </p>
                </div>

                {onSelectProject && (
                    <Button 
                        label="Seleccionar proyecto" 
                        icon="pi pi-arrow-left"
                        onClick={onSelectProject}
                        className="p-button-text"
                        size="small"
                    />
                )}
            </div>
        </div>
    );
};

export default EmptyStateActivity;
