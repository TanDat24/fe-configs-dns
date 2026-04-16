"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  ChildDnsRow,
  DnsRecord,
  DnsTemplate,
  DomainConfig,
  DomainJsonField,
  EmailForwardRow,
} from "@/lib/domain-types";

const TEAL_TITLE = "text-teal-600";
const SIDEBAR_ITEMS = [
  "Cấu hình bản ghi tên miền",
  "Thay đổi DNS",
  "Tạo DNS con phụ",
  "Email chuyển tiếp",
] as const;

const DEFAULT_NAME_SERVERS = ["nsbak.pavietnam.net", "ns1.pavietnam.vn", "ns2.pavietnam.vn"];
const DEFAULT_RECORD: DnsRecord = { host: "", type: "A", value: "", ttl: "300", priority: "" };
const DEFAULT_CHILD: ChildDnsRow = { name: "", ipv4: "", ipv6: "" };
const DEFAULT_FORWARD: EmailForwardRow = { source: "", target: "" };

const SAMPLE_CSV_RECORDS: DnsRecord[] = [
  { host: "@", type: "A", value: "103.57.221.79", ttl: "300", priority: "" },
  { host: "www", type: "CNAME", value: "@", ttl: "300", priority: "" },
  { host: "mail", type: "A", value: "103.57.221.80", ttl: "300", priority: "" },
  { host: "@", type: "MX", value: "mail.example.com", ttl: "300", priority: "10" },
  { host: "@", type: "TXT", value: "v=spf1 include:_spf.google.com ~all", ttl: "300", priority: "" },
  { host: "_dmarc", type: "TXT", value: "v=DMARC1; p=none; rua=mailto:admin@example.com", ttl: "300", priority: "" },
  { host: "ns1", type: "NS", value: "ns1.pavietnam.vn", ttl: "86400", priority: "" },
  { host: "_sip._tcp", type: "SRV", value: "sipserver.example.com", ttl: "300", priority: "10" },
  { host: "@", type: "CAA", value: "0 issue \"letsencrypt.org\"", ttl: "300", priority: "" },
];

const inputCellClass = "w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900";

type SaveFn = (field: DomainJsonField, payload: unknown) => Promise<void>;

type DnsTabPanelProps = {
  data: DomainConfig | null;
  templates: DnsTemplate[];
  onSaveTab: SaveFn;
  savingField: DomainJsonField | null;
};

function initRecords(data: DomainConfig | null): DnsRecord[] {
  return data?.dns_records_json?.length ? data.dns_records_json : [{ ...DEFAULT_RECORD }];
}
function initNameServers(data: DomainConfig | null): string[] {
  return data?.name_servers_json?.length ? data.name_servers_json : [""];
}
function initChildren(data: DomainConfig | null): ChildDnsRow[] {
  return data?.child_dns_json?.length ? data.child_dns_json : [{ ...DEFAULT_CHILD }];
}
function initForwards(data: DomainConfig | null): EmailForwardRow[] {
  return data?.email_forwards_json?.length ? data.email_forwards_json : [{ ...DEFAULT_FORWARD }];
}

function toCsv(rows: DnsRecord[]): string {
  const BOM = "\uFEFF";
  const header = "host,type,value,ttl,priority";
  const escaped = rows.map((r) =>
    [r.host, r.type, r.value, r.ttl, r.priority]
      .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
      .join(","),
  );
  return BOM + [header, ...escaped].join("\n");
}

function parseCsv(content: string): DnsRecord[] {
  const stripped = content.replace(/^\uFEFF/, "");
  const lines = stripped.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [];
  return lines.slice(1).map((line) => {
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          cols.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
    }
    cols.push(current);
    return {
      host: cols[0] ?? "",
      type: cols[1] ?? "A",
      value: cols[2] ?? "",
      ttl: cols[3] ?? "300",
      priority: cols[4] ?? "",
    };
  });
}

