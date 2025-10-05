'use client';

import * as React from 'react';
import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import AuthGuard from '@/components/auth-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, ChevronLeft, ArrowRight, RotateCw, BarChart, CheckCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useSurveys } from '@/hooks/use-surveys';
import { Loader2 } from 'lucide-react';

const intelligenceTypes = {
  linguistic: {
    name: 'Sözel-Dilsel Zeka',
    description: 'Kelimeleri etkili bir şekilde kullanma, dil öğrenme ve dili başkalarını ikna etmek için kullanma yeteneği.',
    professions: ['Yazar', 'Avukat', 'Gazeteci', 'Öğretmen', 'Politikacı']
  },
  logical: {
    name: 'Mantıksal-Matematiksel Zeka',
    description: 'Mantık yürütme, problem çözme, sayılarla ve soyut kavramlarla çalışma yeteneği.',
    professions: ['Bilim İnsanı', 'Matematikçi', 'Mühendis', 'Programcı', 'Muhasebeci']
  },
  spatial: {
    name: 'Görsel-Mekansal Zeka',
    description: 'Görsel dünyayı algılama, zihinde canlandırma ve mekansal ilişkileri anlama yeteneği.',
    professions: ['Mimar', 'Sanatçı', 'Tasarımcı', 'Pilot', 'Cerrah']
  },
  bodily: {
    name: 'Bedensel-Kinestetik Zeka',
    description: 'Vücudu ve elleri kullanarak kendini ifade etme, nesneleri manipüle etme ve fiziksel becerilerde ustalık.',
    professions: ['Sporcu', 'Dansçı', 'Aktör', 'Zanaatkar', 'Cerrah']
  },
  musical: {
    name: 'Müziksel-Ritmik Zeka',
    description: 'Müzikal formları algılama, yaratma ve değerlendirme yeteneği. Ritim, melodi ve tınıya duyarlılık.',
    professions: ['Müzisyen', 'Besteci', 'Şarkıcı', 'DJ', 'Müzik Öğretmeni']
  },
  interpersonal: {
    name: 'Kişilerarası (Sosyal) Zeka',
    description: 'Başkalarının duygularını, niyetlerini ve motivasyonlarını anlama ve onlarla etkili bir şekilde iletişim kurma yeteneği.',
    professions: ['Psikolog', 'Danışman', 'Satış Temsilcisi', 'Yönetici', 'Öğretmen']
  },
  intrapersonal: {
    name: 'İçsel Zeka',
    description: 'Kendi duygularını, güçlü ve zayıf yönlerini anlama ve bu bilgiyi hayatını yönlendirmek için kullanma yeteneği.',
    professions: ['Filozof', 'Yazar', 'Teorisyen', 'Girişimci', 'Psikolog']
  },
  naturalist: {
    name: 'Doğacı Zeka',
    description: 'Doğayı, bitkileri, hayvanları ve doğal dünyayı tanıma, sınıflandırma ve anlama yeteneği.',
    professions: ['Biyolog', 'Veteriner', 'Çiftçi', 'Doğa Rehberi', 'Jeolog']
  }
};

