// MVP should support:
// create party
// join and leave party
// display current party members
// embark the party
// enemy and projectiles be party local

/**
 * Properties:
 * 1. Leader would start the embark
 * 2. Players in the party should only see each other in the party, enemies generated is also party local. Also projectiles n stuff
 * 3. Default party that everyone joins is empty string party, party cannot create empty party
 */
export type Party = {
  id: string;
  leaderSessionId: string;
  memberSessionIds: Set<string>;
  status: "lobby" | "embarked";
  embarkId?: string;
};