import { redirect } from "next/navigation";

/** /recruiter ไม่มีหน้าของตัวเอง — หน้าหลักของ recruiter คือรายการงาน */
export default function RecruiterIndexPage() {
  redirect("/recruiter/jobs");
}
