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
    type: z.enum(['text', 'checklist']).describe("The type of content detected. If the user mentions creating a list (e.g., 'to-do list', 'shopping list') or enumerates items, this should be 'checklist'. Otherwise, it should be 'text'."),
    note: z.string().describe("The polished, corrected, and coherent note if the type is 'text'. This will be empty if the type is 'checklist'."),
    items: z.array(z.string()).describe("An array of strings representing the items of the checklist if the type is 'checklist'. This will be empty if the type is 'text'."),
});
export type SpeechToNoteOutput = z.infer<typeof SpeechToNoteOutputSchema>;


export async function speechToNote(input: SpeechToNoteInput): Promise<SpeechToNoteOutput> {
  const prompt = ai.definePrompt({
    name: 'speechToNotePrompt',
    input: { schema: SpeechToNoteInputSchema },
    output: { schema: SpeechToNoteOutputSchema },
    prompt: `You are an intelligent note-taking assistant. You will be given a raw transcript from a voice recognition system. This transcript may contain errors, filler words, or be grammatically incorrect.

Your tasks are:
1. Analyze the following transcript to understand the user's intent.
2. Determine if the user is creating a list (e.g., 'to-do list', 'shopping list', enumerating items like 'first...', 'second...') or just taking a regular note.
3. Set the 'type' field to 'checklist' or 'text' accordingly.
4. **If the type is 'text'**: Correct any mistakes, remove filler words, and format it into a single, clear, and concise note. Populate the 'note' field with this polished text. The 'items' field must be an empty array.
5. **If the type is 'checklist'**: Extract each item from the list. Correct any mistakes in the items. Populate the 'items' array with these polished list items. The 'note' field must be an empty string.

Examples:
- Transcript: "yapılacaklar listesi raporu tamamla veliyi ara ve sınav sorularını hazırla" -> type: 'checklist', items: ["Raporu tamamla", "Veliyi ara", "Sınav sorularını hazırla"]
- Transcript: "market listesi süt ekmek ve yumurta" -> type: 'checklist', items: ["Süt", "Ekmek", "Yumurta"]
- Transcript: "bugün derste ahmet çok iyiydi katılımı yüksekti" -> type: 'text', note: "Bugün derste Ahmet çok iyiydi, katılımı yüksekti."

Raw Transcript:
"{{{transcript}}}"

`,
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
