export async function fetchProjects(userId: string): Promise<Array<{ id: string; name: string }>> {
  // شبیه‌سازی تاخیر شبکه
  await new Promise((resolve) => setTimeout(resolve, 500));

  // این دیتا فعلاً Mock است، اما userId را می‌گیرد تا در آینده فیلتر شده برگرداند
  return [
    { id: "P10", name: "Hansa Warehouse" },
    { id: "P12", name: "Bau Müller HQ" },
    { id: "P99", name: "Frankfurt Central Park" }
  ];
}