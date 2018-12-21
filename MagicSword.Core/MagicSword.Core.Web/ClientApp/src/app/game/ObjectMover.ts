import * as THREE from "three";
import { Game } from "@App/game/Game";
import { Card } from "@App/game/logic/Card";
import { IActor } from "@App/game/logic/IActor";

export enum STATE {
    NONE = -1,
    ROTATE = 0,
    PAN = 2,
    TOUCH_ROTATE = 3,
    TOUCH_DOLLY_PAN = 4
}

type Handler<TE> = (event: TE) => void;

class EventDispatcher<TE> {
    private handlers: Handler<TE>[] = [];
    fire(event: TE) {
        for (let h of this.handlers) {
            h(event);
        }
    }
    register(handler: Handler<TE>) {
        this.handlers.push(handler);
    }
}


class PanEvent {

}

export class ObjectMover {

    private mouseButtons = { LEFT: THREE.MOUSE.LEFT, MIDDLE: THREE.MOUSE.MIDDLE, RIGHT: THREE.MOUSE.RIGHT };

    private state = STATE.NONE;

    private rotateStart = new THREE.Vector2();
    private rotateEnd = new THREE.Vector2();
    private rotateDelta = new THREE.Vector2();

    private panStart = new THREE.Vector2();
    private panEnd = new THREE.Vector2();
    private panDelta = new THREE.Vector2();

    private rotateSpeed = 1.0;
    private panSpeed = 1.0;

    //startEvent = { type: 'start' };
    //changeEvent = { type: 'change' };
    //endEvent = { type: 'end' };

    //private panStartDispatcher = new EventDispatcher<PanEvent>();

    //addEventListener = function (eventName, callback) {
    //    this.events[eventName].registerCallback(callback);
    //};

    panStartHandler: Handler<THREE.Vector2>;
    panMoveHandler: Handler<THREE.Vector2>;
    panEndHandler: Handler<THREE.Vector2>;

    constructor(private container: HTMLElement, private game: Game) {

        container.addEventListener('mousedown', this.onMouseDown, false);

        container.addEventListener('touchstart', this.onTouchStart, false);
        container.addEventListener('touchmove', this.onTouchMove, false);
        container.addEventListener('touchend', this.onTouchEnd, false);
    }

    public updateRaycaster2 = (x: number, y: number) => {

        var mouseX = (x / this.container.clientWidth) * 2 - 1;
        var mouseY = -(y / this.container.clientHeight) * 2 + 1;

        var vector = new THREE.Vector3(mouseX, mouseY, 1);
        vector.unproject(this.game.camera);

        this.game.raycaster.set(this.game.camera.position, vector.sub(this.game.camera.position).normalize());

        //this.raycaster.setFromCamera({ x: event.clientX,  y: event.clientY }, this.camera);
    }

    private onMouseDown = (event: MouseEvent) => {
        event.preventDefault();

        var x = event.offsetX;
        var y = event.offsetY;

        console.log(event);
        console.log(x + " " + y);

        switch (event.button) {
            case this.mouseButtons.LEFT:
                this.state = STATE.PAN;
                this.handlePanStart(x, y);
                break;
            case this.mouseButtons.RIGHT:
                this.state = STATE.ROTATE;
                this.handleRotateStart(x, y);
                break;
        }

        if (this.state !== STATE.NONE) {
            this.container.addEventListener('mousemove', this.onMouseMove, false);
            this.container.addEventListener('mouseup', this.onMouseUp, false);
        }

    }

    private onMouseMove = (event: MouseEvent) => {
        event.preventDefault();

        var x = event.offsetX;
        var y = event.offsetY;

        switch (this.state) {
            case STATE.ROTATE:
                this.handleRotateMove(x, y);
                break;
            case STATE.PAN:
                this.handlePanMove(x, y);
                break;
        }
    }

    private onMouseUp = (event: MouseEvent) => {

        this.container.removeEventListener('mousemove', this.onMouseMove, false);
        this.container.removeEventListener('mouseup', this.onMouseUp, false);

        var x = event.offsetX;
        var y = event.offsetY;

        switch (this.state) {
            case STATE.ROTATE:
                this.handleRotateEnd(x, y);
                break;
            case STATE.PAN:
                this.handlePanEnd(x, y);
                break;
            default:
                break;
        }
        //scope.dispatchEvent(endEvent);

        this.state = STATE.NONE;
    }

    private touchToState = (event: TouchEvent) => {
        switch (event.touches.length) {
            case 1:
                return STATE.TOUCH_DOLLY_PAN;
            case 2:
                return STATE.TOUCH_ROTATE;
            default:
                return STATE.NONE;
        }
    }

    private onTouchStart = (event: TouchEvent) => {
        event.preventDefault();

        console.log(event);

        this.state = this.touchToState(event);
        switch (this.state) {
            case STATE.TOUCH_ROTATE:
                var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                this.handleRotateStart(x, y);
                break;
            case STATE.TOUCH_DOLLY_PAN:
                var x = event.touches[0].pageX;
                var y = event.touches[0].pageY;


                x = event.touches[0].pageX - (event.touches[0].target as any).offsetLeft;
                y = event.touches[0].pageY - (event.touches[0].target as any).offsetTop;

                console.log(x + " " + y);

                this.handlePanStart(x, y);
                break;
            default:
                break;
        }

        if (this.state !== STATE.NONE) {
            //scope.dispatchEvent(startEvent);
        }
    }

