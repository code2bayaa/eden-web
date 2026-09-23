import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
// import { supabase } from "@/integrations/supabase/client";
// import type { User } from "@supabase/supabase-js";

export function SiteNav() {
  const [user, setUser] = useState<null>(null);
  const navigate = useNavigate();

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
//     const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
//       setUser(session?.user ?? null);
//     });
//     return () => sub.subscription.unsubscribe();
//   }, []);

  const signOut = async () => {
    // await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <nav className="fixed top-0 w-full z-40 border-b border-sand-100/5 bg-earth-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-serif text-2xl font-medium tracking-tight text-sand-100">
            EDEN
          </Link>
          <div className="hidden md:flex gap-6">
            <a href="#cinema" className="text-sm font-medium text-sand-100/60 hover:text-sand-100 transition-colors">Cinema</a>
            <a href="#creators" className="text-sm font-medium text-sand-100/60 hover:text-sand-100 transition-colors">Creators</a>
            <a href="#garden" className="text-sm font-medium text-sand-100/60 hover:text-sand-100 transition-colors">The Garden</a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden md:inline text-xs text-sand-100/50 font-mono truncate max-w-[160px]">{user}</span>
              <button onClick={signOut} className="text-sm font-medium text-sand-100/80 px-4 py-2 hover:text-sand-100">
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/signin" className="text-sm font-medium text-sand-100/80 px-4 py-2 hover:text-sand-100">
              Sign In
            </Link>
          )}
          <Link
            to="/signup"
            className="bg-clay-500 hover:bg-clay-400 text-sand-100 text-sm font-medium px-4 py-2 rounded-full ring-1 ring-clay-500 transition-transform"
          >
            Launch Film
          </Link>
        </div>
      </div>
    </nav>
  );
}
