## Something similar to Hades but multiplayer
- 3 act
- each act multiple rooms, a miniboss, and a boss

## Gameplay Loop
- each "run" is an embark
- each embark create a "party" that varied amount of people can join
- the party collect specific resources during embarks
- embark should have the flexibility to explore different areas for different resources
- unlock new area with resources
    - ex. key to act 2 
        - key here is abstract, it could be that an area is foggy and need to make a latern before able to enter (u can still enter but take extra damage or smth)
    - ex. different areas for more resources
- build stuff at base with resources
    - corekeeper style

### HL Implementation plan
1. event system (refactor)
    a. movement
    b. damage
2. combat system (unordered)
    a. enemy
    b. enemy generation system
    c. miniboss and boss
    d. damage and health
        - depends on colliders
    e. consumables
    f. weapons
3. room system
    a. having different room where players only see each other in the same room
4. party system 
    a. during an embark you can only see other party members
    b. system for roguelike during embark (consider things like one member died in a room)
5. room generation system
6. resources system
7. unlockable system
8. interactable system

### Tangent ideas
1. overarching story design
2. dialogue system design
3. decoration system

### Anticipated roadblocks
- performance with high amount of colliders/objects