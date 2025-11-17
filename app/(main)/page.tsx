/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState, useEffect, use } from 'react';
import { Chart } from 'primereact/chart';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { ProyectoService } from '@/src/services';

export default function DashboardEjecutivo() {

	const [dashboardData, setDashboardData] = useState<any>(null);
	const [barData, setBarData] = useState<any>(null);
	const [donutData, setDonutData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	// Hook para refrescar el token de autenticación
	//const { refreshAuth } = useAuthRefresh({ interval: 300000, checkOnMount: true, checkOnFocus: true });
	// Gráfica: Proyectos por departamento

	const barOptions = {
		indexAxis: 'y',
		plugins: { 
			legend: { display: false },
			datalabels: {
				display: false,
				anchor: 'end',
				align: 'end',
				color: '#374151',
				font: {
					weight: 'bold',
					size: 12
				},
			}
		},
		scales: {
			x: { 
				grid: { color: '#f3f4f6' }, 
				ticks: { 
					color: '#64748b',
					stepSize: 1
				},
				title: {
					display: true,
					text: 'Total de proyectos'
				}
			},
			y: { 
				grid: { color: '#f3f4f6' }, 
				ticks: { color: '#64748b' },
				display: true,
			},
		},
		responsive: true,
		maintainAspectRatio: false,
	};

	const donutOptions = {
		cutout: '80%',
		plugins: {
			legend: { display: false },
			tooltip: { enabled: false },
		},
		responsive: true,
		maintainAspectRatio: true,
	};

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const res = await ProyectoService.getDashboardEjecutivo();
				const data = res.data;
				setDashboardData(data);

				// configurar la gráfica de barras con los datos recibidos
				setBarData({
					labels: data?.proyectos_por_departamento.map((d: any) => d.departamento_nombre),
					datasets: [
						{
							label: 'Proyectos',
							backgroundColor: '#6366f1',
							data: data?.proyectos_por_departamento.map((d: any) => d.total_proyectos),
							borderRadius: 8,
						},
					],
				});

				setDonutData({
					labels: ['Avance', 'Restante'],
					datasets: [
						{
							data: [
								data?.resumen_general?.porcentaje_avance_global || 0, 
								100 - (data?.resumen_general?.porcentaje_avance_global || 0)
							],
							backgroundColor: ['#22c55e', '#e5e7eb'],
							borderWidth: 0,
						},
					],
				});
			} catch (error) {
				console.error('Error fetching dashboard data:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []); // El array vacío asegura que esto se ejecute solo una vez al montar el componente

	// Componente Skeleton para cards
	const CardSkeleton = () => (
		<div className="card border-round-xl shadow-2 bg-white mb-0">
			<div className="flex align-items-center gap-3 mb-2">
				<Skeleton shape="circle" size="3rem" />
				<Skeleton width="60%" height="1.5rem" />
			</div>
			<Skeleton width="80%" height="2rem" className="mb-2" />
			<Skeleton width="50%" height="1rem" />
		</div>
	);

	// Componente Skeleton para gráfica de barras
	const ChartSkeleton = () => (
		<div className="card border-round-xl shadow-2 bg-white mb-0" style={{ minHeight: 220 }}>
			<div className="flex align-items-center gap-3 mb-3">
				<Skeleton shape="circle" size="2rem" />
				<Skeleton width="40%" height="1.5rem" />
			</div>
			<div style={{ height: 180 }}>
				<Skeleton width="100%" height="100%" />
			</div>
		</div>
	);

	// Componente Skeleton para listas
	const ListSkeleton = () => (
		<div className="card border-round-xl shadow-2 bg-white mb-0">
			<div className="flex align-items-center gap-3 mb-3">
				<Skeleton shape="circle" size="2rem" />
				<Skeleton width="50%" height="1.5rem" />
			</div>
			<div className="flex flex-column gap-3">
				{Array.from({ length: 3 }).map((_, idx) => (
					<div key={idx} className="flex align-items-center gap-3 p-3 border-1 border-round surface-border">
						<Skeleton width="60%" height="1rem" />
						<Skeleton width="80px" height="1.5rem" />
						<Skeleton width="80px" height="10px" />
						<Skeleton width="40px" height="1rem" />
					</div>
				))}
			</div>
		</div>
	);

	// Componente para estado vacío
	const EmptyState = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
		<div className="flex flex-column align-items-center justify-content-center p-6 text-center">
			<i className={`${icon} text-6xl text-300 mb-3`} />
			<h3 className="text-900 font-semibold mb-2">{title}</h3>
			<p className="text-600 m-0">{description}</p>
		</div>
	);

	return (
		<div className="grid">
			{/* Tarjetas resumen */}
			
			<div className="col-12 md:col-6 xl:col-2">
				{loading ? (
					<CardSkeleton />
				) : (
					<div className="card border-round-xl shadow-2 bg-white mb-0" style={{ position: 'relative' }}>
						<div className="flex align-items-center gap-3 mb-2">
							<i className="pi pi-chart-pie text-3xl text-green-500" />
							<span className="text-lg font-semibold text-green-700">Avance global</span>
						</div>
						{dashboardData?.resumen_general ? (
							<>
								<div style={{ height: 90, width: 90, margin: '0 auto', position: 'relative' }}>
									<Chart type="doughnut" data={donutData} options={donutOptions} />
									<div style={{
										position: 'absolute',
										left: 0,
										right: 0,
										top: 0,
										bottom: 0,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										pointerEvents: 'none',
										fontSize: 24,
										fontWeight: 700,
										color: '#22c55e',
									}}>{dashboardData?.resumen_general?.porcentaje_avance_global || 0}%</div>
								</div>
								<span className="text-500 text-justify">de avance en todos los proyectos</span>
							</>
						) : (
							<EmptyState 
								icon="pi pi-chart-pie" 
								title="Sin datos" 
								description="No hay información de avance disponible"
							/>
						)}
					</div>
				)}
			</div>
			<div className="col-12 md:col-6 xl:col-3">
				{loading ? (
					<CardSkeleton />
				) : (
					<div className="card border-round-xl shadow-2 bg-white mb-0">
						<div className="flex align-items-center gap-3 mb-2">
							<i className="pi pi-folder-open text-2xl text-primary-500" />
							<span className="text-lg font-semibold text-primary-800">Proyectos registrados</span>
						</div>
						{dashboardData?.resumen_general ? (
							<>
								<div className="text-4xl font-bold text-primary-700 mb-1">
									{dashboardData?.resumen_general?.total_proyectos || 0}
								</div>
								<span className="text-500">en {dashboardData?.resumen_general?.departamentos_participantes} departamentos</span>
							</>
						) : (
							<EmptyState 
								icon="pi pi-folder-open" 
								title="Sin proyectos" 
								description="No hay proyectos registrados"
							/>
						)}
					</div>
				)}
			</div>
			<div className="col-12 md:col-12 xl:col-7">
				{loading ? (
					<ChartSkeleton />
				) : (
					<div className="card border-round-xl shadow-2 bg-white mb-0" style={{ minHeight: 220 }}>
						<div className="flex align-items-center gap-3 mb-3">
							<i className="pi pi-building text-2xl text-blue-500" />
							<span className="text-lg font-semibold text-blue-700">Proyectos por departamento</span>
						</div>
						{dashboardData?.proyectos_por_departamento?.length > 0 ? (
							<div style={{ height: 180 }}>
								<Chart type="bar" data={barData} options={barOptions} />
							</div>
						) : (
							<EmptyState 
								icon="pi pi-building" 
								title="Sin datos por departamento" 
								description="No hay proyectos distribuidos por departamentos"
							/>
						)}
					</div>
				)}
			</div>


			{/* Proyectos con mas actividades */}
			<div className="col-12 xl:col-6">
				{loading ? (
					<ListSkeleton />
				) : (
					<div className="card border-round-xl shadow-2 bg-white mb-0">
						<div className="flex align-items-center gap-3 mb-3">
							<i className="pi pi-star text-2xl text-yellow-500" />
							<span className="text-lg font-semibold text-yellow-700">Proyectos con mas actividades</span>
						</div>
						{dashboardData?.proyectos_prioritarios?.length > 0 ? (
							<div className="flex flex-column gap-3">
								{dashboardData?.proyectos_prioritarios?.map((p:any) => (
									<div
										key={p.nombre}
										className="flex align-items-center gap-3 p-3 border-1 border-round surface-border bg-yellow-50"
									>
										<span className="text-900 font-medium flex-1">{p.nombre}</span>
										<Tag
											value={p.total_actividades + ' actividades'}
											severity="warning"
										/>
										<ProgressBar
											value={p.porcentaje_avance}
											showValue={false}
											style={{ width: 80, height: 10 }}
											className="mx-2"
										/>
										<span className="text-700 font-semibold">{p.porcentaje_avance}%</span>
									</div>
								))}
							</div>
						) : (
							<EmptyState 
								icon="pi pi-star" 
								title="Sin proyectos prioritarios" 
								description="No hay proyectos con actividades registradas"
							/>
						)}
					</div>
				)}
			</div>

			{/* Últimas actividades */}
			<div className="col-12 xl:col-6">
				{loading ? (
					<ListSkeleton />
				) : (
					<div className="card border-round-xl shadow-2 bg-white mb-0">
						<div className="flex align-items-center gap-3 mb-3">
							<i className="pi pi-clock text-2xl text-gray-500" />
							<span className="text-lg font-semibold text-gray-700">Últimas actividades completadas</span>
						</div>
						{dashboardData?.ultimas_actividades_completadas?.length > 0 ? (
							<ul className="list-none p-0 m-0">
								{dashboardData?.ultimas_actividades_completadas.map((a:any, idx:number) => (
									<li key={idx} className="flex align-items-center gap-3 py-2 border-bottom-1 surface-border">
										<i className="pi pi-check-circle text-green-500 text-xl" />
										<div className="flex flex-column">
											<span className="text-900 font-medium">{a.nombre}</span>
											<span className="text-700 text-sm">
												{a.proyecto_nombre} &middot; {a.responsable_nombre}
											</span>
										</div>
										<span className="ml-auto text-500 text-xs">{a.fecha_completada}</span>
									</li>
								))}
							</ul>
						) : (
							<EmptyState 
								icon="pi pi-clock" 
								title="Sin actividades recientes" 
								description="No hay actividades completadas recientemente"
							/>
						)}
					</div>
				)}
			</div>
			{/* Avance de actividades por proyecto */}
			<div className="col-12 xl:col-6">
				{loading ? (
					<ListSkeleton />
				) : (
					<div className="card border-round-xl shadow-2 bg-white mb-0">
						<div className="flex align-items-center gap-3 mb-3">
							<i className="pi pi-list text-2xl text-cyan-500" />
							<span className="text-lg font-semibold text-cyan-700">Avance de actividades por proyecto</span>
						</div>
						{dashboardData?.ultimos_proyectos?.length > 0 ? (
							<div className="flex flex-column gap-3">
								{dashboardData?.ultimos_proyectos?.map((p:any) => (
									<div key={p.nombre} className="flex align-items-center gap-3">
										<span className="w-10rem text-900 font-medium">{p.nombre}</span>
										<ProgressBar value={p.porcentaje_avance} showValue className="flex-1" style={{ height: 18 }} />
										<span className="text-700 font-semibold ml-2">{p.porcentaje_avance}%</span>
									</div>
								))}
							</div>
						) : (
							<EmptyState 
								icon="pi pi-list" 
								title="Sin avance de proyectos" 
								description="No hay información de avance disponible"
							/>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
