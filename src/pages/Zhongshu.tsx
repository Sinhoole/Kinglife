import React, { useState } from 'react';
import { useImperialStore, Ministry } from '../store';
import { draftDecree } from '../services/ai';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Edit3, Check, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export default function Zhongshu() {
  const [request, setRequest] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [step, setStep] = useState<'input' | 'edit'>('input');
  const [draftPlan, setDraftPlan] = useState<any>(null);
  const [activeDecreeId, setActiveDecreeId] = useState<string | null>(null);
  
  const addDecree = useImperialStore(state => state.addDecree);
  const updateDecreeDraft = useImperialStore(state => state.updateDecreeDraft);
  const navigate = useNavigate();

  const handleDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;

    setIsDrafting(true);
    const decreeId = addDecree(request);
    setActiveDecreeId(decreeId);

    try {
      const plan = await draftDecree(request);
      // Ensure tasks have IDs
      const planWithIds = {
        ...plan,
        tasks: plan.tasks?.map((t: any) => ({ ...t, id: uuidv4() })) || []
      };
      setDraftPlan(planWithIds);
      setStep('edit');
    } catch (error) {
      console.error("拟旨失败:", error);
      alert("中书省笔误，请重新上奏！(AI Request Failed)");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleTaskChange = (taskId: string, field: string, value: string) => {
    setDraftPlan((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) => t.id === taskId ? { ...t, [field]: value } : t)
    }));
  };

  const handleAddTask = () => {
    setDraftPlan((prev: any) => ({
      ...prev,
      tasks: [...prev.tasks, { id: uuidv4(), description: '新任务', ministry: '未分配' }]
    }));
  };

  const handleRemoveTask = (taskId: string) => {
    setDraftPlan((prev: any) => ({
      ...prev,
      tasks: prev.tasks.filter((t: any) => t.id !== taskId)
    }));
  };

  const handleSubmitToMenxia = () => {
    if (activeDecreeId && draftPlan) {
      updateDecreeDraft(activeDecreeId, draftPlan);
      navigate('/menxia');
    }
  };

  const ministries: Ministry[] = ['吏部', '户部', '礼部', '兵部', '刑部', '工部', '未分配'];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h2 className="font-display text-5xl mb-4 text-imperial-red">中书省</h2>
        <p className="text-xl font-bold bg-imperial-yellow inline-block px-4 py-1 border-4 border-imperial-black transform -rotate-2">
          定旨出命 (The Drafting Room)
        </p>
      </header>

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div 
            key="input"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="brutal-box p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-imperial-red rounded-full mix-blend-multiply opacity-20 -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-imperial-cyan rounded-full mix-blend-multiply opacity-20 translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

            <form onSubmit={handleDraft} className="relative z-10 space-y-6">
              <div>
                <label className="block text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="bg-imperial-black text-white px-3 py-1">奏折</span>
                  陛下有何旨意？
                </label>
                <textarea
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="例如：夏天到了，朕想买几件新衣裳，预算500块，下周前办妥。"
                  className="w-full h-48 brutal-input text-lg resize-none"
                  disabled={isDrafting}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isDrafting || !request.trim()}
                  className="brutal-button bg-imperial-red text-white flex items-center gap-2 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDrafting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      宰相拟旨中...
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-6 h-6" />
                      令中书省草拟
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 'edit' && draftPlan && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="brutal-box p-8 bg-white"
          >
            <h3 className="font-display text-3xl mb-6 border-b-4 border-imperial-black pb-2 flex items-center justify-between">
              <span>政令草案 (Draft Plan)</span>
              <span className="text-sm font-sans bg-imperial-yellow px-2 py-1 border-2 border-black">可修改</span>
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block font-bold mb-2">政令标题 (Title)</label>
                <input 
                  type="text" 
                  value={draftPlan.title} 
                  onChange={e => setDraftPlan({...draftPlan, title: e.target.value})}
                  className="w-full brutal-input"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">政令摘要 (Summary)</label>
                <textarea 
                  value={draftPlan.summary} 
                  onChange={e => setDraftPlan({...draftPlan, summary: e.target.value})}
                  className="w-full brutal-input h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-2">预算 (Budget)</label>
                  <input 
                    type="number" 
                    value={draftPlan.budget} 
                    onChange={e => setDraftPlan({...draftPlan, budget: Number(e.target.value)})}
                    className="w-full brutal-input"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2">期限 (Deadline)</label>
                  <input 
                    type="text" 
                    value={draftPlan.deadline} 
                    onChange={e => setDraftPlan({...draftPlan, deadline: e.target.value})}
                    className="w-full brutal-input"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="font-bold text-xl">六部分工 (Tasks)</label>
                  <button onClick={handleAddTask} className="flex items-center gap-1 text-sm font-bold bg-imperial-black text-white px-3 py-1 hover:bg-gray-800">
                    <Plus className="w-4 h-4" /> 增派任务
                  </button>
                </div>
                
                <div className="space-y-3">
                  {draftPlan.tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-2 border-2 border-dashed border-gray-400 p-2 bg-gray-50">
                      <select 
                        value={task.ministry}
                        onChange={e => handleTaskChange(task.id, 'ministry', e.target.value)}
                        className="border-2 border-imperial-black bg-white p-2 font-bold outline-none"
                      >
                        {ministries.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input 
                        type="text"
                        value={task.description}
                        onChange={e => handleTaskChange(task.id, 'description', e.target.value)}
                        className="flex-1 border-2 border-imperial-black bg-white p-2 outline-none"
                      />
                      <button onClick={() => handleRemoveTask(task.id)} className="p-2 text-imperial-red hover:bg-red-100 border-2 border-transparent hover:border-imperial-red">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t-4 border-imperial-black mt-8">
                <button
                  onClick={handleSubmitToMenxia}
                  className="brutal-button bg-imperial-cyan text-black flex items-center gap-2 text-xl"
                >
                  <Send className="w-6 h-6" />
                  确认无误，移交门下省
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
