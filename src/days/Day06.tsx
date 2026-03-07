import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const MAX_TOASTS = 3;
const EXIT_DURATION_MS = 400;

interface ToastItem {
  id: number;
  exiting: boolean;
}

interface ToastState {
  items: ToastItem[];
  nextId: number;
}

type ToastAction = { type: "add" } | { type: "remove"; id: number };

const initialToastState: ToastState = {
  items: [],
  nextId: 1,
};

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  if (action.type === "add") {
    const nextToast: ToastItem = {
      id: state.nextId,
      exiting: false,
    };
    const activeItems = state.items.filter((item) => !item.exiting);

    if (activeItems.length < MAX_TOASTS) {
      return {
        items: [...state.items, nextToast],
        nextId: state.nextId + 1,
      };
    }

    const oldestActiveId = activeItems[0]?.id;

    return {
      items: [
        ...state.items.map((item) =>
          item.id === oldestActiveId ? { ...item, exiting: true } : item
        ),
        nextToast,
      ],
      nextId: state.nextId + 1,
    };
  }

  return {
    ...state,
    items: state.items.filter((item) => item.id !== action.id),
  };
};

const Day06 = () => {
  const [toastState, dispatch] = useReducer(toastReducer, initialToastState);
  const timersRef = useRef<Record<number, number>>({});

  useEffect(() => {
    toastState.items.forEach((item) => {
      if (!item.exiting || timersRef.current[item.id]) {
        return;
      }

      const timer = window.setTimeout(() => {
        dispatch({ type: "remove", id: item.id });
        delete timersRef.current[item.id];
      }, EXIT_DURATION_MS);

      timersRef.current[item.id] = timer;
    });
  }, [toastState.items]);

  useEffect(
    () => () => {
      Object.values(timersRef.current).forEach((timer) => {
        window.clearTimeout(timer);
      });
    },
    []
  );

  return (
    <div className="relative flex h-80 w-full max-w-105 flex-col items-center p-6">
      <div className="absolute bottom-20 left-1/2 flex w-89 -translate-x-1/2 flex-col [--gap:16px]">
        {toastState.items.map((toast, i) => (
          <Toast
            key={toast.id}
            index={toastState.items.length - (i + 1)}
            exiting={toast.exiting}
          />
        ))}
      </div>

      <button
        type="button"
        className="relative mt-auto inline-block h-8 w-auto rounded-[9999px] bg-white px-3 text-sm font-medium text-[#1b1b1d] shadow-[0_0_0_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)]"
        onClick={() => {
          dispatch({ type: "add" });
        }}
      >
        Add toast
      </button>
    </div>
  );
};

interface ToastProps {
  index: number;
  exiting: boolean;
}

const Toast = ({ index, exiting }: ToastProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="absolute bottom-0 flex w-full flex-col gap-1 rounded-lg bg-white px-3.5 pt-2.5 pb-3.25 text-[13px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.04)] transition-[opacity,transform] duration-400 ease will-change-transform"
      style={
        {
          "--index": index,
          opacity: mounted && !exiting ? 1 : 0,
          transform: mounted
            ? `translateY(calc(${index} * (100% + var(--gap)) * -1))`
            : "translateY(100%)",
        } as CSSProperties
      }
    >
      <span className="font-medium text-[#1b1b1d]">Event Created</span>
      <span className="leading-none text-[#717175]">
        Monday, January 3rd at 6:00pm
      </span>
    </div>
  );
};

export default Day06;
