import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ManagedLoginDialog() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const utils = trpc.useUtils();
  const login = trpc.auth.managedLogin.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); setOpen(false); setPassword(""); toast.success("Signed in"); }, onError: error => toast.error(error.message) });
  return <>
    <button onClick={() => setOpen(true)}>Login</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="managed-login-title"><div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1b171d] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">COMMUNITY ACCOUNT</p><h2 id="managed-login-title" className="text-2xl font-black">Sign in</h2></div><button aria-label="Close login" onClick={() => setOpen(false)} className="text-white/50">×</button></div><p className="mt-2 text-sm text-white/55">Use an account created in the admin panel.</p><div className="mt-5 space-y-3"><Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" autoComplete="username" /><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" /></div><div className="mt-5 flex justify-end gap-3"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!username || !password || login.isPending} onClick={() => login.mutate({ username, password })} className="bg-[#ff9b62] text-[#251714]">{login.isPending ? "Signing in…" : "Sign in"}</Button></div></div></div>}
  </>;
}
