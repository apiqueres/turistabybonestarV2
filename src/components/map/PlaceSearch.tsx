"use client";

import { useId, useRef, useState } from "react";
import type { Place } from "@/lib/geo/places";
import { searchOnline, searchPlaces } from "@/lib/geo/places";
import { ArrowRight } from "@/components/ui/icons";

interface Props {
  placeholder: string;
  hint?: string;
  onPick: (p: Place) => void;
  autoFocus?: boolean;
  /** Visual size: the map landing uses the large one, the form the compact one. */
  size?: "lg" | "md";
}

/** Text search for a country or a city with suggestions; Enter picks the first one. */
export function PlaceSearch({ placeholder, hint, onPick, autoFocus, size = "lg" }: Props) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [online, setOnline] = useState<"idle" | "loading" | "none" | "error">("idle");
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const seq = useRef(0);
  const timer = useRef<number | null>(null);

  const onChange = (value: string) => {
    setQ(value);
    setOnline("idle");
    const id = ++seq.current;
    if (timer.current) window.clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setItems([]);
      return;
    }
    timer.current = window.setTimeout(() => {
      searchPlaces(value).then((res) => {
        if (seq.current !== id) return;
        setItems(res);
        setCursor(0);
        setOpen(true);
      });
    }, 80);
  };

  const pick = (p: Place) => {
    onPick(p);
    setQ("");
    setItems([]);
    setOpen(false);
    input.current?.focus();
  };

  const lookupOnline = async () => {
    setOnline("loading");
    try {
      const res = await searchOnline(q);
      if (res.length === 0) setOnline("none");
      else {
        setItems(res);
        setCursor(0);
        setOnline("idle");
        setOpen(true);
      }
    } catch {
      setOnline("error");
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && items.length) { e.preventDefault(); setCursor((c) => (c + 1) % items.length); setOpen(true); }
    else if (e.key === "ArrowUp" && items.length) { e.preventDefault(); setCursor((c) => (c - 1 + items.length) % items.length); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (items[cursor]) pick(items[cursor]);
      else if (q.trim().length >= 2) void lookupOnline();
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className={`place-search is-${size}`}>
      <div className="place-search-field">
        <svg viewBox="0 0 24 24" className="place-search-icon" aria-hidden><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <input
          ref={input}
          type="text"
          value={q}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => items.length && setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        />
        {q && (
          <button type="button" className="place-search-go" onClick={() => (items[cursor] ? pick(items[cursor]) : void lookupOnline())} aria-label="Buscar">
            <ArrowRight />
          </button>
        )}
      </div>
      {hint && !q && <div className="kicker mt-3">{hint}</div>}
      {q.trim().length >= 2 && (
        <div className="place-search-panel" hidden={!open && items.length > 0}>
          {items.length > 0 ? (
            <ul id={listId} role="listbox" className="place-list">
              {items.map((p, i) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={i === cursor}
                  className={`place-item ${i === cursor ? "is-active" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); pick(p); }}
                  onMouseEnter={() => setCursor(i)}
                >
                  <span className="place-item-name">{p.name}</span>
                  <span className="place-item-meta">{p.kind === "country" ? "País" : p.country ?? "Ciudad"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="place-empty">
              {online === "loading" && <span className="t-muted">Buscando en el mapa del mundo…</span>}
              {online === "none" && <span className="t-muted">No encontramos «{q}». Prueba con el país o una ciudad cercana.</span>}
              {online === "error" && <span className="t-muted">No se pudo consultar el buscador en línea. Prueba con el país.</span>}
              {online === "idle" && (
                <>
                  <span className="t-muted">No está en nuestra lista.</span>
                  <button type="button" className="link-arrow" onMouseDown={(e) => { e.preventDefault(); void lookupOnline(); }}>
                    Buscar «{q}» en el mapa del mundo
                    <ArrowRight />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
