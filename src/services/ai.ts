import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function draftDecree(request: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `皇帝口谕：${request}`,
    config: {
      systemInstruction: `你是中书省的宰相，负责将皇帝的口谕（自然语言需求）转化为结构化的政令草案。
你需要根据口谕的具体要求，具体化步骤，并只分派给必要的部门（吏部、户部、礼部、兵部、刑部、工部）。不需要的部门不要安排任务。
- 吏部: 人事、考核
- 户部: 预算、财务、采购
- 礼部: 礼仪、教育、外交、穿搭、攻略
- 兵部: 军事、安保、健身
- 刑部: 法律、合规、惩罚
- 工部: 工程、制造、链接、具体执行操作
请返回JSON格式。`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "政令标题，如：购置夏衣事宜" },
          summary: { type: Type.STRING, description: "政令摘要" },
          budget: { type: Type.NUMBER, description: "预估预算（数字）" },
          deadline: { type: Type.STRING, description: "截止日期或时间节点" },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING, description: "具体任务描述" },
                ministry: { 
                  type: Type.STRING, 
                  description: "负责部门",
                  enum: ['吏部', '户部', '礼部', '兵部', '刑部', '工部']
                }
              },
              required: ["description", "ministry"]
            }
          }
        },
        required: ["title", "summary", "budget", "deadline", "tasks"]
      }
    }
  });

  const text = response.text || '{}';
  const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanText);
}

export async function reviewDecree(plan: any) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `中书省草案：\n${JSON.stringify(plan, null, 2)}`,
    config: {
      systemInstruction: `你是门下省的给事中（谏官），负责审核中书省的政令草案。
你需要给出两条谏言：一条是支持该政令的正面理由（说好），一条是指出该政令潜在弊端或需要节俭/注意的反面理由（说不好）。
语气要符合古代大臣的身份，例如：“臣以为...”、“陛下三思...”。
请返回JSON格式。`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          positive: { type: Type.STRING, description: "正面的支持谏言" },
          negative: { type: Type.STRING, description: "反面的反对或担忧谏言" }
        },
        required: ["positive", "negative"]
      }
    }
  });

  const text = response.text || '{}';
  const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanText);
}

export async function generateHistorianRecord(decree: any) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `政令详情：\n${JSON.stringify(decree, null, 2)}`,
    config: {
      systemInstruction: `你是当朝史官。请根据提供的政令执行全过程（包括起因、预算、六部执行情况、最终结果），撰写一段约200字的文言文史官记述。
格式要求：以“史臣曰：”开头，客观记录事件，并给出简短评价。不需要JSON，直接输出纯文本。`
    }
  });
  return response.text || '史臣曰：此事无考。';
}
