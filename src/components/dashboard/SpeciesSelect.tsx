import { useEffect, useId, useRef, useState } from 'react'
import { speciesImageBase, type Species } from '../../species/catalog'

interface Props {
  speciesList: Species[]
  selected: Species | null
  onSelect: (id: string | null) => void
  anyLabel: string
  nameOf: (s: Species) => string
}

/** Ruta de la miniatura de una especie (generadas en public/species). */
function speciesImageUrl(base: string): string {
  return `${import.meta.env.BASE_URL}species/${base}.webp`
}

function Thumb({ base, alt }: { base: string | null; alt: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [base])
  if (!base || failed) return <span className="species-thumb species-thumb-empty" aria-hidden="true">🐟</span>
  return (
    <img
      className="species-thumb"
      src={speciesImageUrl(base)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

/**
 * Reemplazo del <select> nativo: un listbox accesible que muestra la
 * miniatura de cada especie junto a su nombre.
 */
export function SpeciesSelect({ speciesList, selected, onSelect, anyLabel, nameOf }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()

  const options: Array<{ id: string | null; label: string; base: string | null }> = [
    { id: null, label: anyLabel, base: null },
    ...speciesList.map((s) => ({ id: s.id, label: nameOf(s), base: speciesImageBase(s) })),
  ]
  const selectedIdx = Math.max(0, options.findIndex((o) => o.id === (selected?.id ?? null)))

  useEffect(() => {
    if (!open) return
    const onDocDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDocDown)
    return () => document.removeEventListener('pointerdown', onDocDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const openList = () => {
    setActive(selectedIdx)
    setOpen(true)
  }

  const commit = (idx: number) => {
    onSelect(options[idx].id)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(active)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  return (
    <div className="species-select-root" ref={rootRef}>
      <button
        type="button"
        className="species-select species-select-btn"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <Thumb base={selected ? speciesImageBase(selected) : null} alt="" />
        <span className="species-select-value">{options[selectedIdx].label}</span>
        <span className="species-select-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="species-listbox" role="listbox" id={listboxId} ref={listRef}>
          {options.map((o, idx) => (
            <li
              key={o.id ?? ''}
              data-idx={idx}
              role="option"
              aria-selected={idx === selectedIdx}
              className={`species-option${idx === active ? ' is-active' : ''}${idx === selectedIdx ? ' is-selected' : ''}`}
              onPointerMove={() => setActive(idx)}
              onClick={() => commit(idx)}
            >
              <Thumb base={o.base} alt="" />
              <span>{o.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
