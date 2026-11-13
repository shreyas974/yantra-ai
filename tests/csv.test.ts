import { describe, it, expect } from "vitest";
import { sanitizeCsvValue, generateCsv } from "@/lib/csv";

describe("CSV Formula Neutralization", () => {
  it("neutralizes dangerous spreadsheet formula prefixes (=, +, -, @, \\t, \\r)", () => {
    expect(sanitizeCsvValue("=SUM(A1:A10)")).toBe("\"'=SUM(A1:A10)\"");
    expect(sanitizeCsvValue("+123456")).toBe("\"'+123456\"");
    expect(sanitizeCsvValue("-5+2")).toBe("\"'-5+2\"");
    expect(sanitizeCsvValue("@CMD")).toBe("\"'@CMD\"");
    expect(sanitizeCsvValue("\tTabExploit")).toBe("\"'\tTabExploit\"");
    expect(sanitizeCsvValue("\rReturnExploit")).toBe("\"'\rReturnExploit\"");
  });

  it("leaves standard alphanumeric values un-prefixed with quotes", () => {
    expect(sanitizeCsvValue("Alice Smith")).toBe("\"Alice Smith\"");
    expect(sanitizeCsvValue("team@example.com")).toBe("\"team@example.com\"");
    expect(sanitizeCsvValue("CHAD-92A8BF")).toBe("\"CHAD-92A8BF\"");
  });

  it("escapes existing double quotes", () => {
    expect(sanitizeCsvValue('He said "Hello"')).toBe('"He said ""Hello"""');
  });

  it("generates correctly formatted CSV table with neutralized cells", () => {
    const headers = ["Name", "Payload"];
    const rows = [
      ["Alice", "=1+1"],
      ["Bob", "Normal string"],
    ];
    const csv = generateCsv(headers, rows);
    expect(csv).toContain('"Alice","\'=1+1"');
    expect(csv).toContain('"Bob","Normal string"');
  });
});
