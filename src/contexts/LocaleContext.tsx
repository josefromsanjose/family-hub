import { createContext, useContext, useCallback, useState } from "react";
import type { ReactNode } from "react";
import type { MemberLocale } from "@prisma/client";
import { setLocale as setParaglideLocale } from "@paraglide/runtime";

type LocaleContextValue = {
  locale: MemberLocale;
  setLocale: (locale: MemberLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: MemberLocale;
}) {
  const [locale, setLocaleState] = useState<MemberLocale>(initialLocale);

  const setLocale = useCallback((nextLocale: MemberLocale) => {
    setLocaleState(nextLocale);
    setParaglideLocale(nextLocale);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
