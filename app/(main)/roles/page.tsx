"use client";
import React, { useState } from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import dynamic from "next/dynamic";
import { PermisoNode } from "./componentes/FormularioRol";
import { InputText } from "primereact/inputtext";
import { TreeTable } from "primereact/treetable";
import { Column } from "primereact/column";
import { TreeNode } from "primereact/treenode";

// Nuevo árbol de permisos más realista y anidado
const permisosTree: PermisoNode[] = [
	{
		key: "configuracion",
		label: "Configuración",
		children: [
			{
				key: "catalogos",
				label: "Catálogos",
				children: [
				
					// Nuevos subcatálogos
					{
						key: "autoridades",
						label: "Autoridades",
						children: [
							{ key: "autoridades.list", label: "Listar" },
							{ key: "autoridades.create", label: "Agregar" },
							{ key: "autoridades.edit", label: "Editar" },
							{ key: "autoridades.delete", label: "Eliminar" },
						],
					},
					{
						key: "beneficiarios",
						label: "Beneficiarios",
						children: [
							{ key: "beneficiarios.list", label: "Listar" },
							{ key: "beneficiarios.create", label: "Agregar" },
							{ key: "beneficiarios.edit", label: "Editar" },
							{ key: "beneficiarios.delete", label: "Eliminar" },
						],
					},
					{
						key: "capacitadores",
						label: "Capacitadores",
						children: [
							{ key: "capacitadores.list", label: "Listar" },
							{ key: "capacitadores.create", label: "Agregar" },
							{ key: "capacitadores.edit", label: "Editar" },
							{ key: "capacitadores.delete", label: "Eliminar" },
						],
					},
					{
						key: "departamentos",
						label: "Departamentos",
						children: [
							{ key: "departamentos.list", label: "Listar" },
							{ key: "departamentos.create", label: "Agregar" },
							{ key: "departamentos.edit", label: "Editar" },
							{ key: "departamentos.delete", label: "Eliminar" },
						],
					},
					{
						key: "tipos_actividad",
						label: "Tipos de actividad",
						children: [
							{ key: "tipos_actividad.list", label: "Listar" },
							{ key: "tipos_actividad.create", label: "Agregar" },
							{ key: "tipos_actividad.edit", label: "Editar" },
							{ key: "tipos_actividad.delete", label: "Eliminar" },
						],
					},
					{
						key: "tipos_documento",
						label: "Tipos de documento",
						children: [
							{ key: "tipos_documento.list", label: "Listar" },
							{ key: "tipos_documento.create", label: "Agregar" },
							{ key: "tipos_documento.edit", label: "Editar" },
							{ key: "tipos_documento.delete", label: "Eliminar" },
						],
					},
					{
						key: "tipos_proyecto",
						label: "Tipos de proyecto",
						children: [
							{ key: "tipos_proyecto.list", label: "Listar" },
							{ key: "tipos_proyecto.create", label: "Agregar" },
							{ key: "tipos_proyecto.edit", label: "Editar" },
							{ key: "tipos_proyecto.delete", label: "Eliminar" },
						],
					},
				],
			},
			{
				key: "roles",
				label: "Roles de usuario",
				children: [
					{ key: "roles.create", label: "Agregar" },
					{ key: "roles.edit", label: "Editar" },
					{ key: "roles.delete", label: "Eliminar" },
				],
			},
			{
				key: "personas",
				label: "Personas",
				children: [
					{ key: "personas.create", label: "Agregar" },
					{ key: "personas.edit", label: "Editar" },
					{ key: "personas.delete", label: "Eliminar" },
				],
			},
		],
	},
	{
		key: "proyectos",
		label: "Proyectos y actividades",
		children: [
			{ key: "proyectos.create", label: "Agregar" },
			{ key: "proyectos.edit", label: "Editar" },
			{ key: "proyectos.delete", label: "Eliminar" },
			{ key: "proyectos.actividades", label: "Actividades" },
		],
	},
	{
		key: "reportes",
		label: "Reportes",
		children: [
			{ key: "reportes.view", label: "Ver reportes" },
			{ key: "reportes.export", label: "Exportar" },
		],
	},
];

const initialRoles: {
	id: number;
	nombre: string;
	permisos: string[];
	color: "primary" | "info" | "success";
}[] = [
	{
		id: 1,
		nombre: "Administrador",
		permisos: ["dashboard", "usuarios", "configuracion"],
		color: "primary",
	},
	{ id: 2, nombre: "Editor", permisos: ["dashboard.view", "usuarios.edit"], color: "info" },
	{ id: 3, nombre: "Consulta", permisos: ["dashboard.view"], color: "success" },
];

interface Role {
	id: number;
	nombre: string;
	permisos: string[];
	color: "primary" | "info" | "success";
}

// Utilidad para aplanar todos los permisos hoja (leaf) con su path completo
function flattenRBAC(tree: PermisoNode[], parentPath: string[] = []): { path: string[]; key: string; label: string }[] {
	let result: { path: string[]; key: string; label: string }[] = [];
	for (const node of tree) {
		const currentPath = [...parentPath, node.label];
		if (node.children && node.children.length > 0) {
			result = result.concat(flattenRBAC(node.children, currentPath));
		} else {
			result.push({ path: currentPath, key: node.key, label: node.label });
		}
	}
	return result;
}

