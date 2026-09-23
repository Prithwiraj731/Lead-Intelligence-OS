import dns from "dns/promises";
import { DomainHealthReport, DomainDnsRecordCheck } from "@leadintel/types";

/**
 * Helper to resolve TXT with a hard timeout to prevent slow DNS hangs on local/unresolvable domains.
 */
async function resolveTxtWithTimeout(hostname: string, timeoutMs: number = 800): Promise<string[][]> {
  const timeoutPromise = new Promise<string[][]>((_, reject) =>
    setTimeout(() => reject(new Error("DNS_TIMEOUT")), timeoutMs)
  );

  return Promise.race([dns.resolveTxt(hostname), timeoutPromise]);
}

export async function checkDomainHealth(
  domain: string,
  options?: { isProviderManaged?: boolean }
): Promise<DomainHealthReport> {
  const cleanDomain = domain.replace(/^https?:\/\//i, "").split("/")[0].trim().toLowerCase();
  const isGmailDomain = cleanDomain === "gmail.com" || cleanDomain === "googlemail.com";
  const isProviderManaged = Boolean(options?.isProviderManaged || isGmailDomain);

  // If sender domain is managed by Gmail / Google Workspace OAuth provider
  if (isProviderManaged && isGmailDomain) {
    const records: DomainDnsRecordCheck[] = [
      {
        recordType: "SPF",
        name: cleanDomain,
        expectedPattern: "v=spf1 include:_spf.google.com ~all (Google Infrastructure)",
        foundValue: "v=spf1 include:_spf.google.com ~all",
        status: "PROVIDER_MANAGED",
        notes: "SPF for @gmail.com is automatically managed and authorized by Google mail server infrastructure.",
      },
      {
        recordType: "DKIM",
        name: `*._domainkey.${cleanDomain}`,
        expectedPattern: "v=DKIM1; k=rsa; p=... (Google Infrastructure)",
        foundValue: "Google Mail Server DKIM Key",
        status: "PROVIDER_MANAGED",
        notes: "DKIM cryptographic signatures are automatically signed at dispatch time by Gmail API.",
      },
      {
        recordType: "DMARC",
        name: `_dmarc.${cleanDomain}`,
        expectedPattern: "v=DMARC1; p=none/quarantine/reject; (Google Infrastructure)",
        foundValue: "v=DMARC1; p=none; sp=quarantine; rua=mailto:mailauth-reports@google.com",
        status: "PROVIDER_MANAGED",
        notes: "DMARC policy is actively managed domain-wide by Google on _dmarc.gmail.com.",
      },
    ];

    return {
      domain: cleanDomain,
      isHealthy: true,
      hasSpf: true,
      hasDkim: true,
      hasDmarc: true,
      isProviderManaged: true,
      records,
      checkedAt: new Date().toISOString(),
    };
  }

  const records: DomainDnsRecordCheck[] = [];
  let hasSpf = false;
  let hasDkim = false;
  let hasDmarc = false;

  // 1. Check SPF Record (TXT at root domain)
  try {
    const txtRecords = await resolveTxtWithTimeout(cleanDomain);
    const flattened = txtRecords.map((chunk) => chunk.join(""));
    const spfRecord = flattened.find((r) => r.startsWith("v=spf1"));

    if (spfRecord) {
      hasSpf = true;
      records.push({
        recordType: "SPF",
        name: cleanDomain,
        expectedPattern: "v=spf1 include:... ~all",
        foundValue: spfRecord,
        status: "VERIFIED",
        notes: "Valid SPF TXT record discovered on root domain.",
      });
    } else {
      records.push({
        recordType: "SPF",
        name: cleanDomain,
        expectedPattern: "v=spf1 include:_spf.yourprovider.com ~all",
        status: "MISSING",
        notes: "No TXT record starting with 'v=spf1' found for this domain.",
      });
    }
  } catch (err: any) {
    records.push({
      recordType: "SPF",
      name: cleanDomain,
      expectedPattern: "v=spf1 ...",
      status: "UNVERIFIED",
      notes: `DNS query failed: ${err.code || err.message || "Domain unresolvable"}`,
    });
  }

  // 2. Check DMARC Record (TXT at _dmarc.domain)
  try {
    const dmarcHost = `_dmarc.${cleanDomain}`;
    const dmarcTxt = await resolveTxtWithTimeout(dmarcHost);
    const flattened = dmarcTxt.map((chunk) => chunk.join(""));
    const dmarcRecord = flattened.find((r) => r.startsWith("v=DMARC1"));

    if (dmarcRecord) {
      hasDmarc = true;
      records.push({
        recordType: "DMARC",
        name: dmarcHost,
        expectedPattern: "v=DMARC1; p=none/quarantine/reject; ...",
        foundValue: dmarcRecord,
        status: "VERIFIED",
        notes: "Valid DMARC policy discovered.",
      });
    } else {
      records.push({
        recordType: "DMARC",
        name: dmarcHost,
        expectedPattern: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com",
        status: "MISSING",
        notes: "No TXT record found at _dmarc host.",
      });
    }
  } catch (err: any) {
    records.push({
      recordType: "DMARC",
      name: `_dmarc.${cleanDomain}`,
      expectedPattern: "v=DMARC1; ...",
      status: "UNVERIFIED",
      notes: `DNS query failed: ${err.code || err.message || "DMARC unresolvable"}`,
    });
  }

  // 3. Check DKIM Record (Parallel selector checks)
  const dkimSelectors = ["resend", "default", "s1", "google", "k1"];
  let dkimFound = false;

  const dkimResults = await Promise.allSettled(
    dkimSelectors.map(async (selector) => {
      const dkimHost = `${selector}._domainkey.${cleanDomain}`;
      const dkimTxt = await resolveTxtWithTimeout(dkimHost);
      const flattened = dkimTxt.map((chunk) => chunk.join(""));
      const dkimRecord = flattened.find((r) => r.includes("v=DKIM1") || r.includes("p="));
      return { selector, dkimHost, dkimRecord };
    })
  );

  for (const res of dkimResults) {
    if (res.status === "fulfilled" && res.value.dkimRecord) {
      dkimFound = true;
      hasDkim = true;
      records.push({
        recordType: "DKIM",
        name: res.value.dkimHost,
        expectedPattern: "v=DKIM1; k=rsa; p=...",
        foundValue: res.value.dkimRecord,
        status: "VERIFIED",
        notes: `Valid DKIM signature found for selector '${res.value.selector}'.`,
      });
      break;
    }
  }

  if (!dkimFound) {
    records.push({
      recordType: "DKIM",
      name: `resend._domainkey.${cleanDomain}`,
      expectedPattern: "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3...",
      status: "MISSING",
      notes: "No DKIM TXT record found under standard selectors (resend, default, s1, google, k1).",
    });
  }

  const isHealthy = hasSpf && hasDmarc && hasDkim;

  return {
    domain: cleanDomain,
    isHealthy,
    hasSpf,
    hasDkim,
    hasDmarc,
    records,
    checkedAt: new Date().toISOString(),
  };
}
