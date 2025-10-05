'use client';

import * as React from 'react';
import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import AuthGuard from '@/components/auth-guard';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, ChevronLeft, ArrowRight, RotateCw, BarChart3, Info, CheckCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useSurveys } from '@/hooks/use-surveys';
import { Loader2 } from 'lucide-react';



const personalityTypes = {
  realistic: {
    name: 'Gerçekçi (Realistic)',
    description: 'Pratik, mekanik ve gerçekçi. Aletler, makineler veya hayvanlarla çalışmaktan hoşlanır. Sosyal becerilerden çok pratik problem çözme yetenekleri ön plandadır.',
    professions: ['Mühendis', 'Teknisyen', 'Çiftçi', 'Polis', 'Sporcu', 'İtfaiyeci', 'Pilot'],
  },
  investigative: {
    name: 'Araştırmacı (Investigative)',
    description: 'Gözlem yapmayı, öğrenmeyi, araştırmayı, analiz etmeyi ve problem çözmeyi sever. Fikirlerle çalışmaktan hoşlanır. Liderlikten çok bilimsel ve matematiksel konulara odaklanır.',
    professions: ['Bilim İnsanı', 'Doktor', 'Yazılım Geliştirici', 'Matematikçi', 'Akademisyen', 'Araştırmacı'],
  },
  artistic: {
    name: 'Sanatçı (Artistic)',
    description: 'Yaratıcı, sezgisel ve bağımsız. Yapılandırılmamış ortamlarda çalışmayı, kendini sanat, müzik, yazı gibi yollarla ifade etmeyi sever.',
    professions: ['Sanatçı', 'Müzisyen', 'Yazar', 'Tasarımcı', 'Aktör', 'Fotoğrafçı', 'Mimar'],
  },
  social: {
    name: 'Sosyal (Social)',
    description: 'İnsanlara yardım etmeyi, öğretmeyi, hizmet etmeyi ve onlarla etkileşimde bulunmayı sever. İşbirliğine yatkındır ve başkalarının sorunlarıyla ilgilenir.',
    professions: ['Öğretmen', 'Psikolog', 'Hemşire', 'Sosyal Hizmet Uzmanı', 'Danışman', 'Rehber'],
  },
  enterprising: {
    name: 'Girişimci (Enterprising)',
    description: 'İnsanları yönetmeyi, ikna etmeyi ve hedeflere ulaşmak için organize etmeyi sever. Liderlik, satış ve ekonomik kazanç odaklıdır. Maceracı ve enerjiktir.',
    professions: ['Yönetici', 'Satış Temsilcisi', 'Avukat', 'Pazarlamacı', 'Girişimci', 'Politikacı'],
  },
  conventional: {
    name: 'Geleneksel (Conventional)',
    description: 'Detaylarla çalışmayı, düzenli ve yapılandırılmış görevleri yerine getirmeyi sever. Veri, sayılar ve kurallarla çalışmaktan hoşlanır. Sorumluluk sahibi ve titizdir.',
    professions: ['Muhasebeci', 'Kütüphaneci', 'Banka Memuru', 'Sekreter', 'Analist', 'Veri Giriş Uzmanı'],
  },
};

