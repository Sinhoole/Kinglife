import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type DecreeStatus = 'DRAFT' | 'REVIEW' | 'EXECUTING' | 'COMPLETED';
export type Ministry = '吏部' | '户部' | '礼部' | '兵部' | '刑部' | '工部' | '未分配';

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  ministry: Ministry;
}

export interface Decree {
  id: string;
  title: string;
  status: DecreeStatus;
  createdAt: Date;
  
  // 中书省数据 (Zhongshu Sheng - Drafting)
  content: {
    userRequest: string;
    aiPlan: string;
    budget: number;
    deadline: string;
    tasks: Task[];
  };
  
  // 门下省数据 (Menxia Sheng - Review)
  review: {
    positiveComment: string;
    negativeComment: string;
    approved: boolean | null;
  };
  
  // 执行痕迹
  executionLogs: string[];
  
  // 史官记述
  historianRecord?: string;
}

interface ImperialStore {
  decrees: Decree[];
  addDecree: (request: string) => string;
  updateDecreeDraft: (id: string, plan: any) => void;
  updateDecreeReview: (id: string, positive: string, negative: string) => void;
  approveDecree: (id: string) => void;
  rejectDecree: (id: string) => void;
  toggleTaskCompletion: (decreeId: string, taskId: string) => void;
  completeDecree: (id: string) => void;
  addLog: (id: string, log: string) => void;
  updateHistorianRecord: (id: string, record: string) => void;
}

export const useImperialStore = create<ImperialStore>((set) => ({
  decrees: [],
  
  addDecree: (request) => {
    const id = uuidv4();
    const newDecree: Decree = {
      id,
      title: '拟旨中...',
      status: 'DRAFT',
      createdAt: new Date(),
      content: {
        userRequest: request,
        aiPlan: '',
        budget: 0,
        deadline: '',
        tasks: [],
      },
      review: {
        positiveComment: '',
        negativeComment: '',
        approved: null,
      },
      executionLogs: [`[${new Date().toLocaleTimeString()}] 皇帝下达口谕：${request}`],
    };
    set((state) => ({ decrees: [newDecree, ...state.decrees] }));
    return id;
  },

  updateDecreeDraft: (id, plan) => set((state) => ({
    decrees: state.decrees.map((d) => 
      d.id === id ? { 
        ...d, 
        title: plan.title || d.title,
        content: { 
          ...d.content, 
          aiPlan: plan.summary || '',
          budget: plan.budget || 0,
          deadline: plan.deadline || '',
          tasks: plan.tasks?.map((t: any) => ({ ...t, id: t.id || uuidv4(), completed: false })) || []
        },
        executionLogs: [...d.executionLogs, `[${new Date().toLocaleTimeString()}] 中书省已拟定草案`]
      } : d
    )
  })),

  updateDecreeReview: (id, positive, negative) => set((state) => ({
    decrees: state.decrees.map((d) => 
      d.id === id ? { 
        ...d, 
        status: 'REVIEW',
        review: { ...d.review, positiveComment: positive, negativeComment: negative },
        executionLogs: [...d.executionLogs, `[${new Date().toLocaleTimeString()}] 门下省给事中已阅，并附上正反两面谏言`]
      } : d
    )
  })),

  approveDecree: (id) => set((state) => ({
    decrees: state.decrees.map((d) => 
      d.id === id ? { 
        ...d, 
        status: 'EXECUTING',
        review: { ...d.review, approved: true },
        executionLogs: [...d.executionLogs, `[${new Date().toLocaleTimeString()}] 皇帝朱批：准奏。移交尚书省执行。`]
      } : d
    )
  })),

  rejectDecree: (id) => set((state) => ({
    decrees: state.decrees.map((d) => 
      d.id === id ? { 
        ...d, 
        status: 'DRAFT',
        review: { ...d.review, approved: false },
        executionLogs: [...d.executionLogs, `[${new Date().toLocaleTimeString()}] 皇帝朱批：发回重议。退回中书省。`]
      } : d
    )
  })),

  toggleTaskCompletion: (decreeId, taskId) => set((state) => ({
    decrees: state.decrees.map((d) => {
      if (d.id !== decreeId) return d;
      const updatedTasks = d.content.tasks.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      const task = d.content.tasks.find(t => t.id === taskId);
      const logMsg = `[${new Date().toLocaleTimeString()}] 六部奏报：任务「${task?.description}」状态更新`;
      return {
        ...d,
        content: { ...d.content, tasks: updatedTasks },
        executionLogs: [...d.executionLogs, logMsg]
      };
    })
  })),

  completeDecree: (id) => set((state) => ({
    decrees: state.decrees.map((d) => 
      d.id === id ? { 
        ...d, 
        status: 'COMPLETED',
        executionLogs: [...d.executionLogs, `[${new Date().toLocaleTimeString()}] 尚书省奏报：政令已全面执行完毕。`]
      } : d
    )
  })),

  addLog: (id, log) => set((state) => ({
    decrees: state.decrees.map((d) => 
      d.id === id ? { 
        ...d, 
        executionLogs: [...d.executionLogs, `[${new Date().toLocaleTimeString()}] ${log}`]
      } : d
    )
  })),

  updateHistorianRecord: (id, record) => set((state) => ({
    decrees: state.decrees.map((d) => 
      d.id === id ? { ...d, historianRecord: record } : d
    )
  })),
}));
