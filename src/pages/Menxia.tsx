import { useState, useEffect } from 'react';
import { useImperialStore } from '../store';
import { reviewDecree } from '../services/ai';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadge } from './Dashboard';
import { Check, X, Loader2, AlertTriangle, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Menxia() {
  const decrees = useImperialStore(state => state.decrees);
  const updateDecreeReview = useImperialStore(state => state.updateDecreeReview);
  const approveDecree = useImperialStore(state => state.approveDecree);
  const rejectDecree = useImperialStore(state => state.rejectDecree);
  const navigate = useNavigate();

  // 找出所有需要审核的政令（DRAFT 状态且有 aiPlan 的，或者已经是 REVIEW 状态的）
  const pendingDecrees = decrees.filter(d => 
    (d.status === 'DRAFT' && d.content.aiPlan) || d.status === 'REVIEW'
  );

  const [activeDecreeId, setActiveDecreeId] = useState<string | null>(
    pendingDecrees.length > 0 ? pendingDecrees[0].id : null
  );
  const [isReviewing, setIsReviewing] = useState(false);
  const [expandedComment, setExpandedComment] = useState<'positive' | 'negative' | null>(null);

  const activeDecree = decrees.find(d => d.id === activeDecreeId);

  // 如果选中了一个 DRAFT 状态的政令，自动触发门下省审核
  useEffect(() => {
    if (activeDecree && activeDecree.status === 'DRAFT' && !activeDecree.review.positiveComment && !isReviewing) {
      const fetchReview = async () => {
        setIsReviewing(true);
        try {
          const review = await reviewDecree(activeDecree.content);
          updateDecreeReview(activeDecree.id, review.positive, review.negative);
        } catch (error) {
          console.error("审核失败:", error);
          updateDecreeReview(activeDecree.id, "臣以为此计可行。", "然需谨慎行事，切勿铺张。(AI Review Failed)");
        } finally {
          setIsReviewing(false);
        }
      };
      fetchReview();
    }
  }, [activeDecree, isReviewing, updateDecreeReview]);

  const handleApprove = () => {
    if (activeDecree) {
      approveDecree(activeDecree.id);
      navigate('/shangshu');
    }
  };

  const handleReject = () => {
    if (activeDecree) {
      rejectDecree(activeDecree.id);
      // 驳回后可以留在当前页或者去 Dashboard
    }
  };

  if (pendingDecrees.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="font-display text-4xl mb-4">门下省</h2>
        <div className="brutal-box inline-block p-8">
          <p className="text-xl font-bold">暂无需要审核的政令。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left: List of pending decrees */}
      <div className="w-full lg:w-1/3 space-y-4">
        <h2 className="font-display text-4xl mb-6">门下省 (审核)</h2>
        {pendingDecrees.map(decree => (
          <button
            key={decree.id}
            onClick={() => setActiveDecreeId(decree.id)}
            className={`w-full text-left p-4 border-4 border-imperial-black transition-all ${
              activeDecreeId === decree.id 
                ? 'bg-imperial-cyan translate-x-2 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <StatusBadge status={decree.status} />
            </div>
            <h3 className="font-bold text-lg truncate">{decree.title}</h3>
          </button>
        ))}
      </div>

      {/* Right: Active Decree Details & Review */}
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
              {/* Draft Content */}
              <div className="brutal-box p-6 bg-yellow-50">
                <div className="flex justify-between items-start border-b-4 border-imperial-black pb-4 mb-4">
                  <div>
                    <h3 className="font-display text-3xl">{activeDecree.title}</h3>
                    <p className="text-gray-600 font-bold mt-2">预算: ¥{activeDecree.content.budget} | 期限: {activeDecree.content.deadline}</p>
                  </div>
                  <span className="bg-imperial-black text-white px-3 py-1 font-bold">中书省草案</span>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-2">摘要：</h4>
                  <p className="text-lg">{activeDecree.content.aiPlan}</p>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-2">六部分工：</h4>
                  <ul className="space-y-2">
                    {activeDecree.content.tasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2 border-2 border-dashed border-gray-400 p-2">
                        <span className="bg-imperial-yellow px-2 py-1 text-xs font-bold border-2 border-black whitespace-nowrap">
                          {task.ministry}
                        </span>
                        <span>{task.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Review Section */}
              <div className="brutal-box p-6 bg-white border-imperial-cyan">
                <h3 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-imperial-red" />
                  给事中谏言 (Review)
                </h3>
                
                {isReviewing ? (
                  <div className="flex items-center gap-3 text-lg font-bold text-gray-600 p-8 justify-center border-4 border-dashed border-gray-300">
                    <Loader2 className="animate-spin w-6 h-6" />
                    门下省正在审阅，请稍候...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Positive Comment */}
                    <div className="border-4 border-imperial-black">
                      <button 
                        onClick={() => setExpandedComment(expandedComment === 'positive' ? null : 'positive')}
                        className="w-full flex items-center justify-between p-4 bg-green-100 hover:bg-green-200 transition-colors font-bold text-lg"
                      >
                        <span className="flex items-center gap-2"><ThumbsUp className="text-green-600" /> 臣以为善 (支持理由)</span>
                        {expandedComment === 'positive' ? <ChevronUp /> : <ChevronDown />}
                      </button>
                      <AnimatePresence>
                        {expandedComment === 'positive' && (
                          <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: 'auto' }} 
                            exit={{ height: 0 }} 
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-white font-serif text-lg leading-relaxed border-t-4 border-imperial-black">
                              "{activeDecree.review.positiveComment}"
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Negative Comment */}
                    <div className="border-4 border-imperial-black">
                      <button 
                        onClick={() => setExpandedComment(expandedComment === 'negative' ? null : 'negative')}
                        className="w-full flex items-center justify-between p-4 bg-red-100 hover:bg-red-200 transition-colors font-bold text-lg"
                      >
                        <span className="flex items-center gap-2"><ThumbsDown className="text-red-600" /> 陛下三思 (反对/担忧)</span>
                        {expandedComment === 'negative' ? <ChevronUp /> : <ChevronDown />}
                      </button>
                      <AnimatePresence>
                        {expandedComment === 'negative' && (
                          <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: 'auto' }} 
                            exit={{ height: 0 }} 
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-white font-serif text-lg leading-relaxed border-t-4 border-imperial-black">
                              "{activeDecree.review.negativeComment}"
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!isReviewing && activeDecree.status === 'REVIEW' && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleApprove}
                    className="flex-1 brutal-button bg-imperial-red text-white flex items-center justify-center gap-2 text-xl"
                  >
                    <Check className="w-6 h-6" />
                    朱批：准奏 (Approve)
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 brutal-button bg-white text-imperial-black flex items-center justify-center gap-2 text-xl"
                  >
                    <X className="w-6 h-6" />
                    发回重议 (Reject)
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
