import { useNavigate } from "@solidjs/router";
import { user } from "../lib/stores";
import { language, setLanguage, type Language } from "../lib/i18n";
import Select from "./Select";

const LANGUAGES: { value: Language; code: string; name: string }[] = [
  { value: "en", code: "EN", name: "English" },
  { value: "tk", code: "TM", name: "Türkmençe" },
  { value: "ru", code: "RU", name: "Русский" },
  { value: "tr", code: "TR", name: "Türkçe" },
];

export default function Header() {
  const navigate = useNavigate();

  return (
    <header class="fixed inset-x-0 top-0 z-1000 flex h-15 items-center justify-between border-b border-line bg-surface px-7.5 max-[576px]:px-4">
      <div class="flex items-center gap-2.5">
        <img
          src="/images/Logo Confidently Routine.svg"
          alt=""
          class="h-7.5 w-auto cursor-pointer max-[768px]:h-8"
          onClick={() => navigate("/")}
        />
        <div class="text-xl text-accent max-[768px]:hidden">Confidently Routine</div>
      </div>

      <div class="flex items-center gap-2.5 text-base text-header max-[768px]:gap-3">
        <Select
          class="w-18 shrink-0 max-[768px]:w-14"
          value={language()}
          options={LANGUAGES.map((l) => ({ value: l.value, label: l.name }))}
          onChange={(v) => setLanguage(v as Language)}
          triggerLabel={() => (
            <span class="text-[13px] font-semibold text-accent">
              {LANGUAGES.find((l) => l.value === language())?.code}
            </span>
          )}
          ariaLabel="Language switcher"
        />
        <div class="max-[768px]:hidden">{user()?.username}</div>
        <div class="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-accent-alt transition-transform hover:scale-105 max-[768px]:size-9.5">
          <img src={user()?.avatar} alt="" class="size-full rounded-full object-cover" />
        </div>
      </div>
    </header>
  );
}
