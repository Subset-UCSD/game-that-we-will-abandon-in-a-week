import { Explosion as ExplosionType } from "@common/game";

export class Explosion implements GameObject {
	public publicState: ExplosionType;
  public shouldDelete = false;
  durationTicks = 70

  constructor(props: ExplosionType) {
		this.publicState = props;
	}

  tick(): void {
    if (this.shouldDelete) return;
  }

  serialize(): ExplosionType {
    return this.publicState;
  }
}
