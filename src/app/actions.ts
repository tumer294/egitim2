'use server';

import { descriptionAutoFill } from '@/ai/flows/description-auto-fill';
import type { DescriptionAutoFillInput } from '@/ai/flows/description-auto-fill';
import { speechToNote } from '@/ai/flows/speech-to-note';
import type { SpeechToNoteInput, SpeechToNoteOutput } from '@/ai/flows/speech-to-note';
import { assistantFlow } from '@/ai/dev';
import type { AssistantInput } from '@/ai/dev';
import { generateIndividualReport } from '@/ai/flows/individual-student-report-flow';
import type { IndividualStudentReportInput, IndividualStudentReportOutput } from '@/ai/flows/individual-student-report-flow';
import { generateClassReport } from '@/ai/flows/class-report-flow.ts';
import type { ClassReportInput, ClassReportOutput } from '@/ai/flows/class-report-flow.ts';
import { generateForumAnswer } from '@/ai/flows/forum-assistant-flow';
import type { ForumAssistantInput } from '@/ai/flows/forum-assistant-flow';
import { parseStudentList } from '@/ai/flows/student-list-parser';
import type { StudentListParserInput, StudentListParserOutput } from '@/ai/flows/student-list-parser';
import type { ForumAuthor, ForumReply, SurveyResult } from '@/lib/types';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";


export async function generateDescriptionAction(input: DescriptionAutoFillInput) {
  try {
    const result = await descriptionAutoFill(input);

    if (result?.description) {
      return { description: result.description };
    }
    
    return { description: "AI-powered description could not be generated." };

  } catch (error) {
    console.error('AI description generation failed:', error);
    return { error: 'AI ile açıklama üretilirken bir hata oluştu.' };
  }
}

export async function speechToNoteAction(input: SpeechToNoteInput): Promise<SpeechToNoteOutput | { error: string }> {
  try {
    const result = await speechToNote(input);
    // If the AI provides a refined note, use it.
    if (result?.note || (result.items && result.items.length > 0)) {
      return result;
    }
    // Otherwise, fallback gracefully to the original transcript without showing an error.
    return { type: 'text', note: input.transcript, items: [] };
  } catch (error) {
    console.error('Speech-to-note processing failed:', error);
    // If an actual error occurs, return the original transcript as a fallback.
    return { type: 'text', note: input.transcript, items: [], error: 'Sesli not işlenirken bir hata oluştu.' };
  }
}

export async function assistantAction(input: AssistantInput): Promise<{ response: string } | { error: string }> {
  try {
    const auth = getAuth(app);
    const userId = auth.currentUser?.uid;
    if (!userId) {
        return { error: 'Kullanıcı oturumu bulunamadı.' };
    }

    const result = await assistantFlow({ ...input, userId });
    if (result?.response) {
      return { response: result.response };
    }
    return { error: 'Yapay zekadan bir cevap alınamadı.' };
  } catch (error: any) {
    console.error('Assistant action failed:', error);
    return { error: error.message || 'Yapay zeka ile iletişim kurulurken bir hata oluştu.' };
  }
}


export async function generateIndividualReportAction(input: IndividualStudentReportInput): Promise<{ report: IndividualStudentReportOutput } | { error: string }> {
  try {
    const result = await generateIndividualReport(input);
    if (result) {
      return { report: result };
    }
    return { error: 'Yapay zeka raporu oluşturulamadı.' };
  } catch (error) {
    console.error('AI individual report generation failed:', error);
    return { error: 'Yapay zeka ile rapor üretilirken bir hata oluştu.' };
  }
}

export async function generateClassReportAction(input: ClassReportInput): Promise<{ report: ClassReportOutput } | { error: string }> {
  try {
    const result = await generateClassReport(input);
    if (result) {
      return { report: result };
    }
    return { error: 'Yapay zeka sınıf raporu oluşturulamadı.' };
  } catch (error) {
    console.error('AI class report generation failed:', error);
    return { error: 'Yapay zeka ile sınıf raporu üretilirken bir hata oluştu.' };
  }
}

export async function parseStudentListAction(input: StudentListParserInput): Promise<StudentListParserOutput | { error: string }> {
    try {
        const result = await parseStudentList(input);
        if (result?.classes) {
            return result;
        }
        return { error: 'Listeyi ayrıştırırken bir hata oluştu.' };
    } catch (error) {
        console.error('Student list parsing failed:', error);
        return { error: 'Öğrenci listesi ayrıştırılırken bir hata oluştu.' };
    }
}


export async function addReplyAction(postId: string, replyData: { author: ForumAuthor, content: string }) {
    if (!replyData.author || !replyData.content) {
        return { success: false, error: 'Cevap içeriği veya yazar bilgisi eksik.' };
    }
    try {
        await addDoc(collection(db, `forum/${postId}/replies`), {
            ...replyData,
            date: new Date().toISOString(),
            upvotedBy: [],
            commentCount: 0,
        });
        return { success: true };
    } catch (error) {
        console.error("Error adding reply:", error);
        return { success: false, error: 'Cevap eklenirken bir hata oluştu.' };
    }
}


export async function generateStandaloneAiAnswerAction(input: ForumAssistantInput): Promise<{ answer: string } | { error: string }> {
  try {
    const aiResponse = await generateForumAnswer(input);
    
    if (!aiResponse || !aiResponse.answer) {
        throw new Error('Yapay zeka bir cevap üretemedi.');
    }
    
    return { answer: aiResponse.answer };
  } catch (error: any) {
    console.error('AI forum answer generation failed:', error);
    return { error: error.message || 'Yapay zeka cevabı oluşturulurken bilinmeyen bir hata oluştu.' };
  }
}
