'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book as BookIcon,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Reading {
  id: string;
  code: string;
  title: string;
  order: number;
}

interface Book {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  readings: Reading[];
}

export default function ItemSetsPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await fetch('/api/books');
        const data = await response.json();
        setBooks(data);
      } catch (error) {
        console.error('Failed to fetch books:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        {selectedBook && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedBook(null)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-foreground"
          >
            {selectedBook ? selectedBook.title : 'Study Materials'}
          </motion.h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {selectedBook
              ? `Exploring ${selectedBook.readings.length} readings from this curriculum`
              : 'Choose a textbook or item set to start your study session'
            }
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedBook ? (
          <motion.div
            key="books-grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {books.map((book) => (
              <Card key={book.id} className="overflow-hidden hover:border-primary/50 transition-all group border-2 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="h-32 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center border-b border-border/50">
                    <div className="p-4 rounded-full bg-background/50 backdrop-blur-md shadow-xl">
                      <BookIcon className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-bold border-primary text-primary px-3 py-1 bg-primary/5">
                          {book.level?.replace('_', ' ') || 'CFA LEVEL'}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {book.readings.length} Readings
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                        {book.title}
                      </h3>
                    </div>

                    <p className="text-muted-foreground text-sm line-clamp-3 min-h-[3.75rem]">
                      {book.description || 'Access complete readings and curriculum materials for this level.'}
                    </p>

                    <Button
                      className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all rounded-xl"
                      onClick={() => setSelectedBook(book)}
                    >
                      Study Now
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="readings-grid"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {selectedBook.readings.map((reading, index) => (
              <motion.div
                key={reading.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="h-full hover:bg-muted/30 transition-colors border border-border/60 hover:border-primary/40 group cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 shadow-sm shadow-primary/5">
                          RD {reading.order}
                        </span>
                      </div>
                      <h4 className="font-bold text-base leading-snug group-hover:text-primary transition-colors">
                        {reading.title}
                      </h4>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {reading.code}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
