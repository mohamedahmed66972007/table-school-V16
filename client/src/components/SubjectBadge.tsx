import { Badge } from "./ui/badge";
import type { Subject } from "@shared/schema";

interface SubjectBadgeProps {
  subject: Subject;
  size?: "sm" | "default";
}

const subjectColors: Record<Subject, string> = {
  "عربي": "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
  "إنجليزي": "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
  "رياضيات": "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30",
  "كيمياء": "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30",
  "فيزياء": "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30",
  "أحياء": "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  "إسلامية": "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
  "اجتماعيات": "bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30",
  "حاسوب": "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30",
  "بدنية": "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30",
  "فنية": "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30",
};

export default function SubjectBadge({ subject, size = "default" }: SubjectBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`${subjectColors[subject]} border font-data transition-all duration-200`}
      data-testid={`badge-${subject}`}
    >
      {subject}
    </Badge>
  );
}
