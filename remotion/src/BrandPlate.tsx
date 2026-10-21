import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Img, Video, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {continueRender, delayRender} from 'remotion';
import {loadFont} from '@remotion/fonts';

export const BRAND_PLATE_SIZE = {width: 1080, height: 1920};
export const BRAND_PLATE_DURATION = 132; // 4,4 s a 30 fps

export type Marca = {
  nombre: string;
  logo: string;
  color: string;
  frase: string;
};

export type PlateProps = {
  /** Puesto en el ranking (5 = el mas abajo). */
  posicion: number;
  /** Indice de la marca activa dentro de `marcas`. */
  activa: number;
  marcas: Marca[];
  /** Fotograma de inicio del presentador (para que cada puesto use otro gesto). */
  presentadorDesde: number;
  /** Milisegundos de presupuesto de la marca (el contador). */
  presupuesto: string;
};

export const defaultPlateProps: PlateProps = {
  posicion: 5,
  activa: 0,
  marcas: [
    {nombre: 'PORSCHE', logo: 'logos/porsche.png', color: '#D5001C', frase: 'pierden'},
    {nombre: 'BMW', logo: 'logos/bmw.png', color: '#0066B1', frase: 'recomiendo'},
    {nombre: 'MERCEDES-BENZ', logo: 'logos/mercedes.png', color: '#00A19B', frase: 'y confiabilidad'},
    {nombre: 'HONDA', logo: 'logos/honda.png', color: '#CC0000', frase: 'su valor'},
    {nombre: 'TOYOTA', logo: 'logos/toyota.png', color: '#EB0A1E', frase: 'quieres bajar'},
  ],
  presentadorDesde: 0,
  presupuesto: '2.4 MDP',
};

const ORO = '#E3A44B';
const TINTA = '#0B0A08';
const PANEL_X = 604; // el carril de marcas empieza aqui (56 %)

export const BrandPlate: React.FC<PlateProps> = (props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [handle] = useState(() => delayRender('cargando tipografias'));
  const [listo, setListo] = useState(false);

  useEffect(() => {
    Promise.all([
      loadFont({family: 'Anton', url: staticFile('fonts/anton-400.woff2')}),
      loadFont({family: 'JetBrains Mono', url: staticFile('fonts/jetbrains-mono-600.woff2')}),
    ])
      .then(() => {
        setListo(true);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);

  if (!listo) return null;

  const {marcas, activa, posicion, presentadorDesde, presupuesto} = props;
  const empuje = interpolate(frame, [0, BRAND_PLATE_DURATION], [1.02, 1.09], {
    extrapolateRight: 'clamp',
  });
  const oscurecer = interpolate(frame, [0, 14], [0, 0.62], {extrapolateRight: 'clamp'});
  const contador = Math.max(0, Math.min(1, (frame - 18) / 46));

  return (
    <AbsoluteFill style={{backgroundColor: TINTA}}>
      {/* ── El presentador de fondo (el plano) ───────────────────────── */}
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Video
          src={staticFile('presentador.mp4')}
          startFrom={presentadorDesde}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${empuje})`,
            filter: 'saturate(1.02) contrast(1.03)',
          }}
        />
      </AbsoluteFill>

      {/* Degradado hacia el panel: el texto del carril tiene que leerse */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, rgba(11,10,8,0) ${PANEL_X - 180}px, rgba(11,10,8,.55) ${PANEL_X - 40}px, rgba(11,10,8,.88) ${PANEL_X}px)`,
        }}
      />
      <AbsoluteFill style={{background: `rgba(11,10,8,${oscurecer * 0.5})`}} />

      {/* ── El carril de marcas (lo que Remotion sabe hacer: datos) ──── */}
      <div
        style={{
          position: 'absolute',
          left: PANEL_X,
          top: 0,
          bottom: 0,
          width: BRAND_PLATE_SIZE.width - PANEL_X,
          background: 'linear-gradient(180deg, rgba(11,10,8,.92), rgba(20,17,12,.94))',
          borderLeft: `2px solid rgba(227,164,75,.55)`,
          padding: '92px 34px 92px 30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 22,
        }}
      >
        {marcas.map((m, i) => {
          const esActiva = i === activa;
          const entra = spring({
            frame: frame - 10 - i * 5,
            fps,
            config: {damping: 200, mass: 0.7},
            durationInFrames: 26,
          });
          const x = interpolate(entra, [0, 1], [70, 0]);
          const escala = esActiva ? interpolate(frame, [0, 10, 22], [0.86, 1.08, 1], {extrapolateRight: 'clamp'}) : 0.82;
          const opacidad = esActiva ? 1 : 0.42;
          return (
            <div
              key={m.nombre}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                transform: `translateX(${x}px)`,
                opacity: opacidad,
              }}
            >
              {/* el orbe con el puesto */}
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: esActiva
                    ? `radial-gradient(circle at 50% 50%, ${ORO} 0%, rgba(227,164,75,.35) 55%, rgba(227,164,75,0) 78%)`
                    : 'rgba(227,164,75,.10)',
                  border: esActiva ? `1px solid ${ORO}` : '1px solid rgba(227,164,75,.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: esActiva ? '#1A1408' : 'rgba(227,164,75,.6)',
                  fontFamily: 'Anton',
                  fontSize: 22,
                  transform: `scale(${escala})`,
                }}
              >
                {marcas.length - i}
              </div>
              {/* el logo de la marca */}
              <div
                style={{
                  width: 96,
                  height: 46,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Img
                  src={staticFile(m.logo)}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    filter: esActiva ? 'none' : 'grayscale(1) brightness(1.6)',
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: 'Anton',
                  fontSize: 30,
                  letterSpacing: '-0.02em',
                  color: esActiva ? m.color : 'rgba(244,239,227,.5)',
                  textShadow: esActiva ? `0 0 22px ${m.color}66` : 'none',
                }}
              >
                {m.nombre}
              </div>
            </div>
          );
        })}

        {/* el contador del presupuesto (dato, no tipografia) */}
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            opacity: interpolate(frame, [16, 30], [0, 1], {extrapolateRight: 'clamp'}),
          }}
        >
          <div style={{fontFamily: 'Anton', fontSize: 62, color: ORO, lineHeight: 1}}>
            {contador >= 1 ? presupuesto : `${(2.4 * contador).toFixed(1)} MDP`}
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 18,
              letterSpacing: '0.18em',
              color: 'rgba(244,239,227,.55)',
            }}
          >
            PRESUPUESTO MEDIO
          </div>
        </div>
      </div>

      {/* Marco de estudio: filete de oro arriba y abajo */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 150,
          height: 2,
          background: 'rgba(227,164,75,.30)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 150,
          height: 2,
          background: 'rgba(227,164,75,.30)',
        }}
      />
    </AbsoluteFill>
  );
};
