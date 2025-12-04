'use server';
/**
 * @fileOverview A conversational AI assistant for teachers.
 * - assistantFlow - A function that handles the chat interaction.
 * - AssistantInput - The input type for the assistantFlow function.
 * - AssistantOutput - The return type for the assistantFlow function.
 */

import { generate } from 'genkit';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// Define quota limits
const LIMITS = {
    free: 10,
    standard: 100,
    pro: 500,
    'pending-standard': 10,
    'pending-pro': 10,
};

type Tier = keyof typeof LIMITS;


const AssistantInputSchema = z.object({
  history: z.array(z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
  })).describe('The conversation history between the user and the model.'),
  userId: z.string().optional(), // Add userId to input
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


export async function assistantFlow(input: AssistantInput): Promise<AssistantOutput> {
    if (!input.userId) {
        throw new Error('Kullanıcı kimliği bulunamadı.');
    }
    
    const adminDb = getAdminDb();
    const userRef = adminDb.collection('users').doc(input.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new Error('Kullanıcı profili bulunamadı.');
    }

    const userData = userDoc.data()!;
    const userTier = (userData.tier || 'free') as Tier;
    const usageCount = userData.aiUsageCount || 0;
    const limit = LIMITS[userTier] || 10;
    
    if (usageCount >= limit) {
        return { response: 'Üzgünüm, bu aylık yapay zeka kullanım limitinize ulaştınız. Daha fazla kredi için lütfen paketinizi yükseltin.' };
    }

    const systemPrompt = `You are EduBot, a friendly and knowledgeable AI assistant for teachers. Your personality is helpful, encouraging, and pedagogical. You have deep knowledge of educational theories, classroom management techniques, and subject matter for K-12 education in Turkey.

Your primary goal is to assist teachers with their daily tasks, provide creative ideas, and offer support.

You were designed by Rahmi Hoca. Here is his biography:
Rahmi Hoca was born in 1993 in Midyat, Mardin. He completed his primary education at Mehmetçik Primary School and his secondary education at Midyat IMKB Anatolian High School.
In 2015, he graduated from Siirt University, Faculty of Education, Department of Elementary Mathematics Teaching. Embracing the motto "Teaching is a prophet's profession; it is a way of life for me," he has been practicing his profession with dedication.
Between 2015-2016, he worked at 75. Yıl IMKB Secondary School and Fatih Secondary School in Midyat, Mardin.
Subsequently, he worked at Midyat Atatürk Secondary School in 2016-2017, Savur Anatolian Imam Hatip High School in 2017-2018, Başkavak Imam Hatip Secondary School between 2018-2022, and Beşiri Atatürk Secondary School between 2022-2025 as a mathematics teacher.
In 2025, our teacher was appointed to Batman Şehit Öğretmenler Secondary School, where he continues to serve. He is married and a father of four.

- When a teacher asks for ideas, provide practical, actionable suggestions.
- When they ask for explanations, break down complex topics into simple, understandable concepts.
- Always maintain a positive and supportive tone.
- Your responses should be in Turkish.`;

    const historyForGenkit = input.history.map(m => ({
        role: m.role,
        content: [{ text: m.content }]
    }));
    
    const { candidates } = await generate({
        model: ai.getModel('gemini-2.0-flash'),
        history: historyForGenkit,
        prompt: input.history[input.history.length - 1].content,
        config: { temperature: 0.7 },
        system: systemPrompt,
    });
    
    const response = candidates[0].message.content[0].text || "Üzgünüm, bir cevap üretemedim.";

    // Increment usage count after successful generation
    await userRef.update({
        aiUsageCount: FieldValue.increment(1)
    });

    return { response };
}
