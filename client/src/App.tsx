import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Profiles from "./pages/Profiles";
import Profile from "./pages/Profile";
import Rooms from "./pages/Rooms";
import Room from "./pages/Room";
import Blog from "./pages/Blog";
import Directory from "./pages/Directory";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ManagedLoginDialog from "./components/ManagedLoginDialog";

function ReferenceHeader() {
  return <header className="rr-header"><Link href="/" className="rr-logo"><img src="https://recroom.network/logos/studio87/NEW%20Studio%2087%20icon.png" alt="Rec Room" /><span>REC<br />ROOM</span></Link><nav className="rr-header-links"><Link href="/rooms">Shop</Link><Link href="/directory">Creator Hub</Link></nav><div className="rr-header-actions"><button aria-label="Search">⌕</button><ManagedLoginDialog /><Link href="/rooms">↓ Download</Link><button aria-label="Settings">⚙</button></div></header>;
}
function Shell({ children }: { children: React.ReactNode }) { return <div className="rr-site"><ReferenceHeader />{children}<footer className="rr-footer"><Link href="/">Rec Room</Link><span>Community tribute and editable archive</span><Link href="/admin">Admin</Link></footer></div>; }
function Router() { return <Switch><Route path="/" component={Home} /><Route path="/profiles" component={Profiles} /><Route path="/user/:username" component={Profile} /><Route path="/rooms" component={Rooms} /><Route path="/room/:slug" component={Room} /><Route path="/blog" component={Blog} /><Route path="/directory" component={Directory} /><Route path="/admin" component={Admin} /><Route component={NotFound} /></Switch>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Shell><Router /></Shell></TooltipProvider></ThemeProvider></ErrorBoundary>; }
