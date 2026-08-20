import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

function parseTags(value: string | null) {
  if (!value) return [] as string[];
  try { return JSON.parse(value) as string[]; } catch { return value.split(",").map(item => item.trim()).filter(Boolean); }
}

export default function Room() {
  const [, params] = useRoute("/room/:slug");
  const { data, isLoading } = trpc.rooms.bySlug.useQuery({ slug: params?.slug || "" }, { enabled: Boolean(params?.slug) });
  if (isLoading) return <main className="rr-subpage"><div className="rr-empty">Loading room…</div></main>;
  if (!data) return <main className="rr-subpage"><div className="rr-empty"><h1>Room not found</h1><Link href="/rooms">Back to Rooms</Link></div></main>;
  const { room, photos } = data;
  const roomTags = parseTags(room.tags);
  return <main className="rr-room-detail">
    <div className="rr-room-hero"><div className="rr-room-cover"><img src={room.coverUrl || "https://img.recroom.network/DefaultRoomImage.jpg?width=1920"} alt={`${room.title} cover`} /></div>
      <section className="rr-room-copy"><h1>^{room.title}</h1><Link href={room.creatorUsername ? `/user/${room.creatorUsername}` : "/profiles"} className="rr-room-creator">@{room.creatorUsername || "Community creator"}</Link><p>{room.description}</p><div className="rr-room-actions"><button className="rr-primary-action">Play</button><button className="rr-secondary-action">Meetup</button></div><p className="rr-room-cheers">♥ {room.cheerCount.toLocaleString()}</p>{roomTags.length > 0 && <div className="rr-tag-row">{roomTags.map(tag => <span key={tag}>#{tag}</span>)}</div>}</section>
    </div>
    <div className="rr-room-stats"><div><strong>Room Visits</strong><span>{room.visitCount.toLocaleString()}</span></div><div><strong>Published</strong><span>{room.publishedAt ? new Date(room.publishedAt).toLocaleDateString() : "—"}</span></div><div><strong>Capacity</strong><span>{room.capacity || "—"}</span></div><div><strong>Platforms</strong><span>{room.platforms || "VR"}</span></div></div>
    <div className="rr-room-tabs"><span>▣ PHOTOS</span><span>▣ EVENTS</span></div>
    <section className="rr-room-photo-panel"><h2>Photos In This Room</h2>{photos.length ? <div className="rr-card-grid">{photos.map(photo => <article key={photo.id} className="rr-card"><img src={photo.imageUrl} alt={photo.caption || room.title} /><div className="rr-card-body"><p>{photo.caption || room.title}</p></div></article>)}</div> : <div className="rr-room-photo-placeholder">No additional public room photos were captured for this room.</div>}</section>
    <Link href="/rooms" className="rr-back-link">‹ Back to Rooms</Link>
  </main>;
}
