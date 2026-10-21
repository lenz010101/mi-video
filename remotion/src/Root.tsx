import React from 'react';
import {Composition} from 'remotion';
import {BrandPlate, BRAND_PLATE_DURATION, BRAND_PLATE_SIZE, defaultPlateProps} from './BrandPlate';
import {OrbColumn, ORB_FPS, ORB_SIZE, defaultOrbProps} from './OrbColumn';

/**
 * Dos composiciones, dos motors:
 *  - BrandPlate: la ficha de marca (presentador + carril de logos + orbes).
 *  - OrbColumn: la columna de orbes dorados sobre negro, que HyperFrames
 *    compone en modo screen sobre el presentador.
 * Un solo componente genera N videos: se cambia el props y se renderiza.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BrandPlate"
        component={BrandPlate}
        durationInFrames={BRAND_PLATE_DURATION}
        fps={30}
        width={BRAND_PLATE_SIZE.width}
        height={BRAND_PLATE_SIZE.height}
        defaultProps={defaultPlateProps}
      />
      <Composition
        id="OrbColumn"
        component={OrbColumn}
        durationInFrames={30 * ORB_FPS}
        fps={ORB_FPS}
        width={ORB_SIZE.width}
        height={ORB_SIZE.height}
        defaultProps={defaultOrbProps}
      />
    </>
  );
};