const questions = [
    // Realistic
    { text: 'Bozuk bir saati veya bisikleti tamir etmek', type: 'realistic' },
    { text: 'Açık havada (doğada) çalışmak', type: 'realistic' },
    { text: 'Elektrikli aletleri kullanmak', type: 'realistic' },
    { text: 'Bir arabanın motorunu tamir etmek', type: 'realistic' },
    { text: 'Ahşap veya metalden bir şeyler yapmak', type: 'realistic' },
    { text: 'Teknik resim çizmek', type: 'realistic' },
    { text: 'Hayvanlarla ilgilenmek ve onları eğitmek', type: 'realistic' },
    { text: 'Bir makinenin nasıl çalıştığını anlamaya çalışmak', type: 'realistic' },
    { text: 'Fiziksel güç gerektiren işler yapmak', type: 'realistic' },
    { text: 'Bir binanın planını okumak', type: 'realistic' },
    // Investigative
    { text: 'Bilimsel bir deney yapmak', type: 'investigative' },
    { text: 'Karmaşık bir problemi çözmek için mantık yürütmek', type: 'investigative' },
    { text: 'Bir konu hakkında derinlemesine araştırma yapmak', type: 'investigative' },
    { text: 'Tıbbi bir teşhis koymaya çalışmak', type: 'investigative' },
    { text: 'Bilgisayar programı yazmak', type: 'investigative' },
    { text: 'Matematik problemleri çözmek', type: 'investigative' },
    { text: 'Doğa olaylarını (hava durumu, yıldızlar vb.) incelemek', type: 'investigative' },
    { text: 'Bir teoriyi anlamak ve açıklamak', type: 'investigative' },
    { text: 'Mikroskop kullanmak', type: 'investigative' },
    { text: 'Felsefi veya soyut konular üzerine düşünmek', type: 'investigative' },
    // Artistic
    { text: 'Hikaye, şiir veya şarkı sözü yazmak', type: 'artistic' },
    { text: 'Bir müzik aleti çalmak', type: 'artistic' },
    { text: 'Resim yapmak veya heykel yontmak', type: 'artistic' },
    { text: 'Bir tiyatro oyununda rol almak', type: 'artistic' },
    { text: 'Orijinal fotoğraflar çekmek', type: 'artistic' },
    { text: 'Dans etmek veya koreografi oluşturmak', type: 'artistic' },
    { text: 'Kıyafet veya aksesuar tasarlamak', type: 'artistic' },
    { text: 'Yeni ve yaratıcı yemek tarifleri denemek', type: 'artistic' },
    { text: 'Bir web sitesi veya poster için görsel tasarım yapmak', type: 'artistic' },
    { text: 'Bir filmin yönetmenliğini yapmak', type: 'artistic' },
    // Social
    { text: 'Başkalarına yeni bir beceri öğretmek', type: 'social' },
    { text: 'Bir arkadaşının sorunlarını dinlemek ve ona tavsiye vermek', type: 'social' },
    { text: 'Gönüllü olarak bir sosyal yardım projesinde çalışmak', type: 'social' },
    { text: 'Hasta veya yaşlı insanlara yardım etmek', type: 'social' },
    { text: 'Bir takımın veya grubun uyum içinde çalışmasını sağlamak', type: 'social' },
    { text: 'Çocuklarla oynamak ve onlara bir şeyler öğretmek', type: 'social' },
    { text: 'Topluluk önünde konuşma yapmak veya sunum yapmak', type: 'social' },
    { text: 'İnsanlar arasındaki anlaşmazlıkları çözmek', type: 'social' },
    { text: 'Yeni insanlarla tanışmak ve sohbet etmek', type: 'social' },
    { text: 'Bir etkinlik veya parti düzenlemek', type: 'social' },
    // Enterprising
    { text: 'Bir grup insanı bir hedef için yönetmek ve yönlendirmek', type: 'enterprising' },
    { text: 'Bir ürün satmak için başkalarını ikna etmek', type: 'enterprising' },
    { text: 'Yeni bir iş veya proje başlatmak', type: 'enterprising' },
    { text: 'Bir tartışmada kendi fikrini hararetle savunmak', type: 'enterprising' },
    { text: 'Risk almak ve kararlar vermek', type: 'enterprising' },
    { text: 'Para kazanmak için yeni yollar bulmak', type: 'enterprising' },
    { text: 'Bir kampanyayı veya seçimi yönetmek', type: 'enterprising' },
    { text: 'Finansal piyasaları takip etmek ve yatırım yapmak', type: 'enterprising' },
    { text: 'Başkalarını motive etmek ve onlara ilham vermek', type: 'enterprising' },
    { text: 'Önemli kişilerle tanışmak ve iş ağı kurmak', type: 'enterprising' },
    // Conventional
    { text: 'Bir bütçe hazırlamak ve harcamaları takip etmek', type: 'conventional' },
    { text: 'Bilgileri düzenli bir şekilde dosyalamak veya sınıflandırmak', type: 'conventional' },
    { text: 'Bilgisayarda veri girişi yapmak', type: 'conventional' },
    { text: 'Belirli kurallara ve prosedürlere göre çalışmak', type: 'conventional' },
    { text: 'Bir ofis ortamında düzenli saatlerde çalışmak', type: 'conventional' },
    { text: 'Yazım ve dilbilgisi hatalarını bulmak ve düzeltmek', type: 'conventional' },
    { text: 'Matematiksel hesaplamaları dikkatlice yapmak', type: 'conventional' },
    { text: 'Bir envanteri (stok) saymak ve kaydını tutmak', type: 'conventional' },
    { text: 'Randevuları ve toplantıları planlamak', type: 'conventional' },
    { text: 'Detaylara dikkat gerektiren işler yapmak', type: 'conventional' },
];

const answerOptions = [
    { label: 'Hoşlanmam', value: 0 },
    { label: 'Farketmez', value: 1 },
    { label: 'Hoşlanırım', value: 2 },
];

const resultColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))'
];

type Answers = { [key: number]: number };

