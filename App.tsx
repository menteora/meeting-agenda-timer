
import React, { useState, useEffect, useCallback } from 'react';
import { Activity, ActivityStatus } from './types';
import { Agenda } from './components/Agenda';
import { TimerPanel } from './components/TimerPanel';

const App: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [meetingStartTime, setMeetingStartTime] = useState<Date>(new Date());
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [ignoreThreshold, setIgnoreThreshold] = useState<number>(5);
  
  const activeActivity = activities.find(a => a.id === activeActivityId) || null;

  useEffect(() => {
    let interval: number | null = null;
    if (activeActivityId) {
      interval = window.setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeActivityId]);
  
  const handleStartActivity = useCallback((id: string) => {
    const now = new Date();

    if (id === activeActivityId) {
      const activityToStop = activities.find(act => act.id === activeActivityId);

      if (activityToStop && sessionStartTime) {
        const sessionDuration = (now.getTime() - sessionStartTime.getTime()) / 1000;

        if (sessionDuration < ignoreThreshold) {
          alert(`Attività ignorata perché durata meno di ${ignoreThreshold} secondi.`);
          
          if (activityToStop.name.endsWith('(ripresa)')) {
            setActivities(prev => prev.filter(act => act.id !== activeActivityId));
          } else {
            setActivities(prev =>
              prev.map(act => {
                if (act.id === activeActivityId) {
                  return { ...act, status: ActivityStatus.Pending, startTime: null, endTime: null, actualDuration: null };
                }
                return act;
              })
            );
          }
        } else {
          if(activityToStop.startTime) {
            const actualDuration = (now.getTime() - activityToStop.startTime.getTime()) / 1000;
            setActivities(prev =>
                prev.map(act => {
                if (act.id === activeActivityId) {
                    return { ...act, status: ActivityStatus.Completed, endTime: new Date(), actualDuration };
                }
                return act;
                })
            );
          }
        }
      }
      
      setActiveActivityId(null);
      setCountdown(0);
      setSessionStartTime(null);
      return;
    }

    const clickedActivity = activities.find(a => a.id === id);
    if (!clickedActivity) return;

    let activityToStart: Activity = clickedActivity;
    let nextActivitiesState: Activity[] = activities;
    let nextActiveId: string = id;

    if (clickedActivity.status === ActivityStatus.Completed) {
        const originalIndex = activities.findIndex(a => a.id === id);
        
        const resumedActivity: Activity = {
            id: `resumed-${Date.now()}`,
            name: `${clickedActivity.name} (ripresa)`,
            plannedDuration: 0,
            actualDuration: null,
            startTime: null,
            endTime: null,
            status: ActivityStatus.Pending,
        };
        
        const newActivitiesList = [...activities];
        newActivitiesList.splice(originalIndex + 1, 0, resumedActivity);
        
        activityToStart = resumedActivity;
        nextActivitiesState = newActivitiesList;
        nextActiveId = resumedActivity.id;
    }

    const logicalStartTime = (() => {
        if (activeActivityId) {
            return now;
        }
        const lastCompletedActivity = activities
            .filter(act => act.status === ActivityStatus.Completed && act.endTime)
            .sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())[0];

        return lastCompletedActivity ? lastCompletedActivity.endTime! : meetingStartTime;
    })();

    const finalActivities = nextActivitiesState.map(act => {
        if (act.id === activeActivityId && act.startTime) {
          const actualDuration = (now.getTime() - act.startTime.getTime()) / 1000;
          return { ...act, status: ActivityStatus.Completed, endTime: now, actualDuration };
        }
        if (act.id === nextActiveId) {
          return { ...act, status: ActivityStatus.Active, startTime: logicalStartTime, endTime: null, actualDuration: null };
        }
        return act;
    });

    setActivities(finalActivities);
    
    const newCountdown = activityToStart.plannedDuration;
    
    setActiveActivityId(nextActiveId);
    setCountdown(Math.round(newCountdown));
    setSessionStartTime(now);

  }, [activeActivityId, activities, meetingStartTime, sessionStartTime, ignoreThreshold]);


  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') return;

        const allLines = text.split('\n').map(line => line.trim()).filter(Boolean);
        if (allLines.length === 0) return;

        const hasHeader = allLines[0].replace(/"/g, '').startsWith("Attività,Tempo Previsto (min)");
        const dataLines = hasHeader ? allLines.slice(1) : allLines;

        const newActivities: Activity[] = dataLines.map((line, index) => {
            try {
                let name: string = '';
                let duration: number = NaN;

                if (hasHeader) {
                    if (line.startsWith('"')) {
                        let nameEndIndex = -1;
                        for (let i = 1; i < line.length; i++) {
                            if (line[i] === '"') {
                                if (i + 1 < line.length && line[i + 1] === '"') {
                                    i++; 
                                } else {
                                    nameEndIndex = i;
                                    break;
                                }
                            }
                        }

                        if (nameEndIndex !== -1) {
                            name = line.substring(1, nameEndIndex).replace(/""/g, '"');
                            const rest = line.substring(nameEndIndex + 2);
                            const parts = rest.split(',');
                            if (parts.length > 0) {
                                duration = parseInt(parts[0], 10);
                            }
                        }
                    }
                } else {
                    const firstCommaIndex = line.indexOf(',');
                    if (firstCommaIndex !== -1) {
                        duration = parseInt(line.substring(0, firstCommaIndex), 10);
                        let namePart = line.substring(firstCommaIndex + 1).trim();
                        if (namePart.startsWith('"') && namePart.endsWith('"')) {
                            name = namePart.substring(1, namePart.length - 1).replace(/""/g, '"');
                        } else {
                            name = namePart;
                        }
                    }
                }

                if (name && !isNaN(duration) && duration > 0) {
                    return {
                        id: `csv-${new Date().getTime()}-${index}`,
                        name,
                        plannedDuration: duration * 60,
                        actualDuration: null,
                        startTime: null,
                        endTime: null,
                        status: ActivityStatus.Pending,
                    };
                }
            } catch (error) {
                console.error("Errore during parsing della riga CSV:", line, error);
            }
            return null;
        }).filter((act): act is Activity => act !== null);

        if (newActivities.length > 0) {
            setActivities(prev => [...prev, ...newActivities]);
        }
    };
    reader.readAsText(file);
};

const handleImportDataCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') return;

        const allLines = text.split('\n').map(line => line.trim().replace(/\r$/, '')).filter(Boolean);
        if (allLines.length === 0) return;

        const hasHeader = allLines[0].replace(/"/g, '').startsWith("Attività,Tempo Previsto (min),Tempo Effettivo (min),Inizio,Fine");
        const dataLines = hasHeader ? allLines.slice(1) : allLines;

        const parseItalianDate = (str: string): Date | null => {
            if (!str || str === '-') return null;
            // Expected format: "dd/mm/yyyy hh:mm:ss"
            const parts = str.trim().split(/\s+/);
            if (parts.length < 2) return null;
            const datePart = parts[0];
            const timePart = parts[1];
            
            const dateComponents = datePart.split('/').map(Number);
            if(dateComponents.length < 3) return null;
            const [day, month, year] = dateComponents;

            const timeComponents = timePart.split(':').map(Number);
            if(timeComponents.length < 2) return null; // hh:mm is enough
            const [hours, minutes, seconds = 0] = timeComponents;
            
            if ([day, month, year, hours, minutes].some(isNaN)) {
                return null;
            }
            // Date constructor month is 0-indexed
            return new Date(year, month - 1, day, hours, minutes, seconds);
        };

        const newActivities: Activity[] = dataLines.map((line, index) => {
            try {
                let name = '';
                let restOfLine = line;

                if (line.startsWith('"')) {
                    let nameEndIndex = -1;
                    for (let i = 1; i < line.length; i++) {
                        if (line[i] === '"') {
                            if (i + 1 < line.length && line[i + 1] === '"') {
                                i++; // This is an escaped quote, skip it
                            } else {
                                nameEndIndex = i; // This is the closing quote
                                break;
                            }
                        }
                    }

                    if (nameEndIndex !== -1) {
                        name = line.substring(1, nameEndIndex).replace(/""/g, '"');
                        restOfLine = line.substring(nameEndIndex + 2); // +2 to skip the quote and the comma
                    } else {
                        return null;
                    }
                } else {
                    const firstCommaIndex = line.indexOf(',');
                    if (firstCommaIndex !== -1) {
                        name = line.substring(0, firstCommaIndex);
                        restOfLine = line.substring(firstCommaIndex + 1);
                    } else {
                        return null;
                    }
                }

                if (!name) return null;

                const parts = restOfLine.split(',');
                if (parts.length < 4) return null; // Must have planned, actual, start, end

                const plannedDurationMin = parseInt(parts[0], 10);
                const actualDurationMinStr = parts[1];
                const startTimeStr = parts[2];
                const endTimeStr = parts[3];

                const plannedDuration = isNaN(plannedDurationMin) ? 0 : plannedDurationMin * 60;
                
                const actualDuration = actualDurationMinStr && !isNaN(parseInt(actualDurationMinStr, 10)) ? parseInt(actualDurationMinStr, 10) * 60 : null;

                const startTime = parseItalianDate(startTimeStr.trim());
                const endTime = parseItalianDate(endTimeStr.trim());

                const status = (actualDuration !== null || (startTime && endTime)) ? ActivityStatus.Completed : ActivityStatus.Pending;

                return {
                    id: `csv-data-${new Date().getTime()}-${index}`,
                    name,
                    plannedDuration,
                    actualDuration,
                    startTime,
                    endTime,
                    status,
                };
            } catch (error) {
                console.error("Errore durante il parsing della riga dati CSV:", line, error);
                return null;
            }
        }).filter((act): act is Activity => act !== null);

        if (newActivities.length > 0) {
            setActivities(prev => [...prev, ...newActivities]);
            alert(`${newActivities.length} attività importate con successo.`);
        } else {
            alert("Nessuna attività valida trovata nel file. Controlla il formato del file e che segua la struttura: Attività,Tempo Previsto (min),Tempo Effettivo (min),Inizio,Fine");
        }
    };
    reader.readAsText(file, 'utf-8');
  };
  
  const formatDateTimeForExport = (date: Date | null): string => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const handleExportCSV = () => {
    const headers = "Attività,Tempo Previsto (min),Tempo Effettivo (min),Inizio,Fine";
    const csvContent = [
        headers,
        ...activities.map(act => {
            const name = `"${act.name.replace(/"/g, '""')}"`;
            const planned = Math.round(act.plannedDuration / 60);
            const actual = act.actualDuration ? Math.round(act.actualDuration / 60) : '';
            const start = formatDateTimeForExport(act.startTime);
            const end = formatDateTimeForExport(act.endTime);
            return [name, planned, actual, start, end].join(',');
        })
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `dati_riunione_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportTemplateCSV = () => {
    const csvRows = activities.map(act => {
        const plannedMinutes = Math.round(act.plannedDuration / 60);
        const name = `"${act.name.replace(/"/g, '""')}"`;
        return [plannedMinutes, name].join(',');
    });

    const csvContent = csvRows.join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `template_riunione_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleDeleteActivity = (id: string) => {
    if(activeActivityId === id) {
        alert("Non puoi eliminare un'attività in corso.");
        return;
    }
    setActivities(prev => prev.filter(act => act.id !== id));
  };
  
  const handleClearData = () => {
    setActivities([]);
    setActiveActivityId(null);
    setCountdown(0);
    setSessionStartTime(null);
    setMeetingStartTime(new Date());
  };

  const handleDuplicateActivity = (id: string) => {
    const activityToDuplicate = activities.find(act => act.id === id);
    if (!activityToDuplicate) return;

    const newActivity: Activity = {
      ...activityToDuplicate,
      id: `duplicated-${Date.now()}`,
      status: ActivityStatus.Pending,
      actualDuration: null,
      startTime: null,
      endTime: null,
    };
    
    const originalIndex = activities.findIndex(act => act.id === id);
    const newActivities = [...activities];
    newActivities.splice(originalIndex + 1, 0, newActivity);
    
    setActivities(newActivities);
  };

  const handleEditActivity = (id: string, newName: string, newDurationMinutes: number) => {
    setActivities(prev => 
      prev.map(act => {
        if (act.id === id) {
          if (act.status !== ActivityStatus.Pending) {
              alert("Puoi modificare solo attività in attesa.");
              return act;
          }
          return {
            ...act,
            name: newName,
            plannedDuration: newDurationMinutes * 60
          };
        }
        return act;
      })
    );
  };
  
  const handleManualUpdateActivity = (id: string, field: keyof Activity, value: any) => {
    setActivities(prev =>
      prev.map(act => {
        if (act.id === id) {
          if (act.id === activeActivityId) {
            alert("Non puoi modificare manualmente un'attività in corso.");
            return act;
          }
          
          const updatedActivity = { ...act, [field]: value };

          if ((field === 'startTime' || field === 'endTime') && updatedActivity.startTime && updatedActivity.endTime) {
              if (updatedActivity.endTime.getTime() >= updatedActivity.startTime.getTime()) {
                  updatedActivity.actualDuration = (updatedActivity.endTime.getTime() - updatedActivity.startTime.getTime()) / 1000;
              } else {
                  alert("L'orario di fine non può essere precedente a quello di inizio.");
                  return act; 
              }
          }

          if((field === 'actualDuration' || field === 'startTime' || field === 'endTime') && value !== null) {
              if (updatedActivity.status === ActivityStatus.Pending) {
                updatedActivity.status = ActivityStatus.Completed;
              }
          }

          return updatedActivity;
        }
        return act;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8 max-w-3xl mx-auto">
         <h1 className="text-4xl font-black text-slate-100">Meeting Agenda Timer</h1>
         <p className="text-slate-400 mt-2">Mantieni le tue riunioni puntuali e organizzate.</p>
      </header>
      <main className="grid grid-cols-1 gap-8 max-w-7xl mx-auto">
        <TimerPanel 
          activities={activities}
          activeActivity={activeActivity}
          countdown={countdown}
          meetingStartTime={meetingStartTime}
          setMeetingStartTime={setMeetingStartTime}
          handleImportCSV={handleImportCSV}
          handleExportCSV={handleExportCSV}
          handleExportTemplateCSV={handleExportTemplateCSV}
          handleImportDataCSV={handleImportDataCSV}
          handleClearData={handleClearData}
          ignoreThreshold={ignoreThreshold}
          setIgnoreThreshold={setIgnoreThreshold}
        />
        <Agenda 
          activities={activities}
          setActivities={setActivities}
          activeActivityId={activeActivityId}
          onStartActivity={handleStartActivity}
          onDeleteActivity={handleDeleteActivity}
          onDuplicateActivity={handleDuplicateActivity}
          onEditActivity={handleEditActivity}
          onManualUpdateActivity={handleManualUpdateActivity}
        />
      </main>
       <footer className="text-center mt-8 text-slate-500 text-sm">
        <p>Realizzato con React, TypeScript, e Tailwind CSS.</p>
      </footer>
    </div>
  );
};

export default App;
