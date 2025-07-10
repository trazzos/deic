import { useState } from 'react';
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

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
    onUploadDocuments?: (files: any[], tipoDocumento: any) => Promise<void>;
    onRemoveDocument?: (file: any) => Promise<void>;
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
    prioridades,
    onUploadDocuments,
    onRemoveDocument
 }: FormularioActividadProps) => {
   
    const customHeader = (
        <div className="flex align-items-center gap-2 py-2">
            <i className="pi pi-calendar-plus text-xl text-primary-600"></i>
            <h5 className="m-0 text-xl font-semibold text-primary-800">
                {initialData?.uuid ? 'Actualizar actividad' : 'Nueva actividad'}
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
            className="w-full md:w-8 lg:w-6"
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
                                    Información Principal
                                </h2>
                            </div>
                            <div className="grid">
                                <div className="col-12 md:col-4 flex flex-column gap-2">
                                    <label htmlFor="nombre" className="font-medium">Nombre <span className="text-red-600">*</span></label>
                                    <InputText
                                        id="nombre" 
                                        name="nombre"
                                        value={initialData.nombre || ''} 
                                        onChange={(e) => setFieldValue(e.target.name, e.target.value)} 
                                        className={errors.nombre ? 'p-invalid' : ''}
                                    />
                                    {errors.nombre && <small className="p-error">{errors.nombre}</small>}
                                </div>

                                <div className="col-12 md:col-4 flex flex-column gap-2">
                                    <label htmlFor="tipo-actividad" className="font-medium">Tipo actividad <span className="text-red-600">*</span></label>
                                    <Dropdown 
                                        id="tipo-actividad" 
                                        name="tipo_actividad_id"
                                        value={initialData.tipo_actividad_id} 
                                        options={tiposActividad || []} 
                                        optionLabel="nombre" 
                                        optionValue="id"
                                        onChange={(e) => setFieldValue(e.target.name, e.value)} 
                                        className={errors.tipo_actividad_id ? 'p-invalid' : ''}
                                        placeholder="Seleccione un tipo"
                                    />
                                    {errors.tipo_actividad_id && <small className="p-error">{errors.tipo_actividad_id}</small>}
                                </div>

                                <div className="col-12 md:col-4 flex flex-column gap-2">
                                    <label htmlFor="prioridad" className="font-medium">Prioridad <span className="text-red-600">*</span></label>
                                    <Dropdown
                                        id="prioridad" 
                                        name="prioridad"
                                        value={initialData.prioridad} 
                                        options={prioridades}
                                        optionLabel="label"
                                        optionValue="value"
                                        className={errors.prioridad ? 'p-invalid' : ''}
                                        placeholder="Seleccione prioridad"
                                    />
                                    {errors.prioridad && <small className="p-error">{errors.prioridad}</small>}
                                </div>
                            </div>
                        </div>

                        {/* Sección de Participantes */}
                        <div className="col-12 mb-4">
                            <div className="p-3 border-round bg-orange-50 dark:bg-orange-900 mb-3">
                                <h2 className="text-lg font-semibold text-orange-800 dark:text-orange-100 m-0">
                                    Participantes
                                </h2>
                            </div>
                            <div className="grid">
                                <div className="col-12 md:col-4 flex flex-column gap-2">
                                    <label htmlFor="responsable" className="font-medium">Responsable <span className="text-red-600">*</span></label>
                                    <Dropdown 
                                        id="responsable" 
                                        name="responsable_id"
                                        value={initialData.responsable_id} 
                                        options={responsables || []} 
                                        optionLabel="nombre" 
                                        optionValue="id"
                                        onChange={(e) => setFieldValue(e.target.name, e.value)} 
                                        className={errors.responsable_id ? 'p-invalid' : ''}
                                        placeholder="Seleccione responsable"
                                    />
                                    {errors.responsable_id && <small className="p-error">{errors.responsable_id}</small>}
                                </div>

                                <div className="col-12 md:col-4 flex flex-column gap-2">
                                    <label htmlFor="capacitador" className="font-medium">Capacitador <span className="text-red-600">*</span></label>
                                    <Dropdown 
                                        id="capacitador" 
                                        name="capacitador_id"
                                        value={initialData.capacitador_id} 
                                        options={capacitadores || []} 
                                        optionLabel="nombre" 
                                        optionValue="id"
                                        onChange={(e) => setFieldValue(e.target.name, e.value)} 
                                        className={errors.capacitador_id ? 'p-invalid' : ''}
                                        placeholder="Seleccione capacitador"
                                    />
                                    {errors.capacitador_id && <small className="p-error">{errors.capacitador_id}</small>}
                                </div>

                                <div className="col-12 md:col-4 flex flex-column gap-2">
                                    <label htmlFor="autoridad" className="font-medium">Autoridades <span className="text-red-600">*</span></label>
                                    <MultiSelect
                                        id="autoridad" 
                                        showClear
                                        name="autoridad_participante"
                                        value={initialData.autoridad_participante} 
                                        onChange={(e:any) => setFieldValue(e.target.name, e.value)} 
                                        options={autoridades}
                                        optionLabel="nombre"
                                        optionValue="id"
                                        className={errors.autoridad_participante ? 'p-invalid' : ''}
                                        placeholder="Seleccione autoridades"
                                    />
                                    {errors.autoridad_participante && <small className="p-error">{errors.autoridad_participante}</small>}
                                </div>
                            </div>
                        </div>

                        {/* Sección de Beneficiarios */}
                        <div className="col-12 mb-4">
                            <div className="p-3 border-round bg-green-50 dark:bg-green-900 mb-3">
                                <h2 className="text-lg font-semibold text-green-800 dark:text-green-100 m-0">
                                    Información del Beneficiario
                                </h2>
                            </div>
                            <div className="grid">
                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="beneficiario" className="font-medium">Beneficiario <span className="text-red-600">*</span></label>
                                    <Dropdown 
                                        id="beneficiario" 
                                        name="beneficiario_id"
                                        value={initialData.beneficiario_id} 
                                        options={beneficiarios || []} 
                                        optionLabel="nombre" 
                                        optionValue="id"
                                        onChange={(e) => setFieldValue(e.target.name, e.value)} 
                                        className={errors.beneficiario_id ? 'p-invalid' : ''}
                                        placeholder="Seleccione beneficiario"
                                    />
                                    {errors.beneficiario_id && <small className="p-error">{errors.beneficiario_id}</small>}
                                </div>

                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="persona_beneficiada" className="font-medium">Persona beneficiada <span className="text-red-600">*</span></label>
                                    <Dropdown
                                        id="persona_beneficiada" 
                                        name="persona_beneficiada"
                                        value={initialData.persona_beneficiada} 
                                        onChange={(e) => setFieldValue(e.target.name, e.value)} 
                                        options={tiposBeneficiados}
                                        optionLabel="label"
                                        optionValue="value"
                                        className={errors.persona_beneficiada ? 'p-invalid' : ''}
                                        placeholder="Seleccione beneficiado"
                                    />
                                    {errors.persona_beneficiada && <small className="p-error">{errors.persona_beneficiada}</small>}
                                </div>
                            </div>
                        </div>

                        {/* Sección de Fechas */}
                        <div className="col-12 mb-4">
                            <div className="p-3 border-round bg-blue-50 dark:bg-blue-900 mb-3">
                                <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-100 m-0">
                                    Fechas
                                </h2>
                            </div>
                            <div className="grid">
                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="fecha_inicio" className="font-medium">Fecha inicio <span className="text-red-600">*</span></label>
                                    <Calendar
                                        id="fecha_inicio" 
                                        name="fecha_inicio"
                                        value={
                                            initialData.fecha_inicio
                                                ? (typeof initialData.fecha_inicio === 'string'
                                                    ? new Date(initialData.fecha_inicio.replace(/-/g, '/'))
                                                    : initialData.fecha_inicio)
                                                : null
                                        }
                                        onChange={(e) => setFieldValue(e.target.name, e.value)} 
                                        className={errors.fecha_inicio ? 'p-invalid' : ''}
                                        placeholder="Seleccione fecha"
                                        showIcon
                                    />
                                    {errors.fecha_inicio && <small className="p-error">{errors.fecha_inicio}</small>}
                                </div>

                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="fecha_fin" className="font-medium">Fecha fin <span className="text-red-600">*</span></label>
                                    <Calendar
                                        id="fecha_fin" 
                                        name="fecha_fin"
                                        value={
                                            initialData.fecha_fin
                                                ? (typeof initialData.fecha_fin === 'string'
                                                    ? new Date(initialData.fecha_fin.replace(/-/g, '/'))
                                                    : initialData.fecha_fin)
                                                : null
                                        }
                                        onChange={(e) => setFieldValue(e.target.name, e.value)} 
                                        className={errors.fecha_fin ? 'p-invalid' : ''}
                                        placeholder="Seleccione fecha"
                                        showIcon
                                    />
                                    {errors.fecha_fin && <small className="p-error">{errors.fecha_fin}</small>}
                                </div>

                                {/* Nuevos campos de fechas opcionales */}
                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="fecha_solicitud_constancia" className="font-medium">Fecha solicitud constancia</label>
                                    <Calendar
                                        id="fecha_solicitud_constancia"
                                        name="fecha_solicitud_constancia"
                                        value={initialData.fecha_solicitud_constancia ? (typeof initialData.fecha_solicitud_constancia === 'string' ? new Date(initialData.fecha_solicitud_constancia.replace(/-/g, '/')) : initialData.fecha_solicitud_constancia) : null}
                                        onChange={(e) => setFieldValue(e.target.name, e.value)}
                                        placeholder="Seleccione fecha"
                                        showIcon
                                    />
                                </div>
                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="fecha_envio_constancia" className="font-medium">Fecha envío constancia</label>
                                    <Calendar
                                        id="fecha_envio_constancia"
                                        name="fecha_envio_constancia"
                                        value={initialData.fecha_envio_constancia ? (typeof initialData.fecha_envio_constancia === 'string' ? new Date(initialData.fecha_envio_constancia.replace(/-/g, '/')) : initialData.fecha_envio_constancia) : null}
                                        onChange={(e) => setFieldValue(e.target.name, e.value)}
                                        placeholder="Seleccione fecha"
                                        showIcon
                                    />
                                </div>
                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="fecha_vencimiento_envio_encuesta" className="font-medium">Fecha vencimiento envío encuesta</label>
                                    <Calendar
                                        id="fecha_vencimiento_envio_encuesta"
                                        name="fecha_vencimiento_envio_encuesta"
                                        value={initialData.fecha_vencimiento_envio_encuesta ? (typeof initialData.fecha_vencimiento_envio_encuesta === 'string' ? new Date(initialData.fecha_vencimiento_envio_encuesta.replace(/-/g, '/')) : initialData.fecha_vencimiento_envio_encuesta) : null}
                                        onChange={(e) => setFieldValue(e.target.name, e.value)}
                                        placeholder="Seleccione fecha"
                                        showIcon
                                    />
                                </div>
                                {/* Solo mostrar fecha_envio_encuesta si hay fecha_vencimiento_envio_encuesta y ya se ha enviado */}
                                {initialData.fecha_vencimiento_envio_encuesta && initialData.fecha_envio_encuesta && (
                                    <div className="col-12 md:col-6 flex flex-column gap-2">
                                        <label htmlFor="fecha_envio_encuesta" className="font-medium">Fecha envío encuesta</label>
                                        <Calendar
                                            id="fecha_envio_encuesta"
                                            name="fecha_envio_encuesta"
                                            value={initialData.fecha_envio_encuesta ? (typeof initialData.fecha_envio_encuesta === 'string' ? new Date(initialData.fecha_envio_encuesta.replace(/-/g, '/')) : initialData.fecha_envio_encuesta) : null}
                                            onChange={(e) => setFieldValue(e.target.name, e.value)}
                                            placeholder="Seleccione fecha"
                                            showIcon
                                        />
                                    </div>
                                )}
                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="fecha_inicio_difusion_banner" className="font-medium">Fecha inicio difusión banner</label>
                                    <Calendar
                                        id="fecha_inicio_difusion_banner"
                                        name="fecha_inicio_difusion_banner"
                                        value={initialData.fecha_inicio_difusion_banner ? (typeof initialData.fecha_inicio_difusion_banner === 'string' ? new Date(initialData.fecha_inicio_difusion_banner.replace(/-/g, '/')) : initialData.fecha_inicio_difusion_banner) : null}
                                        onChange={(e) => setFieldValue(e.target.name, e.value)}
                                        placeholder="Seleccione fecha"
                                        showIcon
                                    />
                                </div>
                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="fecha_fin_difusion_banner" className="font-medium">Fecha fin difusión banner</label>
                                    <Calendar
                                        id="fecha_fin_difusion_banner"
                                        name="fecha_fin_difusion_banner"
                                        value={initialData.fecha_fin_difusion_banner ? (typeof initialData.fecha_fin_difusion_banner === 'string' ? new Date(initialData.fecha_fin_difusion_banner.replace(/-/g, '/')) : initialData.fecha_fin_difusion_banner) : null}
                                        onChange={(e) => setFieldValue(e.target.name, e.value)}
                                        placeholder="Seleccione fecha"
                                        showIcon
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección de Enlaces */}
                        <div className="col-12 mb-4">
                            <div className="p-3 border-round bg-purple-50 dark:bg-purple-900 mb-3">
                                <h2 className="text-lg font-semibold text-purple-800 dark:text-purple-100 m-0">
                                    Enlaces
                                </h2>
                            </div>
                            <div className="grid">
                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="link_zoom" className="font-medium">Link de zoom</label>
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon">
                                            <i className="pi pi-video"></i>
                                        </span>
                                        <InputText
                                            id="link_zoom" 
                                            name="link_zoom"
                                            value={initialData.link_zoom || ''} 
                                            onChange={(e) => setFieldValue(e.target.name, e.target.value)} 
                                            className={errors.link_zoom ? 'p-invalid' : ''}
                                            placeholder="https://zoom.us/..."
                                        />
                                    </div>
                                    {errors.link_zoom && <small className="p-error">{errors.link_zoom}</small>}
                                </div>

                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="link_registro" className="font-medium">Link de registro</label>
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon">
                                            <i className="pi pi-user-plus"></i>
                                        </span>
                                        <InputText
                                            id="link_registro" 
                                            name="link_registro"
                                            value={initialData.link_registro || ''} 
                                            onChange={(e) => setFieldValue(e.target.name, e.target.value)} 
                                            className={errors.link_registro ? 'p-invalid' : ''}
                                            placeholder="https://forms...."
                                        />
                                    </div>
                                    {errors.link_registro && <small className="p-error">{errors.link_registro}</small>}
                                </div>

                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="link_drive" className="font-medium">Link drive</label>
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon">
                                            <i className="pi pi-folder"></i>
                                        </span>
                                        <InputText
                                            id="link_drive" 
                                            name="link_drive"
                                            value={initialData.link_drive || ''} 
                                            onChange={(e) => setFieldValue(e.target.name, e.target.value)} 
                                            className={errors.link_drive ? 'p-invalid' : ''}
                                            placeholder="https://drive.google.com/..."
                                        />
                                    </div>
                                    {errors.link_drive && <small className="p-error">{errors.link_drive}</small>}
                                </div>

                                <div className="col-12 md:col-6 flex flex-column gap-2">
                                    <label htmlFor="link_panelista" className="font-medium">Link panelista</label>
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon">
                                            <i className="pi pi-users"></i>
                                        </span>
                                        <InputText
                                            id="link_panelista" 
                                            name="link_panelista"
                                            value={initialData.link_panelista || ''} 
                                            onChange={(e) => setFieldValue(e.target.name, e.target.value)} 
                                            className={errors.link_panelista ? 'p-invalid' : ''}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    {errors.link_panelista && <small className="p-error">{errors.link_panelista}</small>}
                                </div>
                            </div>
                        </div>

                        {/* Campo registro_nafin después de enlaces */}
                        <div className="col-12 mb-4">
                            <div className="p-3 border-round bg-cyan-50 dark:bg-cyan-900 mb-3">
                                <h2 className="text-lg font-semibold text-cyan-800 dark:text-cyan-100 m-0">
                                    Registro NAFIN
                                </h2>
                            </div>
                            <div className="grid">
                                <div className="col-12 flex flex-column gap-2">
                                    <label htmlFor="registro_nafin" className="font-medium">Registro NAFIN</label>
                                    <InputText
                                        id="registro_nafin"
                                        name="registro_nafin"
                                        value={initialData.registro_nafin || ''}
                                        onChange={(e) => setFieldValue(e.target.name, e.target.value)}
                                        className={errors.registro_nafin ? 'p-invalid' : ''}
                                        placeholder="Registro NAFIN (opcional)"
                                    />
                                    {errors.registro_nafin && <small className="p-error">{errors.registro_nafin}</small>}
                                </div>
                            </div>
                        </div>

                        {/* Sección de Comentarios */}
                        <div className="col-12">
                            <div className="p-3 border-round bg-gray-50 dark:bg-gray-900 mb-3">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 m-0">
                                    Comentarios
                                </h2>
                            </div>
                            <div className="grid">
                                <div className="col-12 flex flex-column gap-2">
                                    <label htmlFor="comentario" className="font-medium">Comentario</label>
                                    <InputTextarea
                                        id="comentario" 
                                        name="comentario"
                                        value={initialData.comentario || ''} 
                                        onChange={(e) => setFieldValue(e.target.name, e.target.value)} 
                                        className={errors.comentario ? 'p-invalid' : ''}
                                        rows={4}
                                        autoResize
                                    />
                                    {errors.comentario && <small className="p-error">{errors.comentario}</small>}
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
                            onClick={() => onHide(false)}
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


export default FormularioActividad;