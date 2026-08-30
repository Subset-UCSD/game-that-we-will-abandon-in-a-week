// import { randomBytes } from "node:crypto";
import { type Event, eventNameSchema } from "./events";

/**
 * This hunk throws an error if this file ever gets imported/executed twice. registeredEvents needs
 * to remain a singleton across our entire server otherwise this file's assumptions fail.
 */
let doubleLoad = false;
if (doubleLoad) {
	throw new Error(
		`shitass; you somehow re-ran this module import (${import.meta.dirname}/${
			import.meta.filename
		}) twice which means events will be broken. congrats.`,
	);
} else {
	doubleLoad = true;
}
// aforementioned singleton
// Eventually once we want to support multiple instances of our game, move this to whatever
// class represents 1 instance of a game
const registeredEvents: Map<Event["type"], Map<string, (data: any) => void>> = new Map();

const RAND_ATTEMPT_THRESHOLD = 100;
const SUBSCRIBER_ID_NUM_BYTES = 2;

/**
 * Anyone across the whole server can LIKE and SUBSCRIBE to any event! This gives us the ability to
 * cleanly handle game logic outside of the main game.ts.
 *
 * Objects that need to know information (such as an enemy needing to know where a player is) can
 * subscribe to an event that will update their internal state so they know what to do in the next
 * game tick (move towards the player to try to kill them)
 *
 * The use case I imagine for this:
 * Enemy gameobject:
 *    subscribe("players-move", (players) => {
 *      // This class' specific handling logic for this event
 *      // ex: pick closest player; set enemy walk direction towards player
 *    });
 *
 * Inside of game.ts:
 *    handlePlayerInput(inputs) {
 *      // Tell every person listening to this event
 *      emit("players-move", <all players' positional data>);
 *    }
 */
export function subscribe<T extends Event["type"], V extends Extract<Event, { type: T }>>(
	name: T,
	cb: (data: V["value"]) => void,
	cleanup?: WeakKey,
) {
	if (!registeredEvents.has(name)) {
		registeredEvents.set(name, new Map());
	}
	const handlers = registeredEvents.get(name)!;
	let id = crypto.randomUUID();
	let n_iter = 0;
	while (handlers.has(id)) {
		id = crypto.randomUUID();
		if (n_iter > RAND_ATTEMPT_THRESHOLD) {
			throw new Error(
				`bro i tried ${RAND_ATTEMPT_THRESHOLD} times to generate a random number to let you LIKE AND SUBSCRIBE to ${name}` +
					`event but your shitass already have TOO MANY SUBSCRIBER. what the fuck that's like ${(2 ** 8) ** SUBSCRIBER_ID_NUM_BYTES} different` +
					`events. surely that's a bug. surely you must be joking. fix your code dump ass. or clean up listeners like your supposed to. lock tf in`,
			);
		}
	}

	handlers.set(id, cb);

	const unsubscribeKey = `${name}-${id}`;
	if (cleanup) {
		new FinalizationRegistry((key: string) => {
			console.log("FinalizationRegistry actually works, that's cool");
			unsubscribe(key);
		}).register(cleanup, unsubscribeKey);
	} else {
		// they need to manually unsubscribe. out of our hands if they want to cause a MEMORY LEAK
		console.warn(`Subscribing to ${name} WITHOUT an automatic cleanup object. Hope u know what ur doing buddy.`);
	}
	return unsubscribeKey;
}

/**
 * oops you posted cringe, your going to loose subscriber.
 *
 * You need to call this with the key returned when subscribing to an event
 * in order to clean up the event registry map when the object no longer needs updates
 * or you will OOM if you're adding too many subscribers w/o this cleanup;
 */
export function unsubscribe(key: string) {
	const split = key.split("-");
	if (split.length !== 2) throw new Error(`idk what "${key}" is but that is NOT how you unsubscribe`);
	const name = eventNameSchema.safeParse(split[0]);
	if (!name.success) {
		throw new Error(`idk what ${split[0]} is but it is certainly not the name of an event that I know about`);
	}
	const handlers = registeredEvents.get(name.data);
	if (!handlers || !handlers.has(split[1])) throw new Error(`i have no subscribers registered for "${key}". you lied`);
	handlers.delete(split[1]);
}

/**
 * Emit a new event for any of your subscribers to listen to, pretty self-explanatory
 *
 * Try to keep events of a single type emitted only once per game tick max. You can go over but
 * if you're emitting like 20-30 events per game tick with a lot of subscribers, the server's
 * probably going to lag a little bit. This is untested/speculation, so feel free to try to break
 * it to see what the limit is
 */
export function emit<T extends Event["type"], V extends Extract<Event, { type: T }>>(name: T, value: V["value"]) {
	const handlers = registeredEvents.get(name);
	if (!handlers || handlers.size === 0) {
		console.warn(`BOZO ALERT! you have zero (0) subscribers who want to listen to your event: ${name}`);
		return;
	}
	for (const [_, func] of handlers) {
		func(value);
	}
	return handlers.size;
}
