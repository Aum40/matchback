"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 💡 1. ใส่ข้อมูล Demo สำหรับใช้พรีเซนต์
const MOCK_DATA = {
  summary: {
    totalJobs: 142,
    totalCandidates: 856,
    avgJobSalaryMax: 45000,
    avgCandidatePreferredSalary: 42500,
  },
  skills: {
    employerDemand: [
      { name: "React", count: 85 },
      { name: "Node.js", count: 65 },
      { name: "TypeScript", count: 50 },
      { name: "Figma", count: 40 },
      { name: "Python", count: 35 },
    ],
    candidateSupply: [
      { name: "React", count: 120 },
      { name: "Node.js", count: 45 },
      { name: "TypeScript", count: 30 },
      { name: "Figma", count: 80 },
      { name: "Python", count: 60 },
    ],
  },
};

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<typeof MOCK_DATA | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 💡 2. จำลองเวลาโหลด 0.5 วินาที เพื่อให้ดูเหมือนดึงข้อมูลจาก API จริง
    const timer = setTimeout(() => {
      setData(MOCK_DATA);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <div className="p-8 text-center mt-10">Loading Analytics...</div>;
  if (!data) return <div className="p-8 text-center text-destructive">Failed to load data</div>;

  // 💡 3. นำข้อมูล Demo มาแปลงรูปแบบเข้ากราฟ
  const skillMap: Record<string, { name: string; demand: number; supply: number }> = {};
  
  data.skills.employerDemand.forEach((item) => {
    skillMap[item.name] = { name: item.name, demand: item.count, supply: 0 };
  });
  data.skills.candidateSupply.forEach((item) => {
    if (skillMap[item.name]) {
      skillMap[item.name].supply = item.count;
    } else {
      skillMap[item.name] = { name: item.name, demand: 0, supply: item.count };
    }
  });

  const skillChartData = Object.values(skillMap);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold">MATCHBACK Insights & Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Compare skill demand, salaries and work arrangements between employers and
          candidates. Figures on this page are sample demo data.
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold">Total Job Postings</p>
          <p className="text-2xl font-bold">{data.summary.totalJobs}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold">Total Candidates</p>
          <p className="text-2xl font-bold">{data.summary.totalCandidates}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold">Avg Offered Salary (Max)</p>
          <p className="text-2xl font-bold text-emerald-600">
            ฿{data.summary.avgJobSalaryMax.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold">Avg Preferred Salary</p>
          <p className="text-2xl font-bold text-primary">
            ฿{data.summary.avgCandidatePreferredSalary.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart 1: Skill Gap Analysis */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm mt-8">
        <h2 className="mb-6 text-xl font-bold">Skill Gap Analysis (Demand vs Supply)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skillChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="demand" name="Employer Demands" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="supply" name="Candidate Has Skill" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
