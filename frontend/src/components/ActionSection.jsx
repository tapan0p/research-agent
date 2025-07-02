// src/components/ActionSection.jsx
import React from 'react';
import { CheckCircle, Zap, Activity, Loader2 } from 'lucide-react';

const ActionItem = ({ action, status }) => {
  const Icon = action.icon;
  
  const getStatusDisplay = () => {
    if (status === 'completed') return 'Completed';
    if (status === 'processing') return 'Processing...';
    return 'Pending';
  };

  const getToolDisplay = () => {
    if (!action.tool || action.tool === 'null' || action.tool === null) {
      return 'General Query';
    }
    return action.tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg transition-all duration-300 ${
      status === 'completed' ? 'bg-green-900/30 border border-green-700/40' :
      status === 'processing' ? 'bg-blue-900/30 border border-blue-700/40' :
      'bg-gray-800/30 border border-gray-600/30'
    }`}>
      <div className={`p-2 rounded-full flex-shrink-0 ${
        status === 'completed' ? 'bg-green-800/50 text-green-400' :
        status === 'processing' ? 'bg-blue-800/50 text-blue-400' :
        'bg-gray-700/50 text-gray-400'
      }`}>
        {status === 'completed' ? (
          <CheckCircle className="w-4 h-4" />
        ) : status === 'processing' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className={`text-sm font-medium truncate ${
            status === 'completed' ? 'text-green-300' :
            status === 'processing' ? 'text-blue-300' :
            'text-gray-300'
          }`}>
            Step {action.stepNumber}
          </p>
          <span className={`text-xs px-2 py-1 rounded-full ${
            status === 'completed' ? 'bg-green-800/30 text-green-400' :
            status === 'processing' ? 'bg-blue-800/30 text-blue-400' :
            'bg-gray-700/30 text-gray-400'
          }`}>
            {getStatusDisplay()}
          </span>
        </div>
        
        <p className={`text-sm mb-2 ${
          status === 'completed' ? 'text-green-200' :
          status === 'processing' ? 'text-blue-200' :
          'text-gray-400'
        }`}>
          {action.action}
        </p>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Tool:</span>
          <span className={`text-xs px-2 py-1 rounded ${
            status === 'completed' ? 'bg-green-900/20 text-green-400' :
            status === 'processing' ? 'bg-blue-900/20 text-blue-400' :
            'bg-gray-800/20 text-gray-400'
          }`}>
            {getToolDisplay()}
          </span>
        </div>
      </div>
    </div>
  );
};

const ActionSection = ({ currentActions, completedActions }) => {
  const totalActions = currentActions.length + completedActions.length;
  
  return (
    <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-blue-800/30 shadow-2xl h-[calc(100vh-70px)] flex flex-col">
      <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Agent Actions</h3>
        </div>
        {totalActions > 0 && (
          <div className="text-sm text-gray-400">
            {completedActions.length}/{totalActions} completed
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentActions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              Currently Processing ({currentActions.length})
            </h4>
            <div className="space-y-3">
              {currentActions.map((action) => (
                <ActionItem key={`current-${action.stepNumber}-${action.id}`} action={action} status="processing" />
              ))}
            </div>
          </div>
        )}

        {completedActions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Completed ({completedActions.length})
            </h4>
            <div className="space-y-3">
              {completedActions.map((action) => (
                <ActionItem key={`completed-${action.stepNumber}-${action.id}`} action={action} status="completed" />
              ))}
            </div>
          </div>
        )}

        {totalActions === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-900/50 to-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-700/30">
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Ready to Assist</h3>
            <p className="text-sm text-gray-400">Send a message to see the AI agent actions in real-time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionSection;