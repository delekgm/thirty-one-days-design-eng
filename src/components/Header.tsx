// Site-wide header — displayed once at the top of the homepage
const Header = () => (
  <header className="py-10">
    <div className="max-w-5xl mx-auto px-6">
      {/* Main title in Instrument Serif italic */}
      <h1 className="font-headline italic text-2xl leading-tight text-ink">
        31 Days of Design Engineering
      </h1>

      {/* Subtitle / context line */}
      <p className="font-body text-muted text-xs mt-3 tracking-widest uppercase">
        March 2026
      </p>
    </div>
  </header>
);

export default Header;
