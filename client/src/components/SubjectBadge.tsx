import { Badge } from "./ui/badge";
import type { Subject } from "@shared/schema";

interface SubjectBadgeProps {
  subject: Subject;
  size?: "sm" | "default";
}

const subjectColors: Record<Subject, string> = {
  "عربي": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "إنجليزي": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "رياضيات": "bg-green-500/20 text-green-300 border-green-500/30",
  "كيمياء": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "فيزياء": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "أحياء": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "إسلامية": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "اجتماعيات": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "حاسوب": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "بدنية": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "فنية": "bg-rose-500/20 text-rose-300 border-rose-500/30",
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
