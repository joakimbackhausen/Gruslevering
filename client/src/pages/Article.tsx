import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { ArrowLeft, Calendar, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';

interface ArticleData {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  date: string;
}

function decodeEntities(str: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = str;
  return el.value;
}

/** Estimate reading time from HTML content */
function readingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/* ── Article content CSS (replaces @tailwindcss/typography) ── */
const articleStyles = `
  .article-body h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    line-height: 1.3;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e8f0e4;
  }
  .article-body h3 {
    font-size: 1.2rem;
    font-weight: 700;
    color: #1f2937;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    line-height: 1.4;
  }
  .article-body h4 {
    font-size: 1.05rem;
    font-weight: 600;
    color: #1f2937;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }
  .article-body p {
    color: #374151;
    line-height: 1.8;
    margin-bottom: 1.25rem;
    font-size: 1.05rem;
  }
  .article-body a {
    color: var(--grus-green);
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.15s;
  }
  .article-body a:hover {
    color: var(--grus-green-hover);
  }
  .article-body strong, .article-body b {
    color: #111827;
    font-weight: 600;
  }
  .article-body ul, .article-body ol {
    margin: 1.25rem 0;
    padding-left: 1.5rem;
  }
  .article-body ul {
    list-style-type: disc;
  }
  .article-body ol {
    list-style-type: decimal;
  }
  .article-body li {
    color: #374151;
    line-height: 1.75;
    margin-bottom: 0.5rem;
    font-size: 1.05rem;
    padding-left: 0.25rem;
  }
  .article-body li::marker {
    color: var(--grus-green);
  }
  .article-body img {
    border-radius: 0.75rem;
    margin: 2rem auto;
    max-width: 100%;
    height: auto;
    display: block;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .article-body figure {
    margin: 2rem 0;
  }
  .article-body figcaption {
    text-align: center;
    font-size: 0.85rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }
  .article-body blockquote {
    border-left: 4px solid var(--grus-green);
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    background: #f0fdf0;
    border-radius: 0 0.5rem 0.5rem 0;
    font-style: italic;
    color: #374151;
  }
  .article-body blockquote p {
    margin-bottom: 0;
  }
  .article-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.95rem;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }
  .article-body th {
    background: #f3f4f6;
    font-weight: 600;
    color: #111827;
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 2px solid #e5e7eb;
  }
  .article-body td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    color: #374151;
  }
  .article-body tr:last-child td {
    border-bottom: none;
  }
  .article-body tr:hover td {
    background: #f9fafb;
  }
  .article-body hr {
    border: none;
    height: 2px;
    background: #e8f0e4;
    margin: 2.5rem 0;
    border-radius: 1px;
  }
  .article-body .wp-block-separator {
    border: none;
    height: 2px;
    background: #e8f0e4;
    margin: 2.5rem 0;
  }
  .article-body > *:first-child {
    margin-top: 0;
  }

  @media (min-width: 640px) {
    .article-body h2 { font-size: 1.65rem; }
    .article-body h3 { font-size: 1.3rem; }
    .article-body p, .article-body li { font-size: 1.1rem; }
  }
`;

const HAVEGUIDE_ARTICLES = [
  {
    title: 'Komplet guide til muld og jord',
    slug: 'komplet-guide-til-muld-og-jord',
    image: 'https://gruslevering.dk/wp-content/uploads/2026/02/ChatGPT-Image-17.-feb.-2026-18.44.55-e1771493007832.png',
  },
  {
    title: 'Sådan etablerer du en ny græsplæne',
    slug: 'saadan-etablerer-du-en-ny-graesplaene',
    image: 'https://gruslevering.dk/wp-content/uploads/2026/02/ok-e1773057103439.png',
  },
  {
    title: 'Granitskærver – den komplette guide 2026',
    slug: 'granitskaerver-guide',
    image: 'https://gruslevering.dk/wp-content/uploads/2025/11/graa-granit-18-25mm.jpg',
  },
  {
    title: 'Flis: Guide til bunddækkematerialer',
    slug: 'flis-pinjebark-bundaekke-daekbark-kakaoflis',
    image: 'https://gruslevering.dk/wp-content/uploads/2025/10/Pinjebark-20-40-pose-e1770390187304.png',
  },
];

export default function ArticlePage() {
  const [, params] = useRoute('/guide/:slug');
  const slug = params?.slug || '';

  const { data: article, isLoading, error } = useQuery<ArticleData>({
    queryKey: ['article', slug],
    queryFn: () =>
      fetch(`/api/articles/${slug}`).then((r) => {
        if (!r.ok) throw new Error('Article not found');
        return r.json();
      }),
    enabled: !!slug,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (article) {
      document.title = `${decodeEntities(article.title)} - Gruslevering.dk`;
    } else {
      document.title = 'Haveguide - Gruslevering.dk';
    }
  }, [article]);

  const otherArticles = HAVEGUIDE_ARTICLES.filter((a) => a.slug !== slug);
  const minutes = article ? readingTime(article.content) : 0;

  return (
    <div className="min-h-screen bg-[var(--grus-bg)] flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: articleStyles }} />
      <Header />

      <main className="flex-1">
        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-3 border-[var(--grus-green)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="max-w-3xl mx-auto px-4 py-24 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">?</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Artikel ikke fundet</h1>
            <p className="text-gray-500 mb-8">Artiklen du leder efter findes desværre ikke.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-colors"
              style={{ backgroundColor: 'var(--grus-green)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbage til forsiden
            </Link>
          </div>
        )}

        {/* ── Article ── */}
        {article && (
          <>
            {/* Hero with featured image */}
            {article.featuredImage && (
              <div className="relative w-full bg-gray-900" style={{ maxHeight: '420px' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                <img
                  src={article.featuredImage}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ maxHeight: '420px' }}
                />
                <div className="absolute bottom-0 left-0 right-0 z-20 max-w-3xl mx-auto px-4 sm:px-6 pb-8">
                  <nav className="mb-4">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Forsiden
                    </Link>
                    <ChevronRight className="inline w-3.5 h-3.5 text-white/50 mx-1" />
                    <span className="text-sm text-white/80">Haveguide</span>
                  </nav>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl sm:text-3xl lg:text-[2.5rem] font-bold text-white leading-tight drop-shadow-lg"
                  >
                    {decodeEntities(article.title)}
                  </motion.h1>
                  <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(article.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {minutes} min læsetid
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* No hero image fallback */}
            {!article.featuredImage && (
              <div className="bg-[#e8f0e4] py-12 sm:py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                  <nav className="mb-4">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[var(--grus-green)] transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Forsiden
                    </Link>
                    <ChevronRight className="inline w-3.5 h-3.5 text-gray-400 mx-1" />
                    <span className="text-sm text-gray-600">Haveguide</span>
                  </nav>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl sm:text-3xl lg:text-[2.5rem] font-bold text-gray-900 leading-tight"
                  >
                    {decodeEntities(article.title)}
                  </motion.h1>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(article.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {minutes} min læsetid
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Article body */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
            >
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* CTA box */}
              <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-[#e8f0e4] border border-[#d0e0cc]">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Klar til dit haveprojekt?
                </h3>
                <p className="text-gray-600 mb-5 text-[15px]">
                  Se vores fulde udvalg af materialer med fri levering i hele Danmark.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold text-sm transition-colors"
                  style={{ backgroundColor: 'var(--grus-green)' }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.backgroundColor =
                      'var(--grus-green-hover)')
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.backgroundColor =
                      'var(--grus-green)')
                  }
                >
                  Se alle produkter
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* Related articles */}
            {otherArticles.length > 0 && (
              <section className="bg-[#f7f7f5] py-12 sm:py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                    Flere artikler fra haveguiden
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                    {otherArticles.map((a) => (
                      <Link
                        key={a.slug}
                        href={`/guide/${a.slug}`}
                        className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                      >
                        <div className="aspect-[16/10] overflow-hidden">
                          <SmartImage
                            src={a.image}
                            alt={a.title}
                            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                            width={350}
                            sizes="(max-width: 640px) 95vw, 30vw"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[var(--grus-green)] transition-colors">
                            {a.title}
                          </h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
