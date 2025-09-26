import React from 'react';
import { Truck, SquareCheck as CheckSquare, Calendar, MapPin } from 'lucide-react';

export const MovingPage: React.FC = () => {
  const movingTasks = [
    { id: 1, task: 'Book moving company', completed: false, category: 'Planning' },
    { id: 2, task: 'Change address with bank', completed: true, category: 'Address Change' },
    { id: 3, task: 'Transfer utilities', completed: false, category: 'Utilities' },
    { id: 4, task: 'Update driver\'s license', completed: false, category: 'Government' },
    { id: 5, task: 'Notify employer', completed: true, category: 'Work' },
    { id: 6, task: 'Transfer internet service', completed: false, category: 'Utilities' },
  ];

  const completedTasks = movingTasks.filter(task => task.completed).length;
  const totalTasks = movingTasks.length;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Moving Planner</h2>
        <p className="text-gray-600 text-sm">Organize your move with our comprehensive checklist</p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Moving Progress</h3>
          <span className="text-sm text-gray-600">{completedTasks} of {totalTasks} completed</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-coral-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500">Moving Date</p>
            <p className="font-semibold">Not Set</p>
          </div>
          
          <div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-xs text-gray-500">Tasks Done</p>
            <p className="font-semibold">{completedTasks}/{totalTasks}</p>
          </div>
          
          <div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500">New Address</p>
            <p className="font-semibold">Not Set</p>
          </div>
        </div>
      </div>

      {/* Moving Checklist */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Moving Checklist</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {movingTasks.map((task) => (
            <div key={task.id} className="p-4 flex items-center space-x-3">
              <input
                type="checkbox"
                checked={task.completed}
                className="rounded border-gray-300 text-coral-500 focus:ring-coral-500"
                readOnly
              />
              <div className="flex-1">
                <p className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  {task.task}
                </p>
                <p className="text-xs text-gray-500">{task.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-primary flex items-center justify-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>Set Moving Date</span>
        </button>
        
        <button className="btn-secondary flex items-center justify-center space-x-2">
          <Truck className="w-4 h-4" />
          <span>Find Movers</span>
        </button>
      </div>
    </div>
  );
};