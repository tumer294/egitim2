
'use client';

import * as React from 'react';
import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import AuthGuard from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MessageSquare, ArrowRight, User, Calendar, Loader2 } from 'lucide-react';
import type { ForumPost } from '@/lib/types';
import { useForum } from '@/hooks/use-forum';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const categories = ['Tümü', 'Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Eğitim Teknolojileri', 'Okul Öncesi', 'Rehberlik', 'Diğer'];

function ForumPageContent() {
  const { posts, isLoading } = useForum();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('Tümü');

  const filteredPosts = React.useMemo(() => {
    return posts.filter(post => {
      const matchesCategory = selectedCategory === 'Tümü' || post.category === selectedCategory;
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, searchTerm, selectedCategory]);

  return (
    <AppLayout>
      <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                Öğretmenler Forumu
            </h2>
            <p className="text-muted-foreground">
              Meslektaşlarınızla bilgi ve deneyimlerinizi paylaşın.
            </p>
          </div>
          <Link href="/forum/yeni">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Yeni Soru Sor
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Sorular içinde ara..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Kategori Seç" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <Card key={post.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
                    <Badge variant="secondary">{post.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-4">
                <div className='flex items-center gap-4'>
                    <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{post.author.name}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{format(new Date(post.date), 'dd MMMM yyyy', { locale: tr })}</span>
                </div>
                <Link href={`/forum/soru/${post.id}`}>
                    <Button variant="outline" size="sm">
                      Devamını Oku <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        )}
        
        {!isLoading && filteredPosts.length === 0 && (
            <div className="text-center py-12">
                <p className='text-lg font-medium'>Aradığınız kriterlere uygun soru bulunamadı.</p>
                <p className='text-muted-foreground mt-2'>Filtreleri temizlemeyi veya yeni bir soru sormayı deneyin.</p>
            </div>
        )}

      </main>
    </AppLayout>
  );
}


export default function ForumPage() {
    return (
        <AuthGuard>
            <ForumPageContent />
        </AuthGuard>
    )
}
