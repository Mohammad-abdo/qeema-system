import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Heart, Zap, Shield } from "lucide-react";
import { playReminderSound } from "@/utils/notificationSound";

const REMINDERS = [
  { text: "صَلِّ عَلَى النَّبِي", sub: "Pray upon the Prophet", icon: Heart },
  { text: "خُذْ بِالْأَسْبَاب", sub: "Take the means", icon: Zap },
  { text: "اتَّقِ الله", sub: "Fear Allah", icon: Shield },
];

const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

function ReminderCard({ reminder, onClose }) {
  const Icon = reminder.icon;
  return (
    <div
      role="alert"
      className="flex items-center gap-4 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/15 dark:to-primary/5 p-4 shadow-lg min-w-[280px]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-foreground leading-tight" dir="rtl">
          {reminder.text}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{reminder.sub}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
        aria-label="Close"
      >
        <span className="text-lg leading-none">×</span>
      </button>
    </div>
  );
}

export function ReminderToaster() {
  const indexRef = useRef(0);
  const toastIdRef = useRef(null);

  useEffect(() => {
    const show = () => {
      const reminder = REMINDERS[indexRef.current % REMINDERS.length];
      indexRef.current += 1;
      playReminderSound();
      toastIdRef.current = toast.custom(
        (t) => (
          <ReminderCard
            reminder={reminder}
            onClose={() => toast.dismiss(t.id)}
          />
        ),
        { duration: 12000, position: "top-center" }
      );
    };

    const first = setTimeout(show, 30000);
    const id = setInterval(show, INTERVAL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return null;
}
