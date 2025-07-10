/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState } from 'react';
import { Chart } from 'primereact/chart';
import { ProgressBar } from 'primereact/progressbar';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';

// Datos simulados para el dashboard ejecutivo
const departamentos = [
	{ nombre: 'TI', proyectos: 12 },
	{ nombre: 'Obras Públicas', proyectos: 8 },
	{ nombre: 'Educación', proyectos: 15 },
	{ nombre: 'Salud', proyectos: 10 },
	{ nombre: 'Cultura', proyectos: 5 },
];

const avanceProyectos = 72; // % global

const proyectos = [
	{ nombre: 'Sistema de Gestión', avance: 90 },
	{ nombre: 'Construcción Hospital', avance: 60 },
	{ nombre: 'Plataforma Educativa', avance: 80 },
	{ nombre: 'Museo Digital', avance: 40 },
	{ nombre: 'Red de Salud', avance: 55 },
];

const responsables = [
	{ nombre: 'Ana López', avatar: '/demo/images/avatar/ana.png', actividades: 34 },
	{ nombre: 'Carlos Ruiz', avatar: '/demo/images/avatar/carlos.png', actividades: 29 },
	{ nombre: 'María Pérez', avatar: '/demo/images/avatar/maria.png', actividades: 27 },
	{ nombre: 'Luis Gómez', avatar: '/demo/images/avatar/luis.png', actividades: 25 },
	{ nombre: 'Sofía Torres', avatar: '/demo/images/avatar/sofia.png', actividades: 22 },
	{ nombre: 'Pedro Sánchez', avatar: '/demo/images/avatar/pedro.png', actividades: 20 },
	{ nombre: 'Lucía Díaz', avatar: '/demo/images/avatar/lucia.png', actividades: 18 },
	{ nombre: 'Miguel Ángel', avatar: '/demo/images/avatar/miguel.png', actividades: 16 },
	{ nombre: 'Elena Ríos', avatar: '/demo/images/avatar/elena.png', actividades: 15 },
	{ nombre: 'Jorge Herrera', avatar: '/demo/images/avatar/jorge.png', actividades: 14 },
];

const proyectosPrioritarios = [
	{ nombre: 'Construcción Hospital', avance: 60, responsable: 'Carlos Ruiz', prioridad: 'Alta' },
	{ nombre: 'Sistema de Gestión', avance: 90, responsable: 'Ana López', prioridad: 'Media' },
	{ nombre: 'Red de Salud', avance: 55, responsable: 'Luis Gómez', prioridad: 'Alta' },
];

const ultimasActividades = [
	{ actividad: 'Entrega de reporte mensual', proyecto: 'Sistema de Gestión', responsable: 'Ana López', fecha: '2025-07-10 09:30' },
	{ actividad: 'Reunión de avance', proyecto: 'Construcción Hospital', responsable: 'Carlos Ruiz', fecha: '2025-07-09 16:00' },
	{ actividad: 'Capacitación usuarios', proyecto: 'Plataforma Educativa', responsable: 'María Pérez', fecha: '2025-07-09 12:00' },
	{ actividad: 'Visita de supervisión', proyecto: 'Red de Salud', responsable: 'Luis Gómez', fecha: '2025-07-08 10:00' },
	{ actividad: 'Actualización de contenidos', proyecto: 'Museo Digital', responsable: 'Sofía Torres', fecha: '2025-07-08 08:30' },
];

