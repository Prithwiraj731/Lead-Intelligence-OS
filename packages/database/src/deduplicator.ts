import { PrismaClient } from "@prisma/client";
import {
  LeadRowInput,
  LeadImportPreviewResult,
  LeadDeduplicationPreviewItem,
} from "@leadintel/types";
import { normalizeDomain, normalizePhone, normalizeCompanyName } from "./normalizer";

/**
 * Deduplication Engine for LEAD INTELLIGENCE OS.
 * Evaluates candidate leads against existing database records using:
 * 1. Normalized root domain
 * 2. Normalized international phone
 * 3. Normalized company name + city / location
 */
export async function previewLeadImport(
  prisma: PrismaClient,
  rows: LeadRowInput[]
): Promise<LeadImportPreviewResult> {
  const items: LeadDeduplicationPreviewItem[] = [];
  let validRows = 0;
  let invalidRows = 0;
  let newLeadsCount = 0;
  let duplicateLeadsCount = 0;

  // Track in-batch seen keys to catch internal duplicates within the uploaded file
  const seenBatchDomains = new Set<string>();
  const seenBatchPhones = new Set<string>();
  const seenBatchNameLocations = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const validationErrors: string[] = [];

    if (!raw.companyName || raw.companyName.trim().length === 0) {
      validationErrors.push("Company Name is required.");
    }

    const normDomain = normalizeDomain(raw.website);
    const normPhone = normalizePhone(raw.phone);
    const normName = normalizeCompanyName(raw.companyName);
    const city = raw.city?.trim() || raw.location?.trim() || "";

    const nameLocKey = `${normName}::${city.toLowerCase()}`;

    if (validationErrors.length > 0) {
      invalidRows++;
      items.push({
        rowNumber: i + 1,
        input: raw,
        isValid: false,
        validationErrors,
        isDuplicate: false,
      });
      continue;
    }

    validRows++;

    // 1. Check in-batch duplicates
    let isDuplicate = false;
    let duplicateReason: any = undefined;
    let existingCompanyName: string | undefined = undefined;
    let existingCompanyId: string | undefined = undefined;

    if (normDomain && seenBatchDomains.has(normDomain)) {
      isDuplicate = true;
      duplicateReason = "EXACT_DOMAIN";
      existingCompanyName = `Duplicate in current file (Domain: ${normDomain})`;
    } else if (normPhone && seenBatchPhones.has(normPhone)) {
      isDuplicate = true;
      duplicateReason = "NORMALIZED_PHONE";
      existingCompanyName = `Duplicate in current file (Phone: ${normPhone})`;
    } else if (normName && seenBatchNameLocations.has(nameLocKey)) {
      isDuplicate = true;
      duplicateReason = "NAME_AND_LOCATION";
      existingCompanyName = `Duplicate in current file (Name: ${raw.companyName})`;
    }

    // 2. If not duplicate in current batch, check database
    if (!isDuplicate) {
      // Check database by domain
      if (normDomain) {
        const match = await prisma.company.findFirst({
          where: { normalizedDomain: normDomain },
          select: { id: true, name: true },
        });
        if (match) {
          isDuplicate = true;
          duplicateReason = "EXACT_DOMAIN";
          existingCompanyId = match.id;
          existingCompanyName = match.name;
        }
      }

      // Check database by phone
      if (!isDuplicate && normPhone) {
        const match = await prisma.company.findFirst({
          where: { normalizedPhone: normPhone },
          select: { id: true, name: true },
        });
        if (match) {
          isDuplicate = true;
          duplicateReason = "NORMALIZED_PHONE";
          existingCompanyId = match.id;
          existingCompanyName = match.name;
        }
      }

      // Check database by normalized name and city
      if (!isDuplicate && normName.length > 2) {
        const match = await prisma.company.findFirst({
          where: {
            normalizedName: normName,
            ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
          },
          select: { id: true, name: true },
        });
        if (match) {
          isDuplicate = true;
          duplicateReason = "NAME_AND_LOCATION";
          existingCompanyId = match.id;
          existingCompanyName = match.name;
        }
      }
    }

    if (isDuplicate) {
      duplicateLeadsCount++;
    } else {
      newLeadsCount++;
      if (normDomain) seenBatchDomains.add(normDomain);
      if (normPhone) seenBatchPhones.add(normPhone);
      if (normName) seenBatchNameLocations.add(nameLocKey);
    }

    items.push({
      rowNumber: i + 1,
      input: raw,
      normalizedDomain: normDomain || undefined,
      normalizedPhone: normPhone || undefined,
      normalizedName: normName || undefined,
      isDuplicate,
      duplicateReason,
      existingCompanyId,
      existingCompanyName,
      isValid: true,
    });
  }

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    newLeadsCount,
    duplicateLeadsCount,
    items,
  };
}
