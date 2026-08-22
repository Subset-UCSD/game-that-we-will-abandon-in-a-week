import z from "zod";

export const playerIdSchema = z.number();

export const playerSchema = z.object({
  id: playerIdSchema,
  x: z.number(),
  y: z.number(),
  x_vel: z.number(),
  y_vel: z.number(),
  facingLeft:z.boolean(),
  baaing: z.string(),
  connected: z.boolean(),
  timeSinceLastInput:z.number(),
  hp: z.number(),
  maxHp: z.number(),
});
export type Player = z.infer<typeof playerSchema>;

// =================================== BEGIN GAME OBJECTS =====================================

function $gameObject<Type extends string, Properties extends z.ZodType>(name: Type, props: Properties) {
	return z.object({
		type: z.literal(name),
    id: playerIdSchema,
    x: z.number(),
    y: z.number(),
		props
	});
}

export const meatBallSchema = $gameObject("meatball", z.object({height: z.number()}));
export type MeatBall = z.infer<typeof meatBallSchema>;

export const explosionSchema = $gameObject("explosion", z.object({radius: z.number()}));
export type Explosion = z.infer<typeof explosionSchema>;

export const gameObject = z.discriminatedUnion("type", [meatBallSchema, explosionSchema])
export type GameObject = z.infer<typeof gameObject>;

// ================================ END GAME OBJECTS ==========================================

export const wholeFkingGameState = z.object({
	players: z.array(playerSchema),
  gameObjects: z.array(gameObject)
  // add to this when you want the client to know more about the game
});
export type WholeFkingGameState = z.infer<typeof wholeFkingGameState>;