let deepcopy = require('deepcopy');
const Bullet = require('./Bullet');
const config = require('./config');

class Tank {
    constructor(id, x, y) {
        this.id = id;
        this.frags = 0;
        this.in_game = false;

        this.x = x;
        this.y = y;

        // alpha (absolute tank angle)
        this.angle = config.TANK_PARAMS['angle'];

        this.width = config.TANK_PARAMS['width'];
        this.height = config.TANK_PARAMS['height'];

        this.gun_length = config.TANK_PARAMS['gun_length'];

        this.health = config.TANK_PARAMS['health'];

        this.gun = deepcopy(config.TANK_PARTS.gun);
        this.turret = deepcopy(config.TANK_PARTS.turret);
        this.left_track = deepcopy(config.TANK_PARTS.left_track);
        this.right_track = deepcopy(config.TANK_PARTS.right_track);
    }

    // Getters

    get tank_id() {
        return this.id;
    }

    get l_track_speed() {
        return this.left_track.speed;
    }

    get r_track_speed() {
        return this.right_track.speed;
    }

    get is_fire() {
        return this.gun.is_fire;
    }

    // Physics

    move(dt) {
        const alpha = this.angle;
        const l = this.width;

        const v1 = this.l_track_speed;
        const v2 = this.r_track_speed;
        const w = (v1 - v2) / l; // angular speed
        const v = (v1 + v2) / 2; // linear speed

        let dx = 0, dy = 0;
        let beta = alpha;

        if (w === 0) {
            dx = v * dt * Math.cos(alpha);
            dy = v * dt * Math.sin(alpha);
        } else {
            const R = l / 2 * ((v1 + v2) / (v1 - v2));
            beta = alpha + w * dt;
            dx = R * (Math.cos(alpha + Math.PI/2) - Math.cos(beta + Math.PI/2));
            dy = R * (Math.sin(alpha + Math.PI/2) - Math.sin(beta + Math.PI/2));
        }

        this.turret.angle += this.turret.speed * dt;
        this.turret.angle %= 2 * Math.PI;

        this.x += dx;
        this.y += dy;

        this.angle = (beta) % (2 * Math.PI);
    }

    // Service methods

    is_not_part_broken(part) {
        return part.health > 0;
    }

    is_part_broken(part) {
        return part.health <= 0;
    }

    // Logic here

    fire() {
        if (this.gun.reload) {
            this.gun.reload--;
            return null;
        }
        if (this.is_not_part_broken(this.gun) && this.gun.ammunition > 0) {
            this.gun.ammunition -= 1;
            this.gun.reload = this.gun.reload_time;
            return new Bullet(
                this,
                this.x,
                this.y,
                (this.angle + this.turret.angle),
                this.gun.bullet_speed,
                this.gun.bullet_dist,
                this.gun.bullet_damage
            );
        }

        return null;
    }

    die() {
        this.gun.player && this.gun.player.leaveTank(this);
        delete this.gun.player;

        this.turret.player && this.turret.player.leaveTank(this);
        delete this.turret.player;

        this.left_track.player && this.left_track.player.leaveTank(this);
        delete this.left_track.player;

        this.right_track.player && this.right_track.player.leaveTank(this);
        delete this.right_track.player;

        this.in_game = false;
        this.health = 0;
    }

    hurt(tank_part_str, damage, enemy) {
        if (tank_part_str === 'tank' || this.is_part_broken(this[tank_part_str])) {
            // all damage to main health
            this.health = Math.max(0, this.health - damage);
        } else {
            // damage to tank part
            let part = this[tank_part_str];

            let new_part_health = part['health'] - damage;

            if (new_part_health < 0) {
                // part is fully destroyed after given damage - spend rest of the damage to the main health

                part['health'] = 0;

                this.health = Math.max(0, this.health + new_part_health);

            }
            else {
                part['health'] = new_part_health;
            }
        }

        // die if health of the tank is empty after the damage
        if (this.is_health_empty()) {
            this.die();
            enemy.frags++;
        }
    }

    is_health_empty() {
        return this.health <= 0;
    }

    // public methods

    joinTurret(player) {
        return this.turret.player = player;
    }

    joinLeftTrack(player) {
        return this.left_track.player = player;
    }

    joinRightTrack(player) {
        return this.right_track.player = player;
    }

    joinGun(player) {
        return this.gun.player = player;
    }

    isTurretEmpty() {
        return this.turret.player == null;
    }

    isLeftTrackEmpty() {
        return this.left_track.player == null;
    }

    isRightTrackEmpty() {
        return this.right_track.player == null;
    }

    isGunEmpty() {
        return this.gun.player == null;
    }

    canPlay() {
        return [
            this.isTurretEmpty(),
            this.isGunEmpty(),
            this.isLeftTrackEmpty(),
            this.isLeftTrackEmpty(),
            this.isDead()
        ].some(v => !v);
    }

    isDead() {
        return this.is_health_empty();
    }

    setLeftTrackMoving(accelerate) {
        this.left_track.speed = this.left_track.max_speed * accelerate;
    }

    setRightTrackMoving(accelerate) {
        this.right_track.speed = this.right_track.max_speed * accelerate;
    }

    setTurretMoving(accelerate) {
        this.turret.speed = this.turret.max_speed * accelerate;
    }

    setFire(accelerate) {
        this.gun.is_fire = accelerate;
    }

    getFrags() {
        return this.frags;
        // TODO:
        // return number of killed tanks
    }
}

module.exports = Tank;
