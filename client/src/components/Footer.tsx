import { Link } from 'wouter';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export default function Footer() {
  const navigation = [
    { label: 'Shop', href: '/shop' },
    { label: 'Levering', href: '/levering' },
    { label: 'Beregner', href: '/volumenberegner' },
    { label: 'Om os', href: '/om-os' },
    { label: 'Kontakt', href: '/kontakt' },
  ];

  const categories = [
    { label: 'Granit & Sten', href: '/shop/granit-sten' },
    { label: 'Sand & Grus', href: '/shop/sand-grus' },
    { label: 'Muld', href: '/shop/muld' },
    { label: 'Flis', href: '/shop/flis' },
    { label: 'Braende', href: '/shop/braende' },
    { label: 'Hus & Have', href: '/shop/hus-have' },
  ];

  return (
    <footer
      className="relative text-white"
      style={{ backgroundColor: 'var(--grus-dark)' }}
    >
      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-5 sm:px-6 pt-24 pb-12">
        {/* Top section: editorial heading + CTA */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-20">
          <div className="lg:w-[60%]">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] text-white/90 tracking-tight leading-[1.15] max-w-xl">
              Naturens bedste materialer, leveret til din dor.
            </h2>
          </div>
          <div className="lg:w-[40%] flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
              Ring til os
            </p>
            <a
              href="tel:+4572494444"
              className="font-display text-2xl sm:text-3xl text-white/90 hover:text-white transition-colors duration-300 tracking-tight"
            >
              +45 72 49 44 44
            </a>
            <p className="text-sm text-white/40 mt-3">
              Hverdage 8:00 - 16:00
            </p>
          </div>
        </div>

        {/* Middle section: 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-8 mb-16">
          {/* Column 1: Navigation */}
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30 mb-5">
              Navigation
            </h4>
            <ul className="space-y-3">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/50 hover:text-white transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Produkter */}
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30 mb-5">
              Produkter
            </h4>
            <ul className="space-y-3">
              {categories.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/50 hover:text-white transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Kontakt */}
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30 mb-5">
              Kontakt
            </h4>
            <ul className="space-y-3 text-sm text-white/50">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/30" />
                <span>
                  Tylstrupvej 1
                  <br />
                  9382 Tylstrup
                </span>
              </li>
              <li>
                <a
                  href="tel:+4572494444"
                  className="flex items-center gap-2 hover:text-white transition-colors duration-300"
                >
                  <Phone className="w-3.5 h-3.5 flex-shrink-0 text-white/30" />
                  +45 72 49 44 44
                </a>
              </li>
              <li>
                <a
                  href="mailto:Info@kaervangmaterialer.dk"
                  className="flex items-center gap-2 hover:text-white transition-colors duration-300"
                >
                  <Mail className="w-3.5 h-3.5 flex-shrink-0 text-white/30" />
                  Info@kaervangmaterialer.dk
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 flex-shrink-0 text-white/30" />
                Hverdage 8:00 - 16:00
              </li>
            </ul>
          </div>

          {/* Column 4: Om Kaervang */}
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30 mb-5">
              Kaervang Materialer
            </h4>
            <p className="text-sm text-white/50 leading-relaxed">
              Siden 2008 har vi leveret grus, sand, sten og havematerialer til
              private og erhverv i hele Danmark. Kvalitet og palidelig levering
              er vores fundament.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            &copy; 2025 Kaervang Materialer ApS
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span>Visa</span>
            <span className="text-white/10">|</span>
            <span>MasterCard</span>
            <span className="text-white/10">|</span>
            <span>MobilePay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
