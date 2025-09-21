'use server';
/**
 * @fileOverview An AI agent that generates a pedagogical report for an entire class.
 * - generateClassReport - A function that handles the report generation.
 * - ClassReportInput - The input type for the generateClassReport function.
 * - ClassReportOutput - The return type for the generateClassReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const StudentSummarySchema = z.object({
  studentName: z.string(),
  totalScore: z.number(),
  plusCount: z.number(),
  minusCount: z.number(),
  halfCount: z.number(),
  absentCount: z.number(),
  permittedCount: z.number(),
  notes: z.array(z.string()),
});

const ClassReportInputSchema = z.object({
  className: z.string(),
  studentData: z.array(StudentSummarySchema),
});
export type ClassReportInput = z.infer<typeof ClassReportInputSchema>;

const ClassReportOutputSchema = z.object({
    classOverview: z.string().describe("Sınıfın genel durumu, atmosferi, katılım düzeyi ve genel performansı hakkında 1-2 cümlelik bir özet."),
    commonStrengths: z.string().describe("Sınıf genelinde gözlemlenen ortak güçlü yönler ve olumlu davranışlar."),
    commonChallenges: z.string().describe("Sınıfın genel olarak zorlandığı veya geliştirilmesi gereken ortak alanlar."),
    outstandingStudents: z.string().describe("Performans puanı, artı sayısı ve öğretmen notlarına göre en başarılı olan birkaç öğrencinin isimleri ve neden öne çıktıklarına dair kısa bir not."),
    studentsNeedingSupport: z.string().describe("Performans puanı, eksi sayısı ve öğretmen notlarına göre desteğe en çok ihtiyaç duyan birkaç öğrencinin isimleri ve hangi konularda desteğe ihtiyaç duyduklarına dair yapıcı bir not."),
    generalRecommendations: z.string().describe("Sınıfın genel dinamiklerini ve başarısını artırmak için öğretmene yönelik 2-3 adet somut ve uygulanabilir eylem önerisi."),
});
export type ClassReportOutput = z.infer<typeof ClassReportOutputSchema>;


export async function generateClassReport(input: ClassReportInput): Promise<ClassReportOutput> {
  const prompt = ai.definePrompt({
    name: 'classReportPrompt',
    input: { schema: ClassReportInputSchema },
    output: { schema: ClassReportOutputSchema },
    prompt: `Sen bir uzman eğitim koçu ve pedagogsun. Görevin, sana verilen sınıf verilerini analiz ederek kapsamlı, yapıcı ve eyleme geçirilebilir bir sınıf raporu oluşturmaktır. Cevapların tamamen Türkçe olmalıdır.

Sınıf Adı: {{{className}}}

Öğrenci Verileri:
{{#each studentData}}
- Öğrenci: {{studentName}}
  - Toplam Puan: {{totalScore}}
  - Artı Sayısı: {{plusCount}}
  - Eksi Sayısı: {{minusCount}}
  - Yarım Sayısı: {{halfCount}}
  - Devamsızlık: {{absentCount}} gün
  - İzinli: {{permittedCount}} gün
  - Öğretmen Notları: {{#if notes}}{{#each notes}}"{{this}}" {{/each}}{{else}}Yok{{/if}}
{{/each}}

Lütfen bu verileri analiz ederek aşağıdaki formatta bir rapor oluştur:

- **Genel Değerlendirme:** Sınıfın genel durumunu özetle.
- **Ortak Güçlü Yönler:** Sınıfın genelindeki pozitif eğilimleri belirt.
- **Geliştirilmesi Gereken Alanlar:** Sınıfın ortak zorluklarını ve ihtiyaçlarını ifade et.
- **Öne Çıkan Öğrenciler:** Verilere dayanarak olumlu yönde dikkat çeken öğrencileri belirt.
- **Desteğe İhtiyaç Duyan Öğrenciler:** Yapıcı bir dille ve verileri kullanarak desteğe ihtiyaç duyan öğrencileri belirt.
- **Genel Öneriler:** Sınıfın genel başarısını artırmak için öğretmene yönelik somut tavsiyeler sun.`,
  });

  const classReportFlow = ai.defineFlow(
    {
      name: 'classReportFlow',
      inputSchema: ClassReportInputSchema,
      outputSchema: ClassReportOutputSchema,
    },
    async (input) => {
      const { output } = await prompt(input);
      return output!;
    }
  );

  return classReportFlow(input);
}
