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
  nav_routines: { en: "Routines", ar: "الروتين" },
  nav_content: { en: "Content", ar: "المحتوى" },
  nav_people: { en: "People", ar: "الأشخاص" },
  nav_library: { en: "Library", ar: "المكتبة" },
  nav_journal: { en: "Journal", ar: "اليوميات" },
  search: { en: "Search", ar: "بحث" },
  nav_health: { en: "Health", ar: "الصحة" },
  nav_mail: { en: "Mail", ar: "البريد" },
  mail_connect: { en: "Connect Google (with Gmail) in Settings to see your inbox here.", ar: "اربط جوجل (مع Gmail) من الإعدادات لعرض بريدك هنا." },
  mail_reconnect: { en: "Reconnect Google to grant Gmail access.", ar: "أعد ربط جوجل لمنح صلاحية البريد." },
  mail_empty: { en: "Inbox is empty.", ar: "صندوق الوارد فارغ." },
  ask: { en: "Ask", ar: "اسأل" },
  // briefing
  briefing_title: { en: "Daily Briefing", ar: "موجز اليوم" },
  regenerate: { en: "Regenerate", ar: "إعادة التوليد" },
  briefing_loading: { en: "Writing your briefing…", ar: "أكتب موجزك…" },
  // ask
  ask_title: { en: "Ask", ar: "اسأل" },
  ask_subtitle: { en: "Ask about your day, projects, or what's slipping.", ar: "اسأل عن يومك أو مشاريعك أو ما يتعثّر." },
  ask_placeholder: { en: "e.g. Is Nashati up to date? What's slipping?", ar: "مثال: هل نشاطي محدّث؟ ما الذي يتعثّر؟" },
  thinking: { en: "Thinking…", ar: "أفكّر…" },
  // health
  health_title: { en: "Health", ar: "الصحة" },
  water: { en: "Water", ar: "الماء" },
  steps: { en: "Steps", ar: "الخطوات" },
  weight: { en: "Weight", ar: "الوزن" },
  mood: { en: "Mood", ar: "المزاج" },
  vs_yesterday: { en: "vs yesterday", ar: "مقابل الأمس" },
  log_steps: { en: "Log steps", ar: "سجّل خطوات" },
  health_note: { en: "Health note / journal", ar: "ملاحظة صحية / يوميات" },
  add_log: { en: "Log", ar: "تسجيل" },
  // whoop
  whoop: { en: "Whoop", ar: "ووب" },
  whoop_connect: { en: "Connect Whoop", ar: "اربط ووب" },
  whoop_hint: { en: "Connect Whoop for recovery, sleep, and strain. (Steps stay manual for now.)", ar: "اربط ووب للتعافي والنوم والجهد. (الخطوات يدوية حالياً.)" },
  recovery: { en: "Recovery", ar: "التعافي" },
  sleep: { en: "Sleep", ar: "النوم" },
  strain: { en: "Strain", ar: "الجهد" },
  resting_hr: { en: "Resting HR", ar: "نبض الراحة" },
  // summaries
  latest_summary: { en: "Latest Briefing", ar: "أحدث ملخص" },
  summary_needs_token: { en: "Add a GitHub token (.env GITHUB_TOKEN) to read your summaries repo.", ar: "أضف رمز GitHub (في .env) لقراءة مستودع الملخصات." },
  // cockpit / pages
  nav_nashati: { en: "Nashati", ar: "نشاطي" },
  open_full: { en: "Open", ar: "فتح" },
  open_briefing: { en: "Open full briefing", ar: "افتح الموجز كاملاً" },
  referenced: { en: "Jump to", ar: "انتقل إلى" },
  action_needed: { en: "Action Needed", ar: "إجراء مطلوب" },
  all_clear: { en: "All clear", ar: "لا إجراءات" },
  unread_count: { en: "unread", ar: "غير مقروء" },
  inbox_label: { en: "Inbox", ar: "الوارد" },
  nashati_needs_key: { en: "Add NASHATI_ADMIN_API_KEY in .env to connect the Nashati cockpit.", ar: "أضف مفتاح نشاطي في .env لتفعيل لوحة نشاطي." },
  pending_approvals: { en: "Pending approvals", ar: "موافقات معلّقة" },
  open_tickets: { en: "Open tickets", ar: "تذاكر مفتوحة" },
  providers: { en: "Providers", ar: "مزوّدون" },
  activities: { en: "Activities", ar: "أنشطة" },
  published: { en: "Published", ar: "منشورة" },
  parents: { en: "Parents", ar: "أولياء أمور" },
  // today sections
  top3_title: { en: "Top 3 for Today", ar: "أهم ٣ لليوم" },
  up_next: { en: "Up Next", ar: "التالي" },
  all_open: { en: "All Open", ar: "كل المفتوح" },
  slipping_title: { en: "Slipping", ar: "المتعثّر" },
  routines_title: { en: "Routines", ar: "الروتين" },
  resurfacing_title: { en: "Resurfacing", ar: "يطفو من جديد" },
  needs_review_title: { en: "Needs Review", ar: "بحاجة لمراجعة" },
  view_all: { en: "View all", ar: "عرض الكل" },
  open_spot: { en: "(open spot)", ar: "(مكان شاغر)" },
  star_hint: { en: "Star a task below to set it as today's top 3.", ar: "ضع نجمة على مهمة لجعلها ضمن أهم ٣ اليوم." },
  nothing_slipping: { en: "Nothing slipping right now. Quiet projects or missed patterns surface here.", ar: "لا شيء متعثّر الآن. المشاريع الهادئة أو الأنماط الفائتة تظهر هنا." },
  resurface_empty: { en: "One journal entry, quote, or saved verse rotates here daily.", ar: "تدوينة أو اقتباس أو آية محفوظة تظهر هنا يومياً." },
  missed: { en: "Missed", ar: "فات" },
  grp_overdue: { en: "Overdue", ar: "متأخرة" },
  grp_today: { en: "Today", ar: "اليوم" },
  grp_tomorrow: { en: "Tomorrow", ar: "غداً" },
  grp_this_week: { en: "This Week", ar: "هذا الأسبوع" },
  grp_later: { en: "Later", ar: "لاحقاً" },
  grp_someday: { en: "No date", ar: "بدون تاريخ" },
  part_morning: { en: "Morning", ar: "الصباح" },
  part_afternoon: { en: "Afternoon", ar: "بعد الظهر" },
  part_evening: { en: "Evening", ar: "المساء" },
  part_anytime: { en: "Anytime", ar: "أي وقت" },
  // modules
  new_task: { en: "New task", ar: "مهمة جديدة" },
  add_quote: { en: "Add quote", ar: "إضافة اقتباس" },
  add_entry: { en: "New entry", ar: "تدوينة جديدة" },
  add_person: { en: "Add person", ar: "إضافة شخص" },
  add_content: { en: "Add item", ar: "إضافة عنصر" },
  module_empty: { en: "Nothing here yet — capture by voice or add one.", ar: "لا شيء هنا بعد — سجّل صوتياً أو أضف عنصراً." },
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
  profile: { en: "Profile", ar: "الملف الشخصي" },
  name_en_label: { en: "Name (English)", ar: "الاسم (إنجليزي)" },
  name_ar_label: { en: "Name (Arabic)", ar: "الاسم (عربي)" },
  name_hint: { en: "Used in your greeting, per language.", ar: "يُستخدم في التحية بحسب اللغة." },
  saved: { en: "Saved", ar: "تم الحفظ" },
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
