"use client";
import React, { useState, useCallback, useRef } from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { TreeTable } from "primereact/treetable";
import { Column } from "primereact/column";
import { TreeNode } from "primereact/treenode";
import { confirmPopup } from "primereact/confirmpopup";
import { BreadCrumb } from "primereact/breadcrumb";
import { MenuItem } from "primereact/menuitem";

import type { PermisoNode, Role } from '@/types/role';

// Los permisos ahora se cargan desde el servidor
import { useNotification } from '@/layout/context/notificationContext';
import { RoleService } from '@/src/services/catalogos/role';
// componentes
import { PermissionGuard } from '@/src/components/PermissionGuard';
import AccessDenied from "@/src/components/AccessDenied";
// hooks
import { usePermissions } from '@/src/hooks/usePermissions';

// Utilidad para convertir PermisoNode[] a TreeNode[] para TreeTable
function permisoNodesToTreeNodes(nodes: PermisoNode[]): TreeNode[] {
	return nodes.map((node) => ({
		key: node.name,
		data: { 
			label: node.title, 
			name: node.name,
			key: node.key,
			isTitle: node.children && node.children.length > 0 
		},
		children: node.children ? permisoNodesToTreeNodes(node.children) : undefined,
	}));
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

	
	const calculateNodeStates = useCallback((nodes: TreeNode[], selectedKeys: { [key: string]: boolean }): { [key: string]: any } => {
		const result: { [key: string]: any } = {};
		
		const processNode = (node: TreeNode): { checked: boolean; partialChecked: boolean } => {
			const hasChildren = node.children && node.children.length > 0;
			
			if (!hasChildren) {
				
				const isChecked = node.key ? selectedKeys[node.key] === true : false;
				if (isChecked && node.key) {
					result[node.key] = { checked: true };
				}
				return { checked: isChecked, partialChecked: false };
			} else {
				
				const childrenStates = node.children!.map(child => processNode(child));
				
				const allChecked = childrenStates.every(state => state.checked);
				const someChecked = childrenStates.some(state => state.checked || state.partialChecked);
				const noneChecked = !someChecked;
				
				if (allChecked) {
				
					if (node.key) {
						result[node.key] = { checked: true };
					}
					return { checked: true, partialChecked: false };
				} else if (someChecked) {
				
					if (node.key) {
						result[node.key] = { checked: false, partialChecked: true };
					}
					return { checked: false, partialChecked: true };
				} else {
					
					return { checked: false, partialChecked: false };
				}
			}
		};
		
		nodes.forEach(node => processNode(node));
		return result;
	}, []);

	const treeTableSelectedKeys = React.useMemo(() => {
		return calculateNodeStates(treeNodes, selectedKeys);
	}, [selectedKeys, treeNodes, calculateNodeStates]);

	const handleSelectionChange = (e: any) => {
		const raw = e.value || {};
		const clean: { [key: string]: boolean } = {};
		
	
		const extractLeafSelections = (nodes: TreeNode[]) => {
			nodes.forEach(node => {
				if (!node.key) return; 
				const value = raw[node.key];
				const isSelected = value === true || (typeof value === 'object' && value.checked === true);
				
				if (node.children && node.children.length > 0) {
					
					extractLeafSelections(node.children);
					
					const hasSelectedChildren = node.children.some(child => {
						return child.key && (clean[child.key] || 
							(child.children && child.children.some(grandChild => 
								grandChild.key && clean[grandChild.key]
							))
						);
					});
		
					if (hasSelectedChildren || isSelected) {
						clean[node.key] = true;
					}
				} else {
			
					if (isSelected && node.key) {
						clean[node.key] = true;
					}
				}
			});
		};
		

		const propagateToAncestors = (nodes: TreeNode[], parentKey?: string) => {
			nodes.forEach((node: any) => {
				if (node.children && node.children.length > 0) {
					propagateToAncestors(node.children, node.key);
				}
				
				if (node.key && clean[node.key] && parentKey) {
					clean[parentKey] = true;
				}
			});
		};
		
		extractLeafSelections(treeNodes);
		onSelectionChange(clean);
	};

	const nodeTemplate = (node: any) => {
		const label = node.data?.label || node.label;
		if (node.data.isTitle) {
			return <span className="font-semibold text-primary-700 text-base">{label}</span>;
		}
		return <span className="text-gray-800">{label}</span>;
	};

	return (
		<div className="bg-white p-0">
			<style>{`.p-treetable-thead { display: none !important; }`}</style>
			<TreeTable
				value={treeNodes}
				selectionMode="checkbox"
				selectionKeys={treeTableSelectedKeys}
				onSelectionChange={handleSelectionChange}
				propagateSelectionUp={true}
				propagateSelectionDown={true}
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
	const { showSuccess, showError } = useNotification();
	const { canCreate, canUpdate, canDelete, canManage } = usePermissions();
	const [loading, setLoading] = useState(false);
	const [savingRoleId, setSavingRoleId] = useState<number | null>(null);
	const [roles, setRoles] = useState<Role[]>([]);
	const [expanded, setExpanded] = useState<{ [id: number]: boolean }>({});
	const [nuevoRol, setNuevoRol] = useState("");
	const [permisosTree, setPermisosTree] = useState<PermisoNode[]>([]);
	const [permisosSeleccionados, setPermisosSeleccionados] = useState<{ [roleId: number]: { [key: string]: boolean } }>({});

	// Ref para el debounce timeout
	const debounceTimeoutRef = useRef<{ [roleId: number]: NodeJS.Timeout }>({});

	// Cargar datos iniciales
	const fetchInitialData = useCallback(async () => {
		try {
			setLoading(true);
			const [rolesResponse, permisosResponse] = await Promise.all([
				RoleService.getListRoles(),
				RoleService.getListPermisos()
			]);
			
			setRoles(rolesResponse.data);
			setPermisosTree(permisosResponse.data);
						
			// Sincronizar permisos seleccionados usando las claves correctas
			const map: { [roleId: number]: { [key: string]: boolean } } = {};
			rolesResponse.data.forEach((role: Role) => {
				map[role.id] = {};
				// Los permisos vienen como strings que corresponden a los nombres (name) de los nodos
				role.permisos.forEach(permisoKey => { 
					map[role.id][permisoKey] = true; 
				});
			});
			setPermisosSeleccionados(map);
		} catch (error: any) {
			showError(error.message || 'Error al cargar los datos');
		} finally {
			setLoading(false);
		}
	}, [showError]);

	// useEffect para cargar datos al montar el componente
	React.useEffect(() => {
		fetchInitialData();
	}, []);	

	// Cleanup de timeouts al desmontar el componente
	React.useEffect(() => {
		return () => {
			Object.values(debounceTimeoutRef.current).forEach(timeout => {
				if (timeout) clearTimeout(timeout);
			});
		};
	}, []);	
	
	const toggleExpand = (id: number) => {
		setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const handleDelete = async (event:any, role: Role) => {

		confirmPopup({
						target: event.currentTarget,
						message: '¿Esta seguro de realizar esta acción?',
						icon: 'pi pi-exclamation-triangle',
						acceptLabel: 'Si',
						rejectLabel: 'No',
						accept: async () => {
							try {
								await RoleService.deleteRole(role.id);
								setRoles((prev) => prev.filter((r) => r.id !== role.id));
								showSuccess('Rol eliminado correctamente');
							} catch (error: any) {
								showError(error.message || 'Error al eliminar el rol');
							}  
						},
					});
		
	};

	const handleAddRol = async () => {
		if (nuevoRol.trim()) {
			try {
				const response = await RoleService.createRole({
					nombre: nuevoRol.trim(),
					permisos: []
				});
				setRoles(prev => [...prev, response.data]);
				setNuevoRol("");
				showSuccess('Rol creado correctamente');
			} catch (error: any) {
				showError(error.message || 'Error al crear el rol');
			}
		}
	};

	const savePermissions = useCallback(async (roleId: number, keys: { [key: string]: boolean }) => {
		try {
			setSavingRoleId(roleId);
			const selectedPermisos = Object.keys(keys).filter(k => keys[k]);
			const response = await RoleService.updateRole(roleId, {
				nombre: roles.find(r => r.id === roleId)?.nombre || "",
				permisos: selectedPermisos
			});
			
			setRoles(prev => prev.map(role => {
				if (role.id !== roleId) return role;
				return { ...role, permisos: selectedPermisos };
			}));
			
			showSuccess('Permisos actualizados correctamente');
		} catch (error: any) {
			showError(error.message || 'Error al actualizar los permisos');
		} finally {
			setSavingRoleId(null);
		}
	}, [roles, showSuccess, showError]);


	const handlePermTreeChange = useCallback((roleId: number, keys: { [key: string]: boolean }) => {
		// Actualizar inmediatamente el estado local para que la UI responda
		setPermisosSeleccionados(prev => ({ ...prev, [roleId]: keys }));
		
		// Cancelar el timeout anterior si existe
		if (debounceTimeoutRef.current[roleId]) {
			clearTimeout(debounceTimeoutRef.current[roleId]);
		}
		
		// Crear nuevo timeout para guardar después de 1 segundo
		debounceTimeoutRef.current[roleId] = setTimeout(() => {
			savePermissions(roleId, keys);
		}, 1000);
	}, [savePermissions]);


	const breadcrumbItems: MenuItem[] = [
		{ label: 'Gestión de cuentas', icon: 'pi pi-users' },
		{ label: 'Roles de usuario', icon: 'pi pi-shield' }
	];
	const breadcrumbHome: MenuItem = { icon: 'pi pi-home', command: () => window.location.href = '/' };

	return (
		<div className="grid">
			<div className="col-12 mx-auto">
				<div className="mb-4 p-4 border-round-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-1 border-blue-100 shadow-1">
					<style>{`
						.custom-breadcrumb .p-breadcrumb-list .p-breadcrumb-item .p-breadcrumb-item-link {
							color: #1e40af !important;
							text-decoration: none;
						}
						.custom-breadcrumb .p-breadcrumb-list .p-breadcrumb-item .p-breadcrumb-item-link:hover {
							color: #1d4ed8 !important;
						}
						.custom-breadcrumb .p-breadcrumb-list .p-breadcrumb-separator {
							color: #64748b !important;
						}
						.custom-breadcrumb .p-breadcrumb-list .p-breadcrumb-item .p-breadcrumb-item-icon {
							color: #3b82f6 !important;
						}
					`}</style>
					<BreadCrumb 
						model={breadcrumbItems} 
						home={breadcrumbHome}
						className="custom-breadcrumb bg-transparent border-none p-0"
					/>
					<div className="mt-3">
						<h5 className="font-bold text-blue-800 m-0 flex align-items-center gap-2">
							<i className="pi pi-shield text-blue-600"></i>
							Gestión de Roles
						</h5>
						<p className="text-sm text-blue-600 m-0 mt-1">Administra los roles y permisos del sistema</p>
					</div>
				</div>
				<div className="w-full max-w-2xl flex flex-column gap-4">
					<PermissionGuard resource="gestion_cuentas.roles" action="agregar">
						<div className="flex align-items-center justify-content-end mb-2">
							<span className="flex gap-2">
								<InputText value={nuevoRol} onChange={e => setNuevoRol(e.target.value)} placeholder="Nuevo rol..." />
								<Button icon="pi pi-plus" onClick={handleAddRol} disabled={!nuevoRol.trim()} />
							</span>
						</div>
					</PermissionGuard>
					<div className="flex flex-column gap-4">
						{loading && (
							<div className="text-center py-6">
								<i className="pi pi-spin pi-spinner text-5xl text-primary mb-3"></i>
								<p className="text-gray-500">Cargando roles...</p>
							</div>
						)}
						{(!loading && roles.length === 0) && (
							<div className="text-center text-gray-500 py-6">
								<i className="pi pi-users text-5xl mb-3"></i>
								<p>No hay roles registrados.</p>
							</div>
						)}
						{(!loading && roles.length > 0) && roles.map((role) => (
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
											severity="info"
											className="text-base px-3 py-1"
										/>
									</div>
									<div className="flex gap-2 align-items-center">
										<PermissionGuard resource="gestion_cuentas.roles" action="eliminar">
											<Button
												icon="pi pi-trash"
												rounded
												text
												size="small"
												severity="danger"
												onClick={e => { e.stopPropagation(); handleDelete(e, role); }}
											/>
										</PermissionGuard>
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
									<div className="p-4 border-top-1 surface-border animate__animated animate__fadeIn relative">
										{savingRoleId === role.id && (
											<div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-80 flex align-items-center justify-content-center z-5">
												<div className="flex align-items-center gap-2">
													<i className="pi pi-spin pi-spinner text-primary"></i>
													<span className="text-primary font-medium">Guardando permisos...</span>
												</div>
											</div>
										)}
										<PermissionGuard 
											resource="gestion_cuentas.roles" 
											action="editar"
											fallback={
												<AccessDenied message="No tienes permisos para editar los permisos de este rol" />
											}
										>
											<PermisosTreeTable
												permisosTree={permisosTree}
												selectedKeys={permisosSeleccionados[role.id] || {}}
												onSelectionChange={keys => handlePermTreeChange(role.id, keys)}
											/>
										</PermissionGuard>
									</div>
								)}
							</div>
							))
						}
					</div>
				</div>
			</div>
		</div>
	);
}
