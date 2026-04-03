import { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { machineSlug } from '@/lib/machineSlug';

interface Machine {
  id: number;
  title: string;
  brand: string;
  year: string;
  price: string;
  url: string;
  pictures: { url: string }[];
}

function formatPrice(price: string): string {
  const num = parseInt(price, 10);
  if (isNaN(num)) return price;
  return num.toLocaleString('da-DK');
}

export default function MachineSlider({ machines }: { machines: Machine[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const displayMachines = machines.slice(0, 8);

  if (displayMachines.length === 0) return null;

  return (
    <div className="relative group/slider">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5 lg:gap-6">
          {displayMachines.map((machine) => (
            <div
              key={machine.id}
              className="flex-none w-[280px] sm:w-[310px] lg:w-[340px]"
            >
              <Link
                href={`/maskine/${machineSlug(machine.id, machine.title)}`}
                className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/8 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                  {machine.pictures?.[0]?.url ? (
                    <img
                      src={machine.pictures[0].url}
                      alt={machine.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      Ingen billede
                    </div>
                  )}
                  {machine.year && machine.year !== 'Årgang ukendt' && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/95 backdrop-blur-sm text-[12px] font-semibold px-2.5 py-1 rounded-lg text-[#2d2d2d] shadow-sm">
                        {machine.year}
                      </span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-end p-4">
                    <span className="bg-white rounded-full p-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <ArrowRight className="w-4 h-4 text-[#2d2d2d]" />
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-2">
                    <span className="text-[11px] text-[#E8A000] font-semibold uppercase tracking-wider">
                      {machine.brand}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#2d2d2d] text-[15px] mb-3 line-clamp-2 leading-snug group-hover:text-[#E8A000] transition-colors duration-300">
                    {machine.title}
                  </h3>
                  <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="font-bold text-[18px] text-[#2d2d2d]">
                        {formatPrice(machine.price)} kr
                      </span>
                      <span className="text-[11px] text-[#aaa] block mt-0.5">ekskl. moms</span>
                    </div>
                    <span className="text-[13px] font-semibold text-[#E8A000] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Se mere →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 bg-white shadow-xl shadow-black/10 rounded-full p-3 hover:bg-[#2d2d2d] hover:text-white transition-all duration-300 z-10 opacity-0 group-hover/slider:opacity-100 hover:scale-110"
        data-testid="button-slider-prev"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 bg-white shadow-xl shadow-black/10 rounded-full p-3 hover:bg-[#2d2d2d] hover:text-white transition-all duration-300 z-10 opacity-0 group-hover/slider:opacity-100 hover:scale-110"
        data-testid="button-slider-next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
