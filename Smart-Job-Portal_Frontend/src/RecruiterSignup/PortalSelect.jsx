// PortalSelect.jsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function PortalSelect({
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select category",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const listRef = useRef(null);

  // update dropdown position
  const updateCoords = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (open) updateCoords();
  }, [open]);

  // close on outside click or resize/scroll
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        listRef.current &&
        !listRef.current.contains(e.target) &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleScroll = () => {
      if (open) updateCoords();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const toggleOpen = () => {
    if (!disabled) setOpen((prev) => !prev);
  };

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className="dropdown-btn"
        onClick={toggleOpen}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: "10px",
          border: "1px solid #c3c7cb",
          fontSize: "15px",
          background: "linear-gradient(180deg, rgba(238,255,240))",
          color: value ? "#333" : "#9aa6b4",
          textAlign: "left",
          position: "relative",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {value || placeholder}
        <span
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          ▼
        </span>
      </button>

      {open &&
        createPortal(
          <ul
            ref={listRef}
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              background: "#fff",
              border: "1px solid #c3c7cb",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
              borderRadius: "10px",
              maxHeight: "250px",
              overflowY: "auto",
              zIndex: 999999,
              listStyle: "none",
              margin: 0,
              padding: "8px 0",
            }}
          >
            {options.length === 0 ? (
              <li style={{ padding: "10px 16px", color: "#9aa6b4" }}>
                No categories available
              </li>
            ) : (
              options.map((opt) => (
                <li
                  key={opt.id}
                  onClick={() => {
                    onChange({ target: { name, value: opt.name } });
                    setOpen(false);
                  }}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    background:
                      value === opt.name
                        ? "rgba(76, 175, 80, 0.1)"
                        : "transparent",
                    color: "#333",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(76,175,80,0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      value === opt.name
                        ? "rgba(76,175,80,0.1)"
                        : "transparent")
                  }
                >
                  {opt.name}
                </li>
              ))
            )}
          </ul>,
          document.body
        )}
    </>
  );
}
