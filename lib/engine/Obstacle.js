
class Obstacle {
    constructor(width, height, health) {
        this.x = 0;
        this.y = 0;

        this.width = width;
        this.height = height;

        this.health = health;
    }

    square() {
        return this.width * this.height;
    }

    move(x, y) {
        this.x = x;
        this.y = y;
    }

    has_intersection(other) {

        let has_on_x = (this.x <= other.x && other.x <= this.x + this.width ||
            this.x <= other.x + other.width && other.x + other.width <= this.x + this.width);

        let has_on_y = (this.y <= other.y && other.y <= this.y + this.height||
            this.y <= other.y + other.height && other.y + other.height <= this.y + this.height);

        return has_on_x && has_on_y;
    }

    is_destroyed() {
        return this.health <= 0;
    }

    hurt(damage) {
        this.health = Number.max(0, this.health - damage);
    }
}

module.exports = exports = Obstacle;
