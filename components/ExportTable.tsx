
import React, { useState, useRef } from 'react';
import { Activity } from '../types';
import { AgendaChart, AgendaChartRef } from './AgendaChart';

interface ExportTableProps {
  activities: Activity[];
  onUpdateActivity: (id: string, field: keyof Activity, value: any) => void;
  activeActivityId: string | null;
}

const formatDateTimeLocal = (date: Date | null): string => {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    try {
        return d.toISOString().slice(0, 16);
    } catch (e) {
        return '';
    }
};

export const ExportTable: React.FC<ExportTableProps> = ({ activities, onUpdateActivity, activeActivityId }) => {
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof Activity } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const chartRef = useRef<AgendaChartRef>(null);

  const handleEditStart = (activity: Activity, field: keyof Activity) => {
    if (activity.id === activeActivityId) return;
    setEditingCell({ id: activity.id, field });

    let currentValue: string;
    switch (field) {
        case 'actualDuration':
            currentValue = activity.actualDuration !== null ? String(Math.round(activity.actualDuration / 60)) : '';
            break;
        case 'startTime':
            currentValue = formatDateTimeLocal(activity.startTime);
            break;
        case 'endTime':
            currentValue = formatDateTimeLocal(activity.endTime);
            break;
        default:
            currentValue = '';
    }
    setEditValue(currentValue);
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditSave = () => {
    if (!editingCell) return;
    
    let newValue: any;
    switch (editingCell.field) {
        case 'actualDuration':
            const newDuration = parseInt(editValue, 10);
            newValue = isNaN(newDuration) || newDuration < 0 ? null : newDuration * 60;
            break;
        case 'startTime':
        case 'endTime':
            newValue = editValue ? new Date(editValue) : null;
            break;
        default:
            return;
    }

    onUpdateActivity(editingCell.id, editingCell.field, newValue);
    handleEditCancel();
  };

  const handleExportChart = () => {
    const image = chartRef.current?.getChartBase64Image();
    if (image) {
        const link = document.createElement('a');
        link.download = `grafico_riunione_${new Date().toISOString().split('T')[0]}.png`;
        link.href = image;
        link.click();
    } else {
        alert("Impossibile esportare il grafico.");
    }
  };

  const renderCellContent = (activity: Activity, field: keyof Activity) => {
    if (editingCell?.id === activity.id && editingCell?.field === field) {
        const inputType = field === 'actualDuration' ? 'number' : 'datetime-local';
        return (
            <input
                type={inputType}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditSave}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSave();
                    if (e.key === 'Escape') handleEditCancel();
                }}
                className="bg-slate-900 border border-indigo-500 rounded-md p-1 w-full"
                autoFocus
            />
        );
    }

    switch (field) {
        case 'name':
            return activity.name;
        case 'plannedDuration':
            return `${Math.round(activity.plannedDuration / 60)} min`;
        case 'actualDuration':
            return activity.actualDuration !== null ? `${Math.round(activity.actualDuration / 60)} min` : '-';
        case 'startTime':
            return activity.startTime ? activity.startTime.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
        case 'endTime':
            return activity.endTime ? activity.endTime.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
        default:
            return null;
    }
  }

  if (activities.length === 0) {
      return null;
  }

  return (
    <div className="mt-6 pt-6 border-t border-slate-700">
      <h3 className="font-semibold text-slate-300 mb-3">Anteprima Dati Esportazione (Modificabile)</h3>
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-left table-auto">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800">
            <tr>
              <th className="p-3">Attività</th>
              <th className="p-3 text-right">Previsto</th>
              <th className="p-3 text-right">Effettivo</th>
              <th className="p-3">Inizio</th>
              <th className="p-3">Fine</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {activities.map((act) => (
              <tr key={act.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 transition-colors">
                <td className="p-3 font-medium text-slate-200">{renderCellContent(act, 'name')}</td>
                <td className="p-3 text-right text-slate-400">{renderCellContent(act, 'plannedDuration')}</td>
                <td className={`p-3 text-right ${act.id !== activeActivityId && 'cursor-pointer'}`} onClick={() => handleEditStart(act, 'actualDuration')}>{renderCellContent(act, 'actualDuration')}</td>
                <td className={`p-3 ${act.id !== activeActivityId && 'cursor-pointer'}`} onClick={() => handleEditStart(act, 'startTime')}>{renderCellContent(act, 'startTime')}</td>
                <td className={`p-3 ${act.id !== activeActivityId && 'cursor-pointer'}`} onClick={() => handleEditStart(act, 'endTime')}>{renderCellContent(act, 'endTime')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-700">
        <h3 className="font-semibold text-slate-300 mb-3">Grafico Riepilogativo</h3>
        <div className="bg-slate-800 p-4 rounded-lg">
            <AgendaChart ref={chartRef} activities={activities} />
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleExportChart}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Esporta Grafico
        </button>
      </div>
    </div>
  );
};
