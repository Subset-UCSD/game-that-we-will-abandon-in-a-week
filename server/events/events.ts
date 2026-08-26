import z from "zod";

/**
 * EVENT schema helper. This returns a zod schema for EVENT shape with a payload
 * @param name The literal name of the EVENT
 * @param value The Zod schema that defines the shape of your EVENT's payload
 * cannot be undefined or void!!!
 */
function $EVENT<Type extends string, Payload extends z.ZodType>(name: Type, value: Payload) {
	return z.object({
		type: z.literal(name),
		value
	});
}

/**
 * Events need to be added here to be subscribed to or emitted. Please don't
 * create events that will need to be emitted multiple times within a single
 * game tick. 
 * 
 * If you're creating an event that can trigger multiple times per tick, try
 * to see if you can aggregate the event payload into one message.
 * 
 * It's probably fine to have a few events that fire multiple times per tick
 * if necessary, but less of that means less headache later on
 * 
 * Same goes for subscriber callback functions. Try to keep those as light-
 * weight as possible (just setting some values for the next tick to process)
 */

// =========================== ADD EVENTS BELOW ============================

const PlayerMoveEvent = $EVENT("players:move", z.array(z.object({
	id: z.string(),
	x: z.number(),
	y: z.number()
})));

const PlayerShitEvent = $EVENT("player:shit", z.object({
	id: z.string()
}));

// =========================== ADD EVENTS ABOVE ============================

export const eventSchema = z.discriminatedUnion("type", [
	PlayerMoveEvent,
	PlayerShitEvent
]);
export const eventNameSchema = z.union([...eventSchema.options.map(x=>x.def.shape.type)]);
export type Event = z.infer<typeof eventSchema>;