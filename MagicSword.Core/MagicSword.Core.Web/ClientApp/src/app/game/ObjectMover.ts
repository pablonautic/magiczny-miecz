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


    constructor(private container: HTMLElement, private game: Game) {

        container.addEventListener('mousedown', this.onMouseDown, false);

        container.addEventListener('touchstart', this.onTouchStart, false);
        container.addEventListener('touchmove', this.onTouchMove, false);
        container.addEventListener('touchend', this.onTouchEnd, false);
    }

    public updateRaycaster2 = (x: number, y: number) => {

        var mouseX = (x / this.container.clientWidth) * 2 - 1;
        var mouseY = -(y / this.container.clientHeight) * 2 + 1;

        this.game.raycaster.setFromCamera({ x: mouseX, y: mouseY }, this.game.camera);
    }

    private onMouseDown = (event: MouseEvent) => {
        event.preventDefault();

        switch (event.button) {
            case this.mouseButtons.LEFT:
                this.state = STATE.PAN;
                break;
            case this.mouseButtons.RIGHT:
                this.state = STATE.ROTATE;
                break;
        }

        var x = event.clientX - (event.target as any).offsetParent.offsetLeft;
        var y = event.clientY - (event.target as any).offsetParent.offsetTop;

        this.handlePanStart(x, y);

        if (this.state !== STATE.NONE) {
            this.container.addEventListener('mousemove', this.onMouseMove, false);
            this.container.addEventListener('mouseup', this.onMouseUp, false);
        }

    }

    private onMouseMove = (event: MouseEvent) => {
        event.preventDefault();

        var x = event.clientX - (event.target as any).offsetParent.offsetLeft;
        var y = event.clientY - (event.target as any).offsetParent.offsetTop;

        this.handlePanMove(x, y);
    }

    private onMouseUp = (event: MouseEvent) => {

        this.container.removeEventListener('mousemove', this.onMouseMove, false);
        this.container.removeEventListener('mouseup', this.onMouseUp, false);

        var x = event.clientX - (event.target as any).offsetParent.offsetLeft;
        var y = event.clientY - (event.target as any).offsetParent.offsetTop;

        this.handlePanEnd(x, y);

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

        this.state = this.touchToState(event);

        var x = event.touches[0].clientX - (event.target as any).offsetParent.offsetLeft;
        var y = event.touches[0].clientY - (event.target as any).offsetParent.offsetTop;

        this.handlePanStart(x, y);
    }

    private onTouchMove = (event: TouchEvent) => {
        event.preventDefault();

        var x = event.touches[0].clientX - (event.target as any).offsetParent.offsetLeft;
        var y = event.touches[0].clientY - (event.target as any).offsetParent.offsetTop;

        this.handlePanMove(x, y);
    }

    private onTouchEnd = (event: TouchEvent) => {

        var x = event.touches[0].clientX - (event.target as any).offsetParent.offsetLeft;
        var y = event.touches[0].clientY - (event.target as any).offsetParent.offsetTop;

        this.handlePanEnd(x, y);

        this.state = STATE.NONE;
    }


    handlePanStart(x: number, y: number) {
        this.panStart.set(x, y);

        this.updateRaycaster2(x, y);

        var intersects = this.game.raycaster.intersectObjects(this.game.interectionObjects, true);

        if (intersects.length > 0) {

            var hitMesh = intersects[0].object;
            var hitActor = <IActor>hitMesh.userData["parent"];

            var attr = hitMesh.userData[Card.attributeData];
            if (attr) {
                var card = hitActor as Card;
                var increment = this.state === STATE.PAN || this.state === STATE.TOUCH_DOLLY_PAN;
                this.game.eventDispatcher.cardSetAttributeClientEventHandler.increment(card, attr, increment ? 1 : -1);
                return;
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
        this.panEnd.set(x, y);
        this.panDelta.subVectors(this.panEnd, this.panStart);
        this.panStart.copy(this.panEnd);

        this.updateRaycaster2(x, y);

        if (this.game.draggedObject) {

            if (!(this.state === STATE.PAN || this.state === STATE.TOUCH_DOLLY_PAN)) {
                this.game.draggedObject.rotateY(this.panDelta.x / 300);

            } else {
                var intersects = this.game.raycaster.intersectObject(this.game.plane);
                var intersect = intersects[0].point;
                this.game.draggedObject.position.x = intersect.x;
                this.game.draggedObject.position.z = intersect.z;

            }
        }
    }

    handlePanEnd = (x: number, y: number) => {
        this.panEnd.set(x, y);


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

}
