import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {continueRender, delayRender} from 'remotion';
import {loadFont} from '@remotion/fonts';

export const ORB_SIZE = {width: 1080, height: 1920};
export const ORB_FPS = 30;

export type OrbBrand = {
  nombre: string;
  logo: string;
  color: string;
};

export type OrbProps = {
  marcas: OrbBrand[];
  /** Segundos (desde el inicio) en los que se enciende cada marca. */
  encendido: number[];
  /** Segundos que dura cada puesto. */
  duracion: number;
  /** Radio del orbe en px. */
  radio: number;
  /** Distancia vertical entre orbes. */
  paso: number;
  /** Margen superior del primer orbe. */
  top: number;
  /** Margen izquierdo. */
  left: number;
};

export const defaultOrbProps: OrbProps = {
  marcas: [
    {nombre: 'PORSCHE', logo: 'logos/porsche.png', color: '#D5001C'},
    {nombre: 'BMW', logo: 'logos/bmw.png', color: '#0066B1'},
    {nombre: 'MERCEDES-BENZ', logo: 'logos/mercedes.png', color: '#00A19B'},
    {nombre: 'HONDA', logo: 'logos/honda.png', color: '#CC0000'},
    {nombre: 'TOYOTA', logo: 'logos/toyota.png', color: '#EB0A1E'},
  ],
  encendido: [1.2, 6.4, 11.6, 16.8, 22.0],
  duracion: 5.2,
  radio: 54,
  paso: 200,
  top: 560,
  left: 118,
};

const ORO = '#F5C242';

/**
 * La columna de orbes dorados del ranking (el elemento grafico fuerte de la
 * pieza): 5 orbes apilados a la izquierda, el de la marca activa se enciende
 * con un glow dorado y lleva el logo de la marca DENTRO.
 *
 * Se renderiza sobre NEGRO: en HyperFrames esta capa se compone con
 * mix-blend-mode: screen sobre el presentador, asi que solo sobrevive la luz.
 */
export const OrbColumn: React.FC<OrbProps> = (props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [handle] = useState(() => delayRender('cargando tipografia'));
  const [listo, setListo] = useState(false);

  useEffect(() => {
    loadFont({family: 'Anton', url: staticFile('fonts/anton-400.woff2')})
      .then(() => {
        setListo(true);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);

  if (!listo) return null;

  const {marcas, encendido, duracion, radio, paso, top, left} = props;
  const t = frame / fps;

  // que marca esta encendida ahora
  let activa = 0;
  for (let i = 0; i < encendido.length; i++) {
    if (t >= encendido[i] - 0.35) activa = i;
  }
  const empieza = encendido[activa] ?? 0;
  const local = t - empieza;

  return (
    <AbsoluteFill style={{backgroundColor: '#000000'}}>
      {marcas.map((m, i) => {
        const esActiva = i === activa;
        // el orbe aparece con un rebote al encenderse
        const pop = esActiva
          ? spring({
              frame: frame - Math.round((encendido[i] ?? 0) * fps),
              fps,
              config: {damping: 9, mass: 0.5, stiffness: 180},
              durationInFrames: 22,
            })
          : 0;
        const escala = esActiva ? 0.55 + 0.45 * pop : 1;
        const glow = esActiva ? interpolate(pop, [0, 1], [0, 1]) : 0;
        // el logo dentro del orbe se revela con el rebote
        const logoOp = esActiva ? interpolate(pop, [0.15, 0.75], [0, 1], {extrapolateRight: 'clamp'}) : 0;
        const y = top + i * paso;

        return (
          <React.Fragment key={m.nombre}>
            {/* halo dorado del orbe encendido */}
            {esActiva ? (
              <div
                style={{
                  position: 'absolute',
                  left: left + radio - 150,
                  top: y + radio - 150,
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 50% 50%, rgba(245,194,66,${0.55 * glow}) 0%, rgba(245,194,66,${0.22 * glow}) 38%, rgba(245,194,66,0) 72%)`,
                  transform: `scale(${0.8 + 0.25 * glow})`,
                }}
              />
            ) : null}
            {/* el orbe */}
            <div
              style={{
                position: 'absolute',
                left,
                top: y,
                width: radio * 2,
                height: radio * 2,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: esActiva
                  ? `radial-gradient(circle at 50% 45%, #FFE9A8 0%, ${ORO} 42%, #B87A12 78%, rgba(184,122,18,0) 100%)`
                  : 'radial-gradient(circle at 50% 45%, rgba(245,194,66,.10) 0%, rgba(245,194,66,.05) 60%, rgba(245,194,66,0) 100%)',
                boxShadow: esActiva
                  ? `0 0 42px rgba(245,194,66,.75), 0 0 120px rgba(245,194,66,.45), inset 0 0 22px rgba(255,246,214,.55)`
                  : 'none',
                transform: `scale(${escala})`,
                opacity: esActiva ? 1 : 0.62,
              }}
            >
              {/* el logo de la marca, dentro del orbe */}
              <Img
                src={staticFile(m.logo)}
                style={{
                  maxWidth: radio * 1.15,
                  maxHeight: radio * 1.15,
                  objectFit: 'contain',
                  opacity: logoOp,
                  transform: `scale(${0.7 + 0.3 * logoOp})`,
                }}
              />
              {/* el numero del puesto */}
              <div
                style={{
                  position: 'absolute',
                  fontFamily: 'Anton',
                  fontSize: radio * 0.86,
                  color: esActiva ? '#241800' : 'rgba(245,194,66,.72)',
                  textShadow: esActiva ? 'none' : '0 0 18px rgba(245,194,66,.5)',
                  opacity: esActiva ? 0 : 1,
                }}
              >
                {marcas.length - i}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
