
import React, { useState } from 'react';
import { Activity, ActivityStatus } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CancelIcon, CheckIcon, CopyIcon, EditIcon, GripVerticalIcon, PauseIcon, PlayIcon, PlusIcon, TrashIcon } from './icons';
import { ExportTable } from './ExportTable';

const formatDuration = (seconds: number) => `${Math.round(seconds / 60)} min`;

interface SortableActivityItemProps {
    activity: Activity;
    onStart: (id: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onEdit: (id: string, newName: string, newDuration: number) => void;
    isActive: boolean;
}

const SortableActivityItem: React.FC<SortableActivityItemProps> = ({ activity, onStart, onDelete, onDuplicate, onEdit, isActive }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: activity.id });
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(activity.name);
    const [editedDuration, setEditedDuration] = useState(Math.round(activity.plannedDuration / 60));

    const handleSave = () => {
        if (editedName.trim() && editedDuration > 0) {
            onEdit(activity.id, editedName.trim(), editedDuration);
            setIsEditing(false);
        }
    };
    
    const handleCancel = () => {
        setEditedName(activity.name);
        setEditedDuration(Math.round(activity.plannedDuration / 60));
        setIsEditing(false);
    };
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const statusColor =
        activity.status === ActivityStatus.Completed ? 'border-green-500/50 bg-green-900/20' :
        isActive ? 'border-emerald-500 ring-2 ring-emerald-500 bg-slate-700/80' :
        'border-slate-700 bg-slate-800/50';

    if (isEditing) {
        return (
             <div ref={setNodeRef} style={style} className={`flex items-center p-3 rounded-lg border transition-all mb-2 border-indigo-500 ring-2 ring-indigo-500 bg-slate-700/80`}>
                <div className="flex-grow mx-3 flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text"
                        value={editedName}
                        onChange={e => setEditedName(e.target.value)}
                        className="flex-grow bg-slate-800 border border-slate-600 rounded-md p-2 placeholder-slate-500 text-slate-100"
                        aria-label="Nuovo nome attività"
                    />
                    <div className="flex items-center gap-2">
                         <input 
                            type="number"
                            value={editedDuration}
                            onChange={e => setEditedDuration(Number(e.target.value))}
                            min="1"
                            className="w-24 bg-slate-800 border border-slate-600 rounded-md p-2 placeholder-slate-500 text-slate-100"
                            aria-label="Nuova durata attività"
                        />
                        <span className="text-slate-400">min</span>
                    </div>
                   
                </div>
                <button onClick={handleSave} className="p-2 ml-2 text-green-400 hover:text-green-300 transition-colors" aria-label="Salva modifiche">
                    <CheckIcon className="w-6 h-6" />
                </button>
                <button onClick={handleCancel} className="p-2 ml-1 text-red-400 hover:text-red-300 transition-colors" aria-label="Annulla modifiche">
                    <CancelIcon className="w-6 h-6" />
                </button>
            </div>
        )
    }

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center p-3 rounded-lg border transition-all mb-2 ${statusColor}`}>
            <button {...attributes} {...listeners} className="p-2 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing" aria-label="Riordina attività">
                <GripVerticalIcon className="w-5 h-5" />
            </button>
            <div className="flex-grow mx-3">
                <p className={`font-medium ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}>{activity.name}</p>
                <p className="text-sm text-slate-400">{formatDuration(activity.plannedDuration)}</p>
            </div>
             {activity.status === ActivityStatus.Completed && activity.actualDuration && (
                 <div className="text-right mr-3">
                    <p className="text-sm text-green-400">Completato</p>
                    <p className="text-xs text-slate-400">{formatDuration(activity.actualDuration)}</p>
                 </div>
             )}
            <button
                onClick={() => onStart(activity.id)}
                className={`p-2 rounded-full transition-colors text-white ${isActive ? 'bg-amber-500 hover:bg-amber-400' : 'bg-green-600 hover:bg-green-500'}`}
                aria-label={isActive ? `Pausa ${activity.name}` : `Avvia ${activity.name}`}
                disabled={isEditing}
            >
                {isActive ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            </button>
            <div className="flex items-center ml-1">
                <button onClick={() => setIsEditing(true)} className="p-2 text-slate-500 hover:text-sky-400 transition-colors" aria-label={`Modifica ${activity.name}`}>
                    <EditIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDuplicate(activity.id)} className="p-2 text-slate-500 hover:text-purple-400 transition-colors" aria-label={`Duplica ${activity.name}`}>
                    <CopyIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(activity.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors" aria-label={`Elimina ${activity.name}`}>
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


interface AgendaProps {
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  activeActivityId: string | null;
  onStartActivity: (id: string) => void;
  onDeleteActivity: (id: string) => void;
  onDuplicateActivity: (id: string) => void;
  onEditActivity: (id: string, name: string, duration: number) => void;
  onManualUpdateActivity: (id: string, field: keyof Activity, value: any) => void;
}

export const Agenda: React.FC<AgendaProps> = ({ activities, setActivities, activeActivityId, onStartActivity, onDeleteActivity, onDuplicateActivity, onEditActivity, onManualUpdateActivity }) => {
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDuration, setNewActivityDuration] = useState(5);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActivityName.trim() && newActivityDuration > 0) {
      const newActivity: Activity = {
        id: `new-${Date.now()}`,
        name: newActivityName.trim(),
        plannedDuration: newActivityDuration * 60,
        actualDuration: null,
        startTime: null,
        endTime: null,
        status: ActivityStatus.Pending,
      };
      setActivities(prev => [...prev, newActivity]);
      setNewActivityName('');
      setNewActivityDuration(5);
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
        setActivities((items) => {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    }
  }

  return (
    <div className="bg-slate-800/50 p-6 lg:p-8 rounded-2xl flex flex-col">
      <h2 className="text-xl font-bold text-slate-300 mb-4">Agenda della Riunione</h2>
      
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activities} strategy={verticalListSortingStrategy}>
                {activities.map(act => (
                    <SortableActivityItem 
                        key={act.id} 
                        activity={act}
                        onStart={onStartActivity}
                        onDelete={onDeleteActivity}
                        onDuplicate={onDuplicateActivity}
                        onEdit={onEditActivity}
                        isActive={act.id === activeActivityId}
                    />
                ))}
            </SortableContext>
        </DndContext>
        {activities.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-slate-700 rounded-lg">
                <p className="text-slate-400">Nessuna attività.</p>
                <p className="text-slate-500 text-sm">Aggiungine una sotto o importa un file CSV.</p>
            </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-700">
        <h3 className="font-semibold text-slate-300 mb-3">Aggiungi Attività</h3>
        <form onSubmit={handleAddActivity} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newActivityName}
            onChange={(e) => setNewActivityName(e.target.value)}
            placeholder="Nome attività"
            className="flex-grow bg-slate-700 border border-slate-600 rounded-md p-2 placeholder-slate-500"
          />
          <input
            type="number"
            value={newActivityDuration}
            onChange={(e) => setNewActivityDuration(Number(e.target.value))}
            min="1"
            placeholder="Durata (min)"
            className="w-full sm:w-32 bg-slate-700 border border-slate-600 rounded-md p-2 placeholder-slate-500"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold p-2 rounded-md flex items-center justify-center transition-colors">
            <PlusIcon className="w-5 h-5" />
            <span className="sm:hidden ml-2">Aggiungi</span>
          </button>
        </form>
      </div>
      <ExportTable 
        activities={activities}
        onUpdateActivity={onManualUpdateActivity}
        activeActivityId={activeActivityId}
      />
    </div>
  );
};
