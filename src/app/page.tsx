
'use client';

import * as React from 'react';
import Link from 'next/link';
import { GraduationCap, Check, Menu, Sparkles, StickyNote, Vote, BarChart, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.902-.539-5.586-1.544l-6.333 1.667zM8.717 4.809c.395-.493 1.107-.644 1.766-.644.482 0 .867.048 1.15.098.547.103 1.18.503 1.36 1.125.122.427.165.92.18 1.488.012.568-.009 1.144-.02 1.71-.023 1.123-.3 2.15-1.004 2.995-.233.27-.506.518-.793.747-.54.43-1.14.803-1.803 1.03-.807.28-1.66.39-2.513.375-.6-.01-1.18-.1-1.74-.288-.633-.208-1.22-.51-1.75-.892-.53-.38-.98-.84-1.37-1.36-.36-.49-.65-.97-.88-1.48-.23-.5-.39-1-.48-1.5-.12-.73-.1-1.43.04-2.13.05-.28.1-.55.18-.81.13-.42.33-.8.59-1.15.26-.35.58-.65.95-.88.37-.23.78-.4 1.2-.5.48-.1.98-.13 1.48-.13.33 0 .66.02.98.08.32.06.63.18.9.36.27.18.5.4.68.65z" />
    </svg>
);


