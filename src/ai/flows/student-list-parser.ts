'use server';

/**
 * @fileOverview An AI agent that parses student lists from uploaded files.
 * - parseStudentList - A function that handles parsing the student list.
 * - StudentListParserInput - The input type for the function.
 * - StudentListParserOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const StudentSchema = z.object({
  studentNumber: z.number().describe("The student's school number."),
  firstName: z.string().describe('The first name of the student.'),
  lastName: z.string().describe('The last name of the student.'),
});

const ClassSchema = z.object({
  className: z.string().describe('The name of the class, e.g., "8/C".'),
  students: z.array(StudentSchema).describe('An array of students in this class.'),
});

const StudentListParserInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The student list file (PDF, Excel, etc.) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const StudentListParserOutputSchema = z.object({
  classes: z.array(ClassSchema).describe('An array of classes parsed from the file.'),
});

// Export types separately for clarity and to comply with "use server"
export type { StudentListParserInput, StudentListParserOutput };
type StudentListParserInput = z.infer<typeof StudentListParserInputSchema>;
type StudentListParserOutput = z.infer<typeof StudentListParserOutputSchema>;


export async function parseStudentList(input: StudentListParserInput): Promise<StudentListParserOutput> {
  const prompt = ai.definePrompt({
    name: 'studentListParserPrompt',
    input: { schema: StudentListParserInputSchema },
    output: { schema: StudentListParserOutputSchema },
    prompt: `You are an expert AI assistant that specializes in parsing structured data from documents like PDFs and Excel sheets, specifically for school-related documents from the Turkish education system (e-Okul).

Your task is to analyze the provided file and extract a list of classes and the students within each class.

- The file contains one or more class lists.
- For each class, identify the class name (e.g., "8/A", "11/C Fen").
- For each student in a class, extract their school number, first name, and last name.
- Pay close attention to the column headers to correctly map the data. Student number might be "No", "Numara", "Okul No". First name is usually "Adı", and last name is "Soyadı".
- If the file contains multiple classes, create a separate class object for each one.
- Structure the output strictly according to the provided JSON schema. Ensure all fields are correctly populated.

File to analyze:
{{media url=fileDataUri}}`,
  });

  const studentListParserFlow = ai.defineFlow(
    {
      name: 'studentListParserFlow',
      inputSchema: StudentListParserInputSchema,
      outputSchema: StudentListParserOutputSchema,
    },
    async (input) => {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('AI could not parse the student list.');
      }
      return output;
    }
  );

  return studentListParserFlow(input);
}