import {
  useCallback,
  useEffect,
  useReducer,
  useState,
  type CSSProperties,
} from "react";

const MAX_TOASTS = 3;
const EXIT_DURATION_MS = 400;
const TOAST_LIFETIME_MS = 3000;

interface ToastItem {
  id: number;
  exiting: boolean;
}

interface ToastState {
  items: ToastItem[];
  nextId: number;
}

type ToastAction =
  | { type: "add" }
  | { type: "startExit"; id: number }
  | { type: "remove"; id: number };

const initialToastState: ToastState = {
  items: [],
  nextId: 1,
};

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  if (action.type === "add") {
    const activeItems = state.items.filter((item) => !item.exiting);
    const oldestActiveId = activeItems[0]?.id;

    const nextItems =
      activeItems.length >= MAX_TOASTS
        ? state.items.map((item) =>
            item.id === oldestActiveId ? { ...item, exiting: true } : item,
          )
        : state.items;

    return {
      items: [...nextItems, { id: state.nextId, exiting: false }],
      nextId: state.nextId + 1,
    };
  }

  if (action.type === "startExit") {
    return {
      ...state,
      items: state.items.map((item) =>
        item.id === action.id ? { ...item, exiting: true } : item,
      ),
    };
  }

  return {
    ...state,
    items: state.items.filter((item) => item.id !== action.id),
  };
};

const Day06 = () => {
  const [toastState, dispatch] = useReducer(toastReducer, initialToastState);

  const handleStartExit = useCallback((id: number) => {
    dispatch({ type: "startExit", id });
  }, []);

  const handleRemoveToast = useCallback((id: number) => {
    dispatch({ type: "remove", id });
  }, []);

  return (
    <div className="relative flex h-80 w-full max-w-105 flex-col items-center p-6">
      <div className="absolute bottom-20 left-1/2 flex w-89 -translate-x-1/2 flex-col [--gap:16px]">
        {toastState.items.map((toast, i) => (
          <Toast
            key={toast.id}
            id={toast.id}
            index={toastState.items.length - (i + 1)}
            exiting={toast.exiting}
            onStartExit={handleStartExit}
            onRemove={handleRemoveToast}
          />
        ))}
      </div>

      <button
        type="button"
        className="relative mt-auto inline-block h-8 w-auto rounded-full bg-white px-3 text-sm font-medium text-[#1b1b1d] sm-shadow"
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
  id: number;
  index: number;
  exiting: boolean;
  onStartExit: (id: number) => void;
  onRemove: (id: number) => void;
}

const Toast = ({ id, index, exiting, onStartExit, onRemove }: ToastProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (exiting) {
      return;
    }

    const fadeTimer = window.setTimeout(() => {
      onStartExit(id);
    }, TOAST_LIFETIME_MS);

    return () => {
      window.clearTimeout(fadeTimer);
    };
  }, [exiting, id, onStartExit]);

  useEffect(() => {
    if (!exiting) {
      return;
    }

    const removeTimer = window.setTimeout(() => {
      onRemove(id);
    }, EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(removeTimer);
    };
  }, [exiting, id, onRemove]);

  return (
    <div
      className="absolute bottom-0 flex w-full flex-col gap-1 rounded-lg bg-white px-3.5 pt-2.5 pb-3.25 text-[13px] sm-shadow transition-[opacity,transform] duration-400 ease will-change-transform"
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
