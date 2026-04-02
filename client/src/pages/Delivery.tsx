import { useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Truck, Package, MapPin, Clock, CheckCircle, HelpCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const deliveryMethods = [
  {
    icon: Truck,
    title: 'Bigbag-levering',
    description:
      'Vores mest populaere leveringsmetode. Materialerne leveres i bigbags med kranbil direkte til din adresse. Fri levering i hele Danmark til faste oeer.',
  },
  {
    icon: Package,
    title: 'Tipvogn-levering',
    description:
      'For stoerre projekter tilbyder vi levering med tipvogn. Kontakt os for pris og tilgaengelighed.',
  },
  {
    icon: MapPin,
    title: 'Afhentning',
    description:
      'Du er velkommen til at hente selv paa vores adresse: Tylstrupvej 1, 9382 Tylstrup. Aabningstider: Hverdage 8:00-16:00.',
  },
];

const faqItems = [
  {
    question: 'Hvor hurtigt kan jeg faa leveret?',
    answer:
      'Typisk 3-5 hverdage efter bestilling. Ved akut behov, kontakt os - vi goer vores bedste for at finde en hurtig loesning.',
  },
  {
    question: 'Kan I levere til oeer?',
    answer:
      'Ja, vi leverer til alle faste danske oeer. Levering til oeer er inkluderet i vores gratis leveringsservice for bigbags.',
  },
  {
    question: 'Hvad er en bigbag?',
    answer:
      'En bigbag er en stor saek (ca. 90x90x90 cm) der typisk rummer omkring 1.000 kg materiale. Det er en praktisk og effektiv maade at faa leveret granitskaarver, sand, grus og andre byggematerialer paa.',
  },
  {
    question: 'Kan jeg returnere materialer?',
    answer:
      'Kontakt os paa telefon +45 72 49 44 44 eller email Info@kaervangmaterialer.dk, saa finder vi en loesning. Bemaaerk at materialer leveret i bigbags normalt ikke kan returneres, men vi hjaelper gerne med at finde det rette produkt foer bestilling.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function Delivery() {
  useEffect(() => {
    document.title =
      'Leveringsinformation - Kaervang Materialer | Fri levering i hele Danmark';
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumbs + Hero */}
        <section className="bg-[#f5f7fa] border-b">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-16">
            <Breadcrumb className="mb-8">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Forside</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Leveringsinformation</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-foreground tracking-tight">
                Leveringsinformation
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                Alt du skal vide om levering af materialer
              </p>
            </motion.div>
          </div>
        </section>

        {/* Delivery Methods */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <p
                className="text-[13px] font-semibold tracking-[0.2em] uppercase mb-2"
                style={{ color: 'var(--grus-green)' }}
              >
                Vores muligheder
              </p>
              <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground">
                Leveringsmetoder
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {deliveryMethods.map((method, i) => (
                <motion.div
                  key={method.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-white border border-gray-100 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: 'var(--grus-green-light)' }}
                  >
                    <method.icon
                      className="w-7 h-7"
                      style={{ color: 'var(--grus-green)' }}
                    />
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-3">
                    {method.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {method.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Delivery Area */}
        <section className="py-16 lg:py-20" style={{ backgroundColor: 'var(--grus-green-light)' }}>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-6">
                Leveringsomraade
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-left bg-white rounded-lg p-5 shadow-sm">
                  <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color: 'var(--grus-green)' }} />
                  <p className="text-foreground text-lg">
                    Vi leverer til hele Danmark, inkl. alle faste oeer.
                  </p>
                </div>
                <div className="flex items-start gap-3 text-left bg-white rounded-lg p-5 shadow-sm">
                  <Clock className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color: 'var(--grus-green)' }} />
                  <p className="text-foreground text-lg">
                    Leveringstiden er typisk 3-5 hverdage efter bestilling.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Prices */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-10">
                <p
                  className="text-[13px] font-semibold tracking-[0.2em] uppercase mb-2"
                  style={{ color: 'var(--grus-green)' }}
                >
                  Transparente priser
                </p>
                <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground">
                  Leveringspriser
                </h2>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  {
                    label: 'Bigbag-levering',
                    price: 'GRATIS',
                    note: 'I hele Danmark',
                  },
                  {
                    label: 'Tipvogn-levering',
                    price: 'Efter aftale',
                    note: 'Kontakt os for pris',
                  },
                  {
                    label: 'Afhentning',
                    price: 'GRATIS',
                    note: 'Tylstrupvej 1, Tylstrup',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="bg-white border border-gray-100 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
                  >
                    <p className="text-sm text-muted-foreground font-medium mb-2">
                      {item.label}
                    </p>
                    <p
                      className="text-2xl font-bold mb-1"
                      style={{ color: 'var(--grus-green)' }}
                    >
                      {item.price}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.note}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 lg:py-28 bg-[#f5f7fa]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-10">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--grus-green-light)' }}
                >
                  <HelpCircle className="w-6 h-6" style={{ color: 'var(--grus-green)' }} />
                </div>
                <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground">
                  Ofte stillede spoergsmaal
                </h2>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-base font-semibold text-foreground">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
