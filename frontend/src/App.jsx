import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ScriptureBackdrop from "./components/ScriptureBackdrop.jsx";
import Home from "./pages/Home.jsx";

export default function App() {
  // Visit /?wallpaper to see the scripture collage on its own at full strength
  // (handy for screenshots or using it as a desktop wallpaper).
  if (new URLSearchParams(window.location.search).has("wallpaper")) {
    return <ScriptureBackdrop full />;
  }

  return (
    // `isolate` keeps the -z-10 backdrop inside this stacking context, behind the content.
    <div className="relative isolate flex min-h-screen flex-col">
      <ScriptureBackdrop />
      <Navbar />
      <main className="flex-1">
        <Home />
      </main>
      <Footer />
    </div>
  );
}