const features = [
    {
        icon: Sparkles,
        title: "AI Destekli Asistan",
        description: "Ders planı oluşturmaktan veli iletişimine kadar her konuda size özel öneriler sunan yapay zeka asistanınız."
    },
    {
        icon: StickyNote,
        title: "Akıllı Not ve Hatırlatıcılar",
        description: "Sesli komutlarla hızla notlar alın, önemli görevler için akıllı hatırlatıcılar oluşturun ve işlerinizi asla aksatmayın."
    },
    {
        icon: Vote,
        title: "Pedagojik Anketler",
        description: "Öğrencilerinizin potansiyelini Çoklu Zeka ve Holland Meslek Envanteri gibi standart anketlerle keşfedin."
    },
    {
        icon: BarChart,
        title: "AI Destekli Raporlama",
        description: "Tek bir tıklamayla bireysel öğrenci veya sınıf geneli için kapsamlı, pedagojik ve eyleme geçirilebilir raporlar oluşturun."
    },
    {
        icon: Users,
        title: "Akıllı Günlük Takip",
        description: "Öğrencilerinizi derse katılım, ödev durumu ve davranışlarına göre kolayca ve anında değerlendirin."
    },
    {
        icon: Star,
        title: "Kapsamlı Öğrenci Yönetimi",
        description: "Sınıf listelerinizi kolayca yönetin, öğrenci bilgilerini güncelleyin ve tüm verilerinize tek yerden ulaşın."
    }
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)
 
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  )

  useEffect(() => {
    if (!loading && user) {
      router.replace('/anasayfa');
    }
  }, [user, loading, router]);
  
   useEffect(() => {
    if (!api) {
      return
    }
 
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
 
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-purple-100 to-background dark:from-background dark:via-purple-900/20 text-foreground">
       <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-lg sticky top-0 z-50 border-b">
        <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-background text-foreground">
                    <SheetHeader className='sr-only'>
                        <SheetTitle>Menü</SheetTitle>
                        <SheetDescription>Ana gezinme menüsü</SheetDescription>
                    </SheetHeader>
                     <nav className="flex flex-col gap-4 text-lg items-center pt-8">
                        <Link href="/" className="flex items-center gap-2 font-semibold text-lg mb-4" onClick={() => setIsSheetOpen(false)}>
                            <GraduationCap className="h-6 w-6 text-primary" />
                            <span>SınıfPlanım</span>
                        </Link>
                        <SheetClose asChild>
                           <Link href="/login" className="py-2" prefetch={false}>
                                Giriş Yap
                           </Link>
                        </SheetClose>
                         <SheetClose asChild>
                            <Link href="/kayit" className="py-2" prefetch={false}>
                                Kaydol
                            </Link>
                         </SheetClose>
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
        <Link href="/" className="flex items-center justify-center ml-auto md:ml-0 md:mr-auto" prefetch={false}>
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-semibold">SınıfPlanım</span>
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4">
           <Button asChild variant="ghost" className="hidden sm:inline-flex">
             <Link href="/login" prefetch={false}>
                Giriş Yap
             </Link>
           </Button>
           <Button asChild variant="default">
             <Link href="/kayit" prefetch={false}>
                Ücretsiz Dene
             </Link>
           </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_550px] lg:gap-12 xl:grid-cols-[1fr_650px]">
                <div className="flex flex-col justify-center space-y-6 animate-fade-in-up">
                  <div className="space-y-4">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                      Eğitimde Başarıya Giden Yol: <span className="text-primary">SınıfPlanım</span>
                    </h1>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl">
                      Öğretmenler için tasarlanmış hepsi bir arada dijital asistan. Değerli zamanınızı evrak işlerine değil, öğrencilerinize ayırın.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row">
                    <Button asChild size="lg">
                      <Link href="/kayit" prefetch={false}>
                        Hemen Keşfedin!
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <a href="https://www.instagram.com/rahmi.aksu.47" target="_blank" rel="noopener noreferrer">
                        Instagram
                      </a>
                    </Button>
                  </div>
                </div>
                <img
                    src="https://picsum.photos/seed/education-technology/650/550"
                    width="650"
                    height="550"
                    alt="Hero"
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square animate-fade-in"
                    data-ai-hint="education technology"
                />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Temel Özellikler</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Öğretimi Kolaylaştıran Araçlar</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            SınıfPlanım, öğretmenlerin günlük iş akışlarını basitleştiren, verimliliği artıran ve pedagojik gücü elinizin altına getiren bir dizi akıllı özellik sunar.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 pt-12">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div key={index} className="grid gap-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow animate-fade-in" style={{animationDelay: `${150 * (index + 1)}ms`}}>
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-bold">{feature.title}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
           <div className="container px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">İhtiyaçlarınıza Uygun Paketi Seçin</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Esnek abonelik seçeneklerimizle SınıfPlanım'ın tüm potansiyelini ortaya çıkarın.
                        </p>
                    </div>
                </div>
                 <div className="mx-auto w-full max-w-sm md:max-w-5xl pt-12">
                    <Carousel
                        setApi={setApi}
                        plugins={[plugin.current]}
                        className="w-full"
                        onMouseEnter={plugin.current.stop}
                        onMouseLeave={plugin.current.reset}
                    >
                         <CarouselContent>
                            <CarouselItem className="md:basis-1/2 lg:basis-1/3 p-1 h-full basis-4/5">
                                <div className="flex flex-col justify-between rounded-lg border bg-card text-card-foreground shadow-sm p-6 h-full transition-transform hover:scale-105 animate-fade-in" style={{animationDelay: `300ms`}}>
                                    <div>
                                        <h3 className="text-2xl font-bold">Temel</h3>
                                        <p className="mt-2 text-muted-foreground">Platformu keşfetmek ve temel özellikleri denemek için harika bir başlangıç.</p>
                                        <p className="my-6 text-4xl font-bold">Ücretsiz</p>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />Sınırsız Öğrenci ve Sınıf</li>
                                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />Temel Raporlama</li>
                                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />10 AI Kredisi/Yıl</li>
                                        </ul>
                                    </div>
                                    <Button asChild variant="outline" className="mt-6 w-full">
                                         <Link href="/kayit">Hemen Başla</Link>
                                    </Button>
                                </div>
                            </CarouselItem>
                             <CarouselItem className="md:basis-1/2 lg:basis-1/3 p-1 h-full basis-4/5 pt-6">
                                <div className="relative flex flex-col justify-between rounded-lg border-2 border-primary bg-card text-card-foreground shadow-lg p-6 h-full transition-transform hover:scale-105 animate-fade-in" style={{animationDelay: `450ms`}}>
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">Popüler</div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Standart</h3>
                                        <p className="mt-2 text-muted-foreground">Daha fazla özellik ve daha yüksek limitler ile verimliliğinizi artırın.</p>
                                        <p className="my-6"><span className="text-4xl font-bold">199,99 TL</span><span className="text-muted-foreground">/yıllık</span></p>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />Temel paketteki her şey</li>
                                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />AI Destekli Gelişmiş Raporlar</li>
                                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />100 AI Kredisi/Yıl</li>
                                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />Öncelikli Destek</li>
                                        </ul>
                                    </div>
                                    <Button asChild className="mt-6 w-full">
                                        <Link href="/kayit">Hemen Başla</Link>
                                    </Button>
                                </div>
                            </CarouselItem>
                             <CarouselItem className="md:basis-1/2 lg:basis-1/3 p-1 h-full basis-4/5">
                                <div className="flex flex-col justify-between rounded-lg border bg-card text-card-foreground shadow-sm p-6 h-full transition-transform hover:scale-105 animate-fade-in" style={{animationDelay: `600ms`}}>
                                    <div>
                                        <h3 className="text-2xl font-bold">Pro</h3>
                                        <p className="mt-2 text-muted-foreground">Tüm özelliklere tam erişim ve en yüksek limitlerle sınırları kaldırın.</p>
                                        <p className="my-6"><span className="text-4xl font-bold">399,99 TL</span><span className="text-muted-foreground">/yıllık</span></p>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />Standart paketteki her şey</li>
                                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />Özelleştirilebilir Planlar</li>
                                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />500 AI Kredisi/Yıl</li>
                                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" />7/24 Destek</li>
                                        </ul>
                                    </div>
                                    <Button asChild variant="outline" className="mt-6 w-full">
                                        <Link href="/kayit">Hemen Başla</Link>
                                    </Button>
                                </div>
                            </CarouselItem>
                        </CarouselContent>
                    </Carousel>
                    <div className="py-4 flex justify-center gap-2">
                        {Array.from({ length: count }).map((_, i) => (
                           <button
                             key={i}
                             onClick={() => api?.scrollTo(i)}
                             className={cn(
                               "h-2 w-2 rounded-full transition-all",
                               current === i + 1 ? "w-4 bg-primary" : "bg-primary/30"
                             )}
                           />
                        ))}
                    </div>
                 </div>
           </div>
        </section>
      </main>
      <footer className="py-6 w-full shrink-0 items-center px-4 md:px-6 bg-muted/20 border-t">
         <div className="container flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">&copy; 2024 SınıfPlanım. Tüm hakları saklıdır.</p>
            <nav className="flex gap-4 sm:gap-6 text-xs text-muted-foreground">
                <Link href="#" className="hover:text-foreground" prefetch={false}>
                    Kullanım Koşulları
                </Link>
                <Link href="#" className="hover:text-foreground" prefetch={false}>
                    Gizlilik Politikası
                </Link>
            </nav>
         </div>
      </footer>
       <a href="https://wa.me/905383407318" target="_blank" rel="noopener noreferrer" className="fixed bottom-4 right-4 z-50 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-transform hover:scale-110 flex items-center gap-2">
            <WhatsAppIcon className="h-6 w-6" />
            <span className="hidden sm:inline font-semibold">+90 538 340 73 18</span>
        </a>
    </div>
  );
}
