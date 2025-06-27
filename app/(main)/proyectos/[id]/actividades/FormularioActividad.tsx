import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";

type FormularioActividadProps = {
    visible: boolean;
    onHide: (value?: any) => void;
    onSave: () => Promise<void>;
    initialData: { [key: string]: any };
    errors: { [key: string]: string };
    loading: boolean;
    setFieldValue: (field: string, value: any) => void;
    tiposActividad?: any[];
    beneficiarios?: any[];
    autoridades?: any[];
    responsables?: any[];
    capacitadores?: any[];
    tiposBeneficiados?: any[];
    prioridades?: { label: string; value: string }[];
};

const FormularioActividad = ({ 
    visible, 
    onHide, 
    onSave, 
    initialData, 
    errors, 
    loading, 
    setFieldValue,
    tiposActividad,
    beneficiarios,
    autoridades,
    responsables,
    capacitadores,
    tiposBeneficiados,
    prioridades
 }: FormularioActividadProps) => {
   
    const customHeader  = (
        <div className="flex justify-content-between align-items-center">
            <h5 className="m-0">{ initialData?.uuid ? 'Actualizar actividad' : 'Nueva actividad'}</h5>
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
            header={customHeader}>
            <div className="flex flex-column h-full">
                <div className='flex flex-column justify-content-between gap-4'>
                    <div className="flex flex-column gap-2">
                        <label htmlFor="nombre">Nombre <span className="text-red-600">*</span></label>
                        <input 
                            id="nombre" 
                            name="nombre"
                            type="text" 
                            value={initialData.nombre || ''} 
                            onChange={(e) => setFieldValue(e.target.name, e.target.value)} 
                            className={`p-inputtext ${errors.nombre ? 'p-invalid' : ''}`} />
                        {errors.nombre && <small className="p-error">{errors.nombre}</small>}
                    </div>
                    <div className="flex flex-column gap-2">
                        <label htmlFor="responsable">Responsable <span className="text-red-600">*</span></label>
                        <Dropdown 
                            id="responsable" 
                            name="responsable_id"
                            value={initialData.responsable_id} 
                            options={responsables || []} 
                            optionLabel="nombre" 
                            optionValue="id"
                            onChange={(e) => setFieldValue(e.target.name, e.value)} 
                            className={`w-full ${errors.responsable_id ? 'p-invalid' : ''}`}     
                            placeholder="Seleccione un responsable" />
                        {errors.responsable_id && <small className="p-error">{errors.responsable_id}</small>}
                    </div>
                    <div className="flex flex-column gap-2">
                        <label htmlFor="tipo-actividad">Tipo actividad <span className="text-red-600">*</span></label>
                        <Dropdown 
                            id="tipo-actividad" 
                            name="tipo_actividad_id"
                            value={initialData.tipo_actividad_id} 
                            options={tiposActividad || []} 
                            optionLabel="nombre" 
                            optionValue="id"
                            onChange={(e) => setFieldValue(e.target.name, e.value)} 
                            className={`w-full ${errors.tipo_actividad_id ? 'p-invalid' : ''}`}     
                            placeholder="Seleccione un tipo de actividad" />
                        {errors.tipo_actividad_id && <small className="p-error">{errors.tipo_actividad_id}</small>}
                    </div>
                    <div className="flex flex-column gap-2">
                        <label htmlFor="capacitador">Capacitador <span className="text-red-600">*</span></label>
                        <Dropdown 
                            id="capacitador" 
                            name="capacitador_id"
                            value={initialData.capacitador_id} 
                            options={capacitadores || []} 
                            optionLabel="nombre" 
                            optionValue="id"
                            onChange={(e) => setFieldValue(e.target.name, e.value)} 
                            className={`w-full ${errors.capacitador_id ? 'p-invalid' : ''}`}     
                            placeholder="Seleccione un capacitador" />
                        {errors.capacitador_id && <small className="p-error">{errors.capacitador_id}</small>}
                    </div>
                    <div className="flex flex-column gap-2">
                        <label htmlFor="beneficiario">Beneficiario <span className="text-red-600">*</span></label>
                        <Dropdown 
                            id="beneficiario" 
                            name="beneficiario_id"
                            value={initialData.beneficiario_id} 
                            options={beneficiarios || []} 
                            optionLabel="nombre" 
                            optionValue="id"
                            onChange={(e) => setFieldValue(e.target.name, e.value)} 
                            className={`w-full ${errors.beneficiario_id ? 'p-invalid' : ''}`}     
                            placeholder="Seleccione un tipo de beneficiario" />
                        {errors.beneficiario_id && <small className="p-error">{errors.beneficiario_id}</small>}
                    </div>
                    <div className="flex flex-column gap-2">
                        <label htmlFor="fecha_inicio">Fecha inicio <span className="text-red-600">*</span></label>
                        <Calendar
                            id="fecha_inicio" 
                            name="fecha_inicio"
                            value={initialData.fecha_inicio ? (initialData.fecha_inicio instanceof Date ? initialData.fecha_inicio : new Date(initialData.fecha_inicio?.replace(/-/g, '/'))) : null} 
                            onChange={(e) => setFieldValue(e.target.name, e.value)} 
                            className={`w-full ${errors.fecha_inicio ? 'p-invalid' : ''}`}     
                            placeholder="Seleccione una fecha de inicio" />
                        {errors.fecha_inicio && <small className="p-error">{errors.fecha_inicio}</small>}
                    </div>
                    <div className="flex flex-column gap-2">
                        <label htmlFor="fecha_fin">Fecha fin <span className="text-red-600">*</span></label>
                        <Calendar
                            id="fecha_fin" 
                            name="fecha_fin"
                            value={initialData.fecha_fin ? (initialData.fecha_fin instanceof Date ? initialData.fecha_fin : new Date(initialData.fecha_fin?.replace(/-/g, '/'))) : null} 
                            onChange={(e) => setFieldValue(e.target.name, e.value)} 
                            className={`w-full ${errors.fecha_fin ? 'p-invalid' : ''}`}     
                            placeholder="Seleccione una fecha de fin" />
                        {errors.fecha_fin && <small className="p-error">{errors.fecha_fin}</small>}
                    </div>
                    <div className="flex flex-column gap-2">
                        <label htmlFor="persona_beneficiada">Persona beneficiada <span className="text-red-600">*</span></label>
                        <Dropdown
                            id="persona_beneficiada" 
                            name="persona_beneficiada"
                            value={initialData.persona_beneficiada} 
                            onChange={(e) => setFieldValue(e.target.name, e.value)} 
                            options={tiposBeneficiados}
                            optionLabel="label"
                            optionValue="value"
                            className={`w-full ${errors.persona_beneficiada ? 'p-invalid' : ''}`}     
                            placeholder="Seleccione una persona beneficiada" />
                        {errors.persona_beneficiada && <small className="p-error">{errors.persona_beneficiada}</small>}
                    </div>
                    <div className="flex flex-column gap-2">
                        <label htmlFor="prioridad">Prioridad <span className="text-red-600">*</span></label>
                        <Dropdown
                            id="prioridad" 
                            name="prioridad"
                            value={initialData.prioridad} 
                            onChange={(e) => setFieldValue(e.target.name, e.value)} 
                            options={prioridades}
                            optionLabel="label"
                            optionValue="value"
                            className={`w-full ${errors.prioridad ? 'p-invalid' : ''}`}     
                            placeholder="Seleccione una prioridad" />
                        {errors.prioridad && <small className="p-error">{errors.prioridad}</small>}
                    </div>
                     <div className="flex flex-column gap-2">
                        <label htmlFor="autoridad">Autoridades <span className="text-red-600">*</span></label>
                        <MultiSelect
                            id="autoridad" 
                            showClear={true}
                            name="autoridad_participante"
                            value={initialData.autoridad_participante} 
                            onChange={(e:any) => setFieldValue(e.target.name, e.value)} 
                            options={autoridades}
                            optionLabel="nombre"
                            optionValue="id"
                            className={`w-full ${errors.autoridad_participante ? 'p-invalid' : ''}`}     
                            placeholder="Seleccione una autoridad" />
                        {errors.autoridad_participante && <small className="p-error">{errors.autoridad_participante}</small>}
                    </div>
                </div>
                <div className="mt-auto">
                    <hr className="mb-3 mx-2 border-top-1 border-none surface-border" />
                    <div className='flex justify-content-between align-items-center gap-2'>
                        <Button label="Cancelar" 
                                icon="pi pi-times"
                                severity='danger'
                                disabled={loading} 
                                onClick={() => onHide(false)}>
                        </Button>
                        <Button label="Guardar" 
                                icon="pi pi-save"
                                loading={loading}
                                disabled={loading} 
                                onClick={onSave}></Button>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
};


export default FormularioActividad;