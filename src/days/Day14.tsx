import { useState, useRef, useEffect } from "react";

const menuItems = [
  { label: "Dashboard" },
  { label: "My Integrations" },
  { label: "Billing & Invoices" },
  { label: "Account Settings" },
];

const Day14 = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div
      className="relative flex h-82 flex-col items-center justify-end"
      ref={menuRef}
    >
      {/* Trigger button — matches Day06 style */}
      <button
        type="button"
        className="relative h-8 cursor-pointer rounded-full bg-white px-3 text-sm font-medium text-ink sm-shadow select-none hover:bg-canvas"
        onClick={() => setOpen((prev) => !prev)}
      >
        Options
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute z-10 left-1/2 -translate-x-1/2 mb-12 w-56 origin-bottom rounded-xl bg-white py-3 px-3 sm-shadow opacity-100 scale-100 blur-0 transition-[opacity,scale,filter] duration-220 ease-out starting:opacity-0 starting:scale-95 starting:blur-[2px]">
          {/* User info */}
          <div className="px-4 pt-2 pb-2">
            <p className="text-sm font-semibold text-ink">William Clark</p>
            <p className="text-[12px] text-muted">contact@example.com</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className="w-full cursor-pointer rounded-md px-4 py-2 text-left text-sm text-ink font-medium hover:bg-canvas"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Log out */}
          <div>
            <button
              type="button"
              className="flex w-full rounded-sm cursor-pointer items-center justify-between px-4 py-2 text-left text-sm text-ink font-medium hover:bg-canvas"
            >
              Log out
              {/* Logout icon */}
              <svg
                className="h-4 w-4 text-muted font-medium"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Day14;
