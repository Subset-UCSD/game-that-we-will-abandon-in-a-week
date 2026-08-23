import { Vec2 } from '@common'

export interface Collider {
  debug: boolean;
  // This is for is having multiple layers of collision, so only objects
  // with the same mask can collide with other objects within that mask
  mask: number; //binary mask

  collide(Collider: Collider): Vec2;
  getNearestPoint(point: Vec2): Vec2;
  onCollide(cb: () => void): void;
  triggerCollideEvent(): void;
}

// question: do we need a distinction between objects that cant be moved vs entities that would be walking into these objects
export class BoxCollider implements Collider {
  constructor(x:number, y:number, width:number, height:number, radians=0) {
      
  }

  collide(Collider: Collider): Vec2 {
    if (Collider instanceof BoxCollider) {
      // todo
      return {x: 0, y: 0};
    }
    if (Collider instanceof CircleCollider) {
      // todo
      return {x: 0, y: 0};
    }
    if (Collider instanceof CapsuleCollider) {
      // todo
      return {x: 0, y: 0};
    }
    throw "shitass";
  }

  
    debug = false;
    mask = 0;
    getNearestPoint(point: Vec2): Vec2 {
        throw new Error('Method not implemented.');
    }
    onCollide(cb: () => void): void {
        throw new Error('Method not implemented.');
    }
    triggerCollideEvent(): void {
        throw new Error('Method not implemented.');
    }
}

export class CircleCollider implements Collider {
	constructor(x:number, y:number, width:number, height:number) {
        
    }
    collide(collider: Collider) {
    return {x: 0, y: 0}
  }
  
    debug = false;
    mask = 0;
    getNearestPoint(point: Vec2): Vec2 {
        throw new Error('Method not implemented.');
    }
    onCollide(cb: () => void): void {
        throw new Error('Method not implemented.');
    }
    triggerCollideEvent(): void {
        throw new Error('Method not implemented.');
    }
}

// hello sean i have a question
// what would be a capsule
export class CapsuleCollider implements Collider {
    private width: number
    private height: number
    private radius: number
    
    constructor(x:number, y:number, width: number, height: number, radius: number) {
        this.width = width
        this.height = height
        this.radius = radius

        
    }

    
    debug = false;
    mask = 0;
    collide(collider: Collider) {
    return {x: 0, y: 0}
  }
    getNearestPoint(point: Vec2): Vec2 {
        throw new Error('Method not implemented.');
    }
    onCollide(cb: () => void): void {
        throw new Error('Method not implemented.');
    }
    triggerCollideEvent(): void {
        throw new Error('Method not implemented.');
    }
}

