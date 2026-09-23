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

    // Standardize column key mappings
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

      return {
        companyName: findVal(["companyName", "company", "businessName", "name", "organization"]) || "",
        contactName: findVal(["contactName", "contact", "decisionMaker", "person", "fullName"]),
        role: findVal(["role", "jobTitle", "title", "designation", "position"]),
        email: findVal(["email", "mail", "contactEmail", "primaryEmail"]),
        phone: findVal(["phone", "mobile", "tel", "phoneNumber", "contactNumber", "whatsapp"]),
        website: findVal(["website", "domain", "url", "web", "site"]),
        location: findVal(["location", "address", "area", "region"]),
        city: findVal(["city", "emirate"]),
        country: findVal(["country"]) || "UAE",
        industry: findVal(["industry", "category", "niche", "sector", "vertical"]),
        description: findVal(["description", "about", "notes", "services", "overview"]),
        source: "CSV_IMPORT",
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
