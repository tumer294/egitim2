
'use client';

import * as React from 'react';
import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import AuthGuard from '@/components/auth-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shapes, ChevronLeft, ArrowRight, Loader2, CheckCircle, Eye, Ear, Hand } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useSurveys } from '@/hooks/use-surveys';

const learningStyles = {
  visual: {
    name: 'Görsel Öğrenme',
    description: 'Görsel öğrenenler bilgiyi haritalar, grafikler, diyagramlar ve renklerle görmeyi tercih ederler. Okumayı ve not almayı severler.',
    icon: Eye,
  },
  auditory: {
    name: 'İşitsel Öğrenme',
    description: 'İşitsel öğrenenler dinleyerek ve konuşarak öğrenirler. Tartışmalara katılmaktan, ders anlatımlarından ve sesli okumaktan keyif alırlar.',
    icon: Ear,
  },
  kinesthetic: {
    name: 'Dokunsal/Kinestetik Öğrenme',
    description: 'Kinestetik öğrenenler yaparak ve deneyimleyerek öğrenirler. Fiziksel aktiviteler, deneyler ve canlandırmalar onların en etkili öğrenme yöntemidir.',
    icon: Hand,
  },
};

const questions = [
  { text: 'Bir bilgiyi öğrenirken şemalar, grafikler veya resimler kullanmayı tercih ederim.', type: 'visual' },
  { text: 'Dersleri dinlemek, okumaktan daha çok aklımda kalır.', type: 'auditory' },
  { text: 'Bir şeyi öğrenirken hareket halinde olmak veya ellerimi kullanmak hoşuma gider (örn: model yapmak, deney yapmak).', type: 'kinesthetic' },
  { text: 'Okuduğum bir metindeki önemli yerlerin altını renkli kalemlerle çizerim.', type: 'visual' },
  { text: 'Öğrendiğim bir konuyu başkasına anlatarak veya tartışarak pekiştiririm.', type: 'auditory' },
];

const answerOptions = [
    { label: 'Bana Uygun', value: 2 },
    { label: 'Kısmen Uygun', value: 1 },
    { label: 'Bana Uygun Değil', value: 0 }
];

type Answers = { [key: number]: number };

function OgrenmeStilleriPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const studentId = searchParams.get('studentId');
  const classId = searchParams.get('classId');
  const { toast } = useToast();
  const { saveSurveyResult, isLoading: isSaving } = useSurveys();
  const [isStudentSession, setIsStudentSession] = React.useState(false);
  
  const [answers, setAnswers] = React.useState<Answers>({});
  const [isSurveyComplete, setIsSurveyComplete] = React.useState(false);
  const [dominantStyle, setDominantStyle] = React.useState<keyof typeof learningStyles | null>(null);

  React.useEffect(() => {
    const studentAuth = sessionStorage.getItem('studentAuth');
    setIsStudentSession(!!studentAuth);
  }, []);

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: parseInt(value) }));
  };

  const calculateResults = async () => {
    if (!studentId || !classId) {
        toast({ title: 'Hata', description: 'Öğrenci veya sınıf bilgisi eksik.', variant: 'destructive' });
        return;
    }
      
    const scores: { [key: string]: number } = { visual: 0, auditory: 0, kinesthetic: 0 };

    Object.entries(answers).forEach(([questionIndex, answerValue]) => {
      const question = questions[parseInt(questionIndex)];
      if (question) {
        scores[question.type] += answerValue;
      }
    });

    const dominantStyleResult = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b) as keyof typeof learningStyles;
    setDominantStyle(dominantStyleResult);
    
    const finalResults = {
        dominantStyle: dominantStyleResult,
        scores,
    };
    
    try {
        const surveyData = {
            studentId,
            classId,
            surveyType: 'ogrenme-stilleri',
            results: finalResults,
            completedAt: new Date().toISOString()
        };
        await saveSurveyResult(surveyData);
        toast({ title: 'Başarılı', description: 'Anket sonuçları başarıyla kaydedildi.' });
        setIsSurveyComplete(true);
    } catch(e: any) {
        toast({ title: 'Kaydetme Başarısız', description: e.message || 'Anket sonuçları kaydedilemedi.', variant: 'destructive' });
    }
  };
  
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  
  const BackLink = () => {
    const href = isStudentSession ? `/ogrenci/${studentId}` : '/anket';
    return (
        <Link href={href} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {isStudentSession ? 'Öğrenci Paneline Geri Dön' : 'Öğrenci Seçimine Geri Dön'}
        </Link>
    );
  };
  
  if (isSurveyComplete && dominantStyle) {
    const resultInfo = learningStyles[dominantStyle];
    const Icon = resultInfo.icon;
    const FinishButton = () => {
        const href = isStudentSession ? `/ogrenci/${studentId}` : '/anket';
        return (
            <Link href={href}>
                <Button>
                    <CheckCircle className="h-4 w-4 mr-2"/>
                    Tamamla
                </Button>
            </Link>
        )
    };
    
    return (
        <AppLayout>
             <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className='max-w-2xl mx-auto'>
                    <h2 className="text-3xl font-bold tracking-tight text-center mb-6">
                        Anket Sonucu
                    </h2>
                     <Card>
                        <CardHeader className='items-center text-center'>
                            <div className='p-4 bg-primary/10 rounded-full mb-4'>
                                <Icon className="h-12 w-12 text-primary"/>
                            </div>
                            <CardTitle>{resultInfo.name}</CardTitle>
                            <CardDescription className='text-base pt-2'>{resultInfo.description}</CardDescription>
                        </CardHeader>
                    </Card>

                    <div className='flex justify-center mt-6'>
                        <FinishButton />
                    </div>
                </div>
             </main>
        </AppLayout>
    )
  }

  return (
    <AppLayout>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <BackLink />
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Shapes className="h-8 w-8 text-primary"/>
                    Öğrenme Stilleri Anketi
                </h2>
                <p className="text-muted-foreground mt-1">
                    Öğrencinin baskın öğrenme stilini keşfedin.
                </p>
            </div>
        </div>

        <Card className="sticky top-4 z-10">
            <CardContent className="p-4 space-y-2">
                <div className='flex justify-between text-sm text-muted-foreground'>
                    <span>İlerleme</span>
                    <span>{answeredCount} / {questions.length}</span>
                </div>
                <Progress value={progress} />
            </CardContent>
        </Card>

        <div className='space-y-4'>
            {questions.map((q, index) => (
                 <Card key={index} id={`q-${index}`} className={cn(
                     'scroll-mt-24', 
                     answers[index] !== undefined ? 'border-green-500/50 bg-green-500/5' : ''
                  )}>
                    <CardHeader>
                        <CardTitle className="text-lg font-normal flex items-start gap-2">
                             <span>{index + 1}.</span>
                             <span>{q.text}</span>
                             {answers[index] !== undefined && <CheckCircle className='h-5 w-5 text-green-500 flex-shrink-0' />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <RadioGroup
                            onValueChange={(value) => handleAnswerChange(index, value)}
                            value={answers[index]?.toString()}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                            {answerOptions.map(opt => (
                                <div key={opt.value}>
                                    <RadioGroupItem value={opt.value.toString()} id={`q${index}-opt${opt.value}`} className="peer sr-only" />
                                    <Label 
                                        htmlFor={`q${index}-opt${opt.value}`}
                                        className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary"
                                    >
                                        <span>{opt.label}</span>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                 </Card>
            ))}
        </div>

        <div className='flex justify-center mt-6'>
            <Button onClick={calculateResults} disabled={answeredCount < questions.length || isSaving}>
                {isSaving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kaydediliyor...
                    </>
                ) : (
                    <>
                        Anketi Tamamla ve Kaydet
                        <ArrowRight className="h-4 w-4 ml-2"/>
                    </>
                )}
            </Button>
        </div>
      </main>
    </AppLayout>
  );
}

const PageWrapper = () => {
    const { user } = useAuth();
    const isStudent = !!sessionStorage.getItem('studentAuth');
    if (user || isStudent) {
        return <OgrenmeStilleriPageContent />
    }
    return <AuthGuard><OgrenmeStilleriPageContent /></AuthGuard>
}

export default function OgrenmeStilleriPage() {
    return (
        <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <PageWrapper />
        </React.Suspense>
    )
}
