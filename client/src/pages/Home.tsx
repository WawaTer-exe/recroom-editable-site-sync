import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const showcase = [
  { title: "View Creator Hub", href: "/directory", image: "https://cdn.recroom.network/static/home/showcase/CreatorStats.jpg" },
  { title: "Download For Free", href: "/rooms", image: "https://cdn.recroom.network/static/home/showcase/RecRoom_Keyart_AllPlatforms.jpg" },
  { title: "Rec Room's Class of '87 Reunion", href: "/blog", image: "https://cdn.recroom.network/wwwcontent/assets/Thumbnail_ffd62263a0.jpg" },
];
const referenceRooms = [
  { title: "CreativeCampus", creator: "EyesDraws", image: "https://img.recroom.network/e1e4f8355c6a418b810afa28757e3646?width=512", slug: "CreativeCampus" },
  { title: "CreativeClub", creator: "EyesDraws", image: "https://img.recroom.network/6770kb9p9pvs8cvcyfi56uumz?width=512", slug: "CreativeClub" },
];

export default function Home() {
  const { data: rooms } = trpc.rooms.list.useQuery();
  const { data: settings } = trpc.settings.public.useQuery();
  const { data: activity = [], isLoading } = trpc.activity.useQuery({ limit: 84 });
  const roomList = rooms ?? [];
  let featuredSlugs: string[] = [];
  try { featuredSlugs = settings?.featuredRoomSlugs ? JSON.parse(settings.featuredRoomSlugs) as string[] : []; } catch { featuredSlugs = []; }
  const orderedRooms = featuredSlugs.length ? featuredSlugs.map(slug => roomList.find(room => room.slug === slug)).filter((room): room is (typeof roomList)[number] => Boolean(room)) : roomList;
  const roomCards = orderedRooms.length ? orderedRooms.slice(0, 6).map((room) => ({ title: room.title, creator: room.creatorUsername || "Community creator", image: room.coverUrl || referenceRooms[0].image, slug: room.slug, visits: room.visitCount })) : referenceRooms.map(room => ({ ...room, visits: 0 }));
  return <main className="rr-home">
    {settings?.announcementVisible !== false && <section className="rr-announcement"><div className="rr-studio-mark">87</div><p>{settings?.announcementLink ? <a href={settings.announcementLink}>{settings.announcementText}</a> : settings?.announcementText || "This website is a community tribute to Rec Room built by Studio 87."}</p><button aria-label="Close announcement">×</button></section>}
    <section className="rr-showcase" aria-label="Featured links">{showcase.map(item => <Link key={item.title} href={item.href} className="rr-showcase-card"><img src={item.image} alt="" /><span>{item.title} <b>›</b></span></Link>)}</section>
    <nav className="rr-section-nav" aria-label="Community sections"><Link href="/blog">▣ News</Link><Link href="/blog">▣ Events</Link><Link href="/rooms">⌂ Rooms</Link></nav>
    <section className="rr-feed-layout"><aside className="rr-featured"><h2>Featured Rooms</h2><div className="rr-room-list">{roomCards.map(room => <Link href={`/room/${room.slug}`} key={`${room.title}-${room.creator}`} className="rr-room-card"><img src={room.image} alt="" /><strong>^{room.title}</strong><span>@{room.creator}</span>{room.visits > 0 && <small>{room.visits.toLocaleString()} visits</small>}</Link>)}</div></aside><section className="rr-activity"><h1>Take A Look At What's Happening Right Now In Rec Room</h1>{isLoading ? <div className="rr-empty">Loading activity…</div> : activity.length ? activity.map(({ photo, profile }) => <article className="rr-photo-card" key={photo.id}><header><Link href={`/user/${encodeURIComponent(profile.username)}`} className="rr-photo-user"><img src={profile.avatarUrl || "https://img.recroom.network/DefaultProfileImage?cropSquare=true&width=40"} alt="" /><span><b>{profile.displayName}</b> @{profile.username}<small>^Community photo</small></span></Link><button aria-label="Share photo">↗</button></header><img className="rr-photo" src={photo.imageUrl} alt={photo.caption || "Rec Room photo"} /><footer><button>♡</button><span>0 cheers</span><span className="rr-login-note">Log in to view comments for this photo</span></footer></article>) : <div className="rr-empty">No public photo activity has been imported yet.</div>}</section></section>
  </main>;
}
