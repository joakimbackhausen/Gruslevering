import { Link } from 'wouter';
import { Phone, Mail, MapPin, Clock, Truck } from 'lucide-react';

export default function Footer() {
  const categories = [
    { label: 'Granit & Sten', href: '/shop/granit-sten' },
    { label: 'Sand & Grus', href: '/shop/sand-grus' },
    { label: 'Muld', href: '/shop/muld' },
    { label: 'Flis', href: '/shop/flis' },
    { label: 'Brænde', href: '/shop/braende' },
    { label: 'Hus & Have', href: '/shop/hus-have' },
  ];

  const kundeservice = [
    { label: 'Volumenberegner', href: '/volumenberegner' },
    { label: 'Leveringsbetingelser', href: '/leveringsbetingelser' },
    { label: 'Om os', href: '/om-os' },
    { label: 'Kontakt', href: '/kontakt' },
  ];

  return (
    <footer className="bg-[#1a1a2e] text-gray-400">
      <div className="max-w-[1260px] mx-auto px-5 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Column 1: Om Kærvang */}
          <div>
            <span className="text-2xl font-bold text-white mb-4 block tracking-tight">
              Kærvang Materialer
            </span>
            <p className="text-[15px] leading-relaxed text-gray-400 mb-5">
              Kærvang Materialer ApS har siden 2008 leveret grus, sand, sten og
              havematerialer til private og erhverv i hele Danmark.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#3f9b3f]/15 text-[#3f9b3f] text-[13px] font-semibold px-4 py-2 rounded-full">
              <Truck className="w-4 h-4" />
              Fri levering
            </div>
          </div>

          {/* Column 2: Kategorier */}
          <div>
            <h4 className="text-[14px] font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Kategorier
            </h4>
            <div className="space-y-3">
              {categories.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="block text-[15px] text-gray-400 hover:text-[#3f9b3f] transition-colors duration-200"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Kundeservice */}
          <div>
            <h4 className="text-[14px] font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Kundeservice
            </h4>
            <div className="space-y-3">
              {kundeservice.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="block text-[15px] text-gray-400 hover:text-[#3f9b3f] transition-colors duration-200"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 4: Kontakt */}
          <div>
            <h4 className="text-[14px] font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Kontakt
            </h4>
            <div className="space-y-3 text-[15px]">
              <p className="text-gray-300 font-medium">Kærvang Materialer ApS</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#3f9b3f]" />
                <span>
                  Tylstrupvej 1
                  <br />
                  9382 Tylstrup
                </span>
              </div>
              <a
                href="tel:+4572494444"
                className="flex items-center gap-2 text-[#3f9b3f] font-medium hover:text-[#4db84d] transition-colors duration-200"
              >
                <Phone className="w-4 h-4" /> +45 72 49 44 44
              </a>
              <a
                href="mailto:Info@kaervangmaterialer.dk"
                className="flex items-center gap-2 hover:text-[#3f9b3f] transition-colors duration-200"
              >
                <Mail className="w-4 h-4" /> Info@kaervangmaterialer.dk
              </a>
              <div className="flex items-center gap-2 text-gray-500 text-[14px]">
                <Clock className="w-4 h-4" /> Hverdage 8:00-16:00
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[13px] text-gray-500">
            &copy; 2025 Kærvang Materialer ApS &mdash; CVR: 40125391
          </p>
          <div className="flex items-center gap-4 text-[13px] text-gray-500">
            <span className="px-2 py-1 border border-gray-700 rounded text-[12px]">Visa</span>
            <span className="px-2 py-1 border border-gray-700 rounded text-[12px]">MasterCard</span>
            <span className="px-2 py-1 border border-gray-700 rounded text-[12px]">MobilePay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
