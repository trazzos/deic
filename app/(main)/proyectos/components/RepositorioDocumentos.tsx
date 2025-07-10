import { useState, useEffect, useRef } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TipoDocumentoService } from '@/src/services/catalogos/tipoDocumento';
import { ProyectoService } from '@/src/services';
import { useNotification } from '@/layout/context/notificationContext';
import { error } from 'node:console';

interface RepositorioDocumentosProps {
    visible: boolean;
    onHide: () => void;
    actividad: any;
    tiposDocumento: any[];
    onUploadDocument?: (file: File, tipoDocumento: any) => Promise<void>;
    onDeleteDocument?: (documento: any) => Promise<void>;
    onDownloadDocument?: (documento: any) => void;
}

const RepositorioDocumentos = ({
    visible,
    onHide,
    actividad,
    tiposDocumento,
    onUploadDocument,
    onDeleteDocument,
    onDownloadDocument
}: RepositorioDocumentosProps) => {
    const [selectedTipo, setSelectedTipo] = useState<any>(null);
    const [documentos, setDocumentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileUploadRef = useRef<any>(null);
    const { showError, showSuccess } = useNotification();

    useEffect(() => {
        if (visible) {
            loadDocumentos();
        }
    }, [visible]);

    const loadDocumentos = async () => {
        try {
           
            const response = await ProyectoService.getListaDocumentosPorActividadUuid(
                actividad.proyecto_uuid, 
                actividad.uuid
            );
            setDocumentos(response.data);
            
        } catch (responseError:any) {
            showError('Ha ocurrido un error', responseError.message);
        }
    };

    const handleUpload = async (event: any) => {
        if (!selectedTipo) {
            // Mostrar mensaje de error
            return;
        }

        const files = event.files;
        if (files && files.length > 0 && onUploadDocument) {
            setUploading(true);
            try {
                for (const file of files) {
                    await onUploadDocument(file, selectedTipo);
                }
                // Recargar documentos después de subir
                await loadDocumentos();
                setSelectedTipo(null);
                // Limpiar el componente FileUpload
                if (fileUploadRef.current) {
                    fileUploadRef.current.clear();
                }
            } catch (error) {
                console.error('Error al subir documento:', error);
            } finally {
                setUploading(false);
            }
        }
    };

    const handleDelete = async (documento: any) => {
        if (onDeleteDocument) {
            try {
                await onDeleteDocument(documento);

                showSuccess('Documento eliminado correctamente');
                setDocumentos(prevDocumentos => 
                    prevDocumentos.filter(doc => doc.uuid !== documento.uuid)
                );
            } catch (responseError: any) {
                console.log( responseError.message);
                showError('Ha ocurrido un error', responseError.message);
               
            }
        }
    };

    const handleDownload = (documento: any) => {
        if (onDownloadDocument) {
            onDownloadDocument(documento);
        } else {
            // Fallback: abrir en nueva ventana
            window.open(documento.url || documento.path, '_blank');
        }
    };

    const actionBodyTemplate = (rowData: any) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-download"
                    rounded
                    text
                    size="small"
                    onClick={() => handleDownload(rowData)}
                    tooltip="Descargar"
                    tooltipOptions={{ position: 'left' }}
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    size="small"
                    onClick={() => handleDelete(rowData)}
                    tooltipOptions={{ position: 'left' }}
                    tooltip="Eliminar"
                />
            </div>
        );
    };

    const tipoDocumentoBodyTemplate = (rowData: any) => {
        return (
            <Tag 
                value={rowData.tipo || 'Sin clasificar'} 
                severity="info"
            />
        );
    };

    const fechaBodyTemplate = (rowData: any) => {
        return rowData.fecha_creacion
            ? new Date(rowData.fecha_creacion).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              }).replace('.', '')
            : 'No disponible';
    };

    const sizeBodyTemplate = (rowData: any) => {
        if (rowData.tamanio) {
            const size = rowData.tamanio;
            if (size < 1024) return `${size} B`;
            if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
            return `${Math.round(size / (1024 * 1024))} MB`;
        }
        return 'N/A';
    };

    const headerTemplate = () => {
        return (
            <div className="flex align-items-center justify-content-between mb-3">
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-cloud-upload text-primary text-lg"></i>
                    <span className="font-semibold">Subir Documento</span>
                </div>
                <Dropdown
                    value={selectedTipo}
                    onChange={(e) => setSelectedTipo(e.value)}
                    options={tiposDocumento}
                    optionLabel="nombre"
                    placeholder="Tipo de documento"
                    className="w-12rem"
                    disabled={uploading}
                />
            </div>
        );
    };

    const customHeader = (
        <div className="flex align-items-center gap-2 py-2">
            <i className="pi pi-folder-open text-xl text-primary-600"></i>
            <h5 className="m-0 text-xl font-semibold text-primary-800">
                Documentos
            </h5>
        </div>
    );

    const emptyTemplate = () => {
        return (
            <div className="flex align-items-center justify-content-center flex-column gap-3 p-4 text-center">
                <i className="pi pi-cloud-upload text-4xl text-300"></i>
                <div className="flex flex-column gap-2">
                    <p className="text-700 m-0 font-medium text-sm">
                        {!selectedTipo 
                            ? 'Seleccione un tipo de documento para comenzar'
                            : 'Arrastre y suelte un archivo aquí'
                        }
                    </p>
                </div>
            </div>
        );
    };

    const itemTemplate = (file: any, props: any) => {
        return (
            <div className="flex align-items-center justify-content-between gap-3 p-3 border-bottom-1 surface-border">
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-file text-xl text-primary-600"></i>
                    <div className="flex flex-column">
                        <span className="font-medium">{file.name}</span>
                        <small className="text-500">{props.formatSize}</small>
                    </div>
                </div>
                <div className="flex gap-2">
                    {selectedTipo && (
                        <Tag 
                            value={selectedTipo.nombre} 
                            severity="info"
                        />
                    )}
                    <Button 
                        icon="pi pi-times" 
                        rounded 
                        text 
                        severity="danger" 
                        size="small"
                        onClick={props.onRemove}
                        tooltip="Remover archivo"
                    />
                </div>
            </div>
        );
    };

    return (
        <Sidebar
            visible={visible}
            onHide={onHide}
            header={customHeader}
            modal={true}
            dismissable={false}
            position="right"
            className="w-full md:w-8 lg:w-6"
            pt={{
                header: { className: 'border-bottom-1 surface-border' },
                content: { className: 'p-0' }
            }}
        >
            <div className="flex flex-column h-full">
                <div className="p-4 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
                    {/* Sección de subida de archivos */}
                    <div className="mb-4">
                        <div className="p-3 border-round bg-primary-50 dark:bg-primary-900 mb-3">
                            <h2 className="text-lg font-semibold text-primary-800 dark:text-primary-100 m-0">
                                Subir Nuevo Documento
                            </h2>
                        </div>
                        
                        {loading ? (
                            <div className="flex justify-content-center p-4">
                                <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="3" />
                            </div>
                        ) : (
                            <div className="border-1 border-round surface-border p-3">
                                <div className="mb-3">
                                    <Dropdown
                                        value={selectedTipo}
                                        onChange={(e) => setSelectedTipo(e.value)}
                                        options={tiposDocumento}
                                        optionLabel="nombre"
                                        placeholder="Seleccione tipo de documento"
                                        className="w-full"
                                        disabled={uploading}
                                    />
                                </div>
                                <FileUpload
                                    ref={fileUploadRef}
                                    name="document"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    maxFileSize={20000000} // 20MB
                                    disabled={!selectedTipo || uploading}
                                    customUpload
                                    uploadHandler={handleUpload}
                                    emptyTemplate={emptyTemplate}
                                    itemTemplate={itemTemplate}
                                    chooseLabel="Seleccionar Archivo"
                                    uploadLabel="Subir"
                                    cancelLabel="Cancelar"
                                    auto={false}
                                    multiple={false}
                                    className="w-full"
                                    pt={{
                                        root: { 
                                            className: !selectedTipo 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'border-1 border-round border-dashed border-300 hover:border-400 transition-colors'
                                        },
                                        buttonbar: {
                                            className: 'border-none p-0 bg-transparent'
                                        },
                                        content: { 
                                            className: 'border-none p-0'
                                        },
                                        chooseButton: {
                                            className: 'p-button-outlined p-button-primary p-button-sm'
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Lista de documentos existentes */}
                    <div className="mb-4">
                        <div className="p-3 border-round bg-blue-50 dark:bg-blue-900 mb-3">
                            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-100 m-0">
                                Documentos Existentes ({documentos.length})
                            </h2>
                        </div>
                        
                        <div className="border-1 border-round surface-border">
                            <DataTable
                                value={documentos}
                                emptyMessage="No hay documentos registrados para esta actividad"
                                className="p-datatable-sm"
                                stripedRows
                                showGridlines
                                pt={{
                                    wrapper: { className: 'border-none' },
                                    header: { className: 'hidden' }
                                }}
                            >
                                <Column 
                                    field="nombre_original" 
                                    header="Archivo"
                                    style={{ minWidth: '250px' }}
                                />
                                <Column 
                                    field="tipo" 
                                    header="Tipo documento"
                                    body={tipoDocumentoBodyTemplate}
                                    style={{ width: '200px' }}
                                />
                                <Column 
                                    field="tamanio" 
                                    header="Tamaño"
                                    body={sizeBodyTemplate}
                                    style={{ width: '80px' }}
                                />
                                <Column 
                                    field="fecha_creacion" 
                                    header="Fecha"
                                    body={fechaBodyTemplate}
                                    style={{ width: '100px' }}
                                />
                                <Column 
                                    body={actionBodyTemplate}
                                    header="Acciones"
                                    style={{ width: '100px' }}
                                    headerStyle={{ textAlign: 'center' }}
                                    bodyStyle={{ textAlign: 'center' }}
                                />
                            </DataTable>
                        </div>
                    </div>
                </div>

                <div className="mt-auto border-top-1 surface-border p-4">
                    <div className="flex justify-content-end">
                        <Button 
                            label="Cerrar" 
                            icon="pi pi-times"
                            outlined
                            onClick={onHide}
                        />
                    </div>
                </div>
            </div>
        </Sidebar>
    );
};

export default RepositorioDocumentos;
