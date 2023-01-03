class Block {
    constructor({
        position = p.createVector(0, 0),
        velocity = p.createVector(0, 0),
        acceleration = p.createVector(0, 0),
        mass = 10,
        maxLifeTime = 300,
        displayFunction = (note) => { },
        maxSpeed = 7000,
        maxForce = 7000
    }) {
        this.position = position;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.mass = mass;
        this.lifeTime = 0;
        this.maxLifeTime = maxLifeTime;
        this.displayFunction = displayFunction;
        this.maxSpeed = maxSpeed;
        this.maxForce = maxForce;
    }
    update() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.acceleration.mult(0);
        this.lifeTime++;
    }

    limitVelocity(value) {
        this.velocity.limit(value);
    }
    limitAcceleration(value) {
        this.acceleration.limit(value);
    }

    applyForce(force) {
        let f = force.copy();
        f = f.limit(this.maxForce)
        this.acceleration.add(f.div(this.mass));
    }
    applyGravity(g) {
        let gravity = p.createVector(0, this.mass * g);
        this.applyForce(gravity);
    }
    applyFriction(c) {
        let friction = this.velocity.copy();
        friction.mult(-1);
        friction.normalize();
        friction.mult(c);
        this.applyForce(friction);
    }
    applyAirDrag(c) {
        let speed = this.velocity.mag();
        let dragMagnitude = c * speed * speed;
        let airDrag = this.velocity.copy();
        airDrag.mult(-1);
        airDrag.normalize();
        airDrag.mult(dragMagnitude);
        this.applyForce(airDrag);
    }

    moveTo(newPosition, desiredR = 100) {
        let desired = p5.Vector.sub(newPosition, this.position);
        let d = desired.mag();
        desired.normalize();
        if (d < desiredR) {
            let m = p.map(d, 0, desiredR, 0, this.maxSpeed);
            desired.mult(m);
        } else {
            desired.mult(this.maxSpeed);
        }
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce);
        this.applyForce(steer);
    }

    checkEdges() {
        if (this.position.x < -p.width / 2 || this.position.x > p.width / 2) {
            this.velocity.x *= -1;
        }
        if (this.position.y < -p.height / 2 || this.position.y > p.height / 2) {
            this.velocity.y *= -1.03;
        }
    }

    display() {
        this.displayFunction(this);
    }

    isDead() {
        if (this.lifeTime > this.maxLifeTime) {
            return true;
        } else {
            return false;
        }
    }
}

class Box {
    constructor(x, y, w, h, density = 1.0, friction = 0.5, restitution = 0.2, linearVelocity = new box2d.b2Vec2(p.random(-5, 5), p.random(2, 5)), angularVelocity = (p.random(-5, 5)), borderColor = [200, 200, 200], fillColor = [255, 255, 255]) {
        this.w = w;
        this.h = h;
        this.borderColor = borderColor;
        this.fillColor = fillColor;

        //定义一个box
        let bd = new box2d.b2BodyDef();
        bd.type = box2d.b2BodyType.b2_dynamicBody;
        bd.position = scaleToWorld(x, y);

        //定义一个夹具
        let fd = new box2d.b2FixtureDef();

        //定义一个形状
        fd.shape = new box2d.b2PolygonShape();
        fd.shape.SetAsBox(scaleToWorld(this.w / 2), scaleToWorld(this.h / 2));//坐标转换

        //在夹具中设置物理参数
        fd.density = 1.0;
        fd.friction = 0.5;
        fd.restitution = 0.2;

        //创建物体
        this.body = world.CreateBody(bd);
        //绑定物体和夹具
        this.body.CreateFixture(fd);

        //额外设置
        this.body.SetLinearVelocity(linearVelocity);
        this.body.SetAngularVelocity(angularVelocity);

        this.body.SetUserData(this);
    }

    //删除物体
    killBody() {
        world.DestroyBody(this.body);
    }

    //是否删除
    done() {
        let transform = this.body.GetTransform();
        let pos = scaleToPixels(transform.position);
        if (pos.y > p.height + this.r * 2) {
            this.killBody();
            return true;
        }
        return false;
    }

    contains(x, y) {
        let worldPoint = scaleToWorld(x, y);
        let f = this.body.GetFixtureList();
        let inside = f.TestPoint(worldPoint);
        return inside;
    }

    changeColor() {
        this.borderColor = [255, 255, 0];
    }

