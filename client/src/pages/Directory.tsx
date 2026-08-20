import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Directory() { const { data = [], isLoading } = trpc.directory.useQuery(); return <main className="rr-subpage"><div className="rr-subpage-head"><div><h1>Creator Hub</h1><p>Explore the people, rooms, and stories in this community archive.</p></div><Link href="/profiles" className="rr-section-nav">Profiles ›</Link></div>{isLoading ? <div className="rr-empty">Loading directory…</div> : <div className="rr-directory-list">{data.map(section => <Link key={section.id} href={section.href || "/"} className="rr-directory-card"><div><h2>{section.title}</h2><p>{section.description}</p></div><strong className="text-[#ff6a36]">›</strong></Link>)}</div>}</main>; }
