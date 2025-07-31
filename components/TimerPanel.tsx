
import React, { useRef, useState, useEffect } from 'react';
import { Activity, ActivityStatus } from '../types';

interface TimerPanelProps {
  activities: Activity[];
  activeActivity: Activity | null;
  countdown: number;
  meetingStartTime: Date;
  setMeetingStartTime: (date: Date) => void;
  handleImportCSV: (file: File) => void;
  handleExportCSV: () => void;
  handleExportTemplateCSV: () => void;
  handleImportDataCSV: (file: File) => void;
  handleClearData: () => void;
  ignoreThreshold: number;
  setIgnoreThreshold: (seconds: number) => void;
}

const formatTime = (timeInSeconds: number) => {
  if (timeInSeconds < 0) timeInSeconds = 0;
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatDate = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const TimerPanel: React.FC<TimerPanelProps> = ({
  activities,
  activeActivity,
  countdown,
  meetingStartTime,
  setMeetingStartTime,
  handleImportCSV,
  handleExportCSV,
  handleExportTemplateCSV,
  handleImportDataCSV,
  handleClearData,
  ignoreThreshold,
  setIgnoreThreshold,
}) => {
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const dataFileInputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!activeActivity) return;

    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeActivity]);

  const totalPlannedDuration = activities.reduce((sum, act) => sum + act.plannedDuration, 0);
  const plannedEndTime = new Date(meetingStartTime.getTime() + totalPlannedDuration * 1000);
  
  const accumulatedDeviation = activities.reduce((dev, act) => {
    if (act.status === ActivityStatus.Completed && act.actualDuration !== null) {
        return dev + (act.actualDuration - act.plannedDuration);
    }
    return dev;
  }, 0);

  let projectedEndTime: Date;
  let partialDeviation = 0;
  let totalDeviation = 0;
  
  if (activeActivity && activeActivity.startTime) {
      const activeIndex = activities.findIndex(act => act.id === activeActivity.id);
      const elapsedSeconds = (now.getTime() - activeActivity.startTime.getTime()) / 1000;

      // Remaining planned time for the current active task
      const remainingPlannedTimeForActiveTask = Math.max(0, activeActivity.plannedDuration - elapsedSeconds);
      
      // Sum of planned durations for all subsequent tasks in the agenda
      const plannedTimeForFutureTasks = activities
          .slice(activeIndex + 1)
          .reduce((sum, act) => sum + act.plannedDuration, 0);
          
      const totalRemainingPlannedTime = remainingPlannedTimeForActiveTask + plannedTimeForFutureTasks;
      projectedEndTime = new Date(now.getTime() + totalRemainingPlannedTime * 1000);

      // Partial deviation shows how much the current task is over/under its budget.
      partialDeviation = elapsedSeconds - activeActivity.plannedDuration;

      // Total deviation is the difference between the new projection and the original plan.
      totalDeviation = (projectedEndTime.getTime() - plannedEndTime.getTime()) / 1000;

  } else {
      // If no activity is active, projection is based on accumulated deviation from completed tasks.
      projectedEndTime = new Date(plannedEndTime.getTime() + accumulatedDeviation * 1000);
      totalDeviation = accumulatedDeviation;
      partialDeviation = 0;
  }

  const onTemplateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportCSV(file);
      if (e.target) e.target.value = '';
    }
  };

  const onDataFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportDataCSV(file);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="bg-slate-800/50 p-6 lg:p-8 rounded-2xl flex flex-col">
      <h2 className="text-xl font-bold text-slate-300 mb-4">Timer & Status</h2>

      <div className="flex-grow flex flex-col items-center justify-center text-center">
        <p className="text-slate-400 text-lg">
          {activeActivity ? `In corso: ${activeActivity.name}` : 'Nessuna attività in corso'}
        </p>
        <h1 className={`font-black text-8xl md:text-9xl my-4 transition-colors ${countdown < 10 && countdown > 0 ? 'text-amber-400' : countdown <= 0 ? 'text-red-500' : 'text-emerald-400'}`}>
          {countdown < 0 ? `+${formatTime(Math.abs(countdown))}`: formatTime(countdown)}
        </h1>
        <p className="text-slate-400 text-lg">
          Tempo previsto: {activeActivity ? formatTime(activeActivity.plannedDuration) : '--:--'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-center mt-8">
        {/* Column 1: Settings */}
        <div className="flex flex-col gap-4">
            <div className="bg-slate-900/70 p-4 rounded-lg flex-1 flex flex-col">
              <label htmlFor="start-time" className="block text-sm font-medium text-slate-400 mb-2">Orario Inizio Riunione</label>
              <input 
                type="time" 
                id="start-time"
                value={meetingStartTime.toTimeString().substring(0,5)}
                onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newDate = new Date(meetingStartTime);
                    newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                    setMeetingStartTime(newDate);
                }}
                className="bg-slate-700 border-slate-600 text-slate-200 rounded-md p-2 w-full text-center"
              />
            </div>
            <div className="bg-slate-900/70 p-4 rounded-lg flex-1 flex flex-col">
                <label htmlFor="ignore-threshold" className="block text-sm font-medium text-slate-400 mb-2">Ignora attività brevi (sec)</label>
                <input 
                    type="number" 
                    id="ignore-threshold"
                    value={ignoreThreshold}
                    onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value) && value >= 0) {
                            setIgnoreThreshold(value);
                        }
                    }}
                    min="0"
                    className="bg-slate-700 border-slate-600 text-slate-200 rounded-md p-2 w-full text-center"
                />
            </div>
        </div>

        {/* Column 2: End Times */}
        <div className="flex flex-col gap-4">
            <div className="bg-slate-900/70 p-4 rounded-lg flex-1 flex flex-col justify-center">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Fine Prevista (Pianificata)</h4>
                <p className="text-2xl font-bold">{formatDate(plannedEndTime)}</p>
            </div>
             <div className="bg-slate-900/70 p-4 rounded-lg flex-1 flex flex-col justify-center">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Fine Prevista (Reale)</h4>
                <p className="text-2xl font-bold">{formatDate(projectedEndTime)}</p>
            </div>
        </div>
        
        {/* Column 3: Differences */}
        <div className="flex flex-col gap-4">
            <div className={`bg-slate-900/70 p-4 rounded-lg transition-colors flex-1 flex flex-col justify-center ${partialDeviation > 0 ? 'bg-red-900/50' : partialDeviation < 0 ? 'bg-green-900/50' : ''}`}>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Differenza Parziale (Attività)</h4>
                <p className={`text-2xl font-bold ${partialDeviation > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {partialDeviation >= 0 ? '+' : ''}{formatTime(Math.abs(Math.round(partialDeviation)))}
                </p>
            </div>
            <div className={`bg-slate-900/70 p-4 rounded-lg transition-colors flex-1 flex flex-col justify-center ${totalDeviation > 0 ? 'bg-red-900/50' : totalDeviation < 0 ? 'bg-green-900/50' : ''}`}>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Differenza Totale (Riunione)</h4>
                <p className={`text-2xl font-bold ${totalDeviation > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {totalDeviation >= 0 ? '+' : ''}{formatTime(Math.abs(Math.round(totalDeviation)))}
                </p>
            </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-700">
        <h3 className="font-semibold text-slate-300 mb-4 text-center text-lg">Gestione Dati e Template</h3>
        
        <input type="file" accept=".csv" ref={dataFileInputRef} onChange={onDataFileChange} className="hidden" aria-hidden="true" />
        <input type="file" accept=".csv" ref={templateFileInputRef} onChange={onTemplateFileChange} className="hidden" aria-hidden="true" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => dataFileInputRef.current?.click()}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Importa Dati
          </button>
           <button
            onClick={() => templateFileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Importa Template
          </button>
          
          {activities.length > 0 && (
            <>
              <button
                onClick={handleExportCSV}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Esporta Dati
              </button>
              <button
                onClick={handleExportTemplateCSV}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Esporta Template
              </button>
            </>
          )}
        </div>
        {activities.length > 0 && (
          <div className="mt-4">
            <button
                onClick={() => {
                    if (window.confirm("Sei sicuro di voler eliminare tutti i dati? L'azione non può essere annullata.")) {
                        handleClearData();
                    }
                }}
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
                Elimina Dati
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