// Utilidad para convertir PermisoNode[] a TreeNode[] para TreeTable
function permisoNodesToTreeNodes(nodes: PermisoNode[]): TreeNode[] {
	return nodes.map((node) => ({
		key: node.key,
		data: { label: node.label, isTitle: !node.children || node.children.length === 0 ? false : true },
		children: node.children ? permisoNodesToTreeNodes(node.children) : undefined,
	}));
}

// Renderiza una matriz RBAC: módulos (primer nivel) como columnas, acciones (CRUD) como filas, submódulos agrupados
function getRBACMatrix(
	permisosTree: PermisoNode[],
	rolPermisos: string[],
	onPermChange: (permKey: string, checked: boolean) => void
) {
	// Agrupa por módulo y acción
	const flat = flattenRBAC(permisosTree);
	// Encuentra todos los módulos (primer nivel)
	const modulos = permisosTree.map((m) => m.label);
	// Encuentra todas las acciones (CRUD) posibles
	const acciones = Array.from(new Set(flat.map((p) => p.label)));
	// Agrupa por submódulo si existe (segundo nivel)
	const submodulos: { modulo: string; submodulo?: string }[] = [];
	permisosTree.forEach((modulo) => {
		if (modulo.children) {
			modulo.children.forEach((sub) => {
				if (sub.children) {
					submodulos.push({ modulo: modulo.label, submodulo: sub.label });
				} else {
					submodulos.push({ modulo: modulo.label });
				}
			});
		}
	});
	// Agrupa por submódulo para filas
	const filas: { modulo: string; submodulo?: string; acciones: { key: string; label: string }[] }[] = [];
	permisosTree.forEach((modulo) => {
		if (modulo.children) {
			modulo.children.forEach((sub) => {
				if (sub.children) {
					filas.push({
						modulo: modulo.label,
						submodulo: sub.label,
						acciones: sub.children.map((perm) => ({ key: perm.key, label: perm.label })),
					});
				} else {
					filas.push({
						modulo: modulo.label,
						acciones: [{ key: sub.key, label: sub.label }],
					});
				}
			});
		}
	});
	// También agrega los permisos directos bajo módulo (sin submódulo)
	permisosTree.forEach((modulo) => {
		if (modulo.children) {
			const directPerms = modulo.children.filter((sub) => !sub.children);
			if (directPerms.length > 0) {
				filas.push({ modulo: modulo.label, acciones: directPerms.map((perm) => ({ key: perm.key, label: perm.label })) });
			}
		}
	});
	return (
		<div className="overflow-x-auto">
			<table className="w-full border-separate border-spacing-0">
				{/* Header eliminado para diseño más limpio */}
				<tbody>
					{filas.map((fila, idx) => (
						fila.acciones.map((accion, i) => (
							<tr key={fila.modulo + (fila.submodulo || "") + accion.key}>
								{i === 0 && (
									<td rowSpan={fila.acciones.length} className="px-2 py-2 text-sm text-gray-700 bg-white border-bottom-1 surface-border align-top">
										{fila.modulo}
									</td>
								)}
								{i === 0 && (
									<td rowSpan={fila.acciones.length} className="px-2 py-2 text-sm text-gray-700 bg-white border-bottom-1 surface-border align-top">
										{fila.submodulo || "-"}
									</td>
								)}
								<td className="px-2 py-2 text-sm text-gray-700 bg-white border-bottom-1 surface-border">{accion.label}</td>
								<td className="text-center align-middle bg-white border-bottom-1 surface-border">
									<label className="inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={rolPermisos.includes(accion.key)}
											onChange={e => onPermChange(accion.key, e.target.checked)}
											className="hidden"
										/>
										<span className={`w-6 h-6 flex items-center justify-center rounded border transition-all duration-150 ${rolPermisos.includes(accion.key) ? 'bg-violet-500 border-violet-500' : 'bg-gray-100 border-gray-300'}`}>
											{rolPermisos.includes(accion.key) && <i className="pi pi-check text-white text-xs"></i>}
										</span>
									</label>
								</td>
							</tr>
						))
					))}
				</tbody>
			</table>
		</div>
	);
}

