import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const fallback = [
  { title: "CreativeCampus", creator: "EyesDraws", image: "https://img.recroom.network/e1e4f8355c6a418b810afa28757e3646?width=512" },
  { title: "CreativeClub", creator: "EyesDraws", image: "https://img.recroom.network/6770kb9p9pvs8cvcyfi56uumz?width=512" },
];

function tags(value: string | null) {
  if (!value) return [] as string[];
  try { return JSON.parse(value) as string[]; } catch { return value.split(",").map(item => item.trim()).filter(Boolean); }
}

export default function Rooms() {
  const { data = [], isLoading } = trpc.rooms.list.useQuery();
  const rooms = data.length ? data : fallback.map((room, index) => ({
    id: index, slug: room.title, title: room.title, creatorUsername: room.creator, coverUrl: room.image, description: "Featured room from the public community archive.",
    playerCount: 0, cheerCount: 0, visitCount: 0, publishedAt: null, capacity: 0, platforms: "VR", tags: null,
  }));
  return <main className="rr-subpage">
    <div className="rr-subpage-head"><div><h1>Rooms Hot List</h1><p>Real public rooms captured from the recroom.network rooms directory.</p></div><Link href="/directory" className="rr-section-nav">Creator Hub ›</Link></div>
    {isLoading ? <div className="rr-empty">Loading rooms…</div> : <div className="rr-card-grid">
      {rooms.map(room => {
        const roomTags = tags(room.tags);
        return <Link key={room.slug} href={`/room/${room.slug}`} className="rr-card">
          <img src={room.coverUrl || fallback[0].image} alt={`${room.title} cover`} />
          <div className="rr-card-body"><h2>^{room.title}</h2><p className="text-[#ff6a36]">@{room.creatorUsername || "Community creator"}</p>
            <p>{room.description || "Public room from the community archive."}</p>
            <p>{room.visitCount.toLocaleString()} visits · {room.cheerCount.toLocaleString()} cheers · capacity {room.capacity || "—"}</p>
            <p>{room.platforms || "VR"}{room.publishedAt ? ` · Published ${new Date(room.publishedAt).toLocaleDateString()}` : ""}</p>
            {roomTags.length > 0 && <div className="rr-tag-row">{roomTags.map(tag => <span key={tag}>#{tag}</span>)}</div>}
          </div>
        </Link>;
      })}
    </div>}
  </main>;
}
