import z from "zod";

export const playerIdSchema = z.number();

export const playerSchema = z.object({
  id: playerIdSchema,
  x: z.number(),
  y: z.number(),
  x_vel: z.number(),
  y_vel: z.number(),
  baaing: z.string(),
});
export type Player = z.infer<typeof playerSchema>;


export const meatBallSchema = z.object({
  id: playerIdSchema,
  x: z.number(),
  y: z.number(),
  height: z.number()
});
export type MeatBall = z.infer<typeof meatBallSchema>;

export const wholeFkingGameState = z.object({
	players: z.array(playerSchema),
  meatballs: z.array(meatBallSchema).optional(),
  // add to this when you want the client to know more about the game
});
export type WholeFkingGameState = z.infer<typeof wholeFkingGameState>;