function PermisosTreeTable({
	permisosTree,
	selectedKeys,
	onSelectionChange,
}: {
	permisosTree: PermisoNode[];
	selectedKeys: { [key: string]: boolean };
	onSelectionChange: (keys: { [key: string]: boolean }) => void;
}) {
	const treeNodes = permisoNodesToTreeNodes(permisosTree);
	const handleSelectionChange = (e: any) => {
		const raw = e.value || {};
		const clean: { [key: string]: boolean } = {};
		Object.keys(raw).forEach(k => {
			clean[k] = !!raw[k] && (typeof raw[k] === 'boolean' ? raw[k] : raw[k].checked === true);
		});
		onSelectionChange(clean);
	};
	const nodeTemplate = (node: any) => {
		const label = node.data?.label || node.label;
		if (node.data.isTitle) {
			return <span className="font-semibold text-primary-700 text-base">{label}</span>;
		}
		return <span className="text-sm text-gray-800">{label}</span>;
	};
	return (
		<div className="bg-white p-0">
			<style>{`.p-treetable-thead { display: none !important; }`}</style>
			<TreeTable
				value={treeNodes}
				selectionMode="checkbox"
				selectionKeys={selectedKeys}
				onSelectionChange={handleSelectionChange}
				scrollable
				style={{ minWidth: 400 }}
				className="p-treetable-sm border-none shadow-none"
				tableStyle={{ borderCollapse: 'separate', borderSpacing: 0 }}
			>
				<Column
					field="label"
					header={null}
					expander
					body={nodeTemplate}
				/>
			</TreeTable>
		</div>
	);
}

export default function RolesPage() {
	const [roles, setRoles] = useState<Role[]>(initialRoles);
	const [expanded, setExpanded] = useState<{ [id: number]: boolean }>({});
	const [nuevoRol, setNuevoRol] = useState("");
	const [permisosSeleccionados, setPermisosSeleccionados] = useState<{ [roleId: number]: { [key: string]: boolean } }>({});

	// Sincroniza los permisos seleccionados con el estado de roles
	React.useEffect(() => {
		const map: { [roleId: number]: { [key: string]: boolean } } = {};
		roles.forEach(role => {
			map[role.id] = {};
			role.permisos.forEach(key => { map[role.id][key] = true; });
		});
		setPermisosSeleccionados(map);
	}, [roles]);

	const toggleExpand = (id: number) => {
		setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const handleDelete = (role: Role) => {
		setRoles((prev) => prev.filter((r) => r.id !== role.id));
	};

	const handlePermChange = (roleId: number, permKey: string, checked: boolean) => {
		setRoles(prev => prev.map(role => {
			if (role.id !== roleId) return role;
			const permisos = checked
				? Array.from(new Set([...role.permisos, permKey]))
				: role.permisos.filter(p => p !== permKey);
			return { ...role, permisos };
		}));
	};

	const handleAddRol = () => {
		if (nuevoRol.trim()) {
			setRoles(prev => [
				...prev,
				{ id: Date.now(), nombre: nuevoRol.trim(), permisos: [], color: "info" },
			]);
			setNuevoRol("");
		}
	};

	const handlePermTreeChange = (roleId: number, keys: { [key: string]: boolean }) => {
		setPermisosSeleccionados(prev => ({ ...prev, [roleId]: keys }));
		setRoles(prev => prev.map(role => {
			if (role.id !== roleId) return role;
			return { ...role, permisos: Object.keys(keys).filter(k => keys[k]) };
		}));
	};

	return (
		<div className="grid">
			<div className="col-12 md:col-8 mx-auto">
				<div className="w-full max-w-2xl flex flex-column gap-4">
					<div className="flex align-items-center justify-content-between mb-2">
						<h2 className="text-2xl font-bold text-primary m-0">Roles</h2>
						<span className="flex gap-2">
							<InputText value={nuevoRol} onChange={e => setNuevoRol(e.target.value)} placeholder="Nuevo rol..." />
							<Button icon="pi pi-plus" onClick={handleAddRol} disabled={!nuevoRol.trim()} />
						</span>
					</div>
					<div className="flex flex-column gap-4">
						{roles.length === 0 && (
							<div className="text-center text-gray-500 py-6">
								<i className="pi pi-users text-5xl mb-3"></i>
								<p>No hay roles registrados.</p>
							</div>
						)}
						{roles.map((role) => (
							<div
								key={role.id}
								className="border-round-lg shadow-1 border-1 surface-border bg-white"
							>
								<div className="flex align-items-center justify-content-between px-4 py-3 border-bottom-1 surface-border cursor-pointer select-none"
									onClick={() => toggleExpand(role.id)}
								>
									<div className="flex align-items-center gap-2">
										<Tag
											value={role.nombre}
											severity={role.color === "primary" ? "info" : role.color}
											className="text-base px-3 py-1"
										/>
									</div>
									<div className="flex gap-2 align-items-center">
										<Button
											icon="pi pi-trash"
											rounded
											text
											size="small"
											severity="danger"
											onClick={e => { e.stopPropagation(); handleDelete(role); }}
										/>
										<Button
											icon={expanded[role.id] ? "pi pi-chevron-up" : "pi pi-chevron-down"}
											rounded
											text
											size="small"
											aria-label={expanded[role.id] ? "Colapsar" : "Expandir"}
											onClick={e => { e.stopPropagation(); toggleExpand(role.id); }}
										/>
									</div>
								</div>
								{expanded[role.id] && (
									<div className="p-4 border-top-1 surface-border animate__animated animate__fadeIn">
										<PermisosTreeTable
											permisosTree={permisosTree}
											selectedKeys={permisosSeleccionados[role.id] || {}}
											onSelectionChange={keys => handlePermTreeChange(role.id, keys)}
										/>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
