import { SerializedCorpse, GameObject } from "@common/game";



export class Corpse implements GameObject {
    static #nextId = 0
    shouldDelete = false
    #publicState: SerializedCorpse

    constructor (publicState: Omit<SerializedCorpse, 'id'> ) {
        this.#publicState = {...publicState,
            id: Corpse.#nextId++,
        }
    }

    tick(): void {
        // TODO
    }

    serialize(): SerializedCorpse {
        return this.#publicState
    }
}