    private onTouchMove = (event: TouchEvent) => {
        event.preventDefault();
        event.stopPropagation();

        var localState = this.touchToState(event);

        switch (localState) {
            case STATE.TOUCH_ROTATE:
                var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                this.handleRotateMove(x, y);
                break;
            case STATE.TOUCH_DOLLY_PAN:
                var x = event.touches[0].pageX;
                var y = event.touches[0].pageY;

                x = event.touches[0].pageX - (event.touches[0].target as any).offsetLeft;
                y = event.touches[0].pageY - (event.touches[0].target as any).offsetTop;

                this.handlePanMove(x, y);
                break;
            default:
                this.state = STATE.NONE;
                break;
        }
    }

    private onTouchEnd = (event: TouchEvent) => {

        switch (this.state) {
            case STATE.TOUCH_ROTATE:
                var x = 0.5 * (event.changedTouches[0].pageX + event.touches[1].pageX);
                var y = 0.5 * (event.changedTouches[0].pageY + event.touches[1].pageY);
                this.handleRotateEnd(x, y);
                break;
            case STATE.TOUCH_DOLLY_PAN:
                var x = event.changedTouches[0].pageX;
                var y = event.changedTouches[0].pageY;

                //x = event.touches[0].pageX - (event.touches[0].target as any).offsetLeft;
                //y = event.touches[0].pageY - (event.touches[0].target as any).offsetTop;

                this.handlePanEnd(x, y);
                break;
            default:
                break;
        }
        this.state = STATE.NONE;
    }


    handlePanStart(x: number, y: number) {
        //this.panStart.set(x, y);

        //this.dispatchEvent(startEvent);
        //if (this.panStartHandler) {
        //    this.panStartHandler(this.panStart);
        //}

        this.updateRaycaster2(x, y);

        var intersects = this.game.raycaster.intersectObjects(this.game.interectionObjects, true);

        if (intersects.length > 0) {

            var hitMesh = intersects[0].object;
            var hitActor = <IActor>hitMesh.userData["parent"];

            var attr = hitMesh.userData[Card.attributeData];
            if (attr) {
                //var card = hitActor as Card;
                //this.eventDispatcher.cardSetAttributeClientEventHandler.increment(card, attr, event.buttons === 2 ? -1 : 1);
            }

            if (hitActor.selectable) {
                this.game.world.selectActor(hitActor);
            } else {
                this.game.world.clearSelectedActor();
            }

            if (hitActor.draggable) {
                this.game.draggedObject = hitActor.object3D;
                this.game.dragInitialPosition.copy(this.game.draggedObject.position);
                this.game.dragInitialRotation.copy(this.game.draggedObject.rotation);
                this.game.controls.enabled = false;
            }
        } else {
            this.game.world.clearSelectedActor();
        }
    }

    handlePanMove = (x: number, y: number) => {
        //this.panEnd.set(x, y);
        //this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
        //this.pan(this.panDelta.x, this.panDelta.y);
        //this.panStart.copy(this.panEnd);
        ////scope.update();

        //if (this.panMoveHandler) {
        //    this.panMoveHandler(this.panDelta);
        //}

        this.updateRaycaster2(x, y);

        if (this.game.draggedObject) {

            //if (event.buttons === 2) {
            //    this.draggedObject.rotateY((event.movementX) / 300);

            //} else {
            var intersects = this.game.raycaster.intersectObject(this.game.plane);
            var intersect = intersects[0].point;
            this.game.draggedObject.position.x = intersect.x;
            this.game.draggedObject.position.z = intersect.z;

            //}
        }
    }

    handlePanEnd = (x: number, y: number) => {
        //this.panEnd.set(x, y);
        //if (this.panEndHandler) {
        //    this.panEndHandler(this.panEnd);
        //}

        if (!this.game.draggedObject) {
            return;
        }

        var finalPosition = this.game.draggedObject.position;

        if (finalPosition.distanceTo(this.game.dragInitialPosition) > 0.001) {
            var actor = this.game.draggedObject.userData["parent"];
            this.game.eventDispatcher.actorMoveHandler.moveActor(actor);
        }

        var finalRotation = this.game.draggedObject.rotation;
        if (finalRotation.toVector3().distanceTo(this.game.dragInitialRotation.toVector3()) > 0.001) {
            var actor2 = this.game.draggedObject.userData["parent"];
            this.game.eventDispatcher.actorRotateHandler.moveActor(actor2);
        }

        this.game.draggedObject = null;
        this.game.controls.enabled = true;

    }

    handleRotateStart(x: number, y: number) {
        this.rotateStart.set(x, y);
    }

    handleRotateMove = (x: number, y: number) => {
        this.rotateEnd.set(x, y);
        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);
        var element = this.container; // scope.domElement === document ? scope.domElement.body : scope.domElement;
        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight); // yes, height
        this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);
        this.rotateStart.copy(this.rotateEnd);
        //scope.update();
    }

    handleRotateEnd = (x: number, y: number) => {
        this.rotateEnd.set(x, y);
    }


    pan = (x, y) => {
        console.log("pan " + x + " " + y);
    }

    rotateLeft = (a) => {
        console.log("rotateLeft " + a);
    }

    rotateUp = (a) => {
        console.log("rotateUp " + a);
    }
}