export function DnsTabPanel({ data, templates, onSaveTab, savingField }: DnsTabPanelProps) {
  const [activeSidebar, setActiveSidebar] = useState(0);
  const [records, setRecords] = useState<DnsRecord[]>(() => initRecords(data));
  const [nameServers, setNameServers] = useState<string[]>(() => initNameServers(data));
  const [children, setChildren] = useState<ChildDnsRow[]>(() => initChildren(data));
  const [forwards, setForwards] = useState<EmailForwardRow[]>(() => initForwards(data));
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [templateId, setTemplateId] = useState<number>(templates[0]?.id ?? 0);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter((r) => `${r.host} ${r.type} ${r.value} ${r.ttl} ${r.priority}`.toLowerCase().includes(q));
  }, [records, search]);

  const triggerDownload = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;

  function showNotice(type: "ok" | "error", text: string) {
    setNotice({ type, text });
    if (type === "ok") setTimeout(() => setNotice(null), 4000);
  }

  return (
    <div className="flex min-h-[min(70vh,560px)] flex-col bg-white lg:flex-row">
      <aside className="shrink-0 border-b border-zinc-200 lg:w-60 lg:border-b-0">
        <nav className="flex flex-col gap-0.5 p-3 lg:p-4" aria-label="Menu DNS">
          {SIDEBAR_ITEMS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => { setActiveSidebar(index); setNotice(null); }}
              className={cn("rounded-md px-3 py-2.5 text-left text-sm text-zinc-800 transition-colors", activeSidebar === index ? "bg-zinc-100 font-medium" : "hover:bg-zinc-50")}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 px-0 lg:pl-5">
        {notice ? (
          <div className={cn(
            "mx-2 mt-3 rounded-md border px-3 py-2 text-sm",
            notice.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800",
          )}>
            {notice.text}
          </div>
        ) : null}

        {activeSidebar === 0 ? (
          <div className="space-y-4 py-5 pr-0 lg:pr-2">
            <h2 className={`text-lg font-semibold ${TEAL_TITLE}`}>Cấu hình bản ghi tên miền</h2>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(Number(e.target.value))}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              >
                <option value={0}>Chọn mẫu DNS</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
                ))}
              </select>
              <button type="button" className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" onClick={() => {
                if (!selectedTemplate) {
                  showNotice("error", "Chưa chọn mẫu DNS. Vui lòng chọn mẫu từ danh sách.");
                  return;
                }
                setRecords(selectedTemplate.records.length ? selectedTemplate.records : [{ ...DEFAULT_RECORD }]);
                showNotice("ok", `Đã áp dụng mẫu: ${selectedTemplate.title}`);
              }}>Bản ghi mẫu</button>
              <button type="button" className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" onClick={() => {
                triggerDownload(`dns-records-${data?.domain ?? "domain"}.csv`, toCsv(records));
                showNotice("ok", `Đã xuất ${records.length} bản ghi ra tệp CSV.`);
              }}>Xuất tệp CSV</button>
              <button type="button" className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" onClick={() => csvInputRef.current?.click()}>Nhập tệp CSV</button>
              <button type="button" className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" onClick={() => {
                triggerDownload("dns-records-mau.csv", toCsv(SAMPLE_CSV_RECORDS));
                showNotice("ok", "Đã tải tệp CSV mẫu với 9 bản ghi ví dụ.");
              }}>Tải CSV mẫu</button>
              <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const parsed = parseCsv(text);
                if (!parsed.length) {
                  showNotice("error", "Tệp CSV trống hoặc sai định dạng. Vui lòng kiểm tra lại.");
                } else {
                  setRecords(parsed);
                  showNotice("ok", `Đã nhập ${parsed.length} bản ghi từ tệp CSV.`);
                }
                e.target.value = "";
              }} />
            </div>

            <div className="relative">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nhập từ khoá tìm kiếm (host, loại, giá trị...)" className="w-full rounded-md border border-zinc-300 bg-white py-2.5 px-3 text-sm" />
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead><tr className="bg-[#dbe8e0]"><th className="border-b border-zinc-200 px-3 py-2.5 text-left">STT</th><th className="border-b border-zinc-200 px-3 py-2.5 text-left">Host</th><th className="border-b border-zinc-200 px-3 py-2.5 text-left">Loại</th><th className="border-b border-zinc-200 px-3 py-2.5 text-left">Giá trị</th><th className="border-b border-zinc-200 px-3 py-2.5 text-left">TTL</th><th className="border-b border-zinc-200 px-3 py-2.5 text-left">Ưu tiên</th><th className="border-b border-zinc-200 px-3 py-2.5 text-left">Thao tác</th></tr></thead>
                <tbody>
                  {filteredRecords.map((row, index) => (
                    <tr key={`${index}-${row.host}-${row.type}`}>
                      <td className="border-b border-zinc-200 px-3 py-2">{index + 1}</td>
                      <td className="border-b border-zinc-200 px-2 py-2"><input className={inputCellClass} value={row.host} onChange={(e) => {
                        const srcIndex = records.indexOf(row); if (srcIndex < 0) return;
                        const next = [...records]; next[srcIndex] = { ...next[srcIndex], host: e.target.value }; setRecords(next);
                      }} /></td>
                      <td className="border-b border-zinc-200 px-2 py-2"><select className={inputCellClass} value={row.type} onChange={(e) => {
                        const srcIndex = records.indexOf(row); if (srcIndex < 0) return;
                        const next = [...records]; next[srcIndex] = { ...next[srcIndex], type: e.target.value }; setRecords(next);
                      }}><option value="A">A</option><option value="AAAA">AAAA</option><option value="CNAME">CNAME</option><option value="MX">MX</option><option value="TXT">TXT</option><option value="NS">NS</option><option value="SRV">SRV</option><option value="CAA">CAA</option></select></td>
                      <td className="border-b border-zinc-200 px-2 py-2"><input className={inputCellClass} value={row.value} onChange={(e) => {
                        const srcIndex = records.indexOf(row); if (srcIndex < 0) return;
                        const next = [...records]; next[srcIndex] = { ...next[srcIndex], value: e.target.value }; setRecords(next);
                      }} /></td>
                      <td className="border-b border-zinc-200 px-2 py-2"><input className={inputCellClass} value={row.ttl} onChange={(e) => {
                        const srcIndex = records.indexOf(row); if (srcIndex < 0) return;
                        const next = [...records]; next[srcIndex] = { ...next[srcIndex], ttl: e.target.value }; setRecords(next);
                      }} /></td>
                      <td className="border-b border-zinc-200 px-2 py-2"><input className={inputCellClass} value={row.priority} onChange={(e) => {
                        const srcIndex = records.indexOf(row); if (srcIndex < 0) return;
                        const next = [...records]; next[srcIndex] = { ...next[srcIndex], priority: e.target.value }; setRecords(next);
                      }} /></td>
                      <td className="border-b border-zinc-200 px-2 py-2"><button type="button" className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50" onClick={() => setRecords((prev) => prev.filter((r) => r !== row))}>Xoá</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" onClick={() => setRecords((prev) => [...prev, { ...DEFAULT_RECORD }])}>Thêm bản ghi</button>
              <button type="button" disabled={savingField === "dns_records_json"} onClick={async () => {
                const errors: string[] = [];
                records.forEach((r, i) => {
                  if (!r.host.trim() && !r.value.trim()) return;
                  if (r.type === "A" && r.value && !/^\d{1,3}(\.\d{1,3}){3}$/.test(r.value.trim())) errors.push(`Bản ghi ${i + 1}: Giá trị A phải là IPv4 hợp lệ (VD: 103.57.221.79)`);
                  if (r.type === "AAAA" && r.value && !/^[0-9a-fA-F:]+$/.test(r.value.trim())) errors.push(`Bản ghi ${i + 1}: Giá trị AAAA phải là IPv6 hợp lệ`);
                  if (r.type === "MX" && r.priority && !/^\d+$/.test(r.priority.trim())) errors.push(`Bản ghi ${i + 1}: Ưu tiên MX phải là số nguyên`);
                  if (r.type === "SRV" && r.priority && !/^\d+$/.test(r.priority.trim())) errors.push(`Bản ghi ${i + 1}: Ưu tiên SRV phải là số nguyên`);
                  const ttlNum = Number(r.ttl);
                  if (r.ttl && (!Number.isFinite(ttlNum) || ttlNum < 60)) errors.push(`Bản ghi ${i + 1}: TTL tối thiểu 60 giây`);
                });
                if (errors.length) { showNotice("error", errors[0]); return; }
                try { await onSaveTab("dns_records_json", records); showNotice("ok", "Đã lưu cấu hình bản ghi DNS."); } catch (err) { showNotice("error", err instanceof Error ? err.message : "Không lưu được bản ghi DNS."); }
              }} className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{savingField === "dns_records_json" ? "Đang lưu..." : "Lưu cấu hình"}</button>
            </div>
          </div>
        ) : null}

        {activeSidebar === 1 ? (
          <div className="space-y-4 py-5 pr-0 lg:pr-2">
            <h2 className={`text-lg font-semibold ${TEAL_TITLE}`}>Thay đổi DNS</h2>
            <p className="text-sm text-zinc-600">Quản lý danh sách name server cho tên miền. Thay đổi có thể mất 24-48 giờ để có hiệu lực toàn cầu.</p>
            <div className="space-y-2">
              {nameServers.map((ns, i) => (
                <div key={`${i}-${ns}`} className="flex gap-2">
                  <input className={inputCellClass} placeholder={`Name server ${i + 1}`} value={ns} onChange={(e) => { const next = [...nameServers]; next[i] = e.target.value; setNameServers(next); }} />
                  <button type="button" className="rounded-md border border-zinc-300 px-3 text-sm text-red-600 hover:bg-red-50" onClick={() => setNameServers((prev) => prev.filter((_, idx) => idx !== i))}>Xoá</button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" onClick={() => setNameServers((p) => [...p, ""])}>Thêm</button>
              <button type="button" className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" onClick={() => { setNameServers([...DEFAULT_NAME_SERVERS]); showNotice("ok", "Đã áp dụng name server mặc định."); }}>Sử dụng name server mặc định</button>
              <button type="button" disabled={savingField === "name_servers_json"} onClick={async () => { try { await onSaveTab("name_servers_json", nameServers.filter(Boolean)); showNotice("ok", "Đã lưu danh sách name server."); } catch (err) { showNotice("error", err instanceof Error ? err.message : "Không lưu được name server."); } }} className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{savingField === "name_servers_json" ? "Đang lưu..." : "Lưu cấu hình"}</button>
            </div>
          </div>
        ) : null}

        {activeSidebar === 2 ? (
          <div className="space-y-4 py-5 pr-0 lg:pr-2">
            <h2 className={`text-lg font-semibold ${TEAL_TITLE}`}>Tạo DNS con phụ</h2>
            <p className="text-sm text-zinc-600">Tạo name server con phụ (Glue Record) cho tên miền.</p>
            {children.map((row, i) => (
              <div key={i} className="grid gap-2 rounded-md border border-zinc-200 p-3 sm:grid-cols-3">
                <input className={inputCellClass} placeholder="Tên name server" value={row.name} onChange={(e) => { const next = [...children]; next[i] = { ...next[i], name: e.target.value }; setChildren(next); }} />
                <input className={inputCellClass} placeholder="Địa chỉ IPv4" value={row.ipv4} onChange={(e) => { const next = [...children]; next[i] = { ...next[i], ipv4: e.target.value }; setChildren(next); }} />
                <div className="flex gap-2"><input className={inputCellClass} placeholder="Địa chỉ IPv6 (tuỳ chọn)" value={row.ipv6} onChange={(e) => { const next = [...children]; next[i] = { ...next[i], ipv6: e.target.value }; setChildren(next); }} /><button type="button" className="rounded-md border border-zinc-300 px-3 text-sm text-red-600 hover:bg-red-50" onClick={() => setChildren((prev) => prev.filter((_, idx) => idx !== i))}>Xoá</button></div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" onClick={() => setChildren((p) => [...p, { ...DEFAULT_CHILD }])}>Thêm</button>
              <button type="button" disabled={savingField === "child_dns_json"} onClick={async () => { try { await onSaveTab("child_dns_json", children); showNotice("ok", "Đã lưu cấu hình DNS con phụ."); } catch (err) { showNotice("error", err instanceof Error ? err.message : "Không lưu được DNS con phụ."); } }} className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{savingField === "child_dns_json" ? "Đang lưu..." : "Lưu cấu hình"}</button>
            </div>
          </div>
        ) : null}

        {activeSidebar === 3 ? (
          <div className="space-y-4 py-5 pr-0 lg:pr-2">
            <h2 className="text-lg font-semibold text-sky-600">Email chuyển tiếp</h2>
            <p className="text-sm text-zinc-600">Chuyển tiếp email từ tên miền của bạn đến địa chỉ email khác. Tối đa 10 email chuyển tiếp.</p>
            {forwards.map((row, i) => (
              <div key={i} className="grid gap-2 rounded-md border border-zinc-200 p-3 sm:grid-cols-2">
                <input className={inputCellClass} placeholder="Email nguồn (VD: info)" value={row.source} onChange={(e) => { const next = [...forwards]; next[i] = { ...next[i], source: e.target.value }; setForwards(next); }} />
                <div className="flex gap-2"><input className={inputCellClass} placeholder="Email đích (VD: admin@gmail.com)" value={row.target} onChange={(e) => { const next = [...forwards]; next[i] = { ...next[i], target: e.target.value }; setForwards(next); }} /><button type="button" className="rounded-md border border-zinc-300 px-3 text-sm text-red-600 hover:bg-red-50" onClick={() => setForwards((prev) => prev.filter((_, idx) => idx !== i))}>Xoá</button></div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={forwards.length >= 10} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-60" onClick={() => setForwards((p) => [...p, { ...DEFAULT_FORWARD }])}>Thêm</button>
              <button type="button" disabled={savingField === "email_forwards_json"} onClick={async () => { try { const normalized = forwards.map((f) => ({ source: f.source.trim(), target: f.target.trim() })).filter((f) => f.source || f.target); await onSaveTab("email_forwards_json", normalized); showNotice("ok", "Đã lưu cấu hình email chuyển tiếp."); } catch (err) { showNotice("error", err instanceof Error ? err.message : "Không lưu được email chuyển tiếp."); } }} className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{savingField === "email_forwards_json" ? "Đang lưu..." : "Lưu cấu hình"}</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