    display() {
        //获取位置和角度信息
        let pos = scaleToPixels(this.body.GetPosition());
        let a = this.body.GetAngleRadians();

        p.rectMode(p.CENTER);
        p.push();
        p.translate(pos.x, pos.y);
        p.rotate(a);
        p.fill(this.fillColor[0], this.fillColor[1], this.fillColor[2]);
        p.stroke(this.borderColor[0], this.borderColor[1], this.borderColor[2]);
        p.strokeWeight(2);
        p.rect(0, 0, this.w, this.h);
        p.pop();
    }
}

class Boundary {
    //x,y,宽,高
    constructor(x, y, w, h, density = 1.0, friction = 0.5, restitution = 0.2) {
        this.x = x;
        this.y = y;
        this.w = w * 2;
        this.h = h * 2;

        let fd = new box2d.b2FixtureDef();
        fd.density = density;
        fd.friction = friction;
        fd.restitution = restitution;

        let bd = new box2d.b2BodyDef();

        bd.type = box2d.b2BodyType.b2_staticBody;
        bd.position.x = scaleToWorld(this.x);
        bd.position.y = scaleToWorld(this.y);
        fd.shape = new box2d.b2PolygonShape();
        fd.shape.SetAsBox(this.w / (scaleFactor * 2), this.h / (scaleFactor * 2));
        this.body = world.CreateBody(bd).CreateFixture(fd);
    }

    display() {
        p.fill(127);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(this.x, this.y, this.w, this.h);
    }
}

class Circle {
    constructor(x, y, r, density = 1.0, friction = 0.1, restitution = 0.3, linearVelocity = new box2d.b2Vec2(p.random(-5, 5), p.random(2, 5)), angularVelocity = (p.random(-5, 5)), borderColor = [200, 200, 200], fillColor = [255, 255, 255]) {
        this.r = r;
        this.borderColor = borderColor;
        this.fillColor = fillColor;

        let bd = new box2d.b2BodyDef();
        bd.type = box2d.b2BodyType.b2_dynamicBody;
        bd.position = scaleToWorld(x, y);

        let fd = new box2d.b2FixtureDef();
        fd.shape = new box2d.b2CircleShape();
        fd.shape.m_radius = scaleToWorld(this.r);

        fd.density = density;
        fd.friction = friction;
        fd.restitution = restitution;

        this.body = world.CreateBody(bd);
        this.body.CreateFixture(fd);

        //额外设置
        this.body.SetLinearVelocity(linearVelocity);
        this.body.SetAngularVelocity(angularVelocity);

        this.body.SetUserData(this);
    }

    //删除物体
    killBody() {
        world.DestroyBody(this.body);
    }

    //是否删除
    done() {
        let transform = this.body.GetTransform();
        let pos = scaleToPixels(transform.position);
        if (pos.y > p.height + this.r * 2) {
            this.killBody();
            return true;
        }
        return false;
    }

    contains(x, y) {
        let worldPoint = scaleToWorld(x, y);
        let f = this.body.GetFixtureList();
        let inside = f.TestPoint(worldPoint);
        return inside;
    }

    changeColor() {
        this.borderColor = [255, 255, 0];
    }

    display() {
        let pos = scaleToPixels(this.body.GetPosition());
        let a = this.body.GetAngleRadians();

        // p.rectMode(p.CENTER);
        p.push();
        p.translate(pos.x, pos.y);
        // p.rotate(a);
        p.fill(this.fillColor[0], this.fillColor[1], this.fillColor[2]);
        p.stroke(this.borderColor[0], this.borderColor[1], this.borderColor[2]);
        p.strokeWeight(1);
        p.ellipse(0, 0, this.r * 2, this.r * 2);
        // p.line(0, 0, this.r, 0);
        p.pop();
    }
}

class JointDistanceObject {
    constructor(obj1, obj2, len, frequencyHz = 3, dampingRatio = 0.1) {
        this.len = len;

        this.p1 = obj1;
        this.p2 = obj2;

        let djd = new box2d.b2DistanceJointDef();
        //连接
        djd.bodyA = this.p1.body;
        djd.bodyB = this.p2.body;
        //长度
        djd.length = scaleToWorld(this.len);

        //设置关节物理属性
        djd.frequencyHz = frequencyHz;
        djd.dampingRatio = dampingRatio;

        let dj = world.CreateJoint(djd);
    }

    done() {
        return this.p1.done() && this.p2.done();
    }

    display() {
        let pos1 = scaleToPixels(this.p1.body.GetPosition());
        let pos2 = scaleToPixels(this.p2.body.GetPosition());

        p.stroke(0);
        p.strokeWeight(1);
        p.line(pos1.x, pos1.y, pos2.x, pos2.y);

        this.p1.display();
        this.p2.display();
    }
}
