import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Building2, Send } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const contactDetails = [
  {
    icon: Building2,
    label: 'Firma',
    content: 'Kaervang Materialer ApS',
  },
  {
    icon: MapPin,
    label: 'Adresse',
    content: 'Tylstrupvej 1, 9382 Tylstrup',
    href: 'https://maps.google.com/?q=Tylstrupvej+1,+9382+Tylstrup',
  },
  {
    icon: Phone,
    label: 'Telefon',
    content: '+45 72 49 44 44',
    href: 'tel:+4572494444',
  },
  {
    icon: Mail,
    label: 'Email',
    content: 'Info@kaervangmaterialer.dk',
    href: 'mailto:Info@kaervangmaterialer.dk',
  },
  {
    icon: Clock,
    label: 'Åbningstider',
    content: 'Hverdage 8:00-16:00',
  },
];

export default function Contact() {
  useEffect(() => {
    document.title = 'Kontakt os - Kaervang Materialer ApS | Tlf: 72 49 44 44';
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    alert('Tak for din besked! Vi vender tilbage hurtigst muligt.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

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
                Vi er altid klar
              </p>
              <h1
                className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight"
                data-testid="text-page-title"
              >
                Kontakt os
              </h1>
              <p className="mt-4 text-lg text-white/70 max-w-xl">
                Ring eller skriv - vi svarer hurtigt
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
              {/* Contact Form (left) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p
                  className="text-sm uppercase tracking-widest font-semibold mb-4"
                  style={{ color: 'var(--grus-green)' }}
                >
                  Skriv til os
                </p>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-10">
                  Send en besked
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Navn *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-foreground focus:outline-none focus:ring-2 transition-shadow"
                        style={{ '--tw-ring-color': 'var(--grus-green)' } as React.CSSProperties}
                        placeholder="Dit navn"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-foreground focus:outline-none focus:ring-2 transition-shadow"
                        style={{ '--tw-ring-color': 'var(--grus-green)' } as React.CSSProperties}
                        placeholder="din@email.dk"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-foreground focus:outline-none focus:ring-2 transition-shadow"
                        style={{ '--tw-ring-color': 'var(--grus-green)' } as React.CSSProperties}
                        placeholder="+45 00 00 00 00"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                        Emne *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-foreground focus:outline-none focus:ring-2 transition-shadow"
                        style={{ '--tw-ring-color': 'var(--grus-green)' } as React.CSSProperties}
                      >
                        <option value="">Vælg emne...</option>
                        <option value="bestilling">Bestilling</option>
                        <option value="levering">Levering</option>
                        <option value="produkter">Produkter</option>
                        <option value="reklamation">Reklamation</option>
                        <option value="andet">Andet</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Besked *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-foreground focus:outline-none focus:ring-2 transition-shadow resize-vertical"
                      style={{ '--tw-ring-color': 'var(--grus-green)' } as React.CSSProperties}
                      placeholder="Skriv din besked her..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition-all"
                    style={{ backgroundColor: 'var(--grus-green)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--grus-green-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--grus-green)')
                    }
                  >
                    <Send className="w-5 h-5" />
                    Send besked
                  </button>
                </form>
              </motion.div>

              {/* Contact Info (right) */}
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
                  Kontaktoplysninger
                </p>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-10">
                  Få fat i os
                </h2>

                <div className="space-y-6 mb-12">
                  {contactDetails.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-4 p-4 rounded-lg hover:bg-[#f5f7fa] transition-colors"
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--grus-green-light)' }}
                      >
                        <item.icon className="w-5 h-5" style={{ color: 'var(--grus-green)' }} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          {item.label}
                        </div>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-foreground font-medium hover:underline"
                            target={item.href.startsWith('http') ? '_blank' : undefined}
                            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          >
                            {item.content}
                          </a>
                        ) : (
                          <span className="text-foreground font-medium">{item.content}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Map */}
                <div>
                  <p
                    className="text-sm uppercase tracking-widest font-semibold mb-4"
                    style={{ color: 'var(--grus-green)' }}
                  >
                    Find vej
                  </p>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-6">
                    Besøg os i Tylstrup
                  </h3>
                  <div className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden shadow-sm">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2200!2d9.935!3d57.155!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sTylstrupvej+1%2C+9382+Tylstrup!5e0!3m2!1sda!2sdk"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Kaervang Materialer lokation"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
