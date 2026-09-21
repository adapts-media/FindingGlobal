import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, Globe } from "lucide-react";
import { COUNTRIES } from "@/lib/mock-data";
import { getCountryFlagUrl } from "@/lib/country-codes";
import { cn } from "@/lib/utils";
import { LazyFlag } from "@/components/lazy-flag";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
  excludeAllCountries?: boolean;
}

export function CountrySelect({
  value,
  onChange,
  className,
  triggerClassName,
  placeholder = "Select Country",
  excludeAllCountries = false,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const countriesList = excludeAllCountries
    ? COUNTRIES.filter((c) => c !== "All Countries")
    : COUNTRIES;

  const filteredCountries = countriesList.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const flagUrl = getCountryFlagUrl(value);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border border-border bg-card py-3.5 pl-4 pr-10 text-xs font-bold text-obsidian outline-none transition-all hover:border-hyperblue/30 focus:border-hyperblue focus:ring-2 focus:ring-hyperblue/10 cursor-pointer text-left shadow-xs",
          triggerClassName
        )}
      >
        <span className="flex items-center gap-2.5 truncate">
          {flagUrl ? (
            <img
              src={flagUrl}
              alt=""
              className="w-5 h-3.5 object-cover rounded-[2px] border border-border/40 shadow-xs shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : value && value !== "All Countries" ? (
            <Globe className="size-4 text-steel shrink-0" />
          ) : null}
          <span className="truncate">{value || placeholder}</span>
        </span>
        <ChevronDown className={cn("absolute right-3.5 size-4 text-steel transition-transform duration-200 pointer-events-none", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-2 flex flex-col rounded-xl border border-border bg-card p-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 border-b border-border/40 px-2.5 pb-2 pt-1">
            <Search className="size-3.5 text-steel shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-obsidian placeholder-steel outline-none border-none p-0 focus:ring-0"
            />
          </div>
          <div className="max-h-60 overflow-y-auto mt-1 space-y-0.5">
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs font-semibold text-steel">
                No countries found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c === value;
                const cFlag = getCountryFlagUrl(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors",
                      isSelected
                        ? "bg-hyperblue text-white"
                        : "text-steel-dark hover:bg-surface-muted hover:text-obsidian"
                    )}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      {cFlag ? (
                        <LazyFlag src={cFlag} isSelected={isSelected} />
                      ) : c !== "All Countries" ? (
                        <Globe className={cn("size-4 shrink-0", isSelected ? "text-white" : "text-steel")} />
                      ) : null}
                      <span className="truncate">{c}</span>
                    </span>
                    {isSelected && <Check className="size-3.5 text-white shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
