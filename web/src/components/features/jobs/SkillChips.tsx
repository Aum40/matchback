import { Badge } from "@/components/ui/badge";
import type { JobSkill } from "@/lib/api/api.type";
import { Check, HelpCircle, X } from "lucide-react";

export type SkillState = "matched" | "unconfirmed" | "missing";

const STATE: Record<
  SkillState,
  { variant: "success" | "warning" | "destructive"; icon: typeof Check; label: string }
> = {
  matched: { variant: "success", icon: Check, label: "in your profile" },
  unconfirmed: { variant: "warning", icon: HelpCircle, label: "not enough information" },
  missing: { variant: "destructive", icon: X, label: "not in your profile" },
};

/**
 * ป้ายทักษะของงาน — สถานะบอกทั้งสี ไอคอน และข้อความสำหรับ screen reader
 * (ไม่พึ่งสีอย่างเดียว คนตาบอดสีต้องแยกออก)
 */
export default function SkillChips({
  skills,
  states,
  limit,
}: {
  skills: JobSkill[];
  /** ไม่ส่ง = แสดงแบบกลาง ๆ (ยังไม่มีข้อมูลผู้สมัคร เช่นหน้าแรก) */
  states?: Record<string, SkillState>;
  limit?: number;
}) {
  const shown = limit ? skills.slice(0, limit) : skills;
  const hidden = skills.length - shown.length;

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
      {shown.map((skill) => {
        const state = states?.[skill.id];
        const config = state ? STATE[state] : null;
        const Icon = config?.icon;
        return (
          <li key={skill.id}>
            <Badge variant={config?.variant ?? "secondary"}>
              {Icon && <Icon aria-hidden="true" />}
              {skill.name}
              {!skill.required && (
                <span className="text-muted-foreground">· nice to have</span>
              )}
              {config && <span className="sr-only">({config.label})</span>}
            </Badge>
          </li>
        );
      })}
      {hidden > 0 && (
        <li>
          <Badge variant="outline">+{hidden} more</Badge>
        </li>
      )}
    </ul>
  );
}

/** จาก id ที่ API ส่งมา (DiscoverJob.match) เป็น map ให้ SkillChips */
export function skillStates(match: {
  matchedSkillIds: string[];
  unconfirmedSkillIds: string[];
  missingSkillIds: string[];
}): Record<string, SkillState> {
  return Object.fromEntries([
    ...match.matchedSkillIds.map((id) => [id, "matched"] as const),
    ...match.unconfirmedSkillIds.map((id) => [id, "unconfirmed"] as const),
    ...match.missingSkillIds.map((id) => [id, "missing"] as const),
  ]);
}
