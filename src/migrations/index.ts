import * as migration_20261029_160149_initial from './20261029_160149_initial';
import * as migration_20261029_204124_image_shape from './20261029_204124_image_shape';

export const migrations = [
  {
    up: migration_20261029_160149_initial.up,
    down: migration_20261029_160149_initial.down,
    name: '20261029_160149_initial',
  },
  {
    up: migration_20261029_204124_image_shape.up,
    down: migration_20261029_204124_image_shape.down,
    name: '20261029_204124_image_shape',
  },
];
