'use server';
/**
 * @fileOverview An AI agent that generates a pedagogical report for a student.
 * - generateIndividualReport - A function that handles the report generation.
 * - IndividualStudentReportInput - The input type for the generateIndividualReport function.
 * - IndividualStudentReportOutput - The return type for the generateIndividualReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const IndividualStudentReportInputSchema = z.object({
  studentName: z.string(),
  className: z.string(),
  plusCount: z.number(),
  minusCount: z.number(),
  halfCount: z.number(),
  absentCount: z.number(),
  permittedCount: z.number(),
  notes: z.array(z.string()),
});
export type IndividualStudentReportInput = z.infer<typeof IndividualStudentReportInputSchema>;

const IndividualStudentReportOutputSchema = z.object({
    generalEvaluation: z.string().describe("Öğrencinin genel durumu, derse katılımı ve davranışları hakkında 2-3 cümlelik bir özet."),
    strengths: z.string().describe("Öğrencinin aldığı artılar ve öğretmen notlarına dayanarak belirlenen güçlü yönleri ve olumlu davranışları."),
    areasForImprovement: z.string().describe("Öğrencinin aldığı eksiler ve öğretmen notlarına dayanarak belirlenen, yapıcı bir dille ifade edilmiş geliştirilmesi gereken yönleri."),
    recommendations: z.string().describe("Öğrencinin gelişimini desteklemek amacıyla öğretmene, veliye veya öğrencinin kendisine yönelik 2-3 adet somut ve uygulanabilir eylem önerisi."),
});
export type IndividualStudentReportOutput = z.infer<typeof IndividualStudentReportOutputSchema>;


export async function generateIndividualReport(input: IndividualStudentReportInput): Promise<IndividualStudentReportOutput> {
  const prompt = ai.definePrompt({
    name: 'individualStudentReportPrompt',
    input: { schema: IndividualStudentReportInputSchema },
    output: { schema: IndividualStudentReportOutputSchema },
    prompt: `Sen bir uzman rehber öğretmen ve pedagogsun. Görevin, sana verilen öğrenci verilerini analiz ederek kapsamlı, yapıcı ve eyleme geçirilebilir bir öğrenci gelişim raporu oluşturmaktır. Cevapların tamamen Türkçe olmalıdır.

Öğrenci: {{{studentName}}}
Sınıf: {{{className}}}

Performans Verileri:
- Artı Sayısı: {{plusCount}}
- Eksi Sayısı: {{minusCount}}
- Yarım Sayısı: {{halfCount}}
- Devamsızlık: {{absentCount}} gün
- İzinli: {{permittedCount}} gün
- Öğretmen Notları: {{#if notes}}{{#each notes}}"{{this}}" {{/each}}{{else}}Yok{{/if}}

Lütfen bu verileri analiz ederek aşağıdaki formatta bir rapor oluştur:

- **Genel Değerlendirme:** Öğrencinin genel durumunu özetle.
- **Güçlü Yönler:** Öğrencinin pozitif yönlerini vurgula.
- **Geliştirilmesi Gereken Yönler:** Öğrencinin zorlandığı alanları yapıcı bir dille ifade et.
- **Öneriler:** Öğrencinin gelişimine yönelik somut adımlar sun.`,
  });

  const individualStudentReportFlow = ai.defineFlow(
    {
      name: 'individualStudentReportFlow',
      inputSchema: IndividualStudentReportInputSchema,
      outputSchema: IndividualStudentReportOutputSchema,
    },
    async (input) => {
      const { output } = await prompt(input);
      return output!;
    }
  );

  return individualStudentReportFlow(input);
}
