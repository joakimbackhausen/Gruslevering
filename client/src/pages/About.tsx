import { useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Phone, Award, HeartHandshake, Leaf, MapPin, Calendar, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const values = [
  {
    icon: Award,
    title: 'Kvalitet',
    description:
      'Vi leverer kun materialer af højeste kvalitet. Alle vores produkter gennemgår grundig kvalitetskontrol før levering.',
  },
  {
    icon: HeartHandshake,
    title: 'Service',
    description:
      'Personlig betjening og hurtig levering er kernen i vores forretning. Vi gør det nemt at bestille byggematerialer.',
  },
  {
    icon: Leaf,
    title: 'Bæredygtighed',
    description:
      'Vi arbejder aktivt på at reducere vores miljøaftryk gennem ansvarlig sourcing og effektiv logistik.',
  },
];

const facts = [
  { icon: Calendar, label: 'Etableret', value: '2008' },
  { icon: MapPin, label: 'Beliggenhed', value: 'Tylstrup (15 km nord for Aalborg)' },
  { icon: Globe, label: 'Leveringsområde', value: 'Hele Danmark' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function About() {
  useEffect(() => {
    document.title = 'Om os - Kaervang Materialer ApS | Byggematerialer med levering';
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative h-[70vh] min-h-[450px] overflow-hidden">
          <img
            src="/hero-drone.jpg"
            alt="Kaervang Materialer"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/90 via-[#1a2332]/70 to-[#1a2332]/40" />

          <div className="relative h-full flex flex-col justify-center max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm uppercase tracking-widest text-white/50 font-semibold mb-3">
                Siden 2008
              </p>
              <h1
                className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight"
                data-testid="text-page-title"
              >
                Om Kaervang Materialer
              </h1>
              <p className="mt-4 text-lg text-white/70 max-w-xl">
                Din partner for byggematerialer med levering i hele Danmark.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-t border-white/10" style={{ backgroundColor: 'var(--grus-green)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-3 divide-x divide-white/20">
              {facts.map((fact) => (
                <div key={fact.label} className="py-8 px-6 text-center">
                  <fact.icon className="w-5 h-5 text-white/70 mx-auto mb-2" />
                  <div className="font-display font-bold text-2xl lg:text-3xl text-white">
                    {fact.value}
                  </div>
                  <div className="mt-1 text-white/70 text-sm">{fact.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* History */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="aspect-[4/3] rounded-lg overflow-hidden shadow-lg"
              >
                <img
                  src="/hero-drone.jpg"
                  alt="Kaervang Materialer"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p
                  className="text-sm uppercase tracking-widest font-semibold mb-4"
                  style={{ color: 'var(--grus-green)' }}
                >
                  Vores historie
                </p>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Kvalitetsmaterialer siden 2008
                </h2>
                <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <p>
                    Kaervang Materialer ApS blev grundlagt i 2008 med en vision om at gøre det
                    nemt og bekvemt at bestille byggematerialer med levering i hele Danmark.
                  </p>
                  <p>
                    Fra vores base i Tylstrup, 15 km nord for Aalborg, leverer vi et bredt
                    sortiment af grus, sand, granitskærver og andre materialer til både private
                    og erhvervskunder.
                  </p>
                  <p>
                    Med gratis bigbag-levering til hele Danmark gør vi det så nemt som muligt
                    at få de materialer, du har brug for, leveret direkte til døren.
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/kontakt"
                    className="inline-flex items-center gap-2 text-white px-6 py-3 rounded font-semibold transition-all"
                    style={{ backgroundColor: 'var(--grus-green)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--grus-green-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--grus-green)')
                    }
                  >
                    <Phone className="w-4 h-4" />
                    Kontakt os
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 border border-gray-300 text-foreground px-6 py-3 rounded font-semibold hover:bg-gray-50 transition-all"
                  >
                    Se produkter
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-[#f5f7fa] py-20 lg:py-28">
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
                Hvad driver os
              </p>
              <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground">
                Vores værdier
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-white rounded-xl border border-gray-100 p-8 text-center hover:shadow-lg transition-shadow duration-300"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: 'var(--grus-green-light)' }}
                  >
                    <value.icon className="w-7 h-7" style={{ color: 'var(--grus-green)' }} />
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-20 lg:py-28"
          style={{
            background: 'linear-gradient(135deg, var(--grus-green) 0%, #1a5a1a 100%)',
          }}
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-display font-bold text-3xl lg:text-4xl text-white mb-4">
                Har du spørgsmål?
              </h2>
              <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
                Vi er altid klar til at hjælpe dig med at finde de rette materialer til dit projekt.
              </p>
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 bg-white font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition-all text-lg"
                style={{ color: 'var(--grus-green)' }}
              >
                Kontakt os
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
