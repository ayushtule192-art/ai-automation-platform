import { parse } from "csv-parse/sync";
import { AppError } from "./errors/app.error.js";

export interface CsvContact {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

/** Normalize phone to E.164-ish format (basic US default) */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+${digits}`;
}

/** Parse a CSV buffer into contact records */
export function parseContactsCsv(buffer: Buffer): CsvContact[] {
  let records: Record<string, string>[];

  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];
  } catch {
    throw AppError.badRequest("Invalid CSV file format", "CSV_PARSE_ERROR");
  }

  if (records.length === 0) {
    throw AppError.badRequest("CSV file contains no data rows", "CSV_EMPTY");
  }

  const contacts: CsvContact[] = [];

  for (const row of records) {
    const name =
      row.name ?? row.Name ?? row.full_name ?? row["Full Name"] ?? row.contact ?? "";
    const phone = row.phone ?? row.Phone ?? row.phone_number ?? row["Phone Number"] ?? "";
    const email = row.email ?? row.Email ?? undefined;
    const notes = row.notes ?? row.Notes ?? undefined;

    if (!phone.trim()) continue;

    contacts.push({
      name: name.trim() || "Unknown",
      phone: normalizePhone(phone.trim()),
      email: email?.trim(),
      notes: notes?.trim(),
    });
  }

  if (contacts.length === 0) {
    throw AppError.badRequest(
      "No valid contacts found. CSV must include a phone column.",
      "CSV_NO_CONTACTS"
    );
  }

  return contacts;
}
