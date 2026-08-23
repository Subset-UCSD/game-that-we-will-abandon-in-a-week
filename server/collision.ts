import { Vec2, vec2, rotate, ortho, normalize, subVec, dot, scaleVec } from '@common'

export interface Collider {
  debug: boolean;
  // This is for is having multiple layers of collision, so only objects
  // with the same mask can collide with other objects within that mask
  mask: number; //binary mask

  // collier
  collide(Collider: Collider): Vec2;
  getNearestPoint(point: Vec2): Vec2;
  onCollide(cb: () => void): void;
  updateLocation(center: Vec2): void;
}

export interface PloygonCollider extends Collider {
    getCorners(): Vec2[]
}

// get all unnormalized edge vectors in a ploygon
const getEdges = (vec_list:Vec2[]): Vec2[] => {
    const edges:Vec2[] = [];
    for (let i = 0; i < vec_list.length; i++) {
        const p1 = vec_list[i]
        const p2 = vec_list[i+1 < vec_list.length ? i + 1 : 0]
        edges.push(subVec(p1, p2))
    }
    return vec_list
}

//the axes in SAT to test are the normal of the edges
const getAxes = (edges: Vec2[]): Vec2[] => {
    // const edges = getEdges(polygonCollider1.getCorners())
    const axes:Vec2[] = []
    for (const edge of edges) {
        axes.push(ortho(edge)) 
    }
    return axes
}

// find the point on an axis that is the projection of p
const proj = (p:Vec2, axis:Vec2): Vec2 => {return scaleVec(axis, dot(p, axis) / dot(axis, axis)) }

//https://dyn4j.org/2010/01/sat/ <- algorithm to detect collisons in convex polygon
// Nolan is a roman
/** sats lover */
const SATSolver = (polygonCollider1: PloygonCollider, polygonCollider2: PloygonCollider): boolean => {
    const edges1 = getEdges(polygonCollider1.getCorners())
    const edges2 = getEdges(polygonCollider2.getCorners())
    const axes = [... getAxes(edges1), ... getAxes(edges2)]
    
    
    
    //project to axis
    //check overlap in projects
    // if you detect one axes that doesn't overlap, its garenteed to not collide
    return true
}



// question: do we need a distinction between objects that cant be moved vs entities that would be walking into these objects | yes
export class BoxCollider implements PloygonCollider {

  private corners: Vec2[];
  private width: number
  private height: number
  private radians: number
  private x: number
  private y: number
  private center: Vec2;
  constructor(x: number, y: number, width: number, height: number, radians = 0) {
    this.x = x
    this.y = y
    this.radians = radians
    this.width = width
    this.height = height
    this.center = vec2(x, y)
    this.corners = this.getCorners()
  }

  getCorners(): Vec2[] {
    return [
      rotate(this.center, vec2(this.x + this.width / 2, this.y + this.height / 2), this.radians), //bottom right
      rotate(this.center, vec2(this.x - this.width / 2, this.y + this.height / 2), this.radians), //bottom left
      rotate(this.center, vec2(this.x + this.width / 2, this.y - this.height / 2), this.radians), //top right
      rotate(this.center, vec2(this.x - this.width / 2, this.y - this.height / 2), this.radians), //top left
    ]
  }


  collide(Collider: Collider): Vec2 {
    if (Collider instanceof BoxCollider) {
      // todo
      return { x: 0, y: 0 };
    }
    if (Collider instanceof CircleCollider) {
      // todo
      return { x: 0, y: 0 };
    }
    if (Collider instanceof CapsuleCollider) {
      // todo
      return { x: 0, y: 0 };
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
}

export class CircleCollider implements Collider {
  constructor(x: number, y: number, width: number, height: number) {

  }
  collide(collider: Collider) {
    return { x: 0, y: 0 }
  }

  debug = false;
  mask = 0;
  getNearestPoint(point: Vec2): Vec2 {
    throw new Error('Method not implemented.');
  }
  onCollide(cb: () => void): void {
    throw new Error('Method not implemented.');
  }
}

// hello sean i have a question
// what would be a capsule
export class CapsuleCollider implements Collider {
  private center: Vec2;
  private halfSpine: Vec2;
  private radius: number;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) {
    this.center = vec2(x, y);
    this.radius = radius;

    const horizontal = width >= height;
    const totalLength = horizontal ? width : height;
    const halfSpineLength = Math.max(0, totalLength / 2 - radius);

    this.halfSpine = horizontal
      ? vec2(halfSpineLength, 0)
      : vec2(0, halfSpineLength);
    }

    getNearestPoint(point: Vec2): Vec2 {
      
      
      return {
        x: 0,
        y: 0,
      };
    }
    
    updateLocation(center: Vec2): void {
      this.center = { ...center };
    }
  }



