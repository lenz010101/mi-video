import React from 'react';
import {Composition} from 'remotion';
import {BrandPlate, BRAND_PLATE_DURATION, BRAND_PLATE_SIZE, defaultPlateProps} from './BrandPlate';

/**
 * La ficha de marca: la capa grafica de un puesto del ranking.
 * Remotion dibuja aqui todo lo que es "datos" (el presentador de fondo, el
 * carril de marcas, los logos, los orbes y el contador). El montaje final
 * (titulares, pies de foto, transiciones, veredicto y cierre) lo monta
 * HyperFrames en HTML+GSAP, usando estos MP4 como planos.
 *
 * Un solo componente genera N fichas: se cambia el props y se renderiza.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BrandPlate"
      component={BrandPlate}
      durationInFrames={BRAND_PLATE_DURATION}
      fps={30}
      width={BRAND_PLATE_SIZE.width}
      height={BRAND_PLATE_SIZE.height}
      defaultProps={defaultPlateProps}
    />
  );
};