function HollandMeslekEnvanteriPageContent() {
    const searchParams = useSearchParams();
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const { toast } = useToast();
    const { saveSurveyResult, isLoading: isSaving } = useSurveys();

    const [answers, setAnswers] = React.useState<Answers>({});
    const [isSurveyComplete, setIsSurveyComplete] = React.useState(false);
    const [results, setResults] = React.useState<any[]>([]);

    const handleAnswerChange = (questionIndex: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: parseInt(value) }));
    };
    
    const calculateResults = async () => {
        if (!studentId || !classId) {
            toast({ title: 'Hata', description: 'Öğrenci veya sınıf bilgisi eksik.', variant: 'destructive' });
            return;
        }

        const scores: { [key: string]: number } = Object.keys(personalityTypes).reduce((acc, key) => ({ ...acc, [key]: 0 }), {});

        Object.entries(answers).forEach(([questionIndex, answerValue]) => {
            const question = questions[parseInt(questionIndex)];
            if (question) {
                scores[question.type] += answerValue;
            }
        });
        
        const finalResults = Object.entries(scores)
            .map(([type, score], index) => ({
                id: type,
                name: personalityTypes[type as keyof typeof personalityTypes].name.split(' ')[0],
                fullName: personalityTypes[type as keyof typeof personalityTypes].name,
                score: score,
                description: personalityTypes[type as keyof typeof personalityTypes].description,
                professions: personalityTypes[type as keyof typeof personalityTypes].professions,
                fill: resultColors[index % resultColors.length]
            }))
            .sort((a, b) => b.score - a.score);

        setResults(finalResults);

        try {
            const surveyData = {
                studentId,
                classId,
                surveyType: 'holland',
                results: finalResults,
                completedAt: new Date().toISOString()
            };
            await saveSurveyResult(surveyData);
            toast({ title: 'Başarılı', description: 'Envanter sonuçları başarıyla kaydedildi.' });
            setIsSurveyComplete(true);
        } catch(e: any) {
            toast({ title: 'Kaydetme Başarısız', description: e.message || 'Envanter sonuçları kaydedilemedi.', variant: 'destructive' });
        }
    };
    
    const resetSurvey = () => {
        setAnswers({});
        setIsSurveyComplete(false);
        setResults([]);
    }

    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;

    if (isSurveyComplete) {
        const topThree = results.slice(0, 3);
        const hollandCode = topThree.map(r => r.name.charAt(0)).join('');

        return (
            <AppLayout>
                 <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                     <div className="flex items-center justify-between space-y-2">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                                <BarChart3 className="h-8 w-8 text-primary"/>
                                Envanter Sonuçları
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                Öğrencinin baskın kişilik tipleri ve meslek önerileri.
                            </p>
                        </div>
                    </div>
                     <Card>
                         <CardHeader>
                            <CardTitle>Holland Kodunuz: {hollandCode}</CardTitle>
                            <CardDescription>En yüksek puan aldığınız üç kişilik tipi aşağıda gösterilmiştir. Bu tiplerin birleşimi sizin mesleki eğilimlerinizi yansıtır.</CardDescription>
                         </CardHeader>
                         <CardContent>
                             <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={results} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis />
                                    <Tooltip cursor={{ fill: 'rgba(206, 213, 224, 0.2)' }} />
                                    <Bar dataKey="score" barSize={40}>
                                        {results.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                         </CardContent>
                    </Card>

                    <div className="pt-2 grid md:grid-cols-3 gap-4">
                        {topThree.map((result, index) => (
                            <Card key={result.id} className={cn(
                                "flex flex-col",
                                index === 0 && "border-primary bg-primary/5",
                                index === 1 && "border-primary/30",
                                index === 2 && "border-primary/20",
                            )}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                    <span>{index + 1}. {result.fullName}</span>
                                    <span className='text-lg font-bold text-primary'>{result.score} Puan</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-3">
                                    <p className='text-sm text-muted-foreground'>{result.description}</p>
                                    <div>
                                        <h4 className='font-semibold text-sm mb-2'>Uygun Meslekler:</h4>
                                        <div className='flex flex-wrap gap-2'>
                                            {result.professions.map((p: string) => <Badge key={p} variant="secondary">{p}</Badge>)}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className='flex justify-center mt-6'>
                       <Link href="/anket">
                          <Button>
                              <CheckCircle className="h-4 w-4 mr-2"/>
                              Tamamla
                          </Button>
                        </Link>
                    </div>
                 </main>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
          <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Link href="/anket" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Öğrenci Seçimine Geri Dön
            </Link>
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Briefcase className="h-8 w-8 text-primary"/>
                        Holland Meslek Envanteri
                    </h2>
                    <p className="text-muted-foreground mt-1">
                       Öğrencilerin mesleki ilgi ve kişilik tiplerini belirleyin.
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
                                className="grid grid-cols-2 md:grid-cols-3 gap-4"
                            >
                                {answerOptions.map(opt => (
                                    <div key={opt.value}>
                                        <RadioGroupItem value={opt.value.toString()} id={`q${index}-opt${opt.value}`} className="peer sr-only" />
                                        <Label 
                                            htmlFor={`q${index}-opt${opt.value}`}
                                            className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary"
                                        >
                                            {opt.label}
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
                        Envanteri Tamamla ve Kaydet
                        <ArrowRight className="h-4 w-4 ml-2"/>
                       </>
                    )}
                </Button>
            </div>
          </main>
        </AppLayout>
    );
}

export default function HollandMeslekEnvanteriPage() {
    return (
        <AuthGuard>
            <HollandMeslekEnvanteriPageContent />
        </AuthGuard>
    )
}