export default function DashboardEjecutivo() {
	// Gráfica: Proyectos por departamento
	const barData = {
		labels: departamentos.map((d) => d.nombre),
		datasets: [
			{
				label: 'Proyectos',
				backgroundColor: '#6366f1',
				data: departamentos.map((d) => d.proyectos),
				borderRadius: 8,
			},
		],
	};
	const barOptions = {
		indexAxis: 'y',
		plugins: { legend: { display: false } },
		scales: {
			x: { grid: { color: '#f3f4f6' }, ticks: { color: '#64748b' } },
			y: { grid: { color: '#f3f4f6' }, ticks: { color: '#64748b' } },
		},
		responsive: true,
		maintainAspectRatio: false,
	};

	// Gráfica: Avance global de proyectos
	const donutData = {
		labels: ['Avance', 'Restante'],
		datasets: [
			{
				data: [avanceProyectos, 100 - avanceProyectos],
				backgroundColor: ['#22c55e', '#e5e7eb'],
				borderWidth: 0,
			},
		],
	};
	const donutOptions = {
		cutout: '75%',
		plugins: {
			legend: { display: false },
			tooltip: { enabled: false },
		},
		responsive: true,
		maintainAspectRatio: true,
	};

	return (
		<div className="grid">
			{/* Tarjetas resumen */}
			<div className="col-12 md:col-6 xl:col-3">
				<div className="card border-round-xl shadow-2 bg-white mb-0">
					<div className="flex align-items-center gap-3 mb-2">
						<i className="pi pi-folder-open text-3xl text-primary-500" />
						<span className="text-lg font-semibold text-primary-800">Proyectos registrados</span>
					</div>
					<div className="text-4xl font-bold text-primary-700 mb-1">
						{departamentos.reduce((a, d) => a + d.proyectos, 0)}
					</div>
					<span className="text-500">en {departamentos.length} departamentos</span>
				</div>
			</div>
			<div className="col-12 md:col-6 xl:col-3">
				<div className="card border-round-xl shadow-2 bg-white mb-0" style={{ position: 'relative' }}>
					<div className="flex align-items-center gap-3 mb-2">
						<i className="pi pi-chart-pie text-3xl text-green-500" />
						<span className="text-lg font-semibold text-green-700">Avance global</span>
					</div>
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
						}}>{avanceProyectos}%</div>
					</div>
					<span className="text-500">de avance en todos los proyectos</span>
				</div>
			</div>
			<div className="col-12 md:col-12 xl:col-6">
				<div className="card border-round-xl shadow-2 bg-white mb-0" style={{ minHeight: 220 }}>
					<div className="flex align-items-center gap-3 mb-3">
						<i className="pi pi-building text-2xl text-blue-500" />
						<span className="text-lg font-semibold text-blue-700">Proyectos por departamento</span>
					</div>
					<div style={{ height: 180 }}>
						<Chart type="bar" data={barData} options={barOptions} />
					</div>
				</div>
			</div>

			{/* Avance de actividades por proyecto */}
			<div className="col-12 xl:col-6">
				<div className="card border-round-xl shadow-2 bg-white mb-0">
					<div className="flex align-items-center gap-3 mb-3">
						<i className="pi pi-tasks text-2xl text-cyan-500" />
						<span className="text-lg font-semibold text-cyan-700">Avance de actividades por proyecto</span>
					</div>
					<div className="flex flex-column gap-3">
						{proyectos.map((p) => (
							<div key={p.nombre} className="flex align-items-center gap-3">
								<span className="w-10rem text-900 font-medium">{p.nombre}</span>
								<ProgressBar value={p.avance} showValue className="flex-1" style={{ height: 18 }} />
								<span className="text-700 font-semibold ml-2">{p.avance}%</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Top responsables */}
			<div className="col-12 xl:col-6">
				<div className="card border-round-xl shadow-2 bg-white mb-0">
					<div className="flex align-items-center gap-3 mb-3">
						<i className="pi pi-users text-2xl text-violet-500" />
						<span className="text-lg font-semibold text-violet-700">Top 10 responsables</span>
					</div>
					<ul className="list-none p-0 m-0">
						{responsables.map((r, idx) => (
							<li key={r.nombre} className="flex align-items-center gap-3 mb-2">
								<span className="text-900 font-bold" style={{ width: 24 }}>
									{idx + 1}
								</span>
								<Avatar image={r.avatar} shape="circle" size="large" />
								<span className="flex-1 text-900 font-medium">{r.nombre}</span>
								<ProgressBar
									value={Math.round((r.actividades / responsables[0].actividades) * 100)}
									showValue={false}
									style={{ width: 80, height: 10 }}
									className="mx-2"
								/>
								<span className="text-700 font-semibold">{r.actividades} act.</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* Proyectos prioritarios */}
			<div className="col-12 xl:col-6">
				<div className="card border-round-xl shadow-2 bg-white mb-0">
					<div className="flex align-items-center gap-3 mb-3">
						<i className="pi pi-star text-2xl text-yellow-500" />
						<span className="text-lg font-semibold text-yellow-700">Proyectos prioritarios</span>
					</div>
					<div className="flex flex-column gap-3">
						{proyectosPrioritarios.map((p) => (
							<div
								key={p.nombre}
								className="flex align-items-center gap-3 p-3 border-1 border-round surface-border bg-yellow-50"
							>
								<span className="text-900 font-medium flex-1">{p.nombre}</span>
								<Tag
									value={p.prioridad}
									severity={p.prioridad === 'Alta' ? 'danger' : 'warning'}
								/>
								<span className="text-700">{p.responsable}</span>
								<ProgressBar
									value={p.avance}
									showValue={false}
									style={{ width: 80, height: 10 }}
									className="mx-2"
								/>
								<span className="text-700 font-semibold">{p.avance}%</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Últimas actividades */}
			<div className="col-12 xl:col-6">
				<div className="card border-round-xl shadow-2 bg-white mb-0">
					<div className="flex align-items-center gap-3 mb-3">
						<i className="pi pi-clock text-2xl text-gray-500" />
						<span className="text-lg font-semibold text-gray-700">Últimas actividades</span>
					</div>
					<ul className="list-none p-0 m-0">
						{ultimasActividades.map((a, idx) => (
							<li key={idx} className="flex align-items-center gap-3 py-2 border-bottom-1 surface-border">
								<i className="pi pi-check-circle text-green-500 text-xl" />
								<div className="flex flex-column">
									<span className="text-900 font-medium">{a.actividad}</span>
									<span className="text-700 text-sm">
										{a.proyecto} &middot; {a.responsable}
									</span>
								</div>
								<span className="ml-auto text-500 text-xs">{a.fecha}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}
