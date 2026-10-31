import { useEffect } from "react";
import {
  About,
  Contact,
  Footer,
  Header,
  Hero,
  Projects,
  Skills,
} from "./components/Sections";
import { ChatWidget } from "./components/ChatWidget";

function App() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Skills />
        <Projects />
        <About />
        <Contact />
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}

export default App;