const questions = [
  // Linguistic
  { text: 'Kitap okumayı severim.', type: 'linguistic' },
  { text: 'Yaşıma göre iyi bir kelime dağarcığımın olduğunu düşünürüm.', type: 'linguistic' },
  { text: 'Duygu ve düşüncelerimi yazıya dökerek daha iyi ifade ederim.', type: 'linguistic' },
  { text: 'Tekerlemeleri, kelime oyunlarını ve şiirleri severim.', type: 'linguistic' },
  { text: 'Dinlediklerimi ve okuduklarımı kolayca hatırlar ve özetleyebilirim.', type: 'linguistic' },
  { text: 'İnsanları konuşarak kolayca ikna edebilirim.', type: 'linguistic' },
  { text: 'Hikaye, fıkra veya anı anlatmaktan hoşlanırım.', type: 'linguistic' },
  { text: 'Yazım kurallarına ve dilbilgisine dikkat ederim.', type: 'linguistic' },
  { text: 'Farklı dilleri öğrenmeye karşı ilgim vardır.', type: 'linguistic' },
  { text: 'Bulmaca çözmeyi (kelime bulmacası, çengel bulmaca vb.) severim.', type: 'linguistic' },
  // Logical
  { text: 'Sayılarla uğraşmayı ve hesap yapmayı severim.', type: 'logical' },
  { text: 'Olayların nedenlerini ve sonuçlarını merak ederim.', type: 'logical' },
  { text: 'Mantık bulmacaları, satranç gibi strateji oyunları ilgimi çeker.', type: 'logical' },
  { text: 'Bilgisayarda programlama yapmak veya denemek hoşuma gider.', type: 'logical' },
  { text: 'Bir şeyleri kategorilere ayırmayı, sınıflandırmayı severim.', type: 'logical' },
  { text: 'Problem çözerken adımları sıralayarak mantıksal bir sıra izlerim.', type: 'logical' },
  { text: 'Grafikleri ve tabloları kolayca anlarım ve yorumlarım.', type: 'logical' },
  { text: 'Bilimsel deneyler yapmak veya izlemek ilgimi çeker.', type: 'logical' },
  { text: 'Her şeyin mantıklı bir açıklaması olması gerektiğini düşünürüm.', type: 'logical' },
  { text: 'Soyut ve kavramsal düşünmek bana zor gelmez.', type: 'logical' },
  // Spatial
  { text: 'Haritaları, şemaları ve diyagramları kolayca okurum.', type: 'spatial' },
  { text: 'Gözlerimi kapattığımda nesneleri zihnimde canlandırabilirim.', type: 'spatial' },
  { text: 'Resim yapmayı, çizim yapmayı veya görsel tasarımlar oluşturmayı severim.', type: 'spatial' },
  { text: 'Yap-boz (puzzle) ve üç boyutlu bulmacalardan hoşlanırım.', type: 'spatial' },
  { text: 'Gittiğim yerleri ve yolları kolay kolay unutmam.', type: 'spatial' },
  { text: 'Legolar, bloklar gibi şeylerle bir şeyler inşa etmeyi severim.', type: 'spatial' },
  { text: 'Bir şeyin nasıl göründüğünü tarif etmekte iyiyimdir.', type: 'spatial' },
  { text: 'Hayal gücümün geniş olduğunu düşünürüm.', type: 'spatial' },
  { text: 'Fotoğraf çekmek veya video kaydetmek ilgimi çeker.', type: 'spatial' },
  { text: 'Nesnelerin farklı açılardan nasıl görüneceğini hayal edebilirim.', type: 'spatial' },
  // Bodily
  { text: 'Spor yapmaktan, koşmaktan veya dans etmekten hoşlanırım.', type: 'bodily' },
  { text: 'Ellerimi kullanarak bir şeyler yapmaktan (tamir, model yapımı vb.) hoşlanırım.', type: 'bodily' },
  { text: 'Uzun süre oturduğumda sıkılırım, hareket etmeye ihtiyaç duyarım.', type: 'bodily' },
  { text: 'Jest ve mimiklerimi konuşurken sıkça kullanırım.', type: 'bodily' },
  { text: 'Denge ve koordinasyon gerektiren aktivitelerde (bisiklete binmek, paten kaymak vb.) iyiyimdir.', type: 'bodily' },
  { text: 'Bir şeyi anlatırken onu canlandırarak veya yaparak göstermeyi tercih ederim.', type: 'bodily' },
  { text: 'Yeni bir beceriyi sadece izleyerek veya okuyarak değil, deneyerek daha iyi öğrenirim.', type: 'bodily' },
  { text: 'Tiyatro, drama gibi sahne sanatlarına ilgim vardır.', type: 'bodily' },
  { text: 'Dokunarak nesneleri tanımakta ve incelemekte iyiyimdir.', type: 'bodily' },
  { text: 'Fiziksel risk almaktan veya macera sporlarından çekinmem.', type: 'bodily' },
  // Musical
  { text: 'Şarkı söylemeyi veya bir enstrüman çalmayı severim.', type: 'musical' },
  { text: 'Ders çalışırken veya dinlenirken müzik dinlemek hoşuma gider.', type: 'musical' },
  { text: 'Duyduğum bir melodiyi kolayca aklımda tutabilirim.', type: 'musical' },
  { text: 'Ritim tutmakta (el çırpma, masaya vurma vb.) iyiyimdir.', type: 'musical' },
  { text: 'Çevremdeki seslere karşı duyarlıyımdır.', type: 'musical' },
  { text: 'Farklı müzik türlerini dinlemekten keyif alırım.', type: 'musical' },
  { text: 'Bir şarkının notasının pes veya tiz olduğunu kolayca fark ederim.', type: 'musical' },
  { text: 'İnsanların veya hayvanların seslerini taklit edebilirim.', type: 'musical' },
  { text: 'Aklımda sık sık bir şarkı veya melodi tekrar eder.', type: 'musical' },
  { text: 'Müzik dinlerken duygulandığım veya enerjik hissettiğim olur.', type: 'musical' },
  // Interpersonal
  { text: 'Arkadaşlarımla vakit geçirmeyi severim.', type: 'interpersonal' },
  { text: 'Grup çalışmalarını tek başıma çalışmaya tercih ederim.', type: 'interpersonal' },
  { text: 'Başkalarının duygularını ve düşüncelerini anlamakta zorlanmam.', type: 'interpersonal' },
  { text: 'Yeni insanlarla tanışmaktan ve sohbet etmekten keyif alırım.', type: 'interpersonal' },
  { text: 'Arkadaşlarım sorunları olduğunda bana danışırlar.', type: 'interpersonal' },
  { text: 'Liderlik yapmam gereken durumlarda kendimi rahat hissederim.', type: 'interpersonal' },
  { text: 'Başkalarını organize etmekte veya bir araya getirmekte iyiyimdir.', type: 'interpersonal' },
  { text: 'İnsanlar arasındaki anlaşmazlıkları çözmeye yardımcı olabilirim.', type: 'interpersonal' },
  { text: 'Empati kurma yeteneğimin güçlü olduğunu düşünürüm.', type: 'interpersonal' },
  { text: 'Topluluk etkinliklerine veya sosyal kulüplere katılmayı severim.', type: 'interpersonal' },
  // Intrapersonal
  { text: 'Kendi başıma vakit geçirmekten hoşlanırım.', type: 'intrapersonal' },
  { text: 'Güçlü ve zayıf yönlerimin farkındayımdır.', type: 'intrapersonal' },
  { text: 'Kendi hedeflerimi belirler ve bu hedeflere ulaşmak için plan yaparım.', type: 'intrapersonal' },
  { text: 'Duygularımın nedenlerini anlarım.', type: 'intrapersonal' },
  { text: 'Günlük tutmak veya yaşadıklarım üzerine düşünmek bana iyi gelir.', type: 'intrapersonal' },
  { text: 'Bağımsız çalışmaktan hoşlanırım.', type: 'intrapersonal' },
  { text: 'Kendi kendimi motive edebilirim.', type: 'intrapersonal' },
  { text: 'Yaptığım hatalardan ders çıkarırım.', type: 'intrapersonal' },
  { text: 'Neyi neden istediğim konusunda net bir fikrim vardır.', type: 'intrapersonal' },
  { text: 'Hayallerim ve hedeflerim hakkında düşünmek için zaman ayırırım.', type: 'intrapersonal' },
  // Naturalist
  { text: 'Doğada (kırda, ormanda, deniz kenarında) vakit geçirmeyi severim.', type: 'naturalist' },
  { text: 'Bitki yetiştirmek veya hayvan beslemek ilgimi çeker.', type: 'naturalist' },
  { text: 'Farklı hayvan veya bitki türlerini tanımakta ve ayırt etmekte iyiyimdir.', type: 'naturalist' },
  { text: 'Doğa belgeselleri izlemekten keyif alırım.', type: 'naturalist' },
  { text: 'Çevre sorunlarına (kirlilik, iklim değişikliği vb.) karşı duyarlıyımdır.', type: 'naturalist' },
  { text: 'Mevsimlerin, havanın ve doğal olayların değişimini fark ederim.', type: 'naturalist' },
  { text: 'Kamp yapmayı, doğa yürüyüşlerini veya balık tutmayı severim.', type: 'naturalist' },
  { text: 'Böceklerden, örümceklerden veya diğer canlılardan korkmam, onları incelerim.', type: 'naturalist' },
  { text: 'Kaya, yaprak, deniz kabuğu gibi doğal nesneleri biriktirmeyi severim.', type: 'naturalist' },
  { text: 'Bulutların şekillerini veya yıldızları incelemekten hoşlanırım.', type: 'naturalist' },
];

