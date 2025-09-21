'use server';

/**
 * @fileOverview An AI agent that generates answers for forum questions.
 * - generateForumAnswer - A function that handles generating an answer.
 * - ForumAssistantInput - The input type for the function.
 * - ForumAssistantOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ForumAssistantInputSchema = z.object({
  title: z.string().describe('The title of the forum post.'),
  description: z.string().describe('The detailed description of the forum post.'),
});
export type ForumAssistantInput = z.infer<typeof ForumAssistantInputSchema>;

const ForumAssistantOutputSchema = z.object({
  answer: z.string().describe("The AI's comprehensive and helpful answer to the question."),
});
export type ForumAssistantOutput = z.infer<typeof ForumAssistantOutputSchema>;

export async function generateForumAnswer(input: ForumAssistantInput): Promise<ForumAssistantOutput> {
  const prompt = ai.definePrompt({
    name: 'forumAssistantPrompt',
    input: { schema: ForumAssistantInputSchema },
    output: { schema: ForumAssistantOutputSchema },
    prompt: `You are EduBot, an expert AI assistant for teachers, specializing in pedagogy, classroom management, and various subjects for K-12 education in Turkey. Your personality is helpful, insightful, and encouraging.

A teacher has asked the following question on a forum. Your task is to provide a comprehensive, well-structured, and practical answer in Turkish.

Begin your answer with a supportive and acknowledging tone.
Structure your response with clear headings or bullet points if applicable.
Offer actionable advice, creative ideas, or different perspectives.
Conclude with an encouraging remark.

Question Title: {{{title}}}

Question Description:
{{{description}}}

Please generate your expert answer below.`,
  });

  const forumAssistantFlow = ai.defineFlow(
    {
      name: 'forumAssistantFlow',
      inputSchema: ForumAssistantInputSchema,
      outputSchema: ForumAssistantOutputSchema,
    },
    async (input) => {
      const { output } = await prompt(input);
      if (!output) {
        return { answer: 'Yapay zeka bir cevap üretemedi.' };
      }
      return output;
    }
  );

  return forumAssistantFlow(input);
}
