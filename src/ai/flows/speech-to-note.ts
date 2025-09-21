'use server';

/**
 * @fileOverview An AI agent that refines raw speech-to-text transcripts into coherent notes.
 *
 * - speechToNote - A function that takes a raw transcript and returns a polished note.
 * - SpeechToNoteInput - The input type for the speechToNote function.
 * - SpeechToNoteOutput - The return type for the speechToNote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SpeechToNoteInputSchema = z.object({
  transcript: z.string().describe('The raw, unedited transcript from a speech-to-text engine.'),
});
export type SpeechToNoteInput = z.infer<typeof SpeechToNoteInputSchema>;

const SpeechToNoteOutputSchema = z.object({
  note: z.string().describe('The polished, corrected, and coherent note ready for saving.'),
});
export type SpeechToNoteOutput = z.infer<typeof SpeechToNoteOutputSchema>;


export async function speechToNote(input: SpeechToNoteInput): Promise<SpeechToNoteOutput> {
  const prompt = ai.definePrompt({
    name: 'speechToNotePrompt',
    input: { schema: SpeechToNoteInputSchema },
    output: { schema: SpeechToNoteOutputSchema },
    prompt: `You are an intelligent note-taking assistant. You will be given a raw transcript from a voice recognition system. This transcript may contain errors, filler words, or be grammatically incorrect.

Your task is to analyze the following transcript, correct any mistakes, and format it into a single, clear, and concise note. The output should be the most logical and likely sentence or phrase the user intended to say.

Raw Transcript:
"{{{transcript}}}"

Corrected Note:`,
  });

  const speechToNoteFlow = ai.defineFlow(
    {
      name: 'speechToNoteFlow',
      inputSchema: SpeechToNoteInputSchema,
      outputSchema: SpeechToNoteOutputSchema,
    },
    async (input) => {
      const { output } = await prompt(input);
      return output!;
    }
  );

  return speechToNoteFlow(input);
}