const answerOptions = [
    { label: 'Hiçbir Zaman', value: 0 },
    { label: 'Ara Sıra', value: 1 },
    { label: 'Sık Sık', value: 2 },
    { label: 'Her Zaman', value: 3 }
];

const resultColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))',
    'hsl(35, 92%, 55%)',
    'hsl(262, 70%, 57%)'
];


type Answers = { [key: number]: number };

function CokluZekaKuramiPageContent() {
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
      
    const scores: { [key: string]: number } = Object.keys(intelligenceTypes).reduce((acc, key) => ({ ...acc, [key]: 0 }), {});

    Object.entries(answers).forEach(([questionIndex, answerValue]) => {
      const question = questions[parseInt(questionIndex)];
      if (question) {
        scores[question.type] += answerValue;
      }
    });
    
    const finalResults = Object.entries(scores)
      .map(([type, score], index) => ({
        id: type,
        name: intelligenceTypes[type as keyof typeof intelligenceTypes].name,
        description: intelligenceTypes[type as keyof typeof intelligenceTypes].description,
        professions: intelligenceTypes[type as keyof typeof intelligenceTypes].professions,
        score: score,
        fill: resultColors[index % resultColors.length]
      }))
      .sort((a, b) => b.score - a.score);

    setResults(finalResults);
    
    try {
        const surveyData = {
            studentId,
            classId,
            surveyType: 'coklu-zeka',
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
  
  const resetSurvey = () => {
      setAnswers({});
      setIsSurveyComplete(false);
      setResults([]);
  }

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  
  if (isSurveyComplete) {
    const topThree = results.slice(0, 3);
    return (
        <AppLayout>
             <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                 <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <BarChart className="h-8 w-8 text-primary"/>
                            Anket Sonuçları
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Öğrencinin baskın zeka alanları aşağıda sıralanmıştır.
                        </p>
                    </div>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Genel Puan Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <ResponsiveContainer width="100%" height={400}>
                            <RechartsBarChart data={results} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} interval={0} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'rgba(206, 213, 224, 0.2)' }} />
                                <Bar dataKey="score" barSize={30}>
                                    {results.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className='grid md:grid-cols-3 gap-4 pt-4'>
                    {topThree.map((result, index) => (
                        <Card key={result.id} className={cn(
                            "flex flex-col",
                            index === 0 && "border-primary bg-primary/5",
                            index === 1 && "border-primary/30",
                            index === 2 && "border-primary/20",
                        )}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                <span>{index + 1}. {result.name}</span>
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
                    <BrainCircuit className="h-8 w-8 text-primary"/>
                    Çoklu Zeka Kuramı Anketi
                </h2>
                <p className="text-muted-foreground mt-1">
                    Öğrencinin baskın zeka alanlarını keşfedin.
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
                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                            {answerOptions.map(opt => (
                                <div key={opt.value}>
                                    <RadioGroupItem value={opt.value.toString()} id={`q${index}-opt${opt.value}`} className="peer sr-only" />
                                    <Label 
                                        htmlFor={`q${index}-opt${opt.value}`}
                                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary"
                                    >
                                        <span className="text-lg font-bold">{opt.value}</span>
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

export default function CokluZekaKuramiPage() {
    return (
        <AuthGuard>
            <CokluZekaKuramiPageContent />
        </AuthGuard>
    )
}
