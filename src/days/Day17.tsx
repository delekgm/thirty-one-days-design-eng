import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

// -- Types --

type DragState = {
  dragY: number;
  sheetHeight: number;
  isDragging: boolean;
};

type SheetContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  drag: DragState;
  onDragStart: (clientY: number, sheetHeight: number) => void;
  onDragMove: (clientY: number) => void;
  onDragEnd: () => void;
};

type RootProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
type DivProps = React.HTMLAttributes<HTMLDivElement>;

// -- Context --

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext(name: string): SheetContextValue {
  const ctx = useContext(SheetContext);

  if (!ctx) {
    throw new Error(`${name} must be used inside Sheet.Root`);
  }

  return ctx;
}

// -- Constants --

const DISMISS_THRESHOLD = 0.15;
const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

// -- Components --

function Root({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: RootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [drag, setDrag] = useState<DragState>({
    dragY: 0,
    sheetHeight: 0,
    isDragging: false,
  });
  const startYRef = useRef(0);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useMemo(() => {
    return (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    };
  }, [isControlled, onOpenChange]);

  function onDragStart(clientY: number, sheetHeight: number) {
    startYRef.current = clientY;
    setDrag({ dragY: 0, sheetHeight, isDragging: true });
  }

  function onDragMove(clientY: number) {
    const dy = Math.max(0, clientY - startYRef.current);
    setDrag((prev) => ({ ...prev, dragY: dy }));
  }

  function onDragEnd() {
    const threshold = drag.sheetHeight * DISMISS_THRESHOLD || 150;

    if (drag.dragY > threshold) {
      setOpen(false);
    }

    setDrag({ dragY: 0, sheetHeight: 0, isDragging: false });
  }

  const value = { open, setOpen, drag, onDragStart, onDragMove, onDragEnd };

  return (
    <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
  );
}

function Trigger({ children, onClick, ...props }: ButtonProps) {
  const { setOpen } = useSheetContext("Sheet.Trigger");

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(e);
    if (!e.defaultPrevented) {
      setOpen(true);
    }
  }

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

function Close({ children, onClick, ...props }: ButtonProps) {
  const { setOpen } = useSheetContext("Sheet.Close");

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(e);
    if (!e.defaultPrevented) {
      setOpen(false);
    }
  }

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

function Overlay({ className = "", onClick, ...props }: DivProps) {
  const { open, setOpen, drag } = useSheetContext("Sheet.Overlay");

  let opacity = open ? 1 : 0;
  if (open && drag.isDragging && drag.sheetHeight > 0) {
    const progress = drag.dragY / drag.sheetHeight;
    opacity = Math.max(0, 1 - progress);
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    onClick?.(e);
    if (!e.defaultPrevented) {
      setOpen(false);
    }
  }

  return (
    <div
      aria-hidden="true"
      {...props}
      onClick={handleClick}
      style={{
        opacity,
        pointerEvents: open ? "auto" : "none",
        transition: drag.isDragging ? "none" : `opacity 0.5s ${EASING}`,
        ...props.style,
      }}
      className={`fixed inset-0 bg-black/40 ${className}`}
    />
  );
}

function Content({ children, className = "", ...props }: DivProps) {
  const { open, drag } = useSheetContext("Sheet.Content");

  const translateY = open ? drag.dragY : 0;
  const transform = open ? `translateY(${translateY}px)` : "translateY(100%)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      {...props}
      style={{
        transform,
        transition: drag.isDragging ? "none" : `transform 0.5s ${EASING}`,
        ...props.style,
      }}
      className={[
        "fixed inset-x-0 bottom-0 z-50 mx-auto",
        "rounded-t-2xl bg-white shadow-2xl",
        "max-h-[85vh] min-h-96 max-w-xl overflow-auto",
        "p-4",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Handle({
  className = "",
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...props
}: DivProps) {
  const { onDragStart, onDragMove, onDragEnd } =
    useSheetContext("Sheet.Handle");

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    onPointerDown?.(e);
    if (e.defaultPrevented) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const sheet = e.currentTarget.closest(
      "[role=dialog]",
    ) as HTMLElement | null;
    const height = sheet ? sheet.clientHeight : 0;
    onDragStart(e.clientY, height);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    onPointerMove?.(e);
    if (e.defaultPrevented) return;
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

    onDragMove(e.clientY);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    onPointerUp?.(e);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onDragEnd();
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    onPointerCancel?.(e);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onDragEnd();
  }

  return (
    <div
      {...props}
      className={`flex cursor-grab touch-none justify-center pb-3 active:cursor-grabbing ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className="h-1.5 w-12 rounded-full bg-gray-300" />
    </div>
  );
}

function Header({ children, className = "", ...props }: DivProps) {
  return (
    <div className={`mb-3 text-lg font-semibold ${className}`} {...props}>
      {children}
    </div>
  );
}

function Body({ children, className = "", ...props }: DivProps) {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

function Footer({ children, className = "", ...props }: DivProps) {
  return (
    <div className={`flex justify-start gap-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

const Sheet = {
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Handle,
  Header,
  Body,
  Footer,
  Close,
};

const Day17 = () => {
  return (
    <>
      <Sheet.Root>
        <Sheet.Trigger className="h-8 cursor-pointer rounded-full bg-ink/80 px-3 text-sm font-medium text-canvas shadow-canvas transition-transform duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.97] sm-shadow">
          Open
        </Sheet.Trigger>

        <Sheet.Portal>
          <Sheet.Overlay />
          <Sheet.Content className="p-6">
            <Sheet.Handle />

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Options</h2>

              <Sheet.Close className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-transform duration-220 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.8]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M10.4854 1.99998L2.00007 10.4853"
                    stroke="#999999"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.4854 10.4844L2.00007 1.99908"
                    stroke="#999999"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Sheet.Close>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 px-4 py-3.5 text-left text-base font-semibold text-ink hover:bg-gray-100"
              >
                <svg
                  width="20"
                  height="21"
                  viewBox="0 0 20 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.00024 9V6C6.00024 3.79086 7.79111 2 10.0002 2V2C12.2094 2 14.0002 3.79086 14.0002 6V9"
                    stroke="#8F8F8F"
                    strokeWidth="2.33319"
                  ></path>
                  <path
                    d="M6.68423 9H13.3163V7H6.68423V9ZM16.0002 11.684V16.316H18.0002V11.684H16.0002ZM13.3163 19H6.68423V21H13.3163V19ZM4.00024 16.316V11.684H2.00024V16.316H4.00024ZM6.68423 19C5.20191 19 4.00024 17.7983 4.00024 16.316H2.00024C2.00024 18.9029 4.09734 21 6.68423 21V19ZM16.0002 16.316C16.0002 17.7983 14.7986 19 13.3163 19V21C15.9032 21 18.0002 18.9029 18.0002 16.316H16.0002ZM13.3163 9C14.7986 9 16.0002 10.2017 16.0002 11.684H18.0002C18.0002 9.09709 15.9032 7 13.3163 7V9ZM6.68423 7C4.09734 7 2.00024 9.09709 2.00024 11.684H4.00024C4.00024 10.2017 5.20191 9 6.68423 9V7Z"
                    fill="#8F8F8F"
                  ></path>
                </svg>
                View Private Key
              </button>

              <button
                type="button"
                className="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 px-4 py-3.5 text-left text-base font-semibold text-ink hover:bg-gray-100"
              >
                <svg
                  width="24"
                  height="20"
                  viewBox="0 0 24 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.75049 10L2.75049 10L1.75049 10ZM12.0005 18.25L12.0005 19.25L12.0005 18.25ZM5.15912 18.1131L5.1911 17.1136L5.15912 18.1131ZM22.1381 5.15748L23.1374 5.11999L22.1381 5.15748ZM2.8622 14.805C2.80427 13.2613 2.75049 11.4384 2.75049 10L0.750488 10C0.750488 11.4772 0.805463 13.3306 0.863604 14.88L2.8622 14.805ZM2.75049 10C2.75049 8.56162 2.80427 6.73874 2.8622 5.19498L0.863605 5.11999C0.805463 6.66944 0.750488 8.5228 0.750488 10L2.75049 10ZM5.1911 2.88636C7.25848 2.82021 9.9404 2.75 12.0005 2.75L12.0005 0.75C9.90647 0.75 7.19769 0.821136 5.12715 0.887381L5.1911 2.88636ZM12.0005 2.75C14.0606 2.75 16.7425 2.82021 18.8099 2.88636L18.8738 0.887382C16.8033 0.821136 14.0945 0.75 12.0005 0.75L12.0005 2.75ZM21.1388 5.19498C21.1967 6.73874 21.2505 8.56162 21.2505 10L23.2505 10C23.2505 8.5228 23.1955 6.66944 23.1374 5.11999L21.1388 5.19498ZM21.2505 10C21.2505 11.4384 21.1967 13.2613 21.1388 14.805L23.1374 14.88C23.1955 13.3306 23.2505 11.4772 23.2505 10L21.2505 10ZM18.8099 17.1136C16.7425 17.1798 14.0606 17.25 12.0005 17.25L12.0005 19.25C14.0945 19.25 16.8033 19.1789 18.8738 19.1126L18.8099 17.1136ZM12.0005 17.25C9.9404 17.25 7.25848 17.1798 5.1911 17.1136L5.12715 19.1126C7.19769 19.1789 9.90647 19.25 12.0005 19.25L12.0005 17.25ZM2.8622 5.19498C2.90954 3.93324 3.92334 2.92692 5.1911 2.88636L5.12715 0.887381C2.81502 0.961356 0.950565 2.80253 0.863605 5.11999L2.8622 5.19498ZM0.863604 14.88C0.950564 17.1975 2.81502 19.0386 5.12715 19.1126L5.1911 17.1136C3.92334 17.0731 2.90954 16.0668 2.8622 14.805L0.863604 14.88ZM21.1388 14.805C21.0914 16.0668 20.0776 17.0731 18.8099 17.1136L18.8738 19.1126C21.186 19.0386 23.0504 17.1975 23.1374 14.88L21.1388 14.805ZM18.8099 2.88636C20.0776 2.92692 21.0914 3.93324 21.1388 5.19498L23.1374 5.11999C23.0504 2.80253 21.186 0.961356 18.8738 0.887382L18.8099 2.88636Z"
                    fill="#8F8F8F"
                  ></path>
                  <rect
                    x="5.5"
                    y="5.12207"
                    width="5.85"
                    height="1.95"
                    rx="0.975"
                    fill="#8F8F8F"
                  ></rect>
                  <rect
                    x="5.5"
                    y="9.02344"
                    width="5.85"
                    height="1.95"
                    rx="0.975"
                    fill="#8F8F8F"
                  ></rect>
                  <rect
                    x="5.5"
                    y="12.9248"
                    width="5.85"
                    height="1.95"
                    rx="0.975"
                    fill="#8F8F8F"
                  ></rect>
                  <rect
                    x="12.6509"
                    y="5.12207"
                    width="5.85"
                    height="1.95"
                    rx="0.975"
                    fill="#8F8F8F"
                  ></rect>
                  <rect
                    x="12.6509"
                    y="9.02344"
                    width="5.85"
                    height="1.95"
                    rx="0.975"
                    fill="#8F8F8F"
                  ></rect>
                  <rect
                    x="12.6509"
                    y="12.9248"
                    width="5.85"
                    height="1.95"
                    rx="0.975"
                    fill="#8F8F8F"
                  ></rect>
                </svg>
                View Recovery Phrase
              </button>

              <button
                type="button"
                className="flex cursor-pointer items-center gap-3 rounded-xl bg-red-50 px-4 py-3.5 text-left text-base text-red-500 hover:bg-red-100 font-semibold"
              >
                <svg
                  width="21"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.6324 11.2514L11.8827 7.49726C11.9232 6.88978 11.4414 6.37476 10.8325 6.37476C10.2237 6.37476 9.74185 6.88978 9.78235 7.49726L10.0326 11.2514C10.0607 11.6725 10.4105 11.9998 10.8325 11.9998C11.2546 11.9998 11.6043 11.6725 11.6324 11.2514Z"
                    fill="#FF3F3F"
                  ></path>
                  <circle
                    cx="10.8328"
                    cy="14.0623"
                    r="0.9375"
                    fill="#FF3F3F"
                  ></circle>
                  <path
                    d="M8.71062 3.09582C9.7307 1.5843 11.9348 1.5843 12.9549 3.09582C14.1585 4.87924 15.6235 7.09937 16.6453 8.81189C17.6058 10.4217 18.6773 12.4256 19.5531 14.1178C20.416 15.7849 19.2611 17.7558 17.3855 17.8327C15.3163 17.9175 12.8085 17.9994 10.8328 17.9994C8.85699 17.9994 6.34926 17.9175 4.28004 17.8327C2.40438 17.7558 1.24949 15.7849 2.11241 14.1178C2.98825 12.4256 4.05975 10.4217 5.02026 8.81189C6.04203 7.09937 7.50705 4.87924 8.71062 3.09582Z"
                    stroke="#FF3F3F"
                    strokeWidth="2"
                  ></path>
                </svg>
                Remove Wallet
              </button>
            </div>
          </Sheet.Content>
        </Sheet.Portal>
      </Sheet.Root>
    </>
  );
};

export default Day17;
