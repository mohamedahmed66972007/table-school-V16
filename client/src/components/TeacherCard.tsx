import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { FileText, Edit, Trash2, User } from "lucide-react";
import SubjectBadge from "./SubjectBadge";
import type { Subject } from "@shared/schema";

interface TeacherCardProps {
  id: string;
  name: string;
  subject: Subject;
  completedSlots: number;
  totalSlots: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExportPDF: (id: string) => void;
}

export default function TeacherCard({
  id,
  name,
  subject,
  completedSlots,
  totalSlots,
  onEdit,
  onDelete,
  onExportPDF,
}: TeacherCardProps) {
  const progress = (completedSlots / totalSlots) * 100;

  return (
    <Card className="p-4 hover-elevate transition-all duration-200" data-testid={`teacher-card-${id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg font-heading mb-1" data-testid={`text-teacher-name-${id}`}>
              {name}
            </h3>
            <SubjectBadge subject={subject} />
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <span>الحصص المكتملة</span>
                <span className="font-data" data-testid={`text-progress-${id}`}>
                  {completedSlots}/{totalSlots}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(id)}
            data-testid={`button-edit-${id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onExportPDF(id)}
            data-testid={`button-export-${id}`}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(id)}
            data-testid={`button-delete-${id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
