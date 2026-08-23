import { Vec2, vec2, rotate, ortho, normalize, subVec, dot, scaleVec, vecLength, SerializedCollider } from '@common'
import test from 'node:test';

export interface Collider {
  debug: boolean;
  // This is for is having multiple layers of collision, so only objects
  // with the same mask can collide with other objects within that mask
  mask: number; //binary mask

  // border collie
  collide(Collider: Collider): Vec2;
  getNearestPoint(point: Vec2): Vec2;
  onCollide(cb: () => void): void;
  updateLocation(center: Vec2): void;
  serialize(): SerializedCollider
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

    return edges
}

// the axes in SAT to test are the normal of the edges
const getAxes = (edges: Vec2[]): Vec2[] => {
    // const edges = getEdges(polygonCollider1.getCorners())
    const axes:Vec2[] = []
    for (const edge of edges) {
        axes.push(normalize(ortho(edge))) 
    }
    return axes
}

//TODO: FIND A POINT FURTHER DOWN RELATIVE TO ANOTHER POINT


// Get the ratio of p1 on the line to point 2
// assumes points are on the same line
const isP2FurtherPoint = (p1: Vec2, p2: Vec2, axis: Vec2): boolean => {
    return dot(p1, axis) < dot(p2, axis)
}

// find the 2 points on the projection that are in the shadow of the shape
const projVec = (p:Vec2, axis:Vec2): Vec2 => {return scaleVec(axis, dot(p, axis) / dot(axis, axis)) }

const projShape = (corners: Vec2[], axis:Vec2): Vec2[] => {
    // each of these points are on the line of the axis at the origin
    let startPoint: Vec2 = projVec(corners[0], axis)
    let endPoint: Vec2 = projVec(corners[1], axis)
    
    for (const corner of corners.slice(2)) {
        const testPoint = projVec(corner, axis)
        if (isP2FurtherPoint(subVec(endPoint,testPoint), subVec(endPoint,startPoint), axis))
            startPoint = testPoint
        
        if (!isP2FurtherPoint(subVec(startPoint, testPoint), subVec(startPoint,endPoint), axis))
            endPoint = testPoint
        
    }
    return [startPoint, endPoint]
}


