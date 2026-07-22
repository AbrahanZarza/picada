# 🎣 Picada

Planifica tu jornada de pesca con caña. Elige un punto en el mapa (o usa tu ubicación)
y un día, y Picada combina **viento, oleaje, presión, coeficiente de marea, fase lunar
y períodos solunares** en una valoración 0-100 explicada, global y por modalidad
(surfcasting, spinning, rockfishing).

**100% estático, sin backend**: toda la información se obtiene de APIs gratuitas sin
clave y de cálculo astronómico en el propio navegador.

## Stack

- React 19 + Vite + TypeScript
- [Open-Meteo](https://open-meteo.com) (previsión meteo y marina, geocoding) — sin API key
- [Nominatim](https://nominatim.org) (nombre del punto elegido, solo cosmético)
- Leaflet + OpenStreetMap (mapa, carga lazy)
- [suncalc](https://github.com/mourner/suncalc) + fórmulas propias (fase lunar,
  tránsitos, coeficiente de marea 20-120, mareas estimadas, solunar)
- i18n propio ES/EN · CSS plano con design tokens · vitest

## Desarrollo

```bash
npm install
npm run dev       # servidor de desarrollo
npm test          # tests de los módulos astro y scoring
npm run build     # build de producción (dist/)
npm run preview   # sirve el build
```

## Despliegue

Es un sitio estático: sube `dist/` a Vercel, Netlify, GitHub Pages o cualquier CDN.
Sin variables de entorno ni configuración.

## Cómo funciona el scoring

Cada hora recibe subscores 0-1 por factor (curvas por tramos, explicables):
viento efectivo (media vs rachas), oleaje (curva distinta por modalidad), presión
(valor + tendencia 24 h), coeficiente de marea, fase lunar y momento del día
(horas doradas + solunar). Se combinan con pesos por modalidad y se normalizan,
de modo que en ubicaciones de interior el peso del oleaje se redistribuye solo.
El score del día es la media del mejor 25% de las horas pescables, y la UI muestra
los 3 factores que más mueven la aguja ("Por qué") y las mejores ventanas horarias.

Las **horas de pleamar/bajamar** se calculan automáticamente a partir del nivel del
mar previsto por Open-Meteo (`sea_level_height_msl`), con interpolación parabólica
para precisión sub-horaria. Donde no hay dato de nivel del mar se estiman por
astronomía (tránsito lunar) y se marcan con "~". El **coeficiente** de marea es
puramente astronómico y robusto.

## Ubicaciones de prueba

| Caso | Coordenadas | Qué valida |
|---|---|---|
| Atlántico | Cádiz `36.529, -6.293` | mareas grandes, datos marinos OK |
| Mediterráneo | Cullera `39.163, -0.222` | marea mínima, marine OK |
| Interior | Madrid `40.417, -3.703` | degradación sin mar, surfcasting deshabilitado |
| Lago | Iznájar `37.258, -4.308` | igual que interior, búsqueda por nombre |
| Alta latitud | Bergen `60.39, 5.32` | sol/luna extremos |
