export type Vec2 = { x: number,  y: number};

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });



export const addVec = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const subVec = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const scaleVec = ({ x, y }: Vec2, scale: number): Vec2 => ({ x: x * scale, y: y * scale });

export const vecLength = ({ x, y } : Vec2) : number => Math.hypot(x, y)
