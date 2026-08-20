import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Profile() {
  const { username = "" } = useParams<{ username: string }>();
  const { data, isLoading, error } = trpc.profiles.byUsername.useQuery({ username: decodeURIComponent(username) });
  const rooms = trpc.rooms.list.useQuery();
  const [tab, setTab] = useState<"about" | "photos" | "rooms">("about");
  if (isLoading) return <main className="rr-subpage"><div className="rr-empty">Loading profile…</div></main>;
  if (error || !data) return <main className="rr-subpage"><div className="rr-empty">Profile not found. <Link href="/profiles">Back to profiles ›</Link></div></main>;
  const { profile, photos } = data;
  return <main className="rr-subpage"><Link href="/profiles" className="rr-section-nav">‹ All profiles</Link><section className="profile-hero"><img className="profile-avatar" src={profile.avatarUrl || "https://img.recroom.network/DefaultProfileImage?cropSquare=true&width=192&height=192"} alt="" /><div><div className="eyebrow">PUBLIC PROFILE</div><h1 className="text-3xl font-black">{profile.displayName}</h1><p className="text-[#ff6a36]">@{profile.username}</p><p className="mt-2 text-xs text-[#aaa]">{profile.subscriberCount} subscribers {profile.joinedAt ? `· Joined ${new Date(profile.joinedAt).toLocaleDateString()}` : ""}</p></div></section><div className="mt-4 flex gap-2" role="tablist">{([["about", "About"], ["photos", "Photo feed"], ["rooms", "Room showcase"]] as const).map(([value, label]) => <button key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`rr-section-nav ${tab === value ? "bg-[#a95356] text-white" : ""}`}>{label}</button>)}</div><section className="mt-4">{tab === "about" && <div className="rr-card p-4"><h2 className="font-black">About</h2><p className="mt-3 text-sm text-[#aaa]">{profile.bio || "No bio has been added yet."}</p></div>}{tab === "photos" && <div className="rr-card-grid">{photos.length ? photos.map(photo => <article key={photo.id} className="rr-card"><img src={photo.imageUrl} alt={photo.caption || "Profile photo"} /><div className="rr-card-body"><p>{photo.caption}</p></div></article>) : <div className="rr-empty">No profile photos have been added.</div>}</div>}{tab === "rooms" && <div className="rr-card-grid">{rooms.data?.slice(0, 6).map(room => <Link href={`/room/${room.slug}`} key={room.id} className="rr-card"><img src={room.coverUrl || "https://img.recroom.network/e1e4f8355c6a418b810afa28757e3646?width=512"} alt="" /><div className="rr-card-body"><h2>^{room.title}</h2><p>@{room.creatorUsername || "Community creator"} · {room.visitCount.toLocaleString()} visits</p></div></Link>)}</div>}</section></main>;
}
