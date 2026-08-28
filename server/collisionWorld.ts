import { isZeroVec } from "@common";
import { Game } from "@server/game"


export
	class CollisionWorld {
	constructor(private readonly game: Game) { }

	tick() {
		// since we are iterating over game objects twice, we can QUARTER the iterations by filtering first
		const collideables = this.game.gameObjects.filter(cock => cock.collider);

		for (const [i, b] of collideables.entries()) {
			for (let j = 0; j < i; j++) {
				const a = collideables[j]
				if (!(b.collider && a.collider)) continue;

				// do we need both?
				// no we dont need both
				const mtv = b.collider.collide(a.collider);
				if (!isZeroVec(mtv)) {
					a.hasCollidedWith(b, mtv);
					b.hasCollidedWith(a, mtv);
				}


				// const mtv2 = gameObj2.collider.collide(gameObj1.collider);
			}
		}
	}

	serialize() {
		return 67
	}
}