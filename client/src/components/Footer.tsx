import { Link } from 'wouter';
import {
  Truck,
  Timer,
  ShieldCheck,
  Headphones,
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Star,
} from 'lucide-react';

const usps = [
  {
    icon: Truck,
    title: 'Fri levering',
    description: 'Ved ordre over 2.000 kr.',
  },
  {
    icon: Timer,
    title: 'Hurtig levering',
    description: 'Levering inden for 1-3 hverdage',
  },
  {
    icon: ShieldCheck,
    title: 'Dansk kvalitet',
    description: 'Materialer fra danske leverandører',
  },
  {
    icon: Headphones,
    title: 'Kundeservice',
    description: 'Vi er klar til at hjælpe dig',
  },
];

const kundeserviceLinks = [
  { label: 'FAQ', href: '/kontakt' },
  { label: 'Leveringsbetingelser', href: '/levering' },
  { label: 'Returpolitik', href: '/levering' },
  { label: 'Kontakt os', href: '/kontakt' },
];

const informationLinks = [
  { label: 'Om os', href: '/om-os' },
  { label: 'Volumenberegner', href: '/volumenberegner' },
  { label: 'Vores materialer', href: '/shop' },
];

export default function Footer() {
  return (
    <footer
      className="text-white"
      style={{ backgroundColor: 'var(--grus-dark)' }}
    >
      {/* USP bar */}
      <div className="bg-white/5">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {usps.map((usp) => (
              <div key={usp.title} className="flex flex-col items-center text-center gap-2">
                <usp.icon className="w-6 h-6 text-[var(--grus-green)]" />
                <span className="text-sm font-semibold text-white">{usp.title}</span>
                <span className="text-sm text-gray-400">{usp.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-8 mb-12">
          {/* Kundeservice */}
          <div>
            <h4 className="text-sm uppercase tracking-wider font-semibold text-white mb-4">
              Kundeservice
            </h4>
            <ul className="space-y-2.5">
              {kundeserviceLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="text-sm uppercase tracking-wider font-semibold text-white mb-4">
              Information
            </h4>
            <ul className="space-y-2.5">
              {informationLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h4 className="text-sm uppercase tracking-wider font-semibold text-white mb-4">
              Kontakt
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="font-medium text-white/80">Kaervang Materialer ApS</li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[var(--grus-green)]" />
                <span>Tylstrupvej 1<br />9382 Tylstrup</span>
              </li>
              <li>
                <a
                  href="tel:+4572494444"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4 shrink-0 text-[var(--grus-green)]" />
                  +45 72 49 44 44
                </a>
              </li>
              <li>
                <a
                  href="mailto:Info@kaervangmaterialer.dk"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0 text-[var(--grus-green)]" />
                  Info@kaervangmaterialer.dk
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-[var(--grus-green)]" />
                Hverdage 8:00 - 16:00
              </li>
            </ul>
          </div>

          {/* Folg os */}
          <div>
            <h4 className="text-sm uppercase tracking-wider font-semibold text-white mb-4">
              Folg os
            </h4>
            <div className="flex items-center gap-3 mb-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4 text-gray-300" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-gray-300" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Star className="w-4 h-4 text-[#00b67a] fill-[#00b67a]" />
              <span>Trustpilot</span>
            </div>
            <p className="text-xs text-[var(--grus-stone)] mt-1">Se anmeldelser</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--grus-stone)]">
            &copy; 2025 Kaervang Materialer ApS &middot; CVR 40125391
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--grus-stone)] bg-white/5 px-2.5 py-1 rounded">Visa</span>
            <span className="text-xs text-[var(--grus-stone)] bg-white/5 px-2.5 py-1 rounded">MasterCard</span>
            <span className="text-xs text-[var(--grus-stone)] bg-white/5 px-2.5 py-1 rounded">MobilePay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
