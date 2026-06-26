// Lightweight bilingual dictionary. English (LTR) + Arabic (RTL).
// Add keys here; components call t(key).

export type Locale = "en" | "ar";

export const LOCALES: { code: Locale; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
];

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

type Dict = Record<string, { en: string; ar: string }>;

export const STRINGS: Dict = {
  app_name: { en: "Operations", ar: "العمليات" },
  // nav
  nav_today: { en: "Today", ar: "اليوم" },
  nav_tasks: { en: "Tasks", ar: "المهام" },
  nav_projects: { en: "Projects", ar: "المشاريع" },
  nav_domains: { en: "Domains", ar: "المجالات" },
  nav_settings: { en: "Settings", ar: "الإعدادات" },
  // today
  today_title: { en: "Today", ar: "اليوم" },
  greet_morning: { en: "Good morning", ar: "صباح الخير" },
  greet_afternoon: { en: "Good afternoon", ar: "مساء الخير" },
  greet_evening: { en: "Good evening", ar: "مساء الخير" },
  stat_open: { en: "Open tasks", ar: "مهام مفتوحة" },
  stat_due: { en: "Due today", ar: "تستحق اليوم" },
  stat_slipping: { en: "Slipping", ar: "متعثّرة" },
  stat_triage: { en: "To triage", ar: "للمراجعة" },
  today_focus: { en: "Top tasks", ar: "أهم المهام" },
  today_schedule: { en: "Schedule", ar: "الجدول" },
  today_domains: { en: "Domains", ar: "المجالات" },
  today_no_tasks: { en: "Nothing pressing. Capture something.", ar: "لا يوجد عاجل. سجّل شيئاً." },
  today_no_events: { en: "No events today.", ar: "لا مواعيد اليوم." },
  pending_triage: { en: "items need triage", ar: "عناصر تحتاج إلى مراجعة" },
  // tasks
  tasks_title: { en: "Tasks", ar: "المهام" },
  add_task: { en: "Add task", ar: "إضافة مهمة" },
  task_placeholder: { en: "What needs doing?", ar: "ما الذي يجب عمله؟" },
  all: { en: "All", ar: "الكل" },
  open: { en: "Open", ar: "مفتوحة" },
  done: { en: "Done", ar: "منجزة" },
  overdue: { en: "Overdue", ar: "متأخرة" },
  due_today: { en: "Due today", ar: "تستحق اليوم" },
  // projects
  projects_title: { en: "Projects", ar: "المشاريع" },
  add_project: { en: "Add project", ar: "إضافة مشروع" },
  project_name: { en: "Project name", ar: "اسم المشروع" },
  milestones: { en: "milestones", ar: "مراحل" },
  // domains
  domains_title: { en: "Domains", ar: "المجالات" },
  slipping: { en: "Slipping", ar: "متعثّر" },
  on_track: { en: "On track", ar: "على المسار" },
  open_tasks: { en: "open tasks", ar: "مهام مفتوحة" },
  last_activity: { en: "Last activity", ar: "آخر نشاط" },
  never: { en: "never", ar: "أبداً" },
  // settings / calendars
  settings_title: { en: "Settings", ar: "الإعدادات" },
  calendars: { en: "Calendars", ar: "التقويمات" },
  connect_google: { en: "Connect Google Calendar", ar: "ربط تقويم جوجل" },
  add_outlook: { en: "Add Outlook (ICS link)", ar: "إضافة آوتلوك (رابط ICS)" },
  outlook_hint: {
    en: "Paste your published Outlook .ics share link (view-only).",
    ar: "الصق رابط مشاركة آوتلوك .ics المنشور (للعرض فقط).",
  },
  add: { en: "Add", ar: "إضافة" },
  language: { en: "Language", ar: "اللغة" },
  connected_calendars: { en: "Connected calendars", ar: "التقويمات المرتبطة" },
  sync_now: { en: "Sync now", ar: "مزامنة الآن" },
  // capture
  capture: { en: "Capture", ar: "تسجيل" },
  listening: { en: "Listening…", ar: "أستمع…" },
  capture_hint: { en: "Tap the mic and speak, or type.", ar: "اضغط الميكروفون وتكلّم، أو اكتب." },
  send: { en: "Send", ar: "إرسال" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  // generic
  save: { en: "Save", ar: "حفظ" },
  loading: { en: "Loading…", ar: "جارٍ التحميل…" },
  inbox: { en: "Inbox", ar: "الوارد" },
};

export function translate(key: string, locale: Locale): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[locale] ?? entry.en;
}
