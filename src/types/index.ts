export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS";

export interface DnsRecord {
  id: string;
  name: string;
  type: DnsRecordType;
  value: string;
  ttl: number;
}
