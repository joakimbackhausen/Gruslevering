import { Link } from 'wouter';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
} from 'lucide-react';

const kundeserviceLinks = [
  { label: 'FAQ', href: '/kontakt' },
  { label: 'Leveringsbetingelser', href: '/levering' },
  { label: 'Returpolitik', href: '/levering' },
  { label: 'Kontakt os', href: '/kontakt' },
];

const informationLinks = [
  { label: 'Om os', href: '/om-os' },
  { label: 'Volumenberegner', href: '/volumenberegner' },
  { label: 'Alle produkter', href: '/shop' },
  { label: 'Levering', href: '/levering' },
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--grus-dark)' }}>
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-8 mb-12">
          {/* Kundeservice */}
          <div>
            <h4 className="text-sm uppercase tracking-wide font-semibold text-white mb-4">
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
            <h4 className="text-sm uppercase tracking-wide font-semibold text-white mb-4">
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
            <h4 className="text-sm uppercase tracking-wide font-semibold text-white mb-4">
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
            <h4 className="text-sm uppercase tracking-wide font-semibold text-white mb-4">
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
            <p className="text-xs text-gray-500 leading-relaxed">
              Gruslevering.dk er en del af Kaervang Materialer ApS.
              Vi leverer grus, sand, sten og havematerialer i hele Danmark.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Kaervang Materialer ApS &middot; CVR 40125391
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded">Visa</span>
            <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded">MasterCard</span>
            <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded">MobilePay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
