import { useState } from 'react';
import { useImperialStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadge } from './Dashboard';
import { CheckSquare, Square, ExternalLink, Search, CheckCircle2 } from 'lucide-react';

export default function Shangshu() {
  const decrees = useImperialStore(state => state.decrees);
  const toggleTaskCompletion = useImperialStore(state => state.toggleTaskCompletion);
  const completeDecree = useImperialStore(state => state.completeDecree);

  const executingDecrees = decrees.filter(d => d.status === 'EXECUTING');

  const [activeDecreeId, setActiveDecreeId] = useState<string | null>(
    executingDecrees.length > 0 ? executingDecrees[0].id : null
  );

  const activeDecree = decrees.find(d => d.id === activeDecreeId);

  const handleTaskToggle = (taskId: string) => {
    if (activeDecree) {
      toggleTaskCompletion(activeDecree.id, taskId);
    }
  };

  const handleCompleteDecree = () => {
    if (activeDecree) {
      // 检查是否所有任务都完成了
      const allDone = activeDecree.content.tasks.every(t => t.completed);
      if (!allDone) {
        if (!window.confirm("尚有任务未完成，确定要强行结案吗？")) {
          return;
        }
      }
      completeDecree(activeDecree.id);
    }
  };

  // 辅助函数：根据部门渲染不同的快捷操作
  const renderMinistryAction = (ministry: string, description: string) => {
    if (ministry === '户部') {
      return (
        <a href={`https://www.taobao.com/search?q=${encodeURIComponent(description)}`} target="_blank" rel="noreferrer" className="text-imperial-cyan hover:underline flex items-center gap-1 text-sm font-bold">
          <Search className="w-4 h-4" /> 去市集(淘宝)看看
        </a>
      );
    }
    if (ministry === '礼部') {
      return (
        <a href={`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(description)}`} target="_blank" rel="noreferrer" className="text-imperial-red hover:underline flex items-center gap-1 text-sm font-bold">
          <Search className="w-4 h-4" /> 查阅典籍(小红书)
        </a>
      );
    }
    return null;
  };

  if (executingDecrees.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="font-display text-4xl mb-4">尚书省 & 六部</h2>
        <div className="brutal-box inline-block p-8">
          <p className="text-xl font-bold">天下太平，六部暂无差遣。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left: List of executing decrees */}
      <div className="w-full lg:w-1/3 space-y-4">
        <h2 className="font-display text-4xl mb-6">尚书省 (执行)</h2>
        {executingDecrees.map(decree => {
          const progress = Math.round((decree.content.tasks.filter(t => t.completed).length / decree.content.tasks.length) * 100) || 0;
          return (
            <button
              key={decree.id}
              onClick={() => setActiveDecreeId(decree.id)}
              className={`w-full text-left p-4 border-4 border-imperial-black transition-all ${
                activeDecreeId === decree.id 
                  ? 'bg-imperial-red text-white translate-x-2 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]' 
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <StatusBadge status={decree.status} />
                <span className="font-mono font-bold">{progress}%</span>
              </div>
              <h3 className="font-bold text-lg truncate">{decree.title}</h3>
              
              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 border-2 border-black mt-3">
                <div className="h-full bg-imperial-yellow" style={{ width: `${progress}%` }}></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right: Active Decree Tasks */}
      <div className="w-full lg:w-2/3">
        <AnimatePresence mode="wait">
          {activeDecree && (
            <motion.div
              key={activeDecree.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="brutal-box p-6 bg-white">
                <div className="flex justify-between items-start border-b-4 border-imperial-black pb-4 mb-6">
                  <div>
                    <h3 className="font-display text-3xl">{activeDecree.title}</h3>
                    <p className="text-gray-600 font-bold mt-2">预算: ¥{activeDecree.content.budget} | 期限: {activeDecree.content.deadline}</p>
                  </div>
                  <button 
                    onClick={handleCompleteDecree}
                    className="brutal-button bg-green-400 text-black flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    结案
                  </button>
                </div>

                <div className="space-y-4">
                  {activeDecree.content.tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`border-4 border-imperial-black p-4 transition-colors ${
                        task.completed ? 'bg-gray-100 opacity-70' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <button 
                          onClick={() => handleTaskToggle(task.id)}
                          className="mt-1 flex-shrink-0 hover:scale-110 transition-transform"
                        >
                          {task.completed ? (
                            <CheckSquare className="w-8 h-8 text-green-500" />
                          ) : (
                            <Square className="w-8 h-8 text-imperial-black" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-imperial-black text-white px-2 py-1 text-xs font-bold">
                              {task.ministry}
                            </span>
                            {renderMinistryAction(task.ministry, task.description)}
                          </div>
                          <p className={`text-lg font-bold ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Execution Logs */}
              <div className="brutal-box p-6 bg-gray-900 text-green-400 font-mono text-sm h-64 overflow-y-auto">
                <h4 className="text-white mb-4 border-b-2 border-gray-700 pb-2">起居注 (Execution Logs)</h4>
                <div className="space-y-2">
                  {activeDecree.executionLogs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
