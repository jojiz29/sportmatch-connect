import { EXCEL_MOCK_COURTS } from "../src/shared/api/mockCourtsData.ts";

console.log("Total mock courts:", EXCEL_MOCK_COURTS.length);
const first10 = EXCEL_MOCK_COURTS.slice(0, 10);
first10.forEach((c) => {
  console.log(`- ${c.id}: ${c.name} (${c.district})`);
});
