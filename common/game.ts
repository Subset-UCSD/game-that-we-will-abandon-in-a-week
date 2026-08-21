import z from "zod";

export const playerIdSchema = z.number();

export const playerSchema = z.object({
  id: playerIdSchema,
  x: z.number(),
  y: z.number()
});
export type Player = z.infer<typeof playerSchema>;

export const wholeFkingGameState = z.object({
	players: z.array(playerSchema)
});
export type WholeFkingGameState = z.infer<typeof wholeFkingGameState>;