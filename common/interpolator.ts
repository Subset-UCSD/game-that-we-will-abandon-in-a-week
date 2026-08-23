/**
 * @module
 * larper
 */

/** 
 * larp
 * @param progress between 0 and 1
 */
export const lerp = (a: number, b: number, progress: number) => a + (b - a) * progress

/**
 * this will delay showing the current value to the user and instead spend the
 * next `SERVER_GAME_TICK` smoothly animating from the current value to the new
 * value
 */
export class Interpolator<T> {
  #delay: number
  
}
