import { useState } from 'react';
import { useImperialStore, Decree } from '../store';
import { generateHistorianRecord } from '../services/ai';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ScrollText, CheckCircle2, Clock, AlertCircle, X, Download, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const decrees = useImperialStore((state) => state.decrees);
  const updateHistorianRecord = useImperialStore((state) => state.updateHistorianRecord);
  
  const [selectedDecree, setSelectedDecree] = useState<Decree | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const stats = {
    total: decrees.length,
    draft: decrees.filter(d => d.status === 'DRAFT').length,
    review: decrees.filter(d => d.status === 'REVIEW').length,
    executing: decrees.filter(d => d.status === 'EXECUTING').length,
    completed: decrees.filter(d => d.status === 'COMPLETED').length,
  };

  const handleExportMarkdown = async (decree: Decree) => {
    setIsExporting(true);
    try {
      let record = decree.historianRecord;
      if (!record) {
        record = await generateHistorianRecord(decree);
        updateHistorianRecord(decree.id, record);
      }

      const markdownContent = `
# ${decree.title}

**状态**: ${decree.status}
**创建时间**: ${format(new Date(decree.createdAt), 'yyyy-MM-dd HH:mm:ss')}
**预算**: ¥${decree.content.budget}
**期限**: ${decree.content.deadline}

## 圣意 (User Request)
${decree.content.userRequest}

## 中书省草案 (Plan)
${decree.content.aiPlan}

## 六部执行 (Tasks)
${decree.content.tasks.map(t => `- [${t.completed ? 'x' : ' '}] [${t.ministry}] ${t.description}`).join('\n')}

## 门下省谏言 (Reviews)
**臣以为善 (正面)**: 
> ${decree.review.positiveComment || '无'}

**陛下三思 (反面)**: 
> ${decree.review.negativeComment || '无'}

## 起居注 (Execution Logs)
${decree.executionLogs.map(l => `- ${l}`).join('\n')}

---

## 史官记述 (Historian Record)
> ${record}
      `.trim();

      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `御旨_${decree.title || '未命名'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("导出失败:", error);
      alert("史官撰写记录失败，请稍后再试。");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h2 className="font-display text-5xl mb-2">大明宫</h2>
        <p className="text-xl font-bold text-gray-600">天下政务，尽在掌握 (Imperial Dashboard)</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="拟旨中" value={stats.draft} color="bg-imperial-yellow" icon={ScrollText} />
        <StatCard title="待审核" value={stats.review} color="bg-imperial-cyan" icon={AlertCircle} />
        <StatCard title="执行中" value={stats.executing} color="bg-imperial-red text-white" icon={Clock} />
        <StatCard title="已完成" value={stats.completed} color="bg-green-400" icon={CheckCircle2} />
      </div>

      {/* Recent Decrees */}
      <div className="brutal-box p-6 mt-8">
        <h3 className="font-display text-3xl mb-6 border-b-4 border-imperial-black pb-2">近期奏折 (Recent Decrees)</h3>
        
        {decrees.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-bold text-lg border-4 border-dashed border-gray-300">
            天下太平，暂无政务。
            <br/>
            (No active decrees. Go to Zhongshu Sheng to draft one.)
          </div>
        ) : (
          <div className="space-y-4">
            {decrees.slice(0, 5).map((decree, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={decree.id} 
                onClick={() => setSelectedDecree(decree)}
                className="border-4 border-imperial-black p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white hover:bg-imperial-yellow cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <StatusBadge status={decree.status} />
                    <span className="text-sm font-bold text-gray-500">
                      {format(new Date(decree.createdAt), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold">{decree.title}</h4>
                </div>
                <div className="text-sm font-mono bg-white px-3 py-1 border-2 border-imperial-black">
                  查看详情 &rarr;
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Decree Details Modal */}
      <AnimatePresence>
        {selectedDecree && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="brutal-box bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-imperial-red text-white p-4 border-b-4 border-imperial-black flex justify-between items-center z-10">
                <h3 className="font-display text-2xl">奏折详情</h3>
                <button onClick={() => setSelectedDecree(null)} className="hover:bg-red-700 p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{selectedDecree.title}</h2>
                    <StatusBadge status={selectedDecree.status} />
                  </div>
                  <button 
                    onClick={() => handleExportMarkdown(selectedDecree)}
                    disabled={isExporting}
                    className="brutal-button bg-imperial-cyan text-black flex items-center gap-2 text-sm px-4 py-2"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    撰写史书并导出 (Markdown)
                  </button>
                </div>

                <div className="bg-gray-100 p-4 border-2 border-imperial-black">
                  <h4 className="font-bold mb-2 text-gray-500">圣意 (Request)</h4>
                  <p className="text-lg">{selectedDecree.content.userRequest}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border-2 border-imperial-black p-3">
                    <span className="text-gray-500 text-sm font-bold">预算</span>
                    <div className="text-xl font-bold">¥{selectedDecree.content.budget}</div>
                  </div>
                  <div className="border-2 border-imperial-black p-3">
                    <span className="text-gray-500 text-sm font-bold">期限</span>
                    <div className="text-xl font-bold">{selectedDecree.content.deadline}</div>
                  </div>
                </div>

                {selectedDecree.historianRecord && (
                  <div className="bg-yellow-50 p-6 border-4 border-imperial-black">
                    <h4 className="font-display text-xl mb-2 flex items-center gap-2">
                      <ScrollText /> 史官记述
                    </h4>
                    <p className="font-serif text-lg leading-relaxed">
                      {selectedDecree.historianRecord}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, color, icon: Icon }: { title: string, value: number, color: string, icon: any }) {
  return (
    <div className={`border-4 border-imperial-black p-4 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] ${color}`}>
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg">{title}</h3>
        <Icon className="w-6 h-6 opacity-80" />
      </div>
      <div className="text-5xl font-display mt-4">{value}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-imperial-yellow text-black',
    REVIEW: 'bg-imperial-cyan text-black',
    EXECUTING: 'bg-imperial-red text-white',
    COMPLETED: 'bg-green-400 text-black',
  };

  const labels: Record<string, string> = {
    DRAFT: '中书拟旨',
    REVIEW: '门下审核',
    EXECUTING: '尚书执行',
    COMPLETED: '功德圆满',
  };

  return (
    <span className={`px-2 py-1 text-xs font-bold border-2 border-imperial-black ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
