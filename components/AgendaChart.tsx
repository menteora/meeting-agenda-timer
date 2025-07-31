
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Activity } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface AgendaChartRef {
    getChartBase64Image: () => string | undefined;
}

interface AgendaChartProps {
    activities: Activity[];
}

export const AgendaChart = forwardRef<AgendaChartRef, AgendaChartProps>(({ activities }, ref) => {
    const chartRef = useRef<ChartJS<'bar'>>(null);

    useImperativeHandle(ref, () => ({
        getChartBase64Image: () => {
            if (chartRef.current) {
                return chartRef.current.toBase64Image('image/png', 1);
            }
            return undefined;
        }
    }));

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#cbd5e1' // slate-300
                }
            },
            title: {
                display: true,
                text: 'Tempo Previsto vs Effettivo',
                color: '#f1f5f9', // slate-100
                font: {
                    size: 16
                }
            },
        },
        scales: {
            x: {
                ticks: {
                    color: '#94a3b8' // slate-400
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Durata (min)',
                    color: '#cbd5e1' // slate-300
                },
                ticks: {
                    color: '#94a3b8' // slate-400
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        },
        animation: {
            duration: 500
        }
    };

    const labels = activities.map(act => {
        // Truncate long labels to prevent chart clutter
        if (act.name.length > 30) {
            return act.name.substring(0, 27) + '...';
        }
        return act.name;
    });

    const data: ChartData<'bar'> = {
        labels,
        datasets: [
            {
                label: 'Tempo Previsto (min)',
                data: activities.map(act => Math.round(act.plannedDuration / 60)),
                backgroundColor: 'rgba(59, 130, 246, 0.7)', // blue-500 with alpha
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
            {
                label: 'Tempo Effettivo (min)',
                data: activities.map(act => act.actualDuration !== null ? Math.round(act.actualDuration / 60) : 0),
                backgroundColor: 'rgba(16, 185, 129, 0.7)', // emerald-500 with alpha
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1,
            },
        ],
    };
    
    return (
        <div style={{ height: '400px', position: 'relative' }}>
             <Bar ref={chartRef} options={options} data={data} />
        </div>
    );
});
