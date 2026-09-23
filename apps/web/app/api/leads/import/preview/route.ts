import { NextRequest, NextResponse } from "next/server";
import { prisma, previewLeadImport } from "@leadintel/database";
import { LeadRowInput } from "@leadintel/types";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let rawRows: any[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    } else {
      const body = await req.json();
      rawRows = body.rows || [];
    }

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "File contains no rows or invalid format" },
        { status: 400 }
      );
    }

    // Standardize column key mappings with smart multi-attribute recognition
    const normalizedRows: LeadRowInput[] = rawRows.map((row: Record<string, any>) => {
      const findVal = (keys: string[]) => {
        for (const k of keys) {
          const matchingKey = Object.keys(row).find(
            (rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, "")
          );
          if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== "") {
            return String(row[matchingKey]).trim();
          }
        }
        return null;
      };

      const companyName = findVal(["companyName", "company", "businessName", "name", "organization"]) || "";
      const location = findVal(["locationAddress", "location", "address", "area", "region", "fullAddress", "place"]);
      const shortDesc = findVal(["shortDescription", "description", "about", "overview"]);
      const outreachNotes = findVal(["outreachNotes", "notes", "remarks"]);
      const rating = findVal(["rating"]);
      const reviews = findVal(["noOfReviews", "reviews", "reviewCount"]);

      // Smart city detection
      let city = findVal(["city", "emirate", "town"]);
      if (!city && (location || shortDesc)) {
        const combinedText = `${location || ""} ${shortDesc || ""}`;
        const cityMatch = combinedText.match(/\b(Ludhiana|Jalandhar|Amritsar|Chandigarh|Patiala|Batala|Mohali|Bathinda|Hoshiarpur|Phagwara|Panchkula|Nangal|Dubai|Abu Dhabi|Sharjah|Ajman|Ras Al Khaimah|Fujairah)\b/i);
        if (cityMatch) {
          city = cityMatch[1];
        } else if (location) {
          const parts = location.split(",").map((p) => p.trim());
          if (parts.length >= 2) {
            city = parts[parts.length - 2].replace(/\d+/g, "").trim();
          }
        }
      }

      // Smart country detection
      let country = findVal(["country"]);
      if (!country) {
        const combinedLoc = `${location || ""} ${city || ""}`;
        if (/(punjab|chandigarh|india|\b\d{6}\b)/i.test(combinedLoc)) {
          country = "India";
        } else if (/(uae|dubai|abu dhabi|sharjah|emirates)/i.test(combinedLoc)) {
          country = "UAE";
        } else {
          country = "India";
        }
      }

      // Smart website extraction
      let website = findVal(["website", "domain", "url", "web", "site"]);
      if (!website) {
        const ws = findVal(["websiteStatus", "webStatus", "siteStatus", "status"]);
        if (ws) {
          const domainMatch = ws.match(/([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\.[a-zA-Z]{2,}|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s)]*)?)/);
          if (domainMatch && !/^(no\.|no$|none|n\/a|unclaimed)/i.test(domainMatch[1])) {
            website = domainMatch[1];
          }
        }
      }

      // Clean phone number
      let phone = findVal(["phone", "mobile", "tel", "phoneNumber", "contactNumber", "whatsapp"]);
      if (phone && /(not listed|none|n\/a|unknown)/i.test(phone)) {
        phone = null;
      }

      // Rich composite description
      const descParts: string[] = [];
      if (shortDesc) descParts.push(shortDesc);
      if (outreachNotes) descParts.push(`Notes: ${outreachNotes}`);
      if (rating) descParts.push(`Rating: ${rating}★${reviews ? ` (${reviews} reviews)` : ""}`);
      const description = descParts.join(" | ") || null;

      return {
        companyName,
        contactName: findVal(["contactName", "contact", "decisionMaker", "person", "fullName"]),
        role: findVal(["role", "jobTitle", "title", "designation", "position"]),
        email: findVal(["email", "mail", "contactEmail", "primaryEmail"]),
        phone,
        website: website || null,
        location: location || null,
        city: city || null,
        country,
        industry: findVal(["industry", "category", "niche", "sector", "vertical"]),
        description,
        source: "CSV_IMPORT" as const,
      };
    });

    const preview = await previewLeadImport(prisma, normalizedRows);

    return NextResponse.json({
      success: true,
      data: preview,
    });
  } catch (error: any) {
    console.error("Lead import preview error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process lead file preview" },
      { status: 500 }
    );
  }
}
