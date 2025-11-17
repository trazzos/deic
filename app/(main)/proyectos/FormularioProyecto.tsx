import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";

type FormularioProyectoProps = {
    visible: boolean;
    onHide: () => void;
    onSave: () => Promise<void>;
    initialData: { [key: string]: any };
    errors: { [key: string]: string };
    loading: boolean;
    setFieldValue: (field: string, value: any) => void;
    tiposProyecto?: any[];
    departamentos?: any[];
};

const FormularioProyecto = ({ 
    visible, 
    onHide, 
    onSave, 
    initialData, 
    errors, 
    loading, 
    setFieldValue,
    tiposProyecto,
    departamentos
}: FormularioProyectoProps) => {
   
    // Verificar si el tipo de proyecto seleccionado es de inversión
    const tipoProyectoSeleccionado = tiposProyecto?.find(tipo => tipo.id == initialData.tipoProyecto);
    const esTipoInversion = tipoProyectoSeleccionado?.nombre?.toLowerCase().includes('inversión') || 
                           tipoProyectoSeleccionado?.nombre?.toLowerCase().includes('inversion');
   
    const customHeader = (
        <div className="flex align-items-center gap-2 py-2">
            <i className="pi pi-folder-plus text-xl text-primary-600"></i>
            <h5 className="m-0 text-xl font-semibold text-primary-800">
                {initialData?.uuid ? 'Actualizar proyecto' : 'Nuevo proyecto'}
            </h5>
        </div>
    );      
   
    return (
        <Sidebar 
            visible={visible} 
            onHide={onHide} 
            modal={true}
            dismissable={false}
            position="right" 
            className="w-full md:w-20rem lg:w-30rem"
            pt={{
                header: { className: 'border-bottom-1 surface-border' },
                content: { className: 'p-0' }
            }}
            header={customHeader}>
            <div className="flex flex-column h-full">
                <div className="p-4 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
                    <div className="grid">
                        {/* Sección de Información Principal */}
                        <div className="col-12 mb-4">
                            <div className="p-3 border-round bg-primary-50 dark:bg-primary-900 mb-3">
                                <h2 className="text-lg font-semibold text-primary-800 dark:text-primary-100 m-0">
                                    Información del Proyecto
                                </h2>
                            </div>
                            <div className="grid">
                                <div className="col-12 flex flex-column gap-2">
                                    <label htmlFor="nombre" className="font-medium">
                                        Nombre <span className="text-red-600">*</span>
                                    </label>
                                    <InputText
                                        id="nombre" 
                                        name="nombre"
                                        value={initialData.nombre || ''} 
                                        onChange={(e) => setFieldValue(e.target.name, e.target.value)} 
                                        className={errors.nombre ? 'p-invalid' : ''}
                                        placeholder="Ingrese el nombre del proyecto"
                                    />
                                    {errors.nombre && <small className="p-error">{errors.nombre}</small>}
                                </div>
                            </div>
                        </div>

                        {/* Sección de Clasificación */}
                        <div className="col-12 mb-4">
                            <div className="p-3 border-round bg-blue-50 dark:bg-blue-900 mb-3">
                                <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-100 m-0">
                                    Clasificación
                                </h2>
                            </div>
                            <div className="grid">
                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="tipoProyecto" className="font-medium">
                                        Tipo de proyecto <span className="text-red-600">*</span>
                                    </label>
                                    <Dropdown 
                                        id="tipoProyecto"
                                        name="tipoProyecto"
                                        filter
                                        filterBy="nombre"
                                        showClear
                                        value={initialData.tipoProyecto}
                                        onChange={(e) => setFieldValue(e.target.name, e.value)}
                                        options={tiposProyecto} 
                                        optionLabel="nombre" 
                                        optionValue="id"
                                        placeholder="Seleccione el tipo" 
                                        className={`w-full ${errors.tipoProyecto ? 'p-invalid' : ''}`}
                                    />
                                    {errors.tipoProyecto && <small className="p-error">{errors.tipoProyecto}</small>}
                                </div>

                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="departamento" className="font-medium">
                                        Departamento <span className="text-red-600">*</span>
                                    </label>
                                    <Dropdown 
                                        id="departamento"
                                        name="departamento"
                                        filter
                                        filterBy="nombre"
                                        showClear
                                        value={initialData.departamento}
                                        onChange={(e) => setFieldValue(e.target.name, e.value)}
                                        options={departamentos} 
                                        optionLabel="nombre" 
                                        optionValue="id"
                                        placeholder="Seleccione el departamento" 
                                        className={`w-full ${errors.departamento ? 'p-invalid' : ''}`}
                                    />
                                    {errors.departamento && <small className="p-error">{errors.departamento}</small>}
                                </div>
                            </div>
                            
                            {/* Campo Monto - Solo visible para proyectos de inversión */}
                            {esTipoInversion && (
                                <div className="grid">
                                    <div className="col-12 flex flex-column gap-2">
                                        <label htmlFor="monto" className="font-medium">
                                            Monto <span className="text-red-600">*</span>
                                        </label>
                                        <InputNumber
                                            id="monto" 
                                            value={initialData.monto || null}
                                            onValueChange={(e) => setFieldValue('monto', e.value)} 
                                            mode="currency"
                                            currency="MXN"
                                            locale="es-MX"
                                            minFractionDigits={2}
                                            maxFractionDigits={2}
                                            className={errors.monto ? 'p-invalid w-full' : 'w-full'}
                                            placeholder="Ingrese el monto del proyecto"
                                        />
                                        {errors.monto && <small className="p-error">{errors.monto}</small>}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Sección de Descripción */}
                        <div className="col-12">
                            <div className="p-3 border-round bg-green-50 dark:bg-green-900 mb-3">
                                <h2 className="text-lg font-semibold text-green-800 dark:text-green-100 m-0">
                                    Descripción
                                </h2>
                            </div>
                            <div className="grid">
                                <div className="col-12 flex flex-column gap-2">
                                    <label htmlFor="descripcion" className="font-medium">
                                        Descripción detallada <span className="text-red-600">*</span>
                                    </label>
                                    <InputTextarea 
                                        id="descripcion"
                                        name="descripcion"
                                        value={initialData.descripcion || ''}
                                        onChange={(e) => setFieldValue(e.target.name, e.target.value)} 
                                        rows={10}
                                        autoResize
                                        className={errors.descripcion ? 'p-invalid' : ''}
                                        placeholder="Describa el proyecto..."
                                    />
                                    {errors.descripcion && <small className="p-error">{errors.descripcion}</small>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto border-top-1 surface-border p-4">
                    <div className="flex justify-content-between align-items-center gap-2">
                        <Button 
                            label="Cancelar" 
                            icon="pi pi-times"
                            severity="danger"
                            outlined
                            disabled={loading} 
                            onClick={onHide}
                        />
                        <Button 
                            label="Guardar" 
                            icon="pi pi-save"
                            loading={loading}
                            disabled={loading} 
                            onClick={onSave}
                        />
                    </div>
                </div>
            </div>
        </Sidebar>
    );
};

export default FormularioProyecto;
