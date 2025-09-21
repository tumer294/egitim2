'use server';

/**
 * @fileOverview An AI agent that auto-fills the description field for a student based on previous entries.
 *
 * - descriptionAutoFill - A function that handles the description auto-fill process.
 * - DescriptionAutoFillInput - The input type for the descriptionAutoFill function.
 * - DescriptionAutoFillOutput - The return type for the descriptionAutoFill function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DescriptionAutoFillInputSchema = z.object({
  studentId: z.string().describe('The ID of the student.'),
  classId: z.string().describe('The ID of the class.'),
  recordDate: z.string().describe('The date for which the description is needed (YYYY-MM-DD).'),
});
export type DescriptionAutoFillInput = z.infer<typeof DescriptionAutoFillInputSchema>;

const DescriptionAutoFillOutputSchema = z.object({
  description: z.string().describe('The auto-filled description for the student.'),
});
export type DescriptionAutoFillOutput = z.infer<typeof DescriptionAutoFillOutputSchema>;

export async function descriptionAutoFill(input: DescriptionAutoFillInput): Promise<DescriptionAutoFillOutput> {
    const prompt = ai.definePrompt({
    name: 'descriptionAutoFillPrompt',
    input: {schema: DescriptionAutoFillInputSchema},
    output: {schema: DescriptionAutoFillOutputSchema},
    prompt: `You are an AI assistant helping teachers auto-fill description fields for student records.

  Given the student ID, class ID, and record date, generate a concise, objective, and pedagogical observation note for the student.
  The note should reflect a potential observation a teacher might make on that day.
  Example notes: "Showed great participation in the math lesson.", "Seemed a bit distracted during the Turkish class.", "Completed the given task ahead of time and helped a friend.", "Forgot to bring the homework assignment."
  
  Do not refer to past entries. Generate a new, relevant note for the given date.
  Keep the language professional and suitable for a school environment.

  Student ID: {{{studentId}}}
  Class ID: {{{classId}}}
  Record Date: {{{recordDate}}}

  Description:`,
  });

  const descriptionAutoFillFlow = ai.defineFlow(
    {
      name: 'descriptionAutoFillFlow',
      inputSchema: DescriptionAutoFillInputSchema,
      outputSchema: DescriptionAutoFillOutputSchema,
    },
    async input => {
      const {output} = await prompt(input);
      return output!;
    }
  );
  
  return descriptionAutoFillFlow(input);
}
