import { useEffect, useRef, useState } from "react";

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="customSelectTrigger"
        onClick={() => setOpen((o) => !o)}
      >
        {value || placeholder}
        <span>▾</span>
      </button>

      {open && (
        <ul className="customSelectMenu">
          {options.map((opt) => (
            <li
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
