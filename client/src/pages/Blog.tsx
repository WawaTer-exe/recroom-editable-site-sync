import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Blog() {
  const { data = [], isLoading } = trpc.blog.useQuery();
  return <main className="rr-subpage"><div className="rr-subpage-head"><div><h1>News & Events</h1><p>Updates, creator stories, and community announcements.</p></div><Link href="/rooms" className="rr-section-nav">Rooms ›</Link></div>{isLoading ? <div className="rr-empty">Loading stories…</div> : data.length ? <div className="rr-blog-grid">{data.map(post => <article key={post.id} className="rr-blog-card">{post.coverUrl ? <img src={post.coverUrl} alt="" /> : <div className="media-placeholder" />}<div className="rr-blog-card-body"><span className="tag">{post.category}</span><h2>{post.title}</h2><p>By {post.author} · {post.publishDate ? new Date(post.publishDate).toLocaleDateString() : "Draft"}</p><p>{post.body}</p></div></article>)}</div> : <div className="rr-empty">No published stories yet.</div>}</main>;
}