//https://dyn4j.org/2010/01/sat/ <- algorithm to detect collisons in convex polygon
// Nolan is a roman
/** sats lover */
const SATSolver = (polygonCollider1: PloygonCollider, polygonCollider2: PloygonCollider): [isColliding:boolean,overlapAmount:number, direction:Vec2]  => {
    const corners1 = polygonCollider1.getCorners()
    const corners2 = polygonCollider2.getCorners()
    
    // The normals of the Shape
    const axes = [... getAxes(getEdges(corners1)), ... getAxes(getEdges(corners2))]
    
    let smallestOverlapAmount = Infinity;
    let mtvAxis = axes[0];

    let check = 0
    // console.log(axes)
    for (const axis of axes) {
        console.log(check, axis)
        check++
        const [start_1, end_1] = projShape(corners1, axis)
        const [start_2, end_2] = projShape(corners2, axis)
        
        //check non overlap in projects
        // if one axis has two projections that don't overlap, then garenteed to not collide!
        // !(start_1 <= end_2 && start_2 <= end_1) <- if something doesn't overlap
        const start1_less_end2 = isP2FurtherPoint(start_1, end_2, axis)
        const start2_less_end1 = isP2FurtherPoint(start_2, end_1, axis)
        console.log(start1_less_end2, start2_less_end1, start_1, end_1, start_2, end_2)

        if (!(start1_less_end2 && start2_less_end1)) {
            return [false, 0, vec2(0,0)]
        } else {
            const overlapAmount = Math.min(
                vecLength(subVec(start_2,end_1)),
                vecLength(subVec(start_1,end_2))
            )
            
            if (overlapAmount < smallestOverlapAmount) {
                smallestOverlapAmount = overlapAmount;
                mtvAxis = axis;
            }
        }
    }
    return [true, smallestOverlapAmount, mtvAxis]
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
      rotate(this.center, vec2(this.x - this.width / 2, this.y - this.height / 2), this.radians), //top left
      rotate(this.center, vec2(this.x + this.width / 2, this.y - this.height / 2), this.radians), //top right
    ]
  }


  collide(Collider: Collider): Vec2 {
    if (Collider instanceof BoxCollider) {
      const [isColliding, overlapAmount, direction] = SATSolver(this, Collider);
      //TODO: these reuslts from SAT helps you find MTV but
      // I don't know how to compute MTV, this is my best guess
      return scaleVec(direction, overlapAmount* 100)

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
  
  updateLocation(center: Vec2): void {
    this.x = center.x
    this.y = center.y
    this.center = center
    this.corners = this.getCorners()
  }

  serialize(): SerializedCollider {
      return {type: 'box',x:this.x-this.width/2,y:this.y-this.height/2,width:this.width,height:this.height}
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

  updateLocation(point: Vec2): void {
    throw new Error('Method not implemented.');
  }

  serialize(): SerializedCollider {
      throw new Error('Method not implemented.');
  }
}

// ciclre
type CapsuleCircle = {
  center: Vec2;
  radius: number;
}

type CapsuleRectangle = {
  center: Vec2;
  width: number;
  height: number;
}

// new CapsuleCollider(100, 100, 40, 100, 20);
// would give 40 pixels wide, 100 tall, radius 20
export class CapsuleCollider implements Collider {

  // ok so a capsule is union between central rectangle
  // and 2 circles
  // line between circle cneters is capsule's spine
  
  // width and height is capsule total outside bound
  // shorte dimension should equal circle diameter
  private center: Vec2;
  private body: CapsuleRectangle;
  private caps: [CapsuleCircle, CapsuleCircle];
  
  // collider config
  debug = false;
  mask = 0;

  private collisionCallbacks: Array<() => void> = [];

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  )
  {
    // bad
    if (width <= 0 || height <= 0) {
      throw new RangeError(
        "WRONG CAPSULE",
      );
    }

    if (radius <= 0) {
      throw new RangeError(
        "WRONG CAPSULE",
      );
    }
    
    // logic
    const horizontal = width >= height;
    const girth = horizontal ? height : width;
    const diameter = radius * 2;

    if (Math.abs(girth - diameter) > 0.001) {
      throw new RangeError(
        "The capsule's girth is strange" // needs to be 2x radius
      )
    }

    this.center = vec2(x, y);

    // remove radius from each gives distance from center of
    // both balls which is the body's length
    const totalLength = horizontal ? width : height;
    const spineLength = Math.max(0, totalLength - diameter);
    const halfSpineLength = spineLength / 2;

    this.body = {
      center: vec2(x, y),
      width: horizontal ? spineLength : diameter,
      height: horizontal ? diameter : spineLength,
    };

    this.caps = horizontal
    ? [
        {
          center: vec2(x - halfSpineLength, y),
          radius,
        },
        {
          center: vec2(x + halfSpineLength, y),
          radius,
        },
      ]
    : [
        {
          center: vec2(x, y - halfSpineLength),
          radius,
        },
        {
          center: vec2(x, y + halfSpineLength),
          radius,
        },
    ];
  }

  getNearestPoint(point: Vec2): Vec2 {
    // throw new Error('Method not implemented.');
    const [startCap, endCap] = this.caps;

    // first find closest point on spine
    // clamp projection for rod and balls
    const spine = subVec(endCap.center, startCap.center);
    const fromStart = subVec(point, startCap.center);

    const spineLengthSquared = spine.x * spine.x + spine.y * spine.y;

    const projection = spineLengthSquared === 0 ? 0 : (fromStart.x * spine.x + fromStart.y * spine.y) / spineLengthSquared;
    const t = Math.max(0, Math.min(1, projection));

    const nearestSpinePoint = {
      x: startCap.center.x + spine.x * t,
      y: startCap.center.y + spine.y * t,
    };

    // move from spine to target pt by one radius
    // this is the nearest pt on capsule outer surface
    const outward = subVec(point, nearestSpinePoint);
    const outwardLength = Math.hypot(outward.x, outward.y);
    
    if (outwardLength > 0) {
      return {
        x: nearestSpinePoint.x + outward.x / outwardLength * startCap.radius,
        y: nearestSpinePoint.y + outward.y / outwardLength * startCap.radius,
      };
    }

    // a point exactly on spine has no outward direction so we pick one perp direction
    const normal = spineLengthSquared === 0 ? vec2(1, 0) : normalize(ortho(spine));
    return {
      x: nearestSpinePoint.x + normal.x * startCap.radius,
      y: nearestSpinePoint.y + normal.y * startCap.radius,
    };
  }

  updateLocation(center: Vec2): void {
    const offsetX = center.x - this.center.x;
    const offsetY = center.y - this.center.y;

    this.center = { ...center };
    this.body.center = { ...center };
    
    for (const cap of this.caps) {
      cap.center.x += offsetX;
      cap.center.y += offsetY;
    }
  }

  // collision lifecycle
  collide(Collider: Collider): Vec2 {
    // for later once boxCollider and CircleCollider have usable geometry
    return vec2(0, 0);
  }

  onCollide(cb: () => void): void {
      this.collisionCallbacks.push(cb);
  }

  

  serialize(): SerializedCollider {
      return {type: 'capsule',x:this.center.x,y:this.center.y,width:this.body.width,height:this.body.height}
  }
}



