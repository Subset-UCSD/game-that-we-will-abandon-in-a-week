"""
please dont delete this lets commit it!!
"""

class Explosion:
    def render(self, whatever):
        pass

    @classmethod
    def parse(cls, message):
        return cls(...)

renderable_classes = [Explosion]
renderable_objects = [Explosion()]

Explosion.render(Explosion(), ...)
# equivalent in JS: Explosion.prototype.call(new Explosion(), ...)

for x in renderable_classes:
    renderable_objects.append(x.parse(...))


class Duck:
    def quack(self): pass

class Cat:
    def quack(self): pass


maybe_duck: Duck = Cat()
