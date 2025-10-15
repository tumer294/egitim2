
'use server';

/**
 * @fileOverview An AI agent that parses a student list file (PDF, Excel) and extracts class and student information, providing a detailed summary.
 * - parseStudentList - A function that handles the student list parsing process.
 * - StudentListParserOutput - The return type for the parseStudentList function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

type StudentListParserInput = {
    fileDataUri: string;
};

export type StudentListParserOutput = z.infer<typeof StudentListParserOutputSchema>;
const StudentListParserOutputSchema = z.object({
  analysis: z.string().describe("The AI's detailed analysis of the file content in Turkish."),
});


export async function parseStudentList(input: StudentListParserInput): Promise<StudentListParserOutput> {
  const StudentListParserInputSchema = z.object({
    fileDataUri: z
      .string()
      .describe(
        "A student list file (PDF or Excel), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
      ),
  });
  
  const prompt = ai.definePrompt({
      name: 'studentListParserPrompt',
      input: { schema: StudentListParserInputSchema },
      output: { schema: StudentListParserOutputSchema },
      prompt: `Sen bir uzman belge analistisin. Görevin, sana verilen dosyayı (PDF veya Excel formatında bir öğrenci listesi) analiz ederek içeriği hakkında detaylı bir rapor oluşturmaktır. Cevabın tamamen Türkçe olmalıdır.

Kullanıcı bir dosya yükledi. Lütfen aşağıdaki adımları izleyerek bir analiz metni oluştur:

1.  **Genel Değerlendirme:** Dosyanın genel yapısını (örneğin, "Bu bir PDF belgesi ve bir öğrenci listesi içeriyor gibi görünüyor.") kısaca belirt.
2.  **Sınıf Tespiti:** Belgeden sınıf adını veya adlarını bulmaya çalış. "5. Sınıf / D Şubesi" gibi ifadeleri ara. Bulduğun sınıf adını/adlarını raporda belirt.
3.  **Veri Analizi:** Dosyadaki öğrenci verilerini analiz et. Kaç öğrenci bulduğunu, hangi sütunların (Okul No, Adı Soyadı vb.) mevcut olduğunu belirt.
4.  **Örnek Veri:** Ayrıştırdığın ilk 2-3 öğrencinin bilgilerini (numara, ad, soyad) örnek olarak listele. Bu, kullanıcının verinin doğru anlaşıldığını görmesine yardımcı olur.
5.  **Sonuç ve Sonraki Adım:** Analizi özetleyen kısa bir cümle kur ve kullanıcıya "Bu verilerle ne yapmak istersiniz?" gibi bir soru sorarak etkileşimi devam ettir.

Örnek Çıktı:
"Yüklediğiniz Excel dosyasını inceledim. Dosya '8/A' sınıfına ait bir öğrenci listesi içeriyor. Listede 'Okul No' ve 'Adı Soyadı' sütunları altında toplam 25 öğrenci bilgisi tespit ettim.

İşte listeden birkaç örnek:
- 101: Ahmet Yılmaz
- 102: Ayşe Kaya

Bu verilerle ne yapmak istersiniz? Örneğin, bu öğrencileri sisteme kaydedebilir veya onlar hakkında bir rapor oluşturabilirim."

Lütfen bu formata uygun, kullanıcı dostu bir analiz metni oluştur.

Analiz edilecek dosya: {{media url=fileDataUri}}`,
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
        return { analysis: "Yapay zeka dosyayı analiz edemedi." };
      }
      return output;
    }
  );

  return studentListParserFlow(input);
}